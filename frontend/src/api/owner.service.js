// src/api/owner.service.js
import { apiClient } from "./apiClient";
import { ENDPOINTS } from "./endpoints";

export const ownerService = {
  myParkings: () => apiClient.get(ENDPOINTS.owner.myParkings),
  parkingReservations: (parking_id) => apiClient.get(ENDPOINTS.owner.parkingReservations, { query: { parking_id } }),
  parkingStationnements: (parking_id) => apiClient.get(ENDPOINTS.owner.parkingStationnements, { query: { parking_id } }),
  revenueMonthly: ({ parking_id, month }) => apiClient.get(ENDPOINTS.owner.revenueMonthly, { query: { parking_id, month } }),
  availabilityAt: ({ parking_id, at }) => apiClient.get(ENDPOINTS.owner.availabilityAt, { query: { parking_id, at } }),
  overstays: (parking_id) => apiClient.get(ENDPOINTS.owner.overstays, { query: { parking_id } }),
};
