

// This is a mock authentication service.
// In a real application, this would make API calls to a secure backend.
// It uses localStorage to persist the login session.

// For demonstration, we'll simulate a user database.
// IMPORTANT: Never store plain text passwords. This is for mock purposes only.
const MOCK_USERS: Record<string, string> = {
  'guest': '', // For auto-login when LOGIN_REQUIRED is false
  'anhducanh': 'emkhongbiet2025',
  'anhducanh-user': 'emkhongbiet2025',
  'heavenstuidos': 'anhducanh2025',
  'editorheaven' : 'contentYoutube'
};

// Simulate a network delay
const NETWORK_DELAY = 500;

export const authService = {
  /**
   * Attempts to log in a user with the given credentials.
   * @returns A promise that resolves with the username on success.
   */
  login: (username: string, password: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (MOCK_USERS[username] !== undefined && MOCK_USERS[username] === password) {
          localStorage.setItem('currentUser', username);
          resolve(username);
        } else {
          reject(new Error('Invalid username or password.'));
        }
      }, NETWORK_DELAY);
    });
  },

  /**
   * Logs out the current user by clearing session data.
   */
  logout: (): void => {
    localStorage.removeItem('currentUser');
  },

  /**
   * Checks if a user is currently logged in.
   * @returns The username if logged in, otherwise null.
   */
  getCurrentUser: (): string | null => {
    return localStorage.getItem('currentUser');
  },
};