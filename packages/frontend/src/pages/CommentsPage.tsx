import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { commentsAPI } from "../api/commentsApi";
import { postsAPI } from "../api/postsApi";
import { useAuth } from "../hooks/useAuth";
import { AnimalPost, Comment } from "../types";
import "./CommentsPage.css";

const CommentsPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<AnimalPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    if (!postId) return;

    postsAPI
      .getPostById(postId)
      .then((res) => {
        const data =
          (res.data as unknown as { success: boolean; data: AnimalPost })
            .data ?? res.data;
        setPost(data as AnimalPost);
      })
      .catch(() => {});

    setLoadingComments(true);
    commentsAPI
      .getPostComments(postId)
      .then((res) => {
        const payload = res.data as unknown as {
          success: boolean;
          data: { data: Comment[] };
        };
        const list = payload.data?.data ?? (res.data as unknown as Comment[]);
        setComments(Array.isArray(list) ? list : []);
      })
      .catch(() => setComments([]))
      .finally(() => setLoadingComments(false));
  }, [postId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newComment.trim();
    if (!content || !postId) return;
    setAddingComment(true);
    try {
      const res = await commentsAPI.addComment(postId, content);
      const created =
        (res.data as unknown as { success: boolean; data: Comment }).data ??
        res.data;
      setComments((prev) => [created as Comment, ...prev]);
      setPost((prev) =>
        prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : prev,
      );
      setNewComment("");
    } catch {
      alert("Failed to add comment.");
    } finally {
      setAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await commentsAPI.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setPost((prev) =>
        prev
          ? { ...prev, commentsCount: Math.max(0, prev.commentsCount - 1) }
          : prev,
      );
    } catch {
      alert("Failed to delete comment.");
    }
  };

  return (
    <div className="comments-page">
      <button className="back-btn" onClick={() => navigate(`/post/${postId}`)}>
        ← Animal Details
      </button>

      <div className="comments-container">
        <h2
          style={{
            fontSize: "1.15rem",
            color: "#2d3748",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          💬 {post?.name ? `${post.name}'s` : ""} Conversations
          <span className="comments-badge">
            {post?.commentsCount ?? comments.length}
          </span>
        </h2>

        {/* Add comment form */}
        <form className="add-comment-form" onSubmit={handleAddComment}>
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}
          >
            <div className="comment-avatar-placeholder">
              {user?.username?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <input
              type="text"
              placeholder="Write a comment…"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={addingComment}
              maxLength={500}
              className="comment-input"
            />
          </div>
          <button
            type="submit"
            className="comment-submit-btn"
            disabled={addingComment || !newComment.trim()}
          >
            {addingComment ? "Posting…" : "Post"}
          </button>
        </form>

        {/* Comment list */}
        {loadingComments ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "2rem",
            }}
          >
            <div className="spinner-ring" />
          </div>
        ) : comments.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: "#a0aec0",
              fontSize: "0.875rem",
              padding: "2rem 0",
              margin: 0,
            }}
          >
            No comments yet. Be the first to say something!
          </p>
        ) : (
          <ul className="comments-list">
            {comments.map((c) => {
              const commentUser = c.userId as unknown as {
                _id: string;
                username: string;
              };
              const isCommentOwner = user?._id === commentUser?._id;
              return (
                <li key={c._id} className="comment-item">
                  <div className="comment-avatar">
                    {commentUser?.username?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                  <div className="comment-body">
                    <div className="comment-header">
                      <button
                        className="comment-author"
                        onClick={() => navigate(`/profile/${commentUser?._id}`)}
                      >
                        {commentUser?.username ?? "Unknown"}
                      </button>
                      <span className="comment-date">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                      {isCommentOwner && (
                        <button
                          className="comment-delete-btn"
                          onClick={() => handleDeleteComment(c._id)}
                          title="Delete comment"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <p className="comment-text">{c.content}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CommentsPage;
