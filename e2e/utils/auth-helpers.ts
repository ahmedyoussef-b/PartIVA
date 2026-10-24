import { users } from '../fixtures/users';

export type Role = 'ADMIN' | 'USER' | 'VIEWER';

export interface TestUser {
  role: Role;
  email: string;
  password: string;
  storageStatePath: string;
}

export const usersMap: Record<Role, TestUser> = users;

// Reusable auth request with retry logic for rate limiting
export async function authRequest(
  request: import('@playwright/test').APIRequestContext,
  role: Role,
) {
  const user = usersMap[role];
  
  // Retry with exponential backoff for rate limiting (429)
  const MAX_RETRIES = 3;
  let retryCount = 0;
  let response;
  
  while (retryCount < MAX_RETRIES) {
    response = await request.post('/api/auth/sign-in/email', {
      data: { email: user.email, password: user.password },
    });
    
    if (response.status() === 429) {
      retryCount++;
      if (retryCount >= MAX_RETRIES) {
        break;
      }
      // Exponential backoff: 100ms * (2 ^ retryCount)
      const delay = 100 * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    
    // Any other non-200 response should fail
    if (response.status() !== 200) {
      break;
    }
    
    // Success
    break;
  }
  
  if (!response || response.status() !== 200) {
    throw new Error(`Auth failed with status ${response?.status()}`);
  }
  
  return { headers: {} };
}

// Reusable API request function with retry for rate limiting
export async function apiRequest(
  request: import('@playwright/test').APIRequestContext,
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  endpoint: string,
  options?: {
    headers?: Record<string, string>;
    data?: any;
    params?: Record<string, string>;
  },
) {
  const MAX_RETRIES = 3;
  let retryCount = 0;
  let response;
  
  while (retryCount < MAX_RETRIES) {
    // Type-safe API request
    switch (method.toLowerCase()) {
      case 'get':
        response = await request.get(endpoint, { headers: options?.headers, params: options?.params });
        break;
      case 'post':
        response = await request.post(endpoint, { headers: options?.headers, data: options?.data });
        break;
      case 'put':
        response = await request.put(endpoint, { headers: options?.headers, data: options?.data });
        break;
      case 'delete':
        response = await request.delete(endpoint, { headers: options?.headers });
        break;
      case 'patch':
        response = await request.patch(endpoint, { headers: options?.headers, data: options?.data });
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    
    if (response.status() === 429) {
      retryCount++;
      if (retryCount >= MAX_RETRIES) {
        break;
      }
      const delay = 100 * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    
    // For 401/403, don't retry
    if ([401, 403].includes(response.status())) {
      break;
    }
    
    // For successful responses or other errors, stop retrying
    if (response.status() < 500) {
      break;
    }
  }
  
  return response;
}