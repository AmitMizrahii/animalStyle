import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { postsAPI } from "../api/postsApi";
import { uploadAPI } from "../api/uploadsApi";
import { usersAPI } from "../api/usersApi";
import { useAuth } from "../hooks/useAuth";
import { AnimalPost, User } from "../types";
import "./ProfilePage.css";

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, updateUserData } = useAuth();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<AnimalPost[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "liked">("posts");
  const [likedPosts, setLikedPosts] = useState<AnimalPost[]>([]);
  const [loadingLiked, setLoadingLiked] = useState(false);
  const [likedLoaded, setLikedLoaded] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const isOwnProfile = currentUser?._id === userId;
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  const getImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    if (path.startsWith("/public")) return `${apiBase}${path}`;
    return `${apiBase}/${path}`;
  };

  useEffect(() => {
    if (!userId) return;

    setLoadingProfile(true);
    setProfileError(null);
    usersAPI
      .getUserById(userId)
      .then((res) => {
        setProfileUser(res);
      })
      .catch(() => setProfileError("Could not load user profile."))
      .finally(() => setLoadingProfile(false));

    setLoadingPosts(true);
    postsAPI
      .getUserPosts(userId)
      .then((res) => {
        const list = res.data;
        setPosts(Array.isArray(list) ? list : []);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoadingPosts(false));
  }, [userId]);

  const openEditModal = () => {
    setEditUsername(profileUser?.username ?? "");
    setEditImagePreview("");
    setEditImageFile(null);
    setEditError(null);
    setIsEditing(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setEditImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleEditSave = async () => {
    if (!editUsername.trim()) {
      setEditError("Username cannot be empty.");
      return;
    }
    setEditLoading(true);
    setEditError(null);
    try {
      let profileImagePath = profileUser?.profileImagePath;

      if (editImageFile) {
        const uploadRes = await uploadAPI.uploadFile(editImageFile);
        profileImagePath = uploadRes.data.data.path;
      }

      await usersAPI.updateProfile({
        username: editUsername.trim(),
        profileImagePath,
      });

      const updated = { username: editUsername.trim(), profileImagePath };
      setProfileUser((prev) => (prev ? { ...prev, ...updated } : prev));
      updateUserData(updated);
      setIsEditing(false);
    } catch {
      setEditError("Failed to update profile. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    try {
      await postsAPI.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch {
      alert("Failed to delete post.");
    }
  };

  if (loadingProfile) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          gap: "1rem",
          color: "#718096",
        }}
      >
        <div className="spinner-ring" />
        <p>Loading profile…</p>
      </div>
    );
  }

  if (profileError || !profileUser) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          gap: "1rem",
          color: "#718096",
        }}
      >
        <p>⚠️ {profileError ?? "User not found."}</p>
        <button
          style={{
            padding: "0.5rem 1.2rem",
            background: "#4caf50",
            color: "#fff",
            borderRadius: "6px",
          }}
          onClick={() => navigate(-1)}
        >
          Go back
        </button>
      </div>
    );
  }

  const avatarUrl = getImageUrl(profileUser.profileImagePath);

  const editProfileModal = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
      onClick={() => setIsEditing(false)}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "2rem",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            margin: "0 0 1.5rem",
            fontSize: "1.3rem",
            color: "#2d3748",
          }}
        >
          Edit Profile
        </h2>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1.25rem",
          }}
        >
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              overflow: "hidden",
              background: "linear-gradient(135deg, #4caf50, #81c784)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "1.6rem",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {editImagePreview || profileUser.profileImagePath ? (
              <img
                src={
                  editImagePreview !== ""
                    ? editImagePreview
                    : (getImageUrl(profileUser.profileImagePath) ??
                      "/public/noImage.png")
                }
                alt="Preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                onError={() => setEditImagePreview("")}
              />
            ) : (
              <span>{editUsername.charAt(0).toUpperCase() || "?"}</span>
            )}
          </div>
          <label className="upload-avatar-label">
            Change Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              disabled={editLoading}
            />
          </label>
        </div>

        <div className="modal-field">
          <label htmlFor="edit-username">Username</label>
          <input
            id="edit-username"
            type="text"
            value={editUsername}
            onChange={(e) => setEditUsername(e.target.value)}
            disabled={editLoading}
            maxLength={30}
          />
        </div>

        {editError && (
          <p
            style={{
              color: "#c53030",
              fontSize: "0.85rem",
              marginBottom: "0.75rem",
            }}
          >
            {editError}
          </p>
        )}

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            className="modal-save-btn"
            onClick={handleEditSave}
            disabled={editLoading}
          >
            {editLoading ? "Saving…" : "Save Changes"}
          </button>
          <button
            className="modal-cancel-btn"
            onClick={() => setIsEditing(false)}
            disabled={editLoading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div style={{ width: 100, height: 100, marginBottom: "0.5rem" }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={profileUser.username}
              className="profile-avatar"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                (
                  e.currentTarget.nextElementSibling as HTMLElement | null
                )?.removeAttribute("style");
              }}
            />
          ) : null}
          <div
            className="profile-avatar-placeholder"
            style={avatarUrl ? { display: "none" } : {}}
          >
            {profileUser.username.charAt(0).toUpperCase()}
          </div>
        </div>

        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "#1a202c",
            margin: 0,
          }}
        >
          {profileUser.username}
        </h1>
        <p style={{ color: "#718096", fontSize: "0.875rem", margin: 0 }}>
          📍 {profileUser.email}
        </p>

        {isOwnProfile && (
          <button className="edit-profile-btn" onClick={openEditModal}>
            ✏️ Edit Profile
          </button>
        )}

        <div style={{ marginTop: "0.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "50px",
              padding: "0.35rem 1rem",
              fontSize: "0.875rem",
              color: "#2d3748",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <span style={{ fontSize: "1rem" }}>📋</span>
            <span style={{ fontWeight: 700, color: "#38a169" }}>
              {posts.length}
            </span>
            <span style={{ color: "#718096" }}>
              {isOwnProfile
                ? "My Listings"
                : `${profileUser.username}'s Listings`}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          borderBottom: "2px solid #e2e8f0",
          marginBottom: "1.5rem",
        }}
      >
        <button
          className={`profile-tab${activeTab === "posts" ? " active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          {isOwnProfile ? "My Posts" : `${profileUser.username}'s Posts`}
        </button>
        <button
          className={`profile-tab${activeTab === "liked" ? " active" : ""}`}
          onClick={() => {
            setActiveTab("liked");
            if (!likedLoaded && userId) {
              setLoadingLiked(true);
              postsAPI
                .getLikedPosts(userId)
                .then((res) => {
                  const list = res.data;
                  setLikedPosts(Array.isArray(list) ? list : []);
                  setLikedLoaded(true);
                })
                .catch(() => setLikedPosts([]))
                .finally(() => setLoadingLiked(false));
            }
          }}
        >
          Liked Animals
        </button>
      </div>

      {activeTab === "liked" ? (
        loadingLiked ? (
          <div className="profile-loading-posts">
            <div className="spinner-ring" />
          </div>
        ) : likedPosts.length === 0 ? (
          <div className="profile-empty-posts">
            <div className="empty-icon">🐾</div>
            <p>No liked animals yet.</p>
          </div>
        ) : (
          <div className="profile-posts-grid">
            {likedPosts.map((post) => {
              const imgUrl =
                getImageUrl(post.imagePaths[0]) ?? "/public/noImage.png";
              return (
                <div key={post._id} className="profile-post-card">
                  <div
                    className="profile-post-image-wrapper"
                    onClick={() => navigate(`/post/${post._id}`)}
                  >
                    <img
                      src={imgUrl}
                      alt={post.name}
                      className="profile-post-image"
                      onError={(e) =>
                        (e.currentTarget.src = "/public/noImage.png")
                      }
                    />
                    <span className="post-species-badge">
                      {post.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="profile-post-info">
                    <div className="post-name-row">
                      <p className="profile-post-name">{post.name}</p>
                      <span className="post-available-badge">AVAILABLE</span>
                    </div>
                    <p className="profile-post-meta">
                      {post.type.charAt(0).toUpperCase() + post.type.slice(1)} •{" "}
                      {post.age} year{post.age !== 1 ? "s" : ""}
                    </p>
                    <div className="post-stats-row">
                      <span>❤️ {post.likes.length}</span>
                      <span>💬 {post.commentsCount}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : loadingPosts ? (
        <div className="profile-loading-posts">
          <div className="spinner-ring" />
        </div>
      ) : posts.length === 0 ? (
        <div className="profile-empty-posts">
          <div className="empty-icon">🐾</div>
          <p>
            {isOwnProfile
              ? "You haven't posted any animals yet."
              : "No posts yet."}
          </p>
          {isOwnProfile && (
            <button
              className="add-post-btn"
              onClick={() => navigate("/create")}
            >
              Create your first post
            </button>
          )}
        </div>
      ) : (
        <div className="profile-posts-grid">
          {posts.map((post) => {
            const imgUrl =
              getImageUrl(post.imagePaths[0]) ?? "/public/noImage.png";
            return (
              <div key={post._id} className="profile-post-card">
                <div
                  className="profile-post-image-wrapper"
                  onClick={() => navigate(`/post/${post._id}`)}
                >
                  <img
                    src={imgUrl}
                    alt={post.name}
                    className="profile-post-image"
                    onError={(e) =>
                      (e.currentTarget.src = "/public/noImage.png")
                    }
                  />
                  <span className="post-species-badge">
                    {post.type.toUpperCase()}
                  </span>
                </div>
                <div className="profile-post-info">
                  <div className="post-name-row">
                    <p className="profile-post-name">{post.name}</p>
                    <span className="post-available-badge">AVAILABLE</span>
                  </div>
                  <p className="profile-post-meta">
                    {post.type.charAt(0).toUpperCase() + post.type.slice(1)} •{" "}
                    {post.age} year{post.age !== 1 ? "s" : ""}
                  </p>
                  <div className="post-stats-row">
                    <span>❤️ {post.likes.length}</span>
                    <span>💬 {post.commentsCount}</span>
                  </div>
                  {isOwnProfile && (
                    <div>
                      <button
                        className="delete-post-btn"
                        onClick={() => handleDeletePost(post._id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isOwnProfile && (
            <div
              className="profile-add-card"
              onClick={() => navigate("/create")}
            >
              <span
                style={{ fontSize: "2rem", fontWeight: 300, lineHeight: 1 }}
              >
                +
              </span>
              <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                List an Animal
              </span>
            </div>
          )}
        </div>
      )}

      {isEditing && editProfileModal}
    </div>
  );
};

export default ProfilePage;
