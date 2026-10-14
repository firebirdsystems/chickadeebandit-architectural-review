import { describe, it, expect } from "vitest";
import { failureLine, uploadFailureLine } from "../src/logic.js";

const err = (props, message = "hub text") => Object.assign(new Error(message), props);
const vote = { action: "record your vote", thing: "request" };

// The append-record endpoint (governance-agreements.ts appendRecord): 403 its
// write ACL, 404 a parent request the caller cannot see, 409 a parent whose
// state no longer takes the record, 400 a malformed body, 5xx a failed insert.
describe("failureLine", () => {
  it("names a duplicate by code, or by the hub's text while production lags", () => {
    expect(failureLine(err({ status: 400, code: "UNIQUE_CONSTRAINT" }), vote)).toBe("That request already exists.");
    expect(failureLine(err({ status: 400 }, "UNIQUE constraint failed: x.id"), vote)).toBe("That request already exists.");
  });
  it("names a refusal without asking for a retry", () => {
    expect(failureLine(err({ status: 403 }, "Forbidden"), vote)).toBe("You don’t have permission to record your vote.");
    expect(failureLine(err({ status: 507 }), vote)).toBe("The household’s storage is full — free up space first.");
  });
  it("reads a 404 as removed and a 409 as changed", () => {
    expect(failureLine(err({ status: 404 }, "Parent row not found"), vote)).toBe("This request has been removed.");
    expect(failureLine(err({ status: 409 }, "Parent row is closed"), vote)).toBe("This request was changed by someone else — check it first.");
  });
  it("asks for a retry only when retrying can work", () => {
    for (const e of [err({}), err({ status: 500 }), err({ status: 503 }), err({ status: 400 }), new TypeError("Failed to fetch"), undefined]) {
      expect(failureLine(e, vote)).toBe("Couldn’t record your vote — try again.");
    }
  });
  it("keeps a line the app wrote for the user, and never shows hub text", () => {
    expect(failureLine(err({ forUser: true }, "Pick a decision first."), vote)).toBe("Pick a decision first.");
    expect(failureLine(err({ status: 500 }, "D1_ERROR: boom"), vote)).not.toMatch(/D1_ERROR/);
  });
  it("asks for a wait on a rate limit", () => {
    expect(failureLine(err({ status: 429 }), vote)).toBe("Too many tries — wait a minute and try again.");
  });
  it("splits a write that changed nothing by the caller's re-read", () => {
    const del = { action: "delete the request", thing: "request" };
    expect(failureLine(null, { ...del, found: false })).toBe("This request has been removed.");
    expect(failureLine(null, { ...del, found: true })).toBe("You don’t have permission to delete the request.");
    expect(failureLine(null, { ...del, found: true, guarded: true })).toBe("This request was changed by someone else — check it first.");
    expect(failureLine(null, { ...del, found: null })).toBe("Couldn’t delete the request — try again.");
  });
});

// The hub's answers, from files-handler.ts and documents-handler.ts: 413 too
// large, 415 a type it does not take, 403 a write ACL, 429 a rate limit, 507
// storage full, 404 the uploaded file not found, 400 a malformed body.
describe("uploadFailureLine", () => {
  const doc = { action: "upload the document", thing: "document" };
  it("names the file's own refusals", () => {
    expect(uploadFailureLine(err({ status: 413 }, "File too large (max 10 MB)"), doc)).toBe("That file is too large.");
    expect(uploadFailureLine(err({ status: 415 }, "File type not allowed: x"), doc)).toBe("That kind of file can’t be uploaded.");
    expect(uploadFailureLine(err({ status: 429 }, "Too many requests"), doc)).toBe("Too many tries — wait a minute and try again.");
  });
  it("gives the rest the template's lines", () => {
    expect(uploadFailureLine(err({ status: 403 }, "File writes require an adult member"), doc)).toBe("You don’t have permission to upload the document.");
    expect(uploadFailureLine(err({ status: 507 }, "Document storage limit exceeded"), doc)).toBe("The household’s storage is full — free up space first.");
    for (const e of [err({ status: 0 }, "Network error"), err({ status: 404 }, "File not found"), err({ status: 400 }), err({ status: 502 }), new TypeError("Failed to fetch")]) {
      expect(uploadFailureLine(e, doc)).toBe("Couldn’t upload the document — try again.");
    }
  });
  it("never shows the hub's text", () => {
    for (const status of [413, 415, 429, 507]) {
      expect(uploadFailureLine(err({ status }, "HUB SAYS NO"), doc)).not.toMatch(/HUB SAYS NO/);
    }
  });
});
