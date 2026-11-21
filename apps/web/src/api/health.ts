import { apiRequest } from './client.ts';
import { HealthData } from '../types/health.ts';

export const healthApi = {
  /**
   * Calls GET /api/health to verify backend connectivity and database status.
   * Leverages the existing API client configuration (VITE_API_URL or local dev proxy).
   */
  checkHealth: (signal?: AbortSignal): Promise<HealthData> => {
    return apiRequest<HealthData>('/api/health', signal ? { signal } : {});
  },
};
