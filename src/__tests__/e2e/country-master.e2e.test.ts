/**
 * End-to-End Tests for Country Master API Endpoints
 * Tests complete API workflows with real HTTP requests
 */

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../app';
import { sequelize } from '../../application/config/database';
import CountryMaster from '../../application/models/country-master.model';
import UserMaster from '../../application/models/user-master.model';
import { config } from '../../config';
import { createTestUser } from '../helpers/test-helpers';

describe('Country Master API E2E Tests', () => {
  let app: Application;
  let accessToken: string;

  // Helper function to create test country
  const createTestCountry = async (overrides?: Partial<any>) => {
    const defaultCountry = {
      name: 'Test Country',
      code: 'TC',
      currency_code: 'TCC',
      status: 'active' as const,
      created_by: null,
      updated_by: null,
    };
    return await CountryMaster.create({ ...defaultCountry, ...overrides });
  };

  // Helper function to cleanup countries
  const cleanupCountries = async () => {
    await CountryMaster.destroy({ where: {}, force: true });
  };

  // Setup: Create app and database connection
  beforeAll(async () => {
    app = await createApp();
    await sequelize.sync({ force: true });

    // Create test user and login to get access token
    await createTestUser({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      status: 'active',
    });

    const loginResponse = await request(app)
      .post(`${config.apiPrefix}/auth/login`)
      .send({
        email: 'admin@example.com',
        password: 'password123',
      });

    accessToken = loginResponse.body.data.accessToken;
  });

  // Cleanup after each test
  afterEach(async () => {
    await cleanupCountries();
  });

  // Teardown: Close database connection
  afterAll(async () => {
    await UserMaster.destroy({ where: {}, force: true });
    await sequelize.close();
  });

  describe('POST /api/v1/countries', () => {
    const newCountry = {
      name: 'United States',
      code: 'US',
      currency_code: 'USD',
      status: 'active',
    };

    it('should successfully create a new country', async () => {
      const response = await request(app)
        .post(`${config.apiPrefix}/countries`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(newCountry)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Country created successfully');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name', 'United States');
      expect(response.body.data).toHaveProperty('code', 'US');
      expect(response.body.data).toHaveProperty('currency_code', 'USD');
      expect(response.body.data).toHaveProperty('status', 'active');
    });

    it('should return 409 when country code already exists', async () => {
      // Create country first
      await createTestCountry({ name: 'Existing Country', code: 'US' });

      const response = await request(app)
        .post(`${config.apiPrefix}/countries`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(newCountry)
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain("Country with code 'US' already exists");
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post(`${config.apiPrefix}/countries`)
        .send(newCountry)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 with missing required fields', async () => {
      const response = await request(app)
        .post(`${config.apiPrefix}/countries`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Test' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 with invalid country code length', async () => {
      const response = await request(app)
        .post(`${config.apiPrefix}/countries`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...newCountry, code: 'TOOLONG' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should convert country code to uppercase', async () => {
      const response = await request(app)
        .post(`${config.apiPrefix}/countries`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...newCountry, code: 'us' })
        .expect(201);

      expect(response.body.data.code).toBe('US');
    });

    it('should create country with default status when not provided', async () => {
      const countryWithoutStatus = {
        name: 'Germany',
        code: 'DE',
        currency_code: 'EUR',
      };

      const response = await request(app)
        .post(`${config.apiPrefix}/countries`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(countryWithoutStatus)
        .expect(201);

      expect(response.body.data.status).toBe('active');
    });
  });

  describe('GET /api/v1/countries', () => {
    beforeEach(async () => {
      // Create test countries
      await createTestCountry({ name: 'United States', code: 'US', currency_code: 'USD' });
      await createTestCountry({ name: 'Canada', code: 'CA', currency_code: 'CAD' });
      await createTestCountry({ name: 'Mexico', code: 'MX', currency_code: 'MXN', status: 'inactive' });
    });

    it('should return paginated list of countries', async () => {
      const response = await request(app)
        .get(`${config.apiPrefix}/countries`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Countries retrieved successfully');
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.pagination).toHaveProperty('total', 3);
      expect(response.body.data.pagination).toHaveProperty('page', 1);
    });

    it('should apply pagination correctly', async () => {
      const response = await request(app)
        .get(`${config.apiPrefix}/countries`)
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get(`${config.apiPrefix}/countries`)
        .query({ status: 'active' })
        .expect(200);

      expect(response.body.data.data).toHaveLength(2);
      response.body.data.data.forEach((country: any) => {
        expect(country.status).toBe('active');
      });
    });

    it('should search by name or code', async () => {
      const response = await request(app)
        .get(`${config.apiPrefix}/countries`)
        .query({ search: 'United' })
        .expect(200);

      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].name).toBe('United States');
    });

    it('should sort by specified field', async () => {
      const response = await request(app)
        .get(`${config.apiPrefix}/countries`)
        .query({ sortBy: 'code', sortOrder: 'ASC' })
        .expect(200);

      const codes = response.body.data.data.map((c: any) => c.code);
      expect(codes).toEqual(['CA', 'MX', 'US']);
    });

    it('should sort in descending order', async () => {
      const response = await request(app)
        .get(`${config.apiPrefix}/countries`)
        .query({ sortBy: 'name', sortOrder: 'DESC' })
        .expect(200);

      const names = response.body.data.data.map((c: any) => c.name);
      expect(names[0]).toBe('United States');
    });
  });

  describe('GET /api/v1/countries/active/list', () => {
    beforeEach(async () => {
      await createTestCountry({ name: 'United States', code: 'US', status: 'active' });
      await createTestCountry({ name: 'Canada', code: 'CA', status: 'active' });
      await createTestCountry({ name: 'Mexico', code: 'MX', status: 'inactive' });
    });

    it('should return only active countries', async () => {
      const response = await request(app)
        .get(`${config.apiPrefix}/countries/active/list`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Active countries retrieved successfully');
      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach((country: any) => {
        expect(country.status).toBe('active');
      });
    });

    it('should return countries sorted by name', async () => {
      const response = await request(app)
        .get(`${config.apiPrefix}/countries/active/list`)
        .expect(200);

      const names = response.body.data.map((c: any) => c.name);
      expect(names).toEqual(['Canada', 'United States']);
    });
  });

  describe('GET /api/v1/countries/:id', () => {
    let testCountry: CountryMaster;

    beforeEach(async () => {
      testCountry = await createTestCountry({ name: 'United States', code: 'US' });
    });

    it('should return country by id', async () => {
      const response = await request(app)
        .get(`${config.apiPrefix}/countries/${testCountry.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Country retrieved successfully');
      expect(response.body.data).toHaveProperty('id', testCountry.id);
      expect(response.body.data).toHaveProperty('name', 'United States');
      expect(response.body.data).toHaveProperty('code', 'US');
    });

    it('should return 404 when country not found', async () => {
      const response = await request(app)
        .get(`${config.apiPrefix}/countries/99999`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 with invalid id format', async () => {
      const response = await request(app)
        .get(`${config.apiPrefix}/countries/invalid`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/countries/code/:code', () => {
    beforeEach(async () => {
      await createTestCountry({ name: 'United States', code: 'US' });
    });

    it('should return country by code', async () => {
      const response = await request(app)
        .get(`${config.apiPrefix}/countries/code/US`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Country retrieved successfully');
      expect(response.body.data).toHaveProperty('name', 'United States');
      expect(response.body.data).toHaveProperty('code', 'US');
    });

    it('should handle case-insensitive code search', async () => {
      const response = await request(app)
        .get(`${config.apiPrefix}/countries/code/us`)
        .expect(200);

      expect(response.body.data).toHaveProperty('code', 'US');
    });

    it('should return 404 when country code not found', async () => {
      const response = await request(app)
        .get(`${config.apiPrefix}/countries/code/XX`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain("Country with code 'XX' not found");
    });
  });

  describe('PUT /api/v1/countries/:id', () => {
    let testCountry: CountryMaster;

    beforeEach(async () => {
      testCountry = await createTestCountry({ name: 'United States', code: 'US' });
    });

    it('should successfully update country', async () => {
      const updateData = {
        name: 'United States of America',
        currency_code: 'USD',
      };

      const response = await request(app)
        .put(`${config.apiPrefix}/countries/${testCountry.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Country updated successfully');
      expect(response.body.data).toHaveProperty('name', 'United States of America');
      expect(response.body.data).toHaveProperty('currency_code', 'USD');
    });

    it('should update country code', async () => {
      const response = await request(app)
        .put(`${config.apiPrefix}/countries/${testCountry.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: 'USA' })
        .expect(200);

      expect(response.body.data.code).toBe('USA');
    });

    it('should return 409 when new code conflicts with existing country', async () => {
      await createTestCountry({ name: 'Canada', code: 'CA' });

      const response = await request(app)
        .put(`${config.apiPrefix}/countries/${testCountry.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: 'CA' })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain("Country with code 'CA' already exists");
    });

    it('should return 404 when country not found', async () => {
      const response = await request(app)
        .put(`${config.apiPrefix}/countries/99999`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put(`${config.apiPrefix}/countries/${testCountry.id}`)
        .send({ name: 'Updated' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/v1/countries/:id', () => {
    let testCountry: CountryMaster;

    beforeEach(async () => {
      testCountry = await createTestCountry({ name: 'United States', code: 'US' });
    });

    it('should successfully soft delete country', async () => {
      const response = await request(app)
        .delete(`${config.apiPrefix}/countries/${testCountry.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Country deleted successfully');

      // Verify country status is set to inactive
      const deletedCountry = await CountryMaster.findByPk(testCountry.id);
      expect(deletedCountry?.status).toBe('inactive');
    });

    it('should return 404 when country not found', async () => {
      const response = await request(app)
        .delete(`${config.apiPrefix}/countries/99999`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`${config.apiPrefix}/countries/${testCountry.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/v1/countries/:id/permanent', () => {
    let testCountry: CountryMaster;

    beforeEach(async () => {
      testCountry = await createTestCountry({ name: 'United States', code: 'US' });
    });

    it('should successfully hard delete country', async () => {
      const response = await request(app)
        .delete(`${config.apiPrefix}/countries/${testCountry.id}/permanent`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Country permanently deleted');

      // Verify country is completely removed
      const deletedCountry = await CountryMaster.findByPk(testCountry.id);
      expect(deletedCountry).toBeNull();
    });

    it('should return 404 when country not found', async () => {
      const response = await request(app)
        .delete(`${config.apiPrefix}/countries/99999/permanent`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`${config.apiPrefix}/countries/${testCountry.id}/permanent`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Integration: Complete Country CRUD Workflow', () => {
    it('should complete full CRUD workflow', async () => {
      // Step 1: Create country
      const createResponse = await request(app)
        .post(`${config.apiPrefix}/countries`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Country',
          code: 'TC',
          currency_code: 'TCC',
          status: 'active',
        })
        .expect(201);

      const countryId = createResponse.body.data.id;
      expect(countryId).toBeDefined();

      // Step 2: Read country by ID
      const readResponse = await request(app)
        .get(`${config.apiPrefix}/countries/${countryId}`)
        .expect(200);

      expect(readResponse.body.data.name).toBe('Test Country');

      // Step 3: Update country
      const updateResponse = await request(app)
        .put(`${config.apiPrefix}/countries/${countryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Test Country' })
        .expect(200);

      expect(updateResponse.body.data.name).toBe('Updated Test Country');

      // Step 4: Soft delete country
      await request(app)
        .delete(`${config.apiPrefix}/countries/${countryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify soft delete
      const softDeletedCountry = await CountryMaster.findByPk(countryId);
      expect(softDeletedCountry?.status).toBe('inactive');

      // Step 5: Hard delete country
      await request(app)
        .delete(`${config.apiPrefix}/countries/${countryId}/permanent`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify hard delete
      const hardDeletedCountry = await CountryMaster.findByPk(countryId);
      expect(hardDeletedCountry).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle concurrent create requests with same code', async () => {
      const countryData = {
        name: 'Concurrent Country',
        code: 'CC',
        currency_code: 'CCC',
      };

      const requests = Array(3)
        .fill(null)
        .map(() =>
          request(app)
            .post(`${config.apiPrefix}/countries`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send(countryData)
        );

      const responses = await Promise.all(requests);

      // Only one should succeed
      const successCount = responses.filter((r) => r.status === 201).length;
      const conflictCount = responses.filter((r) => r.status === 409).length;

      expect(successCount).toBe(1);
      expect(conflictCount).toBe(2);
    });

    it('should handle special characters in country name', async () => {
      const response = await request(app)
        .post(`${config.apiPrefix}/countries`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: "Côte d'Ivoire",
          code: 'CI',
          currency_code: 'XOF',
        })
        .expect(201);

      expect(response.body.data.name).toBe("Côte d'Ivoire");
    });

    it('should trim whitespace from country name', async () => {
      const response = await request(app)
        .post(`${config.apiPrefix}/countries`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '  United States  ',
          code: 'US',
          currency_code: 'USD',
        })
        .expect(201);

      expect(response.body.data.name).toBe('United States');
    });
  });
});
