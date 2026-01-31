// This is a mock usage tracking service.
// In a real application, this logic would live on a secure backend server
// and would use a database (like Google Sheets, Firestore, etc.) for storage.
// This implementation uses localStorage to simulate the behavior on the client-side.

const STORAGE_KEY = 'userUsageData';

export const USAGE_LIMITS = {
  generateStoryboard: 100,
  generateImage: 500,
  generateVideo: 500,
};

type ActionType = keyof typeof USAGE_LIMITS;

interface UsageRecord {
  count: number;
  lastReset: string; // ISO string for the date
}

interface UserUsage {
  [username: string]: {
    [action in ActionType]?: UsageRecord;
  };
}

const getStartOfTodayISO = (): string => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString().split('T')[0]; // Return just the date part YYYY-MM-DD
};

const readUsageData = (): UserUsage => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Failed to parse usage data from localStorage", error);
    return {};
  }
};

const writeUsageData = (data: UserUsage): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error)
 {
    console.error("Failed to write usage data to localStorage", error);
  }
};

export const usageService = {
  /**
   * Retrieves the current usage for a user, resetting counts if it's a new day.
   */
  getUsage(username: string): Record<ActionType, UsageRecord> {
    const allData = readUsageData();
    const userData = allData[username] || {};
    const today = getStartOfTodayISO();

    const result: Record<ActionType, UsageRecord> = {
        generateStoryboard: { count: 0, lastReset: today },
        generateImage: { count: 0, lastReset: today },
        generateVideo: { count: 0, lastReset: today },
    };

    for (const action in USAGE_LIMITS) {
        const actionKey = action as ActionType;
        const record = userData[actionKey];
        if (record && record.lastReset === today) {
            result[actionKey] = record;
        }
    }
    
    // Ensure the user's data is up-to-date in storage
    allData[username] = result;
    writeUsageData(allData);

    return result;
  },

  /**
   * Logs that a user has performed a specific action.
   */
  logAction(username: string, action: ActionType): void {
    const allData = readUsageData();
    const usage = this.getUsage(username); // This also handles daily reset
    
    usage[action].count += 1;

    allData[username] = usage;
    writeUsageData(allData);
  },

  /**
   * Checks if a user can perform a specific action based on their daily limit.
   */
  canPerformAction(username: string, action: ActionType): boolean {
    const usage = this.getUsage(username); // This also handles daily reset
    const count = usage[action]?.count || 0;
    const limit = USAGE_LIMITS[action];
    
    return count < limit;
  },
};
