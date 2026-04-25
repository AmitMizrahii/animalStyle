import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchAPI } from "../api/search-api";
import { usePosts } from "../hooks/usePosts";
import { AnimalPost } from "../types";
import "./FeedPage.css";

const SEARCH_MESSAGES = [
  "Sniffing through the database…",
  "Consulting the animal experts…",
  "Matching your perfect companion…",
  "Almost there, tails are wagging…",
];

const SearchLoader: React.FC = () => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setMsgIndex((i) => (i + 1) % SEARCH_MESSAGES.length),
      2000,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="search-loader">
      <div className="search-loader-ring">
        <span className="search-loader-paw">🐾</span>
      </div>
      <p className="search-loader-title">AI is searching…</p>
      <p className="search-loader-msg">{SEARCH_MESSAGES[msgIndex]}</p>
    </div>
  );
};

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

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<AnimalPost[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);

  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPosts(1, 10);
  }, []);

  useEffect(() => {
    if (isSearchMode) return;
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
  }, [hasMore, isLoading, isSearchMode]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setSearchLoading(true);
    setSearchError(null);

    try {
      const res = await searchAPI.search(q, 1, 20);
      const total = res?.total ?? res.data.length;
      setSearchResults(res.data);
      setSearchTotal(total);
      setIsSearchMode(true);
    } catch {
      setSearchError("Search failed. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearchMode(false);
    setSearchResults([]);
    setSearchError(null);
  };

  const handleToggleLike = async (postId: string) => {
    await toggleLike(postId);
    if (isSearchMode) {
      setSearchResults((prev) =>
        prev.map((post) => {
          if (post._id !== postId) return post;
          const isLiked = !post.isLiked;
          const likesCount = isLiked
            ? post.likes.length + 1
            : post.likes.length - 1;
          return { ...post, isLiked, likes: Array(likesCount).fill("") };
        }),
      );
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "/public/noIamage.svg";
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("/public")) return `${apiBase}${imagePath}`;
    return `${apiBase}/${imagePath}`;
  };

  const displayPosts = isSearchMode ? searchResults : posts;
  const displayError = searchError || (!isSearchMode ? error : null);
  const showSkeletons = !isSearchMode && isLoading && posts.length === 0;
  const showBottomSpinner = !isSearchMode && isLoading && posts.length > 0;

  return (
    <div className="feed-page">
      <div className="feed-header">
        <h1>Find your soul companion</h1>
        <p className="feed-subtitle">
          Browse animals looking for their forever home
        </p>

        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder='Try: "small friendly dog in Tel Aviv" or "young cat for apartment"'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={searchLoading}
              className="search-input"
            />
            <button
              type="submit"
              className="search-btn"
              disabled={searchLoading || !searchQuery.trim()}
            >
              {searchLoading ? "Searching..." : "Search"}
            </button>
          </div>
          {isSearchMode && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={handleClearSearch}
            >
              ✕ Clear — show all posts
            </button>
          )}
        </form>

        {isSearchMode && !searchLoading && (
          <p className="search-results-label">
            🤖 AI found <strong>{searchTotal}</strong> match
            {searchTotal !== 1 ? "es" : ""} for &ldquo;{searchQuery}&rdquo;
          </p>
        )}
      </div>

      {displayError && (
        <div className="error-container">
          <p>⚠️ {displayError}</p>
        </div>
      )}

      {searchLoading && <SearchLoader />}

      <div className="posts-grid">
        {showSkeletons
          ? Array.from({ length: 6 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))
          : !searchLoading && displayPosts.map((post) => (
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
                      (e.currentTarget.src = "/public/noImage.svg")
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
                      onClick={() => handleToggleLike(post._id)}
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
