import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AnimalPost } from "../types";
import "./PostDetailPage.css";
import { postsAPI } from "../api/postsApi";
import { uploadAPI } from "../api/uploadsApi";
import { Tooltip } from "@mui/material";

const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<AnimalPost | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [postError, setPostError] = useState<string | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<AnimalPost>>({
    name: "",
    type: "dog",
    age: 1,
    gender: "male",
    description: "",
    location: "",
    size: "medium",
    vaccinated: false,
    neutered: false,
    goodWithKids: false,
    goodWithOtherAnimals: false,
    adoptionStatus: "available",
  });
  const [editImagePaths, setEditImagePaths] = useState<string[]>([]);
  const [editNewFiles, setEditNewFiles] = useState<File[]>([]);
  const [editNewPreviews, setEditNewPreviews] = useState<string[]>([]);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  const getImageUrl = (path?: string) => {
    if (!path) return "/public/noImage.svg";
    if (path.startsWith("http")) return path;
    if (path.startsWith("/public")) return `${apiBase}${path}`;
    return `${apiBase}/${path}`;
  };

  const getImages = (p: AnimalPost): string[] => {
    return p.imagePaths.map(getImageUrl);
  };

  const isOwner =
    user && post && user._id === (post.createdBy as { _id: string })?._id;

  useEffect(() => {
    if (!postId) return;
    setLoadingPost(true);
    postsAPI
      .getPostById(postId)
      .then((res) => {
        const data =
          (res.data as unknown as { success: boolean; data: AnimalPost })
            .data ?? res.data;
        const p = data as AnimalPost;
        if (user) p.isLiked = p.likes.includes(user._id);
        setPost(p);
        setSelectedImageIdx(0);
      })
      .catch(() => setPostError("Could not load post."))
      .finally(() => setLoadingPost(false));
  }, [postId]);

  const handleToggleLike = async () => {
    if (!post) return;
    try {
      await postsAPI.likePost(post._id);
      setPost((prev) => {
        if (!prev || !user) return prev;
        const alreadyLiked = prev.likes.includes(user._id);
        return {
          ...prev,
          isLiked: !alreadyLiked,
          likes: alreadyLiked
            ? prev.likes.filter((id) => id !== user._id)
            : [...prev.likes, user._id],
        };
      });
    } catch {}
  };

  const handleDeletePost = async () => {
    if (!post) return;
    if (!confirm("Delete this post permanently?")) return;
    try {
      await postsAPI.deletePost(post._id);
      navigate("/");
    } catch {
      alert("Failed to delete post.");
    }
  };

  const openEditModal = () => {
    if (!post) return;
    setEditData({
      name: post.name,
      type: post.type,
      age: post.age,
      gender: post.gender,
      description: post.description,
      location: post.location,
      size: post.size ?? "medium",
      vaccinated: post.vaccinated ?? false,
      neutered: post.neutered ?? false,
      goodWithKids: post.goodWithKids ?? false,
      goodWithOtherAnimals: post.goodWithOtherAnimals ?? false,
      adoptionStatus: post.adoptionStatus ?? "available",
    });
    setEditImagePaths(post.imagePaths ?? []);
    setEditNewFiles([]);
    setEditNewPreviews([]);
    setEditError(null);
    setIsEditing(true);
  };

  const handleEditChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setEditData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? checked : name === "age" ? Number(value) : value,
    }));
  };

  const handleEditAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newPreviews: string[] = new Array(files.length);
    let loaded = 0;
    files.forEach((file, i) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews[i] = reader.result as string;
        loaded++;
        if (loaded === files.length) {
          setEditNewFiles((prev) => [...prev, ...files]);
          setEditNewPreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const handleEditRemoveExisting = (index: number) => {
    setEditImagePaths((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditRemoveNew = (index: number) => {
    setEditNewFiles((prev) => prev.filter((_, i) => i !== index));
    setEditNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditSave = async () => {
    if (!post) return;
    setEditLoading(true);
    setEditError(null);
    try {
      let imagePaths = [...editImagePaths];
      if (editNewFiles.length > 0) {
        const uploadRes = await uploadAPI.uploadMultiple(editNewFiles);
        imagePaths = [...imagePaths, ...uploadRes.data.data.paths];
      }
      if (imagePaths.length === 0) {
        setEditError("At least one image is required.");
        setEditLoading(false);
        return;
      }
      const res = await postsAPI.updatePost(post._id, {
        ...editData,
        imagePaths,
      });
      const updated =
        (res.data as unknown as { success: boolean; data: AnimalPost }).data ??
        res.data;
      setPost((prev) =>
        prev
          ? { ...prev, ...(updated as AnimalPost), isLiked: prev.isLiked }
          : prev,
      );
      setIsEditing(false);
    } catch {
      setEditError("Failed to save changes. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  if (loadingPost) {
    return (
      <div className="detail-loading">
        <div className="spinner-ring" />
        <p>Loading post…</p>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="detail-error">
        <p>⚠️ {postError ?? "Post not found."}</p>
        <button onClick={() => navigate(-1)}>Go back</button>
      </div>
    );
  }

  const images = getImages(post);
  const authorUser = post.createdBy as { _id: string; username: string };

  return (
    <div className="detail-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="detail-layout">
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <div className="main-image-wrap">
            <img
              src={images[selectedImageIdx]}
              alt={post.name}
              className="main-image"
              onError={(e) => (e.currentTarget.src = "/public/noImage.svg")}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {images.map((img, i) => (
              <button
                key={i}
                className={`thumb-btn ${i === selectedImageIdx ? "active" : ""}`}
                onClick={() => setSelectedImageIdx(i)}
              >
                <img
                  src={img}
                  alt={`${post.name} ${i + 1}`}
                  onError={(e) =>
                    (e.currentTarget.src = "/public/questionMark.svg")
                  }
                />
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="section-label">BACKGROUND</span>
            <p className="background-text">{post.description}</p>
          </div>

          <button
            className="conversations-btn"
            onClick={() => navigate(`/post/${post._id}/comments`)} //TODO: comments page
          >
            <span className="conv-icon">💬</span>
            <div className="conv-text">
              <span className="conv-title">Conversations</span>
              <span className="conv-count">
                {post.commentsCount} active comments
              </span>
            </div>
            <span className="conv-chevron">›</span>
          </button>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            <h1 className="animal-name">{post.name}</h1>
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                flexShrink: 0,
                paddingTop: "0.25rem",
              }}
            >
              <button
                className={`like-icon-btn ${post.isLiked ? "liked" : ""}`}
                onClick={handleToggleLike}
                title={post.isLiked ? "Unlike" : "Like"}
              >
                {post.isLiked ? "♥" : "♡"}
              </button>
            </div>
          </div>

          <p
            style={{
              margin: "-0.5rem 0 0",
              color: "#718096",
              fontSize: "0.875rem",
            }}
          >
            <span className="capitalize">{post.type}</span>
            {" — "}
            {post.age} {post.age === 1 ? "Year" : "Years"}
            {" — "}
            <span className="capitalize">{post.gender}</span>
          </p>
          <Tooltip title="soon..." placement="top">
            <button className="adopt-btn" disabled>
              ADOPT ME
            </button>
          </Tooltip>

          <div className="attrs-grid">
            <div className="attr-box">
              <span className="attr-label">TYPE</span>
              <span className="attr-value capitalize">{post.type}</span>
            </div>
            <div className="attr-box">
              <span className="attr-label">AGE</span>
              <span className="attr-value">
                {post.age} {post.age === 1 ? "Year" : "Years"}
              </span>
            </div>
            <div className="attr-box">
              <span className="attr-label">GENDER</span>
              <span className="attr-value capitalize">{post.gender}</span>
            </div>
            <div className="attr-box">
              <span className="attr-label">LOCATION</span>
              <span className="attr-value">{post.location}</span>
            </div>
            {post.size && (
              <div className="attr-box">
                <span className="attr-label">SIZE</span>
                <span className="attr-value capitalize">{post.size}</span>
              </div>
            )}
            <div className="attr-box">
              <span className="attr-label">STATUS</span>
              <span className="attr-value capitalize">
                {post.adoptionStatus ?? "Available"}
              </span>
            </div>
            <div className="attr-box">
              <span className="attr-label">VACCINATED</span>
              <span className="attr-value">
                {post.vaccinated ? "Yes" : "No"}
              </span>
            </div>
            <div className="attr-box">
              <span className="attr-label">NEUTERED</span>
              <span className="attr-value">{post.neutered ? "Yes" : "No"}</span>
            </div>
            <div className="attr-box">
              <span className="attr-label">GOOD WITH KIDS</span>
              <span className="attr-value">
                {post.goodWithKids ? "Yes" : "No"}
              </span>
            </div>
            <div className="attr-box">
              <span className="attr-label">GOOD WITH ANIMALS</span>
              <span className="attr-value">
                {post.goodWithOtherAnimals ? "Yes" : "No"}
              </span>
            </div>
          </div>

          <div className="shelter-section">
            <div className="shelter-avatar">
              {authorUser.username.charAt(0).toUpperCase()}
            </div>
            <div className="shelter-info">
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "#2d3748",
                }}
              >
                {authorUser.username}
              </span>
              <span style={{ fontSize: "0.775rem", color: "#718096" }}>
                {post.location}
              </span>
            </div>
            <button
              className="profile-btn"
              onClick={() => navigate(`/profile/${authorUser._id}`)}
            >
              PROFILE
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="section-label">LOCATION</span>
            <div className="location-map-placeholder">
              <span style={{ fontSize: "1.2rem" }}>📍</span>
              <span>MARK SHELTER</span>
            </div>
          </div>

          {isOwner && (
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                paddingTop: "0.25rem",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <button className="edit-btn" onClick={openEditModal}>
                ✏️ Edit Post
              </button>
              <button className="delete-btn" onClick={handleDeletePost}>
                🗑️ Delete Post
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Post</h2>

            <div className="edit-image-section">
              <div className="image-grid">
                {editImagePaths.map((path, i) => (
                  <div key={`existing-${i}`} className="image-thumb-wrap">
                    <img
                      src={getImageUrl(path)}
                      alt={`Image ${i + 1}`}
                      onError={(e) =>
                        (e.currentTarget.src = "/public/questionMark.svg")
                      }
                    />
                    <button
                      type="button"
                      className="remove-thumb-btn"
                      onClick={() => handleEditRemoveExisting(i)}
                      disabled={editLoading}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {editNewPreviews.map((url, i) => (
                  <div key={`new-${i}`} className="image-thumb-wrap">
                    <img src={url} alt={`New ${i + 1}`} />
                    <button
                      type="button"
                      className="remove-thumb-btn"
                      onClick={() => handleEditRemoveNew(i)}
                      disabled={editLoading}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <label className="add-more-label" htmlFor="edit-image-upload">
                  <span>+</span>
                  <span>Add Photos</span>
                </label>
              </div>
              <input
                ref={editFileInputRef}
                id="edit-image-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleEditAddImages}
                disabled={editLoading}
                className="hidden-file-input"
              />
            </div>

            <div className="edit-form-grid">
              <div className="edit-field">
                <label>Name</label>
                <input
                  name="name"
                  value={editData.name}
                  onChange={handleEditChange}
                  disabled={editLoading}
                />
              </div>
              <div className="edit-field">
                <label>Type</label>
                <select
                  name="type"
                  value={editData.type}
                  onChange={handleEditChange}
                  disabled={editLoading}
                >
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="edit-field">
                <label>Age (years)</label>
                <input
                  name="age"
                  type="number"
                  min="0"
                  value={editData.age}
                  onChange={handleEditChange}
                  disabled={editLoading}
                />
              </div>
              <div className="edit-field">
                <label>Gender</label>
                <select
                  name="gender"
                  value={editData.gender}
                  onChange={handleEditChange}
                  disabled={editLoading}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="edit-field full-width">
                <label>Location</label>
                <input
                  name="location"
                  value={editData.location}
                  onChange={handleEditChange}
                  disabled={editLoading}
                />
              </div>
              <div className="edit-field">
                <label>Size</label>
                <select
                  name="size"
                  value={editData.size}
                  onChange={handleEditChange}
                  disabled={editLoading}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <div className="edit-field">
                <label>Adoption Status</label>
                <select
                  name="adoptionStatus"
                  value={editData.adoptionStatus}
                  onChange={handleEditChange}
                  disabled={editLoading}
                >
                  <option value="available">Available</option>
                  <option value="pending">Pending</option>
                  <option value="adopted">Adopted</option>
                </select>
              </div>
              <div className="edit-field">
                <label>
                  <input
                    type="checkbox"
                    name="vaccinated"
                    checked={editData.vaccinated}
                    onChange={handleEditChange}
                    disabled={editLoading}
                  />{" "}
                  Vaccinated
                </label>
              </div>
              <div className="edit-field">
                <label>
                  <input
                    type="checkbox"
                    name="neutered"
                    checked={editData.neutered}
                    onChange={handleEditChange}
                    disabled={editLoading}
                  />{" "}
                  Neutered
                </label>
              </div>
              <div className="edit-field">
                <label>
                  <input
                    type="checkbox"
                    name="goodWithKids"
                    checked={editData.goodWithKids}
                    onChange={handleEditChange}
                    disabled={editLoading}
                  />{" "}
                  Good With Kids
                </label>
              </div>
              <div className="edit-field">
                <label>
                  <input
                    type="checkbox"
                    name="goodWithOtherAnimals"
                    checked={editData.goodWithOtherAnimals}
                    onChange={handleEditChange}
                    disabled={editLoading}
                  />{" "}
                  Good With Other Animals
                </label>
              </div>
              <div className="edit-field full-width">
                <label>Description</label>
                <textarea
                  name="description"
                  rows={4}
                  value={editData.description}
                  onChange={handleEditChange}
                  disabled={editLoading}
                />
              </div>
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

export default PostDetailPage;
