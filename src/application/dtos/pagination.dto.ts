/**
 * Pagination DTOs
 * Standard pagination request and response objects
 */

/**
 * Pagination Request DTO
 * Query parameters for paginated requests
 */
export interface PaginationRequestDTO {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}

/**
 * Pagination Meta DTO
 * Metadata about the paginated result
 */
export interface PaginationMetaDTO {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated Response DTO
 * Generic wrapper for paginated responses
 */
export class PaginatedResponseDTO<T> {
  data: T[];
  pagination: PaginationMetaDTO;

  constructor(
    data: T[],
    total: number,
    page: number,
    limit: number
  ) {
    this.data = data;
    const totalPages = Math.ceil(total / limit);
    this.pagination = {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Create paginated response
   */
  static create<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ): PaginatedResponseDTO<T> {
    return new PaginatedResponseDTO(data, total, page, limit);
  }
}

/**
 * Cursor-based Pagination Request DTO
 * For large datasets
 */
export interface CursorPaginationRequestDTO {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
}

/**
 * Cursor-based Pagination Response DTO
 */
export interface CursorPaginationMetaDTO {
  nextCursor: string | null;
  previousCursor: string | null;
  hasMore: boolean;
}
