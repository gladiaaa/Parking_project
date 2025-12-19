// src/api/stationnements.service.js
import { apiClient } from "./apiClient";
import { ENDPOINTS } from "./endpoints";

export const stationnementsService = {
  enter: ({ reservation_id }) => apiClient.post(ENDPOINTS.stationnements.enter, { body: { reservation_id } }),
  exit: ({ stationnement_id }) => apiClient.post(ENDPOINTS.stationnements.exit, { body: { stationnement_id } }),
  mine: () => apiClient.get(ENDPOINTS.stationnements.mine),
};
