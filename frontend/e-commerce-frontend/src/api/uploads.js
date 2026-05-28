import { apiUpload } from './client';

export const uploadsApi = {
  uploadProductImage: (file) => apiUpload('/api/admin/images', file),
};
