import { isAdult } from "./shared.js";
export { isAdult };

/**
 * Terminal statuses — a committee decision has been issued. A request in any
 * other status is still active. Single source of truth shared by the client
 * (applyDecisions, filters, counts) so the list never drifts from the SQL
 * exports, which hard-code the same set.
 */
export const DECISION_STATUSES = ["approved", "approved_with_conditions", "denied"];

/**
 * Returns the hub member group acting as the ARC committee, or null if all
 * adults are voters (no specific group configured).
 *
 * @param {Array}  groups          - family.groups from hub context
 * @param {string|null} committeeGroupId - settings.committee_group_id
 */
export function committeeGroup(groups, committeeGroupId) {
  if (!committeeGroupId) return null;
  return groups.find(g => g.id === committeeGroupId) ?? null;
}

/**
 * Returns true if the given member may vote and issue decisions.
 *
 * This MUST mirror the hub's server-side privileged check for the
 * `votes`/`decisions` row policies (`insert_privileged_only`) and the
 * `requests` policy's `privileged_values` SELECT grant: a member is a voter iff
 * a committee group is configured AND that group still exists AND the member
 * belongs to it. There is deliberately NO "all adults" fallback when no group
 * is set — the hub rejects every privileged INSERT (and withholds private-row
 * reads) in that case, so treating adults as voters would only produce 403s and
 * empty results. An admin must appoint a committee group first.
 *
 * @param {object|null} member
 * @param {Array}  groups
 * @param {string|null} committeeGroupId
 */
export function isVoter(member, groups, committeeGroupId) {
  if (!member) return false;
  const g = committeeGroup(groups, committeeGroupId);
  return !!g && g.memberIds.includes(member.id);
}

/**
 * Returns true if the given member (me) may see the request in the list.
 * Voters see everything; submitters see their own; public requests are visible to all.
 *
 * @param {object} req   - request row (must have submitted_by and visibility)
 * @param {object|null} me    - current member, or null if not logged in
 * @param {Array}  groups
 * @param {string|null} committeeGroupId
 */
export function canSeeRequest(req, me, groups, committeeGroupId) {
  if (isVoter(me, groups, committeeGroupId)) return true;
  if (me && req.submitted_by === me.id) return true;
  return req.visibility === "public";
}

/**
 * Fields the in-app search matches against (see hub-sdk `searchMatch`).
 * The description and the unit reference count as well as the title —
 * an ARC request is looked up as "the fence at number 12", which is the
 * unit plus what was actually proposed.
 */
export function searchableFields(item) {
  return [item.title, item.description, item.category, item.unit_ref];
}

/**
 * The line a failed write shows (app-template CLAUDE.md, "Refused, gone, or
 * failed: which line"): "try again" only when retrying can work. `action` and
 * `thing` are the app's own words. Decided from the error's `status` / `code`,
 * never from the hub's text. For the append-record endpoint: 403 is its write
 * ACL (the committee group), 404 a request the caller cannot see or that is
 * gone, 409 a request whose state no longer takes the record.
 */
export function failureLine(e, { action, thing } = {}) {
  if (e?.forUser) return e.message;
  if (e?.code === "UNIQUE_CONSTRAINT" || /UNIQUE constraint failed/i.test(String(e?.message ?? ""))) return `That ${thing} already exists.`;
  if (e?.status === 403) return `You don’t have permission to ${action}.`;
  if (e?.status === 507) return "The household’s storage is full — free up space first.";
  if (e?.status === 404) return `This ${thing} has been removed.`;
  if (e?.status === 409) return `This ${thing} was changed by someone else — check it first.`;
  return `Couldn’t ${action} — try again.`;
}

/**
 * The line a failed document upload shows: the file goes to POST /api/files,
 * then its record to the documents endpoint. The upload's own refusals of the
 * file get a line of their own: 413 too large, 415 a type the hub does not
 * take. 429 is either endpoint's rate limit. The documents endpoint's 404 is
 * the file just uploaded not being found, which a fresh upload can fix, so it
 * is not "removed". The rest follows `failureLine`.
 */
export function uploadFailureLine(e, words) {
  if (e?.status === 413) return "That file is too large.";
  if (e?.status === 415) return "That kind of file can’t be uploaded.";
  if (e?.status === 429) return "Too many tries — wait a minute and try again.";
  if (e?.status === 404) return `Couldn’t ${words.action} — try again.`;
  return failureLine(e, words);
}
