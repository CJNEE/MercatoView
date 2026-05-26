import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Heart, Star, MapPin, Trash2 } from 'lucide-react';

interface Favorite {
  id: number;
  stall: number;
  stall_name: string;
  stall_logo: string | null;
  stall_cuisine: string;
  stall_rating: number;
}

export const SavedStalls: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('favorites/').then((res) => {
      setFavorites(res.data);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleRemoveFavorite = async (e: React.MouseEvent, stallId: number) => {
    e.stopPropagation();
    try {
      await api.post('favorites/toggle/', { stall_id: stallId });
      setFavorites(prev => prev.filter((f) => f.stall !== stallId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="text-food-orange fill-food-orange" size={24} />
          <span>My Saved Stalls</span>
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Quick access to your bookmarked food stalls and vendors.
        </p>
      </div>

      {loading ? (
        <div className="text-xs text-gray-500">Loading favorites...</div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav) => (
            <div
              key={fav.id}
              onClick={() => navigate(`/stalls/${fav.stall}`)}
              className="glass-card p-5 rounded-2xl border border-white/5 flex items-center justify-between cursor-pointer hover:border-food-orange/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-food-orange/10 border border-food-orange/20 flex items-center justify-center font-bold text-food-orange text-lg shrink-0">
                  {fav.stall_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{fav.stall_name}</h4>
                  <p className="text-[10px] text-gray-500">{fav.stall_cuisine}</p>
                  <span className="flex items-center text-[10px] text-food-amber font-semibold mt-1">
                    <Star size={10} className="fill-food-amber text-food-amber mr-0.5" />
                    {fav.stall_rating}
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => handleRemoveFavorite(e, fav.stall)}
                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                title="Remove Bookmark"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 glass-card rounded-2xl text-gray-500 text-xs">
          🍢 You haven't favorited any stalls yet. Browse the discover feed to add bookmarks.
        </div>
      )}
    </div>
  );
};
