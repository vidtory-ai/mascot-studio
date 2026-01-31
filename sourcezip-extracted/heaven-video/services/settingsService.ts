// services/settingsService.ts

const API_KEY_STORAGE_KEY = 'heaven-studios-api-key-v2';
// This is the default key provided. It can be overridden in the app's settings.
const DEFAULT_API_KEY = 'Liên hệ Admin để có API Key sử dụng';

export const settingsService = {
  getApiKey: (): string => {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || DEFAULT_API_KEY;
  },
  setApiKey: (apiKey: string): void => {
    if (apiKey.trim()) {
        localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
    } else {
        // If the user clears the input, we remove the key to fall back to the default.
        localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  },
};
