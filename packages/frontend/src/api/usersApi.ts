import { z } from "zod";
import { User } from "../types";
import apiClient from "./apiClient";

export const usersAPI = {
  getCurrentUser: () => apiClient.get("/users/me"),

  updateProfile: (data: { username?: string; profileImagePath?: string }) =>
    apiClient.put("/users/update", data),

  getUserById: async (userId: string): Promise<User> => {
    const res = await apiClient.get(`/users/${userId}`);

    return z.object({ data: User }).parse(res.data).data;
  },
};
