/**
 * Role hierarchy. Kept dependency-free so it can be used from middleware (edge
 * runtime), from server components, and from unit tests without dragging in
 * Auth.js or the database.
 */

export type Role = "user" | "corporate" | "moderator" | "admin" | "superadmin";

export const ROLE_RANK: Record<Role, number> = {
  user: 0,
  corporate: 1,
  moderator: 2,
  admin: 3,
  superadmin: 4,
};

/** True when `role` meets or exceeds `minimum`. */
export function atLeast(role: Role | undefined, minimum: Role): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export const ORG_ROLE_RANK = { member: 0, admin: 1, owner: 2 } as const;
export type OrgRole = keyof typeof ORG_ROLE_RANK;

export function orgAtLeast(role: OrgRole | undefined, minimum: OrgRole): boolean {
  if (!role) return false;
  return ORG_ROLE_RANK[role] >= ORG_ROLE_RANK[minimum];
}
