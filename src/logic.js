import { isAdult } from "./shared.js";
export { isAdult };

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
