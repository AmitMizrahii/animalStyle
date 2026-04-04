import { IComment, CommentWithUser } from "../../types";

export interface CreateCommentData {
  postId: string;
  userId: string;
  content: string;
}

export interface CommentQueryOptions {
  page: number;
  limit: number;
}

export interface ICommentRepository {
  findByPostId(
    postId: string,
    opts: CommentQueryOptions,
  ): Promise<{ comments: CommentWithUser[]; total: number }>;

  findById(id: string): Promise<IComment | null>;

  create(data: CreateCommentData): Promise<CommentWithUser>;

  delete(id: string): Promise<void>;

  deleteByPostId(postId: string): Promise<void>;

  countByPostId(postId: string): Promise<number>;

  countByPostIds(postIds: string[]): Promise<Map<string, number>>;
}
