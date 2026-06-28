import { describe, it, expect } from "vitest";
import { committeeGroup, isVoter, canSeeRequest, isAdult } from "../src/logic.js";
import { testPrivilegedGateContract } from "./helpers/privileged-gate.mjs";

const GROUPS = [
  { id: "g-arc",  name: "ARC Committee", memberIds: ["m-alice", "m-bob"] },
  { id: "g-kids", name: "Kids",          memberIds: ["m-charlie"] },
];

const ALICE   = { id: "m-alice",   role: "adult" };
const BOB     = { id: "m-bob",     role: "adult" };
const CHARLIE = { id: "m-charlie", role: "child" };
const DANA    = { id: "m-dana",    role: "adult" };

// ── committeeGroup ────────────────────────────────────────────────────────────

describe("committeeGroup", () => {
  it("returns null when no committeeGroupId is set", () => {
    expect(committeeGroup(GROUPS, null)).toBeNull();
    expect(committeeGroup(GROUPS, "")).toBeNull();
  });

  it("returns the matching group", () => {
    expect(committeeGroup(GROUPS, "g-arc")).toEqual(GROUPS[0]);
  });

  it("returns null when the group id does not exist", () => {
    expect(committeeGroup(GROUPS, "g-unknown")).toBeNull();
  });
});

// ── isVoter ───────────────────────────────────────────────────────────────────
// isVoter fronts the `votes` / `decisions` insert_privileged_only policies (and
// the `requests` privileged_values SELECT grant), so it must satisfy the shared
// privileged-gate contract (mirrors the hub: no adult fallback when no committee
// group is configured).

testPrivilegedGateContract("isVoter", isVoter, {
  member:   ALICE, // adult in g-arc
  outsider: DANA,  // adult not in g-arc
  groups:   GROUPS,
  groupId:  "g-arc",
});

describe("isVoter — app-specific", () => {
  it("returns true for a second member in the committee group", () => {
    expect(isVoter(BOB, GROUPS, "g-arc")).toBe(true);
  });

  // Unlike amenity-reservations' isBoard, the committee gate does not require
  // adulthood — a child placed in the committee group is a voter (matching the
  // hub, which checks group membership only).
  it("returns true for a child who IS in the committee group", () => {
    expect(isVoter(CHARLIE, GROUPS, "g-kids")).toBe(true);
  });
});

// ── canSeeRequest ─────────────────────────────────────────────────────────────

const privateReq = { id: "r1", submitted_by: "m-dana",  visibility: "private" };
const publicReq  = { id: "r2", submitted_by: "m-dana",  visibility: "public"  };
const aliceReq   = { id: "r3", submitted_by: "m-alice", visibility: "private" };

describe("canSeeRequest — no committee group", () => {
  it("adult cannot see someone else's private request (no committee → not a voter)", () => {
    // privateReq is Dana's; with no committee Alice is not a voter, so she only
    // sees her own + public — matching the hub's SELECT filter.
    expect(canSeeRequest(privateReq, ALICE, GROUPS, null)).toBe(false);
  });

  it("adult sees their own private request", () => {
    const ownReq = { ...privateReq, submitted_by: "m-alice" };
    expect(canSeeRequest(ownReq, ALICE, GROUPS, null)).toBe(true);
  });

  it("child (non-voter) sees their own private request", () => {
    const ownReq = { ...privateReq, submitted_by: "m-charlie" };
    expect(canSeeRequest(ownReq, CHARLIE, GROUPS, null)).toBe(true);
  });

  it("child (non-voter) cannot see someone else's private request", () => {
    expect(canSeeRequest(privateReq, CHARLIE, GROUPS, null)).toBe(false);
  });

  it("child (non-voter) can see a public request", () => {
    expect(canSeeRequest(publicReq, CHARLIE, GROUPS, null)).toBe(true);
  });

  it("logged-out user can see a public request", () => {
    expect(canSeeRequest(publicReq, null, GROUPS, null)).toBe(true);
  });

  it("logged-out user cannot see a private request", () => {
    expect(canSeeRequest(privateReq, null, GROUPS, null)).toBe(false);
  });
});

describe("canSeeRequest — committee group configured", () => {
  it("committee member sees any private request", () => {
    expect(canSeeRequest(privateReq, ALICE, GROUPS, "g-arc")).toBe(true);
  });

  it("non-committee adult sees their own private request", () => {
    expect(canSeeRequest(aliceReq, ALICE, GROUPS, "g-arc")).toBe(true);
    const danaReq = { ...privateReq, submitted_by: "m-dana" };
    expect(canSeeRequest(danaReq, DANA, GROUPS, "g-arc")).toBe(true);
  });

  it("non-committee adult cannot see another member's private request", () => {
    expect(canSeeRequest(privateReq, ALICE, GROUPS, "g-arc")).toBe(true); // Alice IS in committee
    // Dana submitted privateReq so she sees her own, but Bob's private request she cannot
    const bobReq = { id: "r4", submitted_by: "m-bob", visibility: "private" };
    expect(canSeeRequest(bobReq, DANA, GROUPS, "g-arc")).toBe(false);
    // Charlie is not on committee and did not submit privateReq
    expect(canSeeRequest(privateReq, CHARLIE, GROUPS, "g-arc")).toBe(false);
  });

  it("non-committee adult can see a public request", () => {
    expect(canSeeRequest(publicReq, DANA, GROUPS, "g-arc")).toBe(true);
  });
});

// ── isAdult (re-exported from shared.js) ─────────────────────────────────────

describe("isAdult", () => {
  it("returns true for adult, admin, owner roles", () => {
    expect(isAdult({ role: "adult" })).toBe(true);
    expect(isAdult({ role: "admin" })).toBe(true);
    expect(isAdult({ role: "owner" })).toBe(true);
  });

  it("returns false for child role", () => {
    expect(isAdult({ role: "child" })).toBe(false);
  });

  it("returns false for null", () => {
    expect(isAdult(null)).toBe(false);
  });
});
