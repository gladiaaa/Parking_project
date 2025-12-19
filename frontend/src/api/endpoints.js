// src/api/endpoints.js
export const ENDPOINTS = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    me: "/auth/me",
  },

  parkings: {
    search: "/parkings/search", // autour GPS + dates (si tu l’as)
    details: "/parkings/details", // GET ?id=
    availability: "/parkings/availability", // GET ?parking_id&start_at&end_at
  },

  reservations: {
    create: "/reservations", // POST
    mine: "/reservations/mine", // GET (si dispo)
    invoice: (id) => `/reservations/${id}/invoice`, // GET (si dispo)
  },

  stationnements: {
    enter: "/stationnements/enter", // POST
    exit: "/stationnements/exit", // POST
    mine: "/stationnements/mine", // GET
  },

  subscriptions: {
    listByParking: "/subscriptions/by-parking", // GET ?parking_id=
    subscribe: "/subscriptions", // POST
    mine: "/subscriptions/mine", // GET
  },

  owner: {
    myParkings: "/owner/parkings",
    parkingReservations: "/owner/parkings/reservations", // GET ?parking_id=
    parkingStationnements: "/owner/parkings/stationnements", // GET ?parking_id=
    revenueMonthly: "/owner/parkings/revenue-monthly", // GET ?parking_id&month=YYYY-MM
    availabilityAt: "/owner/parkings/availability-at", // GET ?parking_id&at=
    overstays: "/owner/parkings/overstays", // GET ?parking_id=
  },
};
