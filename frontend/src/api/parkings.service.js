// src/api/parkings.service.js
import { apiClient } from "./apiClient";
import { ENDPOINTS } from "./endpoints";

export const parkingsService = {
  search: ({ lat, lng, radius, start_at, end_at }) =>
    apiClient.get(ENDPOINTS.parkings.search, {
      query: { lat, lng, radius, start_at, end_at },
    }),

  details: (id) => apiClient.get(ENDPOINTS.parkings.details, { query: { id } }),

  availability: ({ parking_id, start_at, end_at }) =>
    apiClient.get(ENDPOINTS.parkings.availability, {
      query: { parking_id, start_at, end_at },
    }),
};
