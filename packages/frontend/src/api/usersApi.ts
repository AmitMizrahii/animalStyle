import apiClient from "./apiClient";

export const usersAPI = {
  getCurrentUser: () => apiClient.get("/users/me"),

  updateProfile: (data: { username?: string; profileImagePath?: string }) =>
    apiClient.put("/users/update", data),

  getUserById: (userId: string) => apiClient.get(`/users/${userId}`),
};
