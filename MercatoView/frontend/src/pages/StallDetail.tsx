import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/useAuth';
import { 
  Star, Heart, Flame, MapPin, Clock, Camera, 
  CheckCircle, ThumbsUp, Send, AlertCircle, Sparkles
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  is_available: boolean;
  average_rating: number;
}

interface Stall {
  id: number;
  name: string;
  description: string;
  logo: string;
  banner: string;
  cuisine_type: string;
  price_range: string;
  operating_hours: Record<string, string>;
  average_rating: number;
  reviews_count: number;
  crowd_level: 'LOW' | 'MEDIUM' | 'HIGH';
  is_featured: boolean;
  location?: {
    latitude: number;
    longitude: number;
    section_name: string;
    description: string;
  };
}

interface Review {
  id: number;
  username: string;
  rating: number;
  comment: string;
  image: string | null;
  helpful_count: number;
  has_voted_helpful: boolean;
  is_verified_purchase: boolean;
  product_name: string | null;
  created_at: string;
}

export const StallDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  
  const [stall, setStall] = useState<Stall | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);

  // Review Form States
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [submittingReview, setSubmittingReview] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifiedScan, setIsVerifiedScan] = useState(false);

  // Detect QR scanner referral
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('scan') === 'true') {
      setIsVerifiedScan(true);
    }
  }, [location.search]);

  useEffect(() => {
    if (!id) return;
    
    // Log event view
    api.post('analytics/event/', { event_type: 'STALL_VIEW', target_id: parseInt(id) }).catch(() => {});

    // Load details
    Promise.all([
      api.get(`stalls/${id}/`),
      api.get(`reviews/?stall_id=${id}`),
      isAuthenticated ? api.get('favorites/') : Promise.resolve({ data: [] })
    ]).then(([stallRes, reviewsRes, favoritesRes]) => {
      setStall(stallRes.data);
      setReviews(reviewsRes.data);
      
      if (isAuthenticated) {
        const isFav = favoritesRes.data.some((f: any) => f.stall === parseInt(id));
        setIsFavorited(isFav);
      }
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, [id, isAuthenticated]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to save favorite stalls.');
      return;
    }
    try {
      const res = await api.post('favorites/toggle/', { stall_id: stall?.id });
      setIsFavorited(res.data.favorited);
    } catch (err) {
      console.error(err);
    }
  };

  const handleHelpfulVote = async (reviewId: number) => {
    if (!isAuthenticated) {
      alert('Please sign in to react to reviews.');
      return;
    }
    try {
      const res = await api.post(`reviews/${reviewId}/vote_helpful/`);
      setReviews(prev => prev.map(rev => {
        if (rev.id === reviewId) {
          return {
            ...rev,
            helpful_count: res.data.helpful_count,
            has_voted_helpful: res.data.has_voted_helpful
          };
        }
        return rev;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    setSubmittingReview(true);
    setErrorMsg('');

    try {
      // Use FormData to allow file uploads (photos)
      const formData = new FormData();
      formData.append('stall', id || '');
      formData.append('rating', rating.toString());
      formData.append('comment', comment);
      if (selectedProduct) {
        formData.append('product', selectedProduct);
      }
      if (imageFile) {
        formData.append('image', imageFile);
      }

      // Check-in referral URL parameter
      const endpoint = isVerifiedScan ? `reviews/?verified=true` : `reviews/`;

      await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Reset and reload
      setComment('');
      setSelectedProduct('');
      setImageFile(null);
      
      const newReviews = await api.get(`reviews/?stall_id=${id}`);
      setReviews(newReviews.data);
      
      // Update stall rating average
      const updatedStall = await api.get(`stalls/${id}/`);
      setStall(updatedStall.data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to post review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading stall information...</div>;
  }

  if (!stall) {
    return <div className="text-center py-12 text-gray-400">🍢 Stall not found.</div>;
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      
      {/* 1. COVER BANNER IMAGE */}
      <div className="relative h-64 md:h-80 w-full rounded-3xl overflow-hidden border border-white/10 shadow-lg">
        {stall.banner ? (
          <img src={stall.banner} alt={stall.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-food-charcoal to-food-orange/10 flex items-center justify-center text-6xl">
            🍢
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"></div>
        
        {/* Banner Details Overlay */}
        <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-food-orange/20 text-food-orange border border-food-orange/30 text-xs font-bold px-3 py-1 rounded-full capitalize">
                {stall.cuisine_type}
              </span>
              <span className="text-xs text-gray-300 font-semibold">{stall.price_range}</span>
              {stall.is_featured && (
                <span className="bg-amber-500/25 text-food-amber border border-food-amber/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <Star size={10} className="fill-food-amber" /> Featured
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <h2 className="text-2xl md:text-4xl font-extrabold text-white font-sans">{stall.name}</h2>
              <span className="flex items-center text-green-400 text-xs gap-0.5 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                <CheckCircle size={12} /> Verified Seller
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300">
              <div className="flex items-center gap-1">
                <MapPin size={14} className="text-food-orange" />
                <span>{stall.location?.section_name || 'Lucena Main Row'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} className="text-food-orange" />
                <span>Hours: {Object.entries(stall.operating_hours || {}).map(([k, v]) => `${k} (${v})`).join(', ') || '4PM-11PM'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleToggleFavorite}
              className={`p-3 rounded-2xl border transition-all ${
                isFavorited 
                  ? 'bg-food-orange text-black border-food-orange shadow-glow-orange' 
                  : 'bg-black/60 border-white/10 text-white hover:bg-black/85'
              }`}
            >
              <Heart size={20} className={isFavorited ? 'fill-black' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. LAYOUT GRID: MENU VS REVIEWS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: ABOUT & DISHES MENU (2/3 size) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* About section */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-3">
            <h3 className="text-lg font-bold text-white">About Vendor</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              {stall.description}
            </p>
          </div>

          {/* Crowd level warning if high */}
          {stall.crowd_level === 'HIGH' && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex gap-3 text-xs">
              <AlertCircle size={18} className="shrink-0" />
              <div>
                <p className="font-semibold">Busy Crowd level inside</p>
                <p className="text-gray-400 mt-0.5">Wait times for hot plates might exceed 15-20 minutes. Scan our QR code to reserve early.</p>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span>Dish Menu & Pricings</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(stall as any).products && (stall as any).products.map((product: Product) => (
                <div key={product.id} className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col justify-between hover:border-white/10 transition-all">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm text-white">{product.name}</h4>
                      <span className="text-xs text-food-amber font-mono font-bold">₱{parseFloat(product.price).toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{product.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-2 border-t border-white/5 text-[10px]">
                    <span className="flex items-center text-food-amber gap-0.5">
                      <Star size={10} className="fill-food-amber" /> {product.average_rating} rating
                    </span>
                    <span className={product.is_available ? 'text-emerald-400' : 'text-red-400'}>
                      {product.is_available ? '● Available' : '● Sold Out'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REVIEWS & FEEDBACK FORM */}
        <div className="space-y-8">
          
          {/* Rating Summary */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 text-center space-y-4">
            <h3 className="text-lg font-bold text-white">Vendor Review Score</h3>
            <div className="flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-white">{stall.average_rating}</span>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star 
                    key={s} 
                    size={16} 
                    className={`${s <= Math.round(stall.average_rating) ? 'text-food-amber fill-food-amber' : 'text-gray-600'}`} 
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 mt-1">{stall.reviews_count} total ratings</span>
            </div>
          </div>

          {/* QR Scan check-in banner */}
          {isVerifiedScan && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-food-amber p-4 rounded-xl flex gap-3 text-xs">
              <Sparkles size={18} className="shrink-0 text-food-orange" />
              <div>
                <p className="font-semibold">QR Code Checked In!</p>
                <p className="text-gray-400 mt-0.5">You scanned this stall's QR code. Writing a review now will attach a **Verified Customer** badge!</p>
              </div>
            </div>
          )}

          {/* Write a review Form */}
          {isAuthenticated ? (
            <form onSubmit={handleReviewSubmit} className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
              <h3 className="font-bold text-white text-base">Write a Review</h3>
              {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}
              
              {/* Star Rating Select */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 block">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="text-2xl hover:scale-110 active:scale-90 transition-all focus:outline-none"
                    >
                      <Star 
                        className={s <= rating ? 'text-food-amber fill-food-amber' : 'text-gray-600'} 
                        size={24}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Product selection */}
              <div>
                <label className="text-xs text-gray-400 block mb-1">What dish did you order? (Optional)</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-food-orange text-white"
                >
                  <option value="">Whole Stall / General Menu</option>
                  {(stall as any).products && (stall as any).products.map((p: Product) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Review Comment */}
              <div>
                <label className="text-xs text-gray-400 block mb-1">Comments</label>
                <textarea
                  required
                  placeholder="Share your authentic dining review..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full input-field text-xs py-2.5"
                />
              </div>

              {/* Image upload */}
              <div>
                <label className="text-xs text-gray-400 block mb-1">Add Dish Photo (Optional)</label>
                <label className="border border-dashed border-white/15 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:border-food-orange/30 hover:bg-white/5 transition-all">
                  <Camera size={20} className="text-gray-400 mb-1" />
                  <span className="text-[10px] text-gray-500">
                    {imageFile ? imageFile.name : 'JPEG, PNG formats'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full btn-primary text-xs py-3 font-semibold mt-2"
              >
                <Send size={12} />
                <span>{submittingReview ? 'Submitting...' : 'Post Food Review'}</span>
              </button>
            </form>
          ) : (
            <div className="glass-card p-6 rounded-2xl border border-white/5 text-center text-xs text-gray-400">
              🔒 <a href="/login" className="text-food-orange hover:underline font-semibold">Sign in</a> to leave a rating and upload photos.
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Customer Reviews ({reviews.length})</h3>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                  
                  {/* Review Header */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-white">{review.username}</span>
                        {review.is_verified_purchase && (
                          <span className="text-[8px] bg-amber-500/10 text-food-amber font-mono font-bold px-1.5 py-0.5 rounded border border-food-amber/15">Verified check-in</span>
                        )}
                      </div>
                      <div className="flex gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            size={10} 
                            className={s <= review.rating ? 'text-food-amber fill-food-amber' : 'text-gray-700'} 
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-[9px] text-gray-500 font-mono">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Review text */}
                  {review.product_name && (
                    <span className="text-[9px] bg-white/5 text-gray-400 border border-white/10 px-2 py-0.5 rounded-full inline-block">
                      Reviewed: {review.product_name}
                    </span>
                  )}
                  
                  <p className="text-xs text-gray-300 leading-relaxed font-sans">{review.comment}</p>

                  {/* Photo review */}
                  {review.image && (
                    <div className="rounded-xl overflow-hidden border border-white/5 max-h-40">
                      <img 
                        src={`http://localhost:8000${review.image}`} 
                        alt="Dish Review" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Helpful Reaction Button */}
                  <div className="pt-2 border-t border-white/5 flex justify-end">
                    <button
                      onClick={() => handleHelpfulVote(review.id)}
                      className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded transition-all ${
                        review.has_voted_helpful 
                          ? 'bg-food-orange/10 text-food-orange font-semibold border border-food-orange/20' 
                          : 'text-gray-500 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <ThumbsUp size={11} className={review.has_voted_helpful ? 'fill-food-orange' : ''} />
                      <span>Helpful ({review.helpful_count})</span>
                    </button>
                  </div>

                </div>
              ))}
              {reviews.length === 0 && (
                <p className="text-xs text-gray-500 italic text-center py-6">Be the first to review this vendor!</p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
