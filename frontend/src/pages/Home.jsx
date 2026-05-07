import { useState, useEffect } from 'react';
import { getListings } from '../api/listings';
import ListingCard from '../components/ListingCard';

const CATEGORIES = ['all', 'textbooks', 'electronics', 'furniture', 'clothing', 'sports', 'other'];

export default function Home() {
  const [listings, setListings] = useState([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = category !== 'all' ? { category } : {};
    getListings(params)
      .then((data) => setListings(data.listings))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="page">
      <div className="home-header">
        <h1>Browse Listings</h1>
        <p>Buy and sell with your campus community</p>
      </div>

      <div className="category-filters">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {loading && <div className="status-msg">Loading listings...</div>}
      {error && <div className="status-msg error">{error}</div>}
      {!loading && !error && listings.length === 0 && (
        <div className="status-msg">No listings found. Be the first to sell something!</div>
      )}

      <div className="listings-grid">
        {listings.map((listing) => (
          <ListingCard key={listing._id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
