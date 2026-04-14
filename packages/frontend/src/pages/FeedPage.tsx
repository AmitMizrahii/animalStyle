import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePosts } from "../hooks/usePosts";
import "./FeedPage.css";

const PostCardSkeleton: React.FC = () => (
  <div className="post-card skeleton-card">
    <div className="skeleton-image" />
    <div className="post-content">
      <div className="skeleton-line sk-name" />
      <div className="skeleton-line sk-meta" />
      <div className="skeleton-line sk-location" />
      <div className="skeleton-line sk-desc" />
      <div className="skeleton-line sk-desc sk-desc-short" />
      <div className="skeleton-footer">
        <div className="skeleton-line sk-btn" />
      </div>
    </div>
  </div>
);

const FeedPage: React.FC = () => {
  const navigate = useNavigate();
  const { posts, isLoading, error, hasMore, fetchPosts, toggleLike, loadMore } =
    usePosts();

  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPosts(1, 10);
  }, []);

  // Infinite scroll via IntersectionObserver — works with any scroll container
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "https://placehold.co/300x200?text=No+Image";
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("/public")) return `${apiBase}${imagePath}`;
    return `${apiBase}/${imagePath}`;
  };

  const displayPosts = posts;
  const displayError = error ?? null;
  const showSkeletons = isLoading;
  const showBottomSpinner = isLoading && posts.length > 0;

  return (
    <div className="feed-page">
      <div className="feed-header">
        <h1>Find your soul companion</h1>
        <p className="feed-subtitle">
          Browse animals looking for their forever home
        </p>
      </div>

      {displayError && (
        <div className="error-container">
          <p>⚠️ {displayError}</p>
        </div>
      )}

      <div className="posts-grid">
        {showSkeletons
          ? Array.from({ length: 6 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))
          : displayPosts.map((post) => (
              <div key={post._id} className="post-card">
                <div
                  className="post-image-wrapper"
                  onClick={() => navigate(`/post/${post._id}`)}
                >
                  <img
                    src={getImageUrl(post.imagePaths[0])}
                    alt={post.name}
                    className="post-image"
                    onError={(e) =>
                      (e.currentTarget.src =
                        "https://placehold.co/300x200?text=No+Image")
                    }
                  />
                  <span className="post-type-badge">{post.type}</span>
                </div>
                <div className="post-content">
                  <h2 className="post-name">{post.name}</h2>
                  <p className="post-meta">
                    {post.age} yr • {post.gender}
                  </p>
                  <p className="post-location">📍 {post.location}</p>
                  <p className="post-description">{post.description}</p>
                  <div className="post-footer">
                    <button
                      className={`like-btn ${post.isLiked ? "liked" : ""}`}
                      onClick={() => toggleLike(post._id)}
                      title={post.isLiked ? "Unlike" : "Like"}
                    >
                      {post.isLiked ? "❤️" : "🤍"} {post.likes.length}
                    </button>
                    <span className="comment-count">
                      💬 {post.commentsCount}
                    </span>
                    <button
                      className="view-details-btn"
                      onClick={() => navigate(`/post/${post._id}`)}
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {showBottomSpinner && (
        <div className="loading-spinner">
          <div className="spinner-ring" />
          <p>Loading...</p>
        </div>
      )}

      {!hasMore && posts.length > 0 && !isLoading && (
        <p className="end-message">You've seen all the animals 🐾</p>
      )}

      {displayPosts.length === 0 && !showSkeletons && (
        <div className="empty-state">
          <div className="empty-icon">🐾</div>
          <p>"No posts yet. Be the first to post an animal for adoption!"</p>
        </div>
      )}

      <div ref={sentinelRef} />
    </div>
  );
};

export default FeedPage;
