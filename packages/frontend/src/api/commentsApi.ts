import { Comment, PaginatedResponse } from "shared";
import apiClient from "./apiClient";

export const commentsAPI = {
  getCommentsByPostId: (postId: string, page: number = 1, limit: number = 20) =>
    apiClient.get<PaginatedResponse<Comment>>(
      `/comments/${postId}?page=${page}&limit=${limit}`,
    ),

  addComment: (postId: string, content: string) =>
    apiClient.post(`/comments/${postId}`, { content }),

  deleteComment: (commentId: string) =>
    apiClient.delete(`/comments/${commentId}`),
};
