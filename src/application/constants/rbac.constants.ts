/**
 * RBAC Constants
 * Defines permission actions and the menu identifiers used by the
 * database-driven authorization middleware (`requirePermission`).
 */

/**
 * Permission Action Enum
 * Maps 1:1 to the boolean flag columns on `role_menu_permissions`
 * (view -> can_view, add -> can_add, etc.).
 */
export enum PermissionAction {
  VIEW = 'view',
  ADD = 'add',
  EDIT = 'edit',
  DELETE = 'delete',
  EXPORT = 'export',
  STATUS = 'status',
}

/**
 * Menu Routes
 * The `menus.route` value that identifies each admin resource. Endpoints
 * declare which menu they belong to so the middleware can resolve the
 * matching `role_menu_permissions` row for the caller's role.
 *
 * NOTE: A menu row with this exact `route` must exist for permissions to be
 * configurable. `super_admin` bypasses these checks entirely.
 */
export const MenuRoute = {
  USERS: '/admin/users',
  ROLES: '/admin/roles',
  PERMISSIONS: '/admin/rbac-permissions',
  BRANCHES: '/admin/branches',
  MENUS: '/admin/menus',
  COUNTRIES: '/admin/countries',
} as const;

export type MenuRouteValue = (typeof MenuRoute)[keyof typeof MenuRoute];
