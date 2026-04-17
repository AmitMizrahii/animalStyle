import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { User, AnimalPost } from "../types";
import "./ProfilePage.css";
import { postsAPI } from "../api/postsApi";
import { uploadAPI } from "../api/uploadsApi";
import { usersAPI } from "../api/usersApi";

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
        const data =
          (res.data as { success: boolean; data: User }).data ?? res.data;
        setProfileUser(data as User);
      })
      .catch(() => setProfileError("Could not load user profile."))
      .finally(() => setLoadingProfile(false));

    setLoadingPosts(true);
    postsAPI
      .getUserPosts(userId)
      .then((res) => {
        const payload = res.data as unknown as {
          success: boolean;
          data: { data: AnimalPost[] };
        };
        const list =
          payload.data?.data ?? (res.data as unknown as AnimalPost[]);
        setPosts(Array.isArray(list) ? list : []);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoadingPosts(false));
  }, [userId]);

  const openEditModal = () => {
    setEditUsername(profileUser?.username ?? "");
    setEditImagePreview(getImageUrl(profileUser?.profileImagePath) ?? "");
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
      <div className="profile-loading">
        <div className="spinner-ring" />
        <p>Loading profile…</p>
      </div>
    );
  }

  if (profileError || !profileUser) {
    return (
      <div className="profile-error">
        <p>⚠️ {profileError ?? "User not found."}</p>
        <button onClick={() => navigate(-1)}>Go back</button>
      </div>
    );
  }

  const avatarUrl = getImageUrl(profileUser.profileImagePath);

  return (
    <div className="profile-page">
      {/* ── Profile Header ── */}
      <div className="profile-header">
        <div className="profile-avatar-wrapper">
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

        <h1 className="profile-username">{profileUser.username}</h1>
        <p className="profile-email">📍 {profileUser.email}</p>

        {isOwnProfile && (
          <button className="edit-profile-btn" onClick={openEditModal}>
            ✏️ Edit Profile
          </button>
        )}

        <div className="profile-stats-row">
          <div className="profile-stat-badge">
            <span className="stat-icon">📋</span>
            <span className="stat-count">{posts.length}</span>
            <span className="stat-label">
              {isOwnProfile
                ? "My Listings"
                : `${profileUser.username}'s Listings`}
            </span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="profile-tabs">
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
                  const payload = res.data as unknown as {
                    success: boolean;
                    data: { data: AnimalPost[] };
                  };
                  const list =
                    payload.data?.data ?? (res.data as unknown as AnimalPost[]);
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

      {/* ── Content ── */}
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
                getImageUrl(post.imagePaths[0]) ??
                "https://placehold.co/300x200?text=No+Image";
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
                        (e.currentTarget.src =
                          "https://placehold.co/300x200?text=No+Image")
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
              getImageUrl(post.imagePaths[0]) ??
              "https://placehold.co/300x200?text=No+Image";
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
                      (e.currentTarget.src =
                        "https://placehold.co/300x200?text=No+Image")
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
                    <div className="profile-post-actions">
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
              <span className="add-card-icon">+</span>
              <span className="add-card-label">List an Animal</span>
            </div>
          )}
        </div>
      )}

      {/* ── Edit Profile Modal ── */}
      {isEditing && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Profile</h2>

            <div className="modal-avatar-row">
              <div className="modal-avatar-preview">
                {editImagePreview ? (
                  <img src={editImagePreview} alt="Preview" />
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

            {editError && <p className="modal-error">{editError}</p>}

            <div className="modal-actions">
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
      )}
    </div>
  );
};

export default ProfilePage;
