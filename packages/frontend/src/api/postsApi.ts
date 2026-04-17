import { AnimalPost, CreatePostSchema, PaginatedResponse } from "shared";
import apiClient from "./apiClient";

export const postsAPI = {
  createPost: (data: CreatePostSchema) =>
    apiClient.post<AnimalPost>("/posts", data),

  getAllPosts: (page: number = 1, limit: number = 10) =>
    apiClient.get<PaginatedResponse<AnimalPost>>(
      `/posts?page=${page}&limit=${limit}`,
    ),

  getPostById: (postId: string) =>
    apiClient.get<AnimalPost>(`/posts/${postId}`),

  likePost: (postId: string) => apiClient.post(`/posts/${postId}/like`),

  deletePost: (postId: string) => apiClient.delete(`/posts/${postId}`),

  updatePost: (postId: string, data: Partial<AnimalPost>) =>
    apiClient.put<AnimalPost>(`/posts/${postId}`, data),

  getUserPosts: (userId: string, page: number = 1, limit: number = 10) =>
    apiClient.get<PaginatedResponse<AnimalPost>>(
      `/posts/user/${userId}?page=${page}&limit=${limit}`,
    ),

  getLikedPosts: (userId: string, page: number = 1, limit: number = 20) =>
    apiClient.get<PaginatedResponse<AnimalPost>>(
      `/posts/liked/${userId}?page=${page}&limit=${limit}`,
    ),
};
