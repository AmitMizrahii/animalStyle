import { AnimalPost, CreatePostSchema, PaginatedResponse } from "shared";
import apiClient from "./apiClient";

export const postsAPI = {
  createPost: (data: CreatePostSchema) =>
    apiClient.post<AnimalPost>("/posts", data),

  getAllPosts: (page: number = 1, limit: number = 10) =>
    apiClient.get<PaginatedResponse<AnimalPost>>(
      `/posts?page=${page}&limit=${limit}`,
    ),
  likePost: (postId: string) => apiClient.post(`/posts/${postId}/like`),
};
