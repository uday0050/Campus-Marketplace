import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createListing } from '../api/listings';
import { generateDescription } from '../api/ai';
import { uploadImage } from '../api/upload';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['textbooks', 'electronics', 'furniture', 'clothing', 'sports', 'other'];

const EMPTY_FORM = { title: '', description: '', price: '', category: 'other' };

export default function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null); // { url, publicId }
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null); // 'uploading' | 'done' | null

  if (!user) {
    return (
      <div className="page centered">
        <p>You must be logged in to create a listing.</p>
      </div>
    );
  }

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setUploadedImage(null);
    setAiResult(null);
    setError(null);

    // Step 1: upload to Cloudinary
    setUploadStatus('uploading');
    try {
      const uploaded = await uploadImage(file);
      setUploadedImage(uploaded);
      setUploadStatus('done');

      // Step 2: auto-trigger AI generation
      setAiLoading(true);
      try {
        const ai = await generateDescription(uploaded.url, form.category);
        if (ai.captionError) {
          setError(ai.captionError);
        } else {
          setAiResult(ai);
          setForm((prev) => ({
            ...prev,
            title: ai.enhanced?.title || prev.title,
            description: ai.enhanced?.description || prev.description,
            price: ai.enhanced?.suggestedPrice?.min?.toString() || prev.price,
          }));
        }
      } catch (aiErr) {
        setError('AI generation failed: ' + aiErr.message);
      } finally {
        setAiLoading(false);
      }
    } catch (upErr) {
      setError('Image upload failed: ' + upErr.message);
      setUploadStatus(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uploadedImage) {
      setError('Please upload an image first.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        images: [{ url: uploadedImage.url, publicId: uploadedImage.publicId }],
      };
      const data = await createListing(payload);
      navigate(`/listings/${data.listing._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isProcessing = uploadStatus === 'uploading' || aiLoading;

  return (
    <div className="page">
      <div className="form-container">
        <h1>Create Listing</h1>

        <form onSubmit={handleSubmit} className="listing-form">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label>Category</label>
            <select name="category" value={form.category} onChange={handleChange}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Image upload */}
          <div className="form-group">
            <label>Product Image</label>
            <div
              className={`image-upload-area ${imagePreview ? 'has-image' : ''}`}
              onClick={() => !isProcessing && fileInputRef.current.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="image-preview" />
              ) : (
                <div className="image-upload-placeholder">
                  <span className="upload-icon">📷</span>
                  <span>Click to upload image</span>
                  <span className="upload-hint">JPG, PNG up to 5MB</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
            </div>

            {uploadStatus === 'uploading' && (
              <p className="upload-status">Uploading image...</p>
            )}
            {aiLoading && (
              <p className="upload-status ai">✨ AI is analyzing your image...</p>
            )}
            {uploadStatus === 'done' && !aiLoading && (
              <p className="upload-status success">✓ Image uploaded · AI description generated</p>
            )}
          </div>

          {aiResult && (
            <div className="ai-result">
              <p className="ai-result-label">Caption: <em>{aiResult.basic}</em></p>
              {aiResult.enhanced.brand && (
                <p className="ai-result-label">Brand detected: <strong>{aiResult.enhanced.brand}</strong></p>
              )}
              {aiResult.enhanced.suggestedPrice && (
                <p className="ai-result-label">
                  Suggested price: <strong>${aiResult.enhanced.suggestedPrice.min} – ${aiResult.enhanced.suggestedPrice.max}</strong>
                </p>
              )}
            </div>
          )}

          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              name="title"
              placeholder="What are you selling?"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Describe your item..."
              value={form.description}
              onChange={handleChange}
              rows={4}
              required
            />
          </div>

          <div className="form-group">
            <label>Price ($)</label>
            <input
              type="number"
              name="price"
              placeholder="0"
              min="0"
              value={form.price}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={submitting || isProcessing}
          >
            {submitting ? 'Publishing...' : 'Publish Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}
