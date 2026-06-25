import { CountryMasterAttributes } from '@models/country-master.model';

/**
 * Country Response DTO
 * Transforms country model to API response format
 */
export class CountryResponseDTO {
  id: number;
  name: string;
  code: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;

  constructor(country: CountryMasterAttributes) {
    this.id = country.id;
    this.name = country.name;
    this.code = country.code;
    this.status = country.status;
    this.createdAt = country.created_at;
    this.updatedAt = country.updated_at;
  }

  /**
   * Create DTO from country model
   */
  static fromModel(country: CountryMasterAttributes): CountryResponseDTO {
    return new CountryResponseDTO(country);
  }

  /**
   * Create array of DTOs from country models
   */
  static fromModels(countries: CountryMasterAttributes[]): CountryResponseDTO[] {
    return countries.map((country) => CountryResponseDTO.fromModel(country));
  }
}

/**
 * Country Summary DTO
 * Minimal country information for dropdowns
 */
export class CountrySummaryDTO {
  id: number;
  name: string;
  code: string;

  constructor(country: CountryMasterAttributes) {
    this.id = country.id;
    this.name = country.name;
    this.code = country.code;
  }

  static fromModel(country: CountryMasterAttributes): CountrySummaryDTO {
    return new CountrySummaryDTO(country);
  }

  static fromModels(countries: CountryMasterAttributes[]): CountrySummaryDTO[] {
    return countries.map((country) => CountrySummaryDTO.fromModel(country));
  }
}

/**
 * Create Country Request DTO
 */
export interface CreateCountryRequestDTO {
  name: string;
  code: string;
  status?: 'active' | 'inactive';
}

/**
 * Update Country Request DTO
 */
export interface UpdateCountryRequestDTO {
  name?: string;
  code?: string;
  status?: 'active' | 'inactive';
}
