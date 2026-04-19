import { z } from "zod";
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
    return z.object({ data: PaginatedResponse(Comment) }).parse(res.data).data;
  },

  addComment: async (postId: string, content: string): Promise<Comment> => {
    const res = await apiClient.post(`/comments/${postId}`, { content });

    return z.object({ data: Comment }).parse(res.data).data;
  },

  deleteComment: async (commentId: string) => {
    await apiClient.delete(`/comments/${commentId}`);
  },
};
