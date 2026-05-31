import { describe, it, expect } from "vitest";
import { committeeGroup, isVoter, canSeeRequest, isAdult } from "../src/logic.js";

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

describe("isVoter — no committee group (all adults)", () => {
  it("returns false for null member", () => {
    expect(isVoter(null, GROUPS, null)).toBe(false);
  });

  it("returns true for an adult", () => {
    expect(isVoter(ALICE, GROUPS, null)).toBe(true);
  });

  it("returns false for a child", () => {
    expect(isVoter(CHARLIE, GROUPS, null)).toBe(false);
  });
});

describe("isVoter — committee group configured", () => {
  it("returns true for a member in the committee group", () => {
    expect(isVoter(ALICE, GROUPS, "g-arc")).toBe(true);
    expect(isVoter(BOB,   GROUPS, "g-arc")).toBe(true);
  });

  it("returns false for an adult NOT in the committee group", () => {
    expect(isVoter(DANA, GROUPS, "g-arc")).toBe(false);
  });

  it("returns true for a child who IS in the committee group", () => {
    expect(isVoter(CHARLIE, GROUPS, "g-kids")).toBe(true);
  });

  it("returns false for null member even with group configured", () => {
    expect(isVoter(null, GROUPS, "g-arc")).toBe(false);
  });

  it("falls back to isAdult when the configured group id no longer exists", () => {
    expect(isVoter(ALICE, GROUPS, "g-deleted")).toBe(true);
    expect(isVoter(CHARLIE, GROUPS, "g-deleted")).toBe(false);
  });
});

// ── canSeeRequest ─────────────────────────────────────────────────────────────

const privateReq = { id: "r1", submitted_by: "m-dana",  visibility: "private" };
const publicReq  = { id: "r2", submitted_by: "m-dana",  visibility: "public"  };
const aliceReq   = { id: "r3", submitted_by: "m-alice", visibility: "private" };

describe("canSeeRequest — no committee group", () => {
  it("adult (voter) sees any private request", () => {
    expect(canSeeRequest(privateReq, ALICE, GROUPS, null)).toBe(true);
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
