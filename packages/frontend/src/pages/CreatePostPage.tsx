import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { postsAPI, uploadAPI } from "../utils/api";
import "./CreatePostPage.css";
import { CreatePostSchema } from "../types";

const initialFormData: CreatePostSchema = {
  name: "",
  type: "dog",
  age: 1,
  gender: "male",
  description: "",
  location: "",
  size: "small",
  vaccinated: false,
  neutered: false,
  goodWithKids: false,
  goodWithOtherAnimals: false,
  adoptionStatus: "available",
  imagePaths: [],
};

const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "age" ? Number(value) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setSelectedFiles((prev) => [...prev, ...files]);
          setPreviewUrls((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (selectedFiles.length === 0) {
      setError("Please select at least one image");
      return;
    }

    try {
      setIsLoading(true);

      const uploadResponse = await uploadAPI.uploadMultiple(selectedFiles);
      const imagePaths = uploadResponse.data.data.paths;

      await postsAPI.createPost({
        name: formData.name,
        type: formData.type,
        age: formData.age,
        gender: formData.gender,
        description: formData.description,
        location: formData.location,
        imagePaths,
        size: formData.size || undefined,
        vaccinated: formData.vaccinated,
        neutered: formData.neutered,
        goodWithKids: formData.goodWithKids,
        goodWithOtherAnimals: formData.goodWithOtherAnimals,
        adoptionStatus: formData.adoptionStatus,
      });

      setSuccess(true);
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-post-container">
      <div className="create-post-card">
        <h1>🐾 Create New Post</h1>
        <p>Share an animal you'd like to adopt</p>

        {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message">
            Post created successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-post-form">
          <div className="form-section">
            <h3>Photos</h3>
            <div className="image-grid">
              {previewUrls.map((url, i) => (
                <div key={i} className="image-thumb-wrap">
                  <img src={url} alt={`Preview ${i + 1}`} />
                  <button
                    type="button"
                    className="remove-thumb-btn"
                    onClick={() => handleRemoveFile(i)}
                    disabled={isLoading}
                  >
                    ×
                  </button>
                </div>
              ))}
              <label className="add-more-label" htmlFor="image-upload">
                <span>+</span>
                <span>Add Photos</span>
              </label>
            </div>
            <input
              ref={fileInputRef}
              id="image-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              disabled={isLoading}
              className="hidden-file-input"
            />
          </div>

          <div className="form-section">
            <h3>Animal Information</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Animal name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="type">Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  disabled={isLoading}
                >
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="age">Age (years) *</label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min="0"
                  value={formData.age}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="gender">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  disabled={isLoading}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="size">Size</label>
                <select
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  disabled={isLoading}
                >
                  <option value="">Unknown</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="adoptionStatus">Status *</label>
                <select
                  name="adoptionStatus"
                  value={formData.adoptionStatus}
                  onChange={handleInputChange}
                  disabled={isLoading}
                >
                  <option value="available">Available</option>
                  <option value="pending">Pending</option>
                  <option value="adopted">Adopted</option>
                </select>
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="location">Location *</label>
              <input
                id="location"
                name="location"
                type="text"
                placeholder="e.g., New York, NY"
                value={formData.location}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Health & Behaviour</h3>
            <div className="checkboxes-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="vaccinated"
                  checked={formData.vaccinated}
                  onChange={handleCheckboxChange}
                  disabled={isLoading}
                />
                Vaccinated
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="neutered"
                  checked={formData.neutered}
                  onChange={handleCheckboxChange}
                  disabled={isLoading}
                />
                Neutered / Spayed
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="goodWithKids"
                  checked={formData.goodWithKids}
                  onChange={handleCheckboxChange}
                  disabled={isLoading}
                />
                Good with kids
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="goodWithOtherAnimals"
                  checked={formData.goodWithOtherAnimals}
                  onChange={handleCheckboxChange}
                  disabled={isLoading}
                />
                Good with other animals
              </label>
            </div>
          </div>

          <div className="form-section">
            <div className="form-group full-width">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                placeholder="Tell us about this animal... (at least 10 characters)"
                value={formData.description}
                onChange={handleInputChange}
                minLength={10}
                rows={3}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? "Creating Post..." : "Create Post"}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate("/")}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostPage;
