/**
 * Permission DTOs
 * Data Transfer Objects for permission-related operations
 */

/**
 * Permission action flags
 */
export interface PermissionFlags {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
  status: boolean;
}

/**
 * Menu permission DTO
 * Represents permissions for a specific menu
 */
export interface MenuPermissionDTO {
  menuId: number;
  permissions: PermissionFlags;
}

/**
 * Role permissions response DTO
 * Response structure for GET /api/permissions?roleId=:roleId
 */
export interface RolePermissionsResponseDTO {
  roleId: number;
  permissions: MenuPermissionDTO[];
}

/**
 * Update permissions request DTO
 * Request structure for PUT /api/permissions
 */
export interface UpdatePermissionsRequestDTO {
  roleId: number;
  permissions: Array<{
    menuId: number;
    view?: boolean;
    add?: boolean;
    edit?: boolean;
    delete?: boolean;
    export?: boolean;
    status?: boolean;
  }>;
}

/**
 * Menu permission item for update
 */
export interface MenuPermissionUpdateItem {
  menuId: number;
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
  status: boolean;
}
