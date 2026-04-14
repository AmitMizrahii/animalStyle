import { AuthResponse, LoginRequest, RegisterRequest } from "../types";
import apiClient from "./apiClient";

export const authAPI = {
  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>("/auth/register", data),

  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>("/auth/login", data),

  logout: () => apiClient.post("/auth/logout"),

  googleLogin: (credential: string) =>
    apiClient.post<AuthResponse>("/auth/google", { credential }),
};
