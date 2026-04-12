export * from "shared";

export interface AuthResponse {
  success: boolean;
  data: import("shared").UserWithToken;
}
