// src/api/reservations.service.js
import { apiClient } from "./apiClient";
import { ENDPOINTS } from "./endpoints";

export const reservationsService = {
  create: (data) => apiClient.post(ENDPOINTS.reservations.create, { body: data }),
  mine: () => apiClient.get(ENDPOINTS.reservations.mine),
  invoice: (id) => apiClient.get(ENDPOINTS.reservations.invoice(id)),
};
