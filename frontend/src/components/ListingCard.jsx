import { Link } from 'react-router-dom';

export default function ListingCard({ listing }) {
  const { _id, title, price, category, images, seller } = listing;
  const image = images?.[0]?.url;

  return (
    <Link to={`/listings/${_id}`} className="listing-card">
      <div className="listing-card-image">
        {image ? (
          <img src={image} alt={title} />
        ) : (
          <div className="listing-card-no-image">No Image</div>
        )}
        <span className="listing-card-category">{category}</span>
      </div>
      <div className="listing-card-body">
        <h3 className="listing-card-title">{title}</h3>
        <div className="listing-card-footer">
          <span className="listing-card-price">${price}</span>
          <span className="listing-card-seller">{seller?.name}</span>
        </div>
      </div>
    </Link>
  );
}
