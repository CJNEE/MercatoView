import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Flame, Star, Award, Trophy, ArrowUp, Zap } from 'lucide-react';

interface TrendingStall {
  stall_id: number;
  name: string;
  cuisine_type: string;
  logo: string | null;
  average_rating: number;
  score: number;
  crowd_level: string;
}

interface Stall {
  id: number;
  name: string;
  cuisine_type: string;
  average_rating: number;
  reviews_count: number;
  price_range: string;
}

interface Product {
  id: number;
  name: string;
  price: string;
  average_rating: number;
  stall: number;
}

export const Trending: React.FC = () => {
  const navigate = useNavigate();

  const [trending, setTrending] = useState<TrendingStall[]>([]);
  const [topStalls, setTopStalls] = useState<Stall[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Log trending page view
    api.post('analytics/event/', { event_type: 'SEARCH_QUERY', target_name: 'Trending Leaderboard' }).catch(() => {});

    Promise.all([
      api.get('discover/trending/'),
      api.get('discover/leaderboard/')
    ]).then(([trendingRes, leaderboardRes]) => {
      setTrending(trendingRes.data);
      setTopStalls(leaderboardRes.data.stalls);
      setTopProducts(leaderboardRes.data.products);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-10 animate-fadeIn">
      
      {/* HEADER SECTION */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-food-orange text-xs font-semibold">
          <Flame size={12} className="fill-food-orange text-food-orange" />
          <span>Hot & Fresh Rankings</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight">
          Trending Discoveries
        </h2>
        <p className="text-sm text-gray-400">
          Rankings are calculated hourly based on customer review velocity, rating growth, and current crowd check-ins inside Mercato Lucena.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Calculating trending metrics...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMN 1: TRENDING SPEED (AI SCORE) */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-food-orange">
                <Flame size={20} className="fill-food-orange" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Trending Velocity</h3>
                <p className="text-[10px] text-gray-500">Most active in the past 7 days</p>
              </div>
            </div>

            <div className="space-y-4">
              {trending.map((stall, index) => (
                <div 
                  key={stall.stall_id}
                  onClick={() => navigate(`/stalls/${stall.stall_id}`)}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-food-orange/20 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-500 w-5 text-center">#{index + 1}</span>
                    <div>
                      <p className="font-semibold text-xs text-white truncate max-w-[120px]">{stall.name}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{stall.cuisine_type}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center justify-end text-[10px] text-food-amber font-semibold">
                        <Star size={10} className="fill-food-amber text-food-amber mr-0.5" />
                        {stall.average_rating}
                      </div>
                      <span className="text-[9px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">Score {Math.round(stall.score)}</span>
                    </div>
                    <ArrowUp size={12} className="text-emerald-400 shrink-0" />
                  </div>
                </div>
              ))}
              {trending.length === 0 && (
                <p className="text-xs text-gray-500 italic">Calculating activity metrics...</p>
              )}
            </div>
          </div>

          {/* COLUMN 2: TOP RATED VENDORS */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-food-amber">
                <Trophy size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Top Rated Stalls</h3>
                <p className="text-[10px] text-gray-500">Highest overall customer feedback</p>
              </div>
            </div>

            <div className="space-y-4">
              {topStalls.map((stall, index) => (
                <div 
                  key={stall.id}
                  onClick={() => navigate(`/stalls/${stall.id}`)}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-food-amber/20 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-500 w-5 text-center">#{index + 1}</span>
                    <div>
                      <p className="font-semibold text-xs text-white truncate max-w-[120px]">{stall.name}</p>
                      <p className="text-[10px] text-gray-400">{stall.cuisine_type}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center justify-end text-xs text-food-amber font-bold">
                      <Star size={12} className="fill-food-amber text-food-amber mr-0.5" />
                      {stall.average_rating}
                    </div>
                    <span className="text-[9px] text-gray-500">{stall.reviews_count} reviews</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COLUMN 3: TOP RATED DISHES */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Award size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Top Rated Dishes</h3>
                <p className="text-[10px] text-gray-500">Highest rated menu offerings</p>
              </div>
            </div>

            <div className="space-y-4">
              {topProducts.map((prod, index) => (
                <div 
                  key={prod.id}
                  onClick={() => navigate(`/stalls/${prod.stall}`)}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-purple-400/20 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-500 w-5 text-center">#{index + 1}</span>
                    <div>
                      <p className="font-semibold text-xs text-white truncate max-w-[125px]">{prod.name}</p>
                      <p className="text-[10px] text-food-amber">₱{parseFloat(prod.price).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-1.5">
                    <div className="flex items-center text-xs text-food-amber font-bold">
                      <Star size={12} className="fill-food-amber text-food-amber mr-0.5" />
                      {prod.average_rating}
                    </div>
                    <Zap size={11} className="text-purple-400 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
