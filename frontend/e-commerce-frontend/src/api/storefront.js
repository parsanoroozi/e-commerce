import { apiRequest } from './client';

export const storefrontApi = {
  settings: () => apiRequest('/api/storefront/settings'),
};
