export const userTypeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    role: Role!
    isActive: Boolean!
    isVerified: Boolean!
    lastLogin: String
    createdAt: String!
    updatedAt: String!
  }

  enum Role {
    admin
    user
    moderator
  }

  type AuthPayload {
    user: User!
    tokens: Tokens!
  }

  type Tokens {
    accessToken: String!
    refreshToken: String!
  }

  type UserList {
    users: [User!]!
    pagination: Pagination!
  }

  type Pagination {
    total: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
  }

  input RegisterInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input UpdateUserInput {
    firstName: String
    lastName: String
    email: String
  }

  type Query {
    # Get user by ID
    getUser(id: ID!): User

    # Get all users (Admin only)
    getUsers(page: Int, limit: Int, sortBy: String, sortOrder: String): UserList

    # Search users
    searchUsers(query: String!, page: Int, limit: Int): UserList

    # Get current user profile
    me: User
  }

  type Mutation {
    # Register a new user
    register(input: RegisterInput!): AuthPayload

    # Login user
    login(input: LoginInput!): AuthPayload

    # Create a new user (Admin only)
    createUser(input: RegisterInput!): User

    # Update user
    updateUser(id: ID!, input: UpdateUserInput!): User

    # Delete user (Admin only)
    deleteUser(id: ID!): Boolean

    # Toggle user active status
    toggleUserStatus(id: ID!): User
  }
`;
