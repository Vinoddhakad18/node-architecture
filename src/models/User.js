/**
 * User Model
 * Represents the User entity in the application
 */

class User {
  constructor(id, name, email, role = 'user') {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
    this.createdAt = new Date();
  }

  // Validate user data
  static validate(userData) {
    const errors = [];

    if (!userData.name || userData.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!userData.email || !this.isValidEmail(userData.email)) {
      errors.push('Valid email is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Email validation helper
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Convert user to JSON (remove sensitive data if needed)
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      createdAt: this.createdAt
    };
  }
}

// In-memory data store (replace with database in production)
class UserRepository {
  constructor() {
    this.users = [];
    this.nextId = 1;
    this._initializeSampleData();
  }

  // Initialize with sample data
  _initializeSampleData() {
    this.users = [
      new User(this.nextId++, 'John Doe', 'john@example.com', 'admin'),
      new User(this.nextId++, 'Jane Smith', 'jane@example.com', 'user'),
      new User(this.nextId++, 'Bob Wilson', 'bob@example.com', 'user')
    ];
  }

  // Get all users
  findAll() {
    return this.users;
  }

  // Get user by ID
  findById(id) {
    return this.users.find(user => user.id === parseInt(id));
  }

  // Get user by email
  findByEmail(email) {
    return this.users.find(user => user.email === email);
  }

  // Create new user
  create(userData) {
    const validation = User.validate(userData);

    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Check if email already exists
    if (this.findByEmail(userData.email)) {
      throw new Error('Email already exists');
    }

    const user = new User(
      this.nextId++,
      userData.name,
      userData.email,
      userData.role || 'user'
    );

    this.users.push(user);
    return user;
  }

  // Update user
  update(id, userData) {
    const user = this.findById(id);

    if (!user) {
      return null;
    }

    if (userData.name) user.name = userData.name;
    if (userData.email) user.email = userData.email;
    if (userData.role) user.role = userData.role;

    return user;
  }

  // Delete user
  delete(id) {
    const index = this.users.findIndex(user => user.id === parseInt(id));

    if (index === -1) {
      return false;
    }

    this.users.splice(index, 1);
    return true;
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
export { User };
