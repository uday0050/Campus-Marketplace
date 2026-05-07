import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getListing, deleteListing } from '../api/listings';
import { useAuth } from '../context/AuthContext';

export default function ProductPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getListing(id)
      .then((data) => setListing(data.listing))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this listing?')) return;
    setDeleting(true);
    try {
      await deleteListing(id);
      navigate('/');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  if (loading) return <div className="page centered">Loading...</div>;
  if (error) return <div className="page centered error">{error}</div>;
  if (!listing) return null;

  const isOwner = user && user._id === listing.seller?._id;

  return (
    <div className="page">
      <div className="product-container">
        <div className="product-images">
          {listing.images?.length > 0 ? (
            <img src={listing.images[0].url} alt={listing.title} className="product-main-image" />
          ) : (
            <div className="product-no-image">No Image</div>
          )}
        </div>

        <div className="product-info">
          <span className="product-category">{listing.category}</span>
          <h1 className="product-title">{listing.title}</h1>
          <p className="product-price">${listing.price}</p>
          <p className="product-description">{listing.description}</p>

          <div className="product-seller">
            <span>Sold by </span>
            <strong>{listing.seller?.name}</strong>
            <span> · {listing.seller?.email}</span>
          </div>

          {isOwner && (
            <button
              className="btn btn-danger btn-full"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Listing'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
