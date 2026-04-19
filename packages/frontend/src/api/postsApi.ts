import { AnimalPost, CreatePostSchema, PaginatedResponse } from "shared";
import apiClient from "./apiClient";

export const postsAPI = {
  createPost: (data: CreatePostSchema) =>
    apiClient.post<AnimalPost>("/posts", data),

  getAllPosts: async (
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<typeof AnimalPost>> => {
    const res = await apiClient.get<PaginatedResponse<typeof AnimalPost>>(
      `/posts?page=${page}&limit=${limit}`,
    );

    return PaginatedResponse(AnimalPost).parse(res.data);
  },

  getPostById: async (postId: string): Promise<AnimalPost> => {
    const res = await apiClient.get<AnimalPost>(`/posts/${postId}`);

    return AnimalPost.parse(res.data);
  },

  likePost: (postId: string) => apiClient.post(`/posts/${postId}/like`),

  deletePost: (postId: string) => apiClient.delete(`/posts/${postId}`),

  updatePost: async (
    postId: string,
    data: Partial<AnimalPost>,
  ): Promise<AnimalPost> => {
    const res = await apiClient.put<AnimalPost>(`/posts/${postId}`, data);

    return AnimalPost.parse(res.data);
  },

  getUserPosts: async (
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<typeof AnimalPost>> => {
    const res = await apiClient.get<PaginatedResponse<typeof AnimalPost>>(
      `/posts/user/${userId}?page=${page}&limit=${limit}`,
    );

    return PaginatedResponse(AnimalPost).parse(res.data);
  },

  getLikedPosts: async (
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<typeof AnimalPost>> => {
    const res = await apiClient.get<PaginatedResponse<typeof AnimalPost>>(
      `/posts/liked/${userId}?page=${page}&limit=${limit}`,
    );

    return PaginatedResponse(AnimalPost).parse(res.data);
  },
};
