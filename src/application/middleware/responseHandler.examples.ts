/**
 * Response Handler Usage Examples
 *
 * This file demonstrates how to use the response handler middleware
 * in your controllers and route handlers.
 */

import { Request, Response } from 'express';

// ============= SUCCESS RESPONSES (2xx) =============

/**
 * Example: Send 200 OK response
 */
export const getUsers = async (req: Request, res: Response) => {
  const users = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];

  // Method 1: With data and custom message
  res.sendSuccess(users, 'Users retrieved successfully');

  // Method 2: With data only (uses default message)
  res.sendSuccess(users);

  // Method 3: With custom message only
  res.sendSuccess(null, 'Operation completed');
};

/**
 * Example: Send 201 Created response
 */
export const createUser = async (req: Request, res: Response) => {
  const newUser = { id: 3, name: 'Bob', email: 'bob@example.com' };

  // With data and custom message
  res.sendCreated(newUser, 'User created successfully');

  // With data only (uses default message)
  res.sendCreated(newUser);
};

/**
 * Example: Send 202 Accepted response (for async operations)
 */
export const processJob = async (req: Request, res: Response) => {
  const jobId = 'job-123';

  res.sendAccepted({ jobId }, 'Job accepted for processing');
};

/**
 * Example: Send 204 No Content response
 */
export const deleteUser = async (req: Request, res: Response) => {
  // After successful deletion
  res.sendNoContent();
};

// ============= CLIENT ERROR RESPONSES (4xx) =============

/**
 * Example: Send 400 Bad Request response
 */
export const invalidRequest = async (req: Request, res: Response) => {
  // Method 1: With custom message
  res.sendBadRequest('Invalid input parameters');

  // Method 2: With custom message and error details
  res.sendBadRequest('Invalid input', {
    field: 'email',
    issue: 'Email format is invalid'
  });

  // Method 3: With default message
  res.sendBadRequest();
};

/**
 * Example: Send 401 Unauthorized response
 */
export const unauthorized = async (req: Request, res: Response) => {
  // Method 1: With custom message
  res.sendUnauthorized('Invalid credentials');

  // Method 2: With default message
  res.sendUnauthorized();
};

/**
 * Example: Send 403 Forbidden response
 */
export const forbidden = async (req: Request, res: Response) => {
  res.sendForbidden('You do not have permission to access this resource');
};

/**
 * Example: Send 404 Not Found response
 */
export const notFound = async (req: Request, res: Response) => {
  // Method 1: Custom message
  res.sendNotFound('User not found');

  // Method 2: Default message
  res.sendNotFound();
};

/**
 * Example: Send 409 Conflict response
 */
export const conflict = async (req: Request, res: Response) => {
  // Method 1: With message only
  res.sendConflict('User with this email already exists');

  // Method 2: With message and error details
  res.sendConflict('Resource conflict detected', {
    field: 'email',
    value: 'john@example.com',
    message: 'Email already in use'
  });
};

/**
 * Example: Send 422 Validation Error response
 */
export const validationError = async (req: Request, res: Response) => {
  const errors = [
    { field: 'email', message: 'Email is required' },
    { field: 'password', message: 'Password must be at least 8 characters' }
  ];

  // Method 1: With custom message
  res.sendValidationError(errors, 'Validation failed');

  // Method 2: With default message
  res.sendValidationError(errors);
};

/**
 * Example: Send 429 Too Many Requests response
 */
export const rateLimited = async (req: Request, res: Response) => {
  res.sendTooManyRequests('You have exceeded the rate limit');
};

// ============= SERVER ERROR RESPONSES (5xx) =============

/**
 * Example: Send 500 Internal Server Error response
 */
export const serverError = async (req: Request, res: Response) => {
  try {
    // Some operation that might fail
    throw new Error('Database connection failed');
  } catch (error: any) {
    // Method 1: With custom message and error details (error details only shown in development)
    res.sendServerError('Failed to process request', error);

    // Method 2: With custom message only
    res.sendServerError('An unexpected error occurred');

    // Method 3: With default message
    res.sendServerError();
  }
};

/**
 * Example: Send 501 Not Implemented response
 */
export const notImplemented = async (req: Request, res: Response) => {
  res.sendNotImplemented('This feature is not yet implemented');
};

/**
 * Example: Send 503 Service Unavailable response
 */
export const serviceUnavailable = async (req: Request, res: Response) => {
  res.sendServiceUnavailable('Database is currently unavailable');
};

// ============= CUSTOM RESPONSE =============

/**
 * Example: Send custom response with any status code
 */
export const customResponse = async (req: Request, res: Response) => {
  res.sendCustom(
    418,                           // status code
    { message: 'I am a teapot' },  // data
    'Teapot response',             // message
    true,                          // success flag
    null                           // errors (optional)
  );
};

// ============= COMPLETE CONTROLLER EXAMPLE =============

/**
 * Complete example: User controller with all response types
 */
export class UserController {
  async getAll(req: Request, res: Response) {
    try {
      const users = await getUsersFromDB();
      res.sendSuccess(users, 'Users retrieved successfully');
    } catch (error: any) {
      res.sendServerError('Failed to retrieve users', error);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const user = await getUserById(req.params.id);

      if (!user) {
        return res.sendNotFound('User not found');
      }

      res.sendSuccess(user);
    } catch (error: any) {
      res.sendServerError('Failed to retrieve user', error);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;

      // Check if user exists
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return res.sendConflict('User with this email already exists');
      }

      const newUser = await createUserInDB({ email, password, name });
      res.sendCreated(newUser, 'User created successfully');
    } catch (error: any) {
      res.sendServerError('Failed to create user', error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const user = await updateUserInDB(req.params.id, req.body);

      if (!user) {
        return res.sendNotFound('User not found');
      }

      res.sendSuccess(user, 'User updated successfully');
    } catch (error: any) {
      res.sendServerError('Failed to update user', error);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const deleted = await deleteUserFromDB(req.params.id);

      if (!deleted) {
        return res.sendNotFound('User not found');
      }

      res.sendNoContent();
    } catch (error: any) {
      res.sendServerError('Failed to delete user', error);
    }
  }

  async authenticate(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await authenticateUser(email, password);

      if (!user) {
        return res.sendUnauthorized('Invalid email or password');
      }

      res.sendSuccess({ user, token: 'jwt-token' }, 'Login successful');
    } catch (error: any) {
      res.sendServerError('Authentication failed', error);
    }
  }

  async validatePermission(req: Request, res: Response) {
    try {
      const hasPermission = await checkUserPermission(req.params.id);

      if (!hasPermission) {
        return res.sendForbidden('You do not have permission to perform this action');
      }

      res.sendSuccess(null, 'Permission granted');
    } catch (error: any) {
      res.sendServerError('Failed to check permission', error);
    }
  }
}

// Mock database functions (replace with actual implementations)
async function getUsersFromDB(): Promise<any[]> { return []; }
async function getUserById(id: string): Promise<any> { return null; }
async function getUserByEmail(email: string): Promise<any> { return null; }
async function createUserInDB(data: any): Promise<any> { return data; }
async function updateUserInDB(id: string, data: any): Promise<any> { return null; }
async function deleteUserFromDB(id: string): Promise<boolean> { return false; }
async function authenticateUser(email: string, password: string): Promise<any> { return null; }
async function checkUserPermission(userId: string): Promise<boolean> { return false; }
