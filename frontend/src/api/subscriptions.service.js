// src/api/subscriptions.service.js
import { apiClient } from "./apiClient";
import { ENDPOINTS } from "./endpoints";

export const subscriptionsService = {
  /**
   * Abonnements de l'utilisateur connecté
   */
  mine: () =>
    apiClient.get(ENDPOINTS.subscriptions.mine),

  /**
   * Abonnements actifs / existants pour un parking (OWNER)
   */
  listByParking: (parking_id) =>
    apiClient.get(ENDPOINTS.subscriptions.listByParking, {
      query: { parking_id },
    }),

  /**
   * Créer / souscrire à un abonnement
   * ex:
   * {
   *   parking_id,
   *   type: "monthly" | "annual" | ...
   *   start_date,
   *   end_date
   * }
   */
  subscribe: (data) =>
    apiClient.post(ENDPOINTS.subscriptions.subscribe, {
      body: data,
    }),
};
