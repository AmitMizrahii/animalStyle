import { useState, useCallback } from "react";
import { AnimalPost, PaginatedResponse } from "../types";
import { postsAPI } from "../api/postsApi";

export const usePosts = () => {
  const [posts, setPosts] = useState<AnimalPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchPosts = useCallback(
    async (pageNum: number = 1, limit: number = 10) => {
      try {
        setIsLoading(true);
        setError(null);

        if (pageNum === 1) {
          setPosts([]);
        }

        const response = await postsAPI.getAllPosts(pageNum, limit);
        const data = (response.data as any)
          .data as PaginatedResponse<AnimalPost>;

        setPosts((prev) =>
          pageNum === 1 ? data.data : [...prev, ...data.data],
        );
        setPage(pageNum);
        setHasMore(data.hasMore);
        setTotal(data.total || 0);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch posts";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchPosts(page + 1);
  }, [page, hasMore, isLoading, fetchPosts]);

  const toggleLike = useCallback(async (postId: string) => {
    try {
      const res = await postsAPI.likePost(postId);
      const { isLiked, likesCount } = (
        res.data as { data: { isLiked: boolean; likesCount: number } }
      ).data;

      setPosts((prev) =>
        prev.map((post) => {
          if (post._id === postId) {
            return {
              ...post,
              isLiked,
              likes: Array(likesCount).fill(""),
            };
          }
          return post;
        }),
      );
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  }, []);

  return {
    posts,
    isLoading,
    error,
    page,
    hasMore,
    total,
    fetchPosts,
    loadMore,
    toggleLike,
  };
};
