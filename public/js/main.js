/**
 * Main JavaScript file for client-side functionality
 */

// Log when page is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Node.js MVC Application loaded successfully');

  // Add smooth scroll behavior
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
});

/**
 * Fetch users from API (example)
 */
async function fetchUsers() {
  try {
    const response = await fetch('/api/users');
    const data = await response.json();

    if (data.success) {
      console.log('Users:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}

/**
 * Create new user (example)
 */
async function createUser(userData) {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (data.success) {
      console.log('User created:', data.data);
      return data.data;
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error creating user:', error);
  }
}

/**
 * Update user (example)
 */
async function updateUser(userId, userData) {
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (data.success) {
      console.log('User updated:', data.data);
      return data.data;
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error updating user:', error);
  }
}

/**
 * Delete user (example)
 */
async function deleteUser(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (data.success) {
      console.log('User deleted successfully');
      return true;
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error deleting user:', error);
  }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fetchUsers,
    createUser,
    updateUser,
    deleteUser
  };
}
