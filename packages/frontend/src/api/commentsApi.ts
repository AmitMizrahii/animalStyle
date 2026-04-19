import { Comment, PaginatedResponse } from "shared";
import apiClient from "./apiClient";

export const commentsAPI = {
  getCommentsByPostId: async (
    postId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<typeof Comment>> => {
    const res = await apiClient.get(
      `/comments/${postId}?page=${page}&limit=${limit}`,
    );
    return PaginatedResponse(Comment).parse(res.data);
  },

  addComment: async (postId: string, content: string): Promise<Comment> => {
    const res = await apiClient.post(`/comments/${postId}`, { content });

    return Comment.parse(res.data);
  },

  deleteComment: async (commentId: string) => {
    await apiClient.delete(`/comments/${commentId}`);
  },
};
