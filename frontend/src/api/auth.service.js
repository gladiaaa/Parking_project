import { apiClient } from "./apiClient";

export const authService = {
  register: ({ email, password, firstname, lastname, role }) =>
    apiClient.post("/auth/register", {
      email,
      password,
      firstname,
      lastname,
      ...(role ? { role } : {}), // "USER" | "OWNER"
    }),

  login: ({ email, password }) =>
    apiClient.post("/auth/login", { email, password }),
};
