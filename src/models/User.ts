export interface IUser {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

export class User implements IUser {
  id: number;
  name: string;
  email: string;
  createdAt: Date;

  constructor(id: number, name: string, email: string) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.createdAt = new Date();
  }

  // Example method to demonstrate business logic in model
  getFullInfo(): string {
    return `User #${this.id}: ${this.name} (${this.email})`;
  }

  // Simulate data validation
  static validate(userData: Partial<IUser>): boolean {
    if (!userData.name || userData.name.length < 2) {
      return false;
    }
    if (!userData.email || !userData.email.includes('@')) {
      return false;
    }
    return true;
  }
}

// Mock database (in real app, this would be a database connection)
export class UserModel {
  private static users: User[] = [
    new User(1, 'John Doe', 'john@example.com'),
    new User(2, 'Jane Smith', 'jane@example.com'),
  ];
  private static currentId = 3;

  static async findAll(): Promise<User[]> {
    // Simulate async database operation
    return Promise.resolve(this.users);
  }

  static async findById(id: number): Promise<User | undefined> {
    return Promise.resolve(this.users.find(user => user.id === id));
  }

  static async create(name: string, email: string): Promise<User> {
    const newUser = new User(this.currentId++, name, email);
    this.users.push(newUser);
    return Promise.resolve(newUser);
  }

  static async update(id: number, updates: Partial<IUser>): Promise<User | null> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;

    const user = this.users[userIndex];
    if (updates.name) user.name = updates.name;
    if (updates.email) user.email = updates.email;

    return Promise.resolve(user);
  }

  static async delete(id: number): Promise<boolean> {
    const initialLength = this.users.length;
    this.users = this.users.filter(user => user.id !== id);
    return Promise.resolve(this.users.length < initialLength);
  }
}
