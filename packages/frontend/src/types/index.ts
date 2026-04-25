export {
  User,
  UserWithToken,
  ApiError,
  Comment,
  AnimalPost,
  PaginatedResponse,
  createPostSchema,
  updatePostSchema,
  updateProfileSchema,
} from "shared";
export type { CreatePostSchema, RegisterRequest, LoginRequest } from "shared";

export interface AuthResponse {
  success: boolean;
  data: import("shared").UserWithToken;
}
