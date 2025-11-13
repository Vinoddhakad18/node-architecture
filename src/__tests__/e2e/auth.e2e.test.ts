/**
 * End-to-End Tests for Authentication API Endpoints
 * Tests complete API workflows with real HTTP requests
 */

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../app';
import { sequelize } from '../../application/config/sequelize';
import UserMaster from '../../application/models/user-master.model';
import { config } from '../../config';
import { createTestUser, cleanupDatabase } from '../helpers/test-helpers';

describe('Auth API E2E Tests', () => {
  let app: Application;
  let testUser: UserMaster;
  let accessToken: string;
  let refreshToken: string;

  // Setup: Create app and database connection
  beforeAll(async () => {
    // Create app instance
    app = await createApp();

    // Sync database (create tables)
    await sequelize.sync({ force: true });
  });

  // Cleanup after each test
  afterEach(async () => {
    await cleanupDatabase();
  });

  // Teardown: Close database connection
  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      testUser = await createTestUser({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        status: 'active',
      });
    });

    it('should successfully login with valid credentials', async () => {
      const response = await request(app)
        .post(`${config.apiPrefix}/auth/login`)
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('expiresAt');
      expect(typeof response.body.data.accessToken).toBe('string');
      expect(typeof response.body.data.refreshToken).toBe('string');
      expect(typeof response.body.data.expiresAt).toBe('number');

      // Store tokens for other tests
      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('should return 401 with invalid email', async () => {
      const response = await request(app)
        .post(`${config.apiPrefix}/auth/login`)
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should return 401 with invalid password', async () => {
      const response = await request(app)
        .post(`${config.apiPrefix}/auth/login`)
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should return 401 for inactive user', async () => {
      // Create inactive user
      await createTestUser({
        email: 'inactive@example.com',
        password: 'password123',
        status: 'inactive',
      });

      const response = await request(app)
        .post(`${config.apiPrefix}/auth/login`)
        .send({
          email: 'inactive@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('deactivated');
    });

    it('should return 400 with missing email', async () => {
      const response = await request(app)
        .post(`${config.apiPrefix}/auth/login`)
        .send({
          password: 'password123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 with missing password', async () => {
      const response = await request(app)
        .post(`${config.apiPrefix}/auth/login`)
        .send({
          email: 'test@example.com',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 with invalid email format', async () => {
      const response = await request(app)
        .post(`${config.apiPrefix}/auth/login`)
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should update last_login timestamp on successful login', async () => {
      const beforeLogin = testUser.last_login;

      await request(app)
        .post(`${config.apiPrefix}/auth/login`)
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      // Fetch updated user
      const updatedUser = await UserMaster.findByPk(testUser.id);
      expect(updatedUser?.last_login).not.toBe(beforeLogin);
      expect(updatedUser?.last_login).toBeInstanceOf(Date);
    });

    it('should handle concurrent login requests', async () => {
      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app)
            .post(`${config.apiPrefix}/auth/login`)
            .send({
              email: 'test@example.com',
              password: 'password123',
            })
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('accessToken');
      });
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    beforeEach(async () => {
      // Create test user and login to get tokens
      testUser = await createTestUser({
        email: 'test@example.com',
        password: 'password123',
      });

      const loginResponse = await request(app)
        .post(`${config.apiPrefix}/auth/login`)
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      accessToken = loginResponse.body.data.accessToken;
      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should successfully refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post(`${config.apiPrefix}/auth/refresh-token`)
        .send({
          refreshToken: refreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Token refreshed successfully');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(typeof response.body.data.accessToken).toBe('string');
      expect(response.body.data.accessToken).not.toBe(accessToken);
    });

    it('should return 400 when refresh token is missing', async () => {
      const response = await request(app)
        .post(`${config.apiPrefix}/auth/refresh-token`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('required');
    });

    it('should return 401 with invalid refresh token', async () => {
      const response = await request(app)
        .post(`${config.apiPrefix}/auth/refresh-token`)
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 401 with expired refresh token', async () => {
      // Create an expired token (this is a mock - in real scenario you'd wait or manipulate time)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1MTYyMzkwMjJ9.invalid';

      const response = await request(app)
        .post(`${config.apiPrefix}/auth/refresh-token`)
        .send({
          refreshToken: expiredToken,
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should not accept access token as refresh token', async () => {
      const response = await request(app)
        .post(`${config.apiPrefix}/auth/refresh-token`)
        .send({
          refreshToken: accessToken, // Using access token instead
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/verify-token', () => {
    beforeEach(async () => {
      // Create test user and login to get tokens
      testUser = await createTestUser({
        email: 'test@example.com',
        password: 'password123',
      });

      const loginResponse = await request(app)
        .post(`${config.apiPrefix}/auth/login`)
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should return valid status for valid access token', async () => {
      const response = await request(app)
        .post(`${config.apiPrefix}/auth/verify-token`)
        .send({
          token: accessToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('valid');
      expect(response.body.data).toHaveProperty('valid', true);
    });

    it('should return invalid status for invalid token', async () => {
      const response = await request(app)
        .post(`${config.apiPrefix}/auth/verify-token`)
        .send({
          token: 'invalid-token',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('valid', false);
    });

    it('should return 400 when token is missing', async () => {
      const response = await request(app)
        .post(`${config.apiPrefix}/auth/verify-token`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('required');
    });

    it('should return invalid for expired token', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1MTYyMzkwMjJ9.invalid';

      const response = await request(app)
        .post(`${config.apiPrefix}/auth/verify-token`)
        .send({
          token: expiredToken,
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('valid', false);
    });

    it('should return invalid for malformed token', async () => {
      const response = await request(app)
        .post(`${config.apiPrefix}/auth/verify-token`)
        .send({
          token: 'malformed.token.string',
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('valid', false);
    });
  });

  describe('Integration: Complete Authentication Flow', () => {
    it('should complete full authentication workflow', async () => {
      // Step 1: Create user
      testUser = await createTestUser({
        email: 'workflow@example.com',
        password: 'password123',
      });

      // Step 2: Login
      const loginResponse = await request(app)
        .post(`${config.apiPrefix}/auth/login`)
        .send({
          email: 'workflow@example.com',
          password: 'password123',
        })
        .expect(200);

      const tokens = loginResponse.body.data;
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');

      // Step 3: Verify access token
      const verifyResponse = await request(app)
        .post(`${config.apiPrefix}/auth/verify-token`)
        .send({
          token: tokens.accessToken,
        })
        .expect(200);

      expect(verifyResponse.body.data.valid).toBe(true);

      // Step 4: Refresh token
      const refreshResponse = await request(app)
        .post(`${config.apiPrefix}/auth/refresh-token`)
        .send({
          refreshToken: tokens.refreshToken,
        })
        .expect(200);

      const newAccessToken = refreshResponse.body.data.accessToken;
      expect(newAccessToken).toBeDefined();
      expect(newAccessToken).not.toBe(tokens.accessToken);

      // Step 5: Verify new access token
      const verifyNewResponse = await request(app)
        .post(`${config.apiPrefix}/auth/verify-token`)
        .send({
          token: newAccessToken,
        })
        .expect(200);

      expect(verifyNewResponse.body.data.valid).toBe(true);
    });
  });
});
