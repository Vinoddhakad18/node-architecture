import { MenuAttributes } from '@models/menu.model';

/**
 * Menu Response DTO
 * Transforms menu model to API response format
 */
export class MenuResponseDTO {
  id: number;
  name: string;
  route: string;
  parentId: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  parent?: MenuSummaryDTO;
  children?: MenuResponseDTO[];

  constructor(menu: MenuAttributes & { parent?: MenuAttributes; children?: MenuAttributes[] }) {
    this.id = menu.id;
    this.name = menu.name;
    this.route = menu.route;
    this.parentId = menu.parent_id;
    this.sortOrder = menu.sort_order;
    this.isActive = menu.is_active;
    this.createdAt = menu.created_at;
    this.updatedAt = menu.updated_at;

    if (menu.parent) {
      this.parent = MenuSummaryDTO.fromModel(menu.parent);
    }

    if (menu.children && menu.children.length > 0) {
      this.children = MenuResponseDTO.fromModels(menu.children);
    }
  }

  /**
   * Create DTO from menu model
   */
  static fromModel(
    menu: MenuAttributes & { parent?: MenuAttributes; children?: MenuAttributes[] }
  ): MenuResponseDTO {
    return new MenuResponseDTO(menu);
  }

  /**
   * Create array of DTOs from menu models
   */
  static fromModels(
    menus: (MenuAttributes & { parent?: MenuAttributes; children?: MenuAttributes[] })[]
  ): MenuResponseDTO[] {
    return menus.map((menu) => MenuResponseDTO.fromModel(menu));
  }
}

/**
 * Menu Summary DTO
 * Minimal menu information for dropdowns and references
 */
export class MenuSummaryDTO {
  id: number;
  name: string;
  route: string;

  constructor(menu: MenuAttributes) {
    this.id = menu.id;
    this.name = menu.name;
    this.route = menu.route;
  }

  static fromModel(menu: MenuAttributes): MenuSummaryDTO {
    return new MenuSummaryDTO(menu);
  }

  static fromModels(menus: MenuAttributes[]): MenuSummaryDTO[] {
    return menus.map((menu) => MenuSummaryDTO.fromModel(menu));
  }
}

/**
 * Menu Tree DTO
 * Hierarchical menu structure for navigation
 */
export class MenuTreeDTO {
  id: number;
  name: string;
  route: string;
  sortOrder: number;
  children: MenuTreeDTO[];

  constructor(menu: MenuAttributes & { children?: MenuAttributes[] }) {
    this.id = menu.id;
    this.name = menu.name;
    this.route = menu.route;
    this.sortOrder = menu.sort_order;
    this.children = menu.children ? MenuTreeDTO.fromModels(menu.children) : [];
  }

  static fromModel(menu: MenuAttributes & { children?: MenuAttributes[] }): MenuTreeDTO {
    return new MenuTreeDTO(menu);
  }

  static fromModels(menus: (MenuAttributes & { children?: MenuAttributes[] })[]): MenuTreeDTO[] {
    return menus.map((menu) => MenuTreeDTO.fromModel(menu));
  }
}

/**
 * Create Menu Request DTO
 */
export interface CreateMenuRequestDTO {
  name: string;
  route: string;
  parent_id?: number | null;
  sort_order?: number;
  is_active?: boolean;
}

/**
 * Update Menu Request DTO
 */
export interface UpdateMenuRequestDTO {
  name?: string;
  route?: string;
  parent_id?: number | null;
  sort_order?: number;
  is_active?: boolean;
}

/**
 * Reorder Menu Request DTO
 */
export interface ReorderMenuRequestDTO {
  menuOrders: { id: number; sort_order: number }[];
}
