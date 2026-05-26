import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Search, Star, Flame, Utensils, MapPin, Sparkles, SlidersHorizontal } from 'lucide-react';

interface Stall {
  id: number;
  name: string;
  description: string;
  logo: string;
  banner: string;
  cuisine_type: string;
  price_range: string;
  average_rating: number;
  reviews_count: number;
  crowd_level: 'LOW' | 'MEDIUM' | 'HIGH';
  is_featured: boolean;
  location?: {
    section_name: string;
  };
}

interface Promotion {
  id: number;
  stall_name: string;
  title: string;
  description: string;
  discount_code: string;
}

export const Discover: React.FC = () => {
  const navigate = useNavigate();
  
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [selectedCrowd, setSelectedCrowd] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  const cuisines = ['Grill / BBQ', 'Desserts', 'Filipino Classics', 'Asian Fusion'];

  useEffect(() => {
    // Log home visit event
    api.post('analytics/event/', { event_type: 'SEARCH_QUERY', target_name: 'Discover Feed' }).catch(() => {});

    // Fetch Stalls and Promos
    Promise.all([
      api.get('stalls/'),
      api.get('promotions/')
    ]).then(([stallsRes, promosRes]) => {
      setStalls(stallsRes.data);
      setPromos(promosRes.data);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  // Filter logic
  const filteredStalls = stalls.filter((stall) => {
    const matchesSearch = 
      stall.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stall.cuisine_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stall.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCuisine = selectedCuisine ? stall.cuisine_type === selectedCuisine : true;
    const matchesCrowd = selectedCrowd ? stall.crowd_level === selectedCrowd : true;
    const matchesPrice = selectedPrice ? stall.price_range === selectedPrice : true;

    return matchesSearch && matchesCuisine && matchesCrowd && matchesPrice;
  });

  const getCrowdBadge = (level: string) => {
    switch (level) {
      case 'HIGH':
        return <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">Busy Crowd</span>;
      case 'MEDIUM':
        return <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">Moderate Crowd</span>;
      case 'LOW':
      default:
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">Relaxed</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. WELCOME HERO SECTOR */}
      <div className="relative rounded-3xl overflow-hidden glass-card-glow p-8 md:p-12 border border-food-orange/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-4 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-food-orange/10 border border-food-orange/20 text-food-orange text-xs font-semibold">
            <Sparkles size={12} />
            <span>Digital Review & Discovery Hub</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold font-sans leading-tight">
            Discover the Best of <span className="bg-gradient-to-r from-food-orange to-food-amber bg-clip-text text-transparent">Mercato Lucena</span>
          </h2>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            Real review feeds, interactive pins, live traffic indices, and authentic dish ratings directly from Lucena City foodies.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            <button onClick={() => navigate('/map')} className="btn-primary">
              🗺 Explore Interactive Map
            </button>
            <button onClick={() => navigate('/trending')} className="btn-secondary">
              🔥 View Hot Leaderboards
            </button>
          </div>
        </div>

        {/* Decorative Grid Image */}
        <div className="w-48 h-48 rounded-2xl bg-gradient-to-tr from-food-orange to-food-amber opacity-25 blur-xl -z-10 absolute md:relative right-10"></div>
      </div>

      {/* 2. ACTIVE PROMOTIONS / DISCOUNTS CAROUSEL */}
      {promos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Flame size={18} className="text-food-orange fill-food-orange" />
            <span>Active Vendor Promos & Discounts</span>
          </h3>
          
          <div className="flex gap-4 overflow-x-auto pb-4 scroll-snap-x snap-mandatory">
            {promos.map((promo) => (
              <div 
                key={promo.id} 
                className="flex-shrink-0 w-80 glass-card px-6 py-5 rounded-2xl snap-start border-l-4 border-l-food-orange flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] text-food-orange font-bold uppercase tracking-wider block mb-1">
                    {promo.stall_name}
                  </span>
                  <h4 className="font-bold text-base text-white">{promo.title}</h4>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{promo.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="bg-white/5 px-2.5 py-1 rounded font-mono text-xs text-food-amber">
                    Code: {promo.discount_code}
                  </div>
                  <button 
                    onClick={() => navigate('/qr-scanner')}
                    className="text-[10px] text-food-orange hover:underline font-semibold"
                  >
                    Scan to Claim &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. SEARCH & DYNAMIC FILTER BAR */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search by vendor name, dish category, or cuisine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full input-field pl-12"
            />
          </div>
          <button 
            onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
            className="btn-secondary py-3 px-4 border border-white/10"
          >
            <SlidersHorizontal size={18} />
            <span>Filters</span>
          </button>
        </div>

        {/* Filter Drawer */}
        {showFiltersDrawer && (
          <div className="p-5 glass-card rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slideDown">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Cuisine Type</label>
              <select 
                value={selectedCuisine}
                onChange={(e) => setSelectedCuisine(e.target.value)}
                className="w-full bg-[#161616] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-food-orange"
              >
                <option value="">All Cuisines</option>
                {cuisines.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-xs text-gray-400 block mb-1">Crowd Velocity</label>
              <select
                value={selectedCrowd}
                onChange={(e) => setSelectedCrowd(e.target.value)}
                className="w-full bg-[#161616] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-food-orange"
              >
                <option value="">All Crowd Levels</option>
                <option value="LOW">Relaxed / Quiet</option>
                <option value="MEDIUM">Medium / Steady</option>
                <option value="HIGH">Busy / Crowded</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Price Range</label>
              <select
                value={selectedPrice}
                onChange={(e) => setSelectedPrice(e.target.value)}
                className="w-full bg-[#161616] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-food-orange"
              >
                <option value="">Any Price</option>
                <option value="$">Budget ($)</option>
                <option value="$$">Moderate ($$)</option>
                <option value="$$$">Premium ($$$)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 4. FOOD VENDOR CARDS LIST */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Utensils size={20} className="text-food-orange" />
            <span>Discover Food Vendors ({filteredStalls.length})</span>
          </h3>
        </div>

        {loading ? (
          /* Skeleton Loader */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass-card h-80 rounded-2xl border border-white/5 animate-pulse bg-white/5"></div>
            ))}
          </div>
        ) : filteredStalls.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStalls.map((stall) => (
              <div 
                key={stall.id}
                onClick={() => navigate(`/stalls/${stall.id}`)}
                className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between h-96 group cursor-pointer"
              >
                {/* Stall Banner Background */}
                <div className="h-36 bg-gradient-to-tr from-food-charcoal to-food-orange/10 relative overflow-hidden shrink-0">
                  {stall.banner ? (
                    <img 
                      src={stall.banner} 
                      alt={stall.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">
                      🍢
                    </div>
                  )}
                  {/* Floating Average Rating */}
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-xl flex items-center gap-1 border border-white/10 text-xs font-semibold text-food-amber">
                    <Star size={13} className="fill-food-amber text-food-amber" />
                    <span>{stall.average_rating}</span>
                  </div>
                </div>

                {/* Stall Metadata */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-food-orange/10 text-food-orange font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-food-orange/10">
                        {stall.cuisine_type}
                      </span>
                      <span className="text-xs text-gray-500">{stall.price_range}</span>
                    </div>

                    <h4 className="font-bold text-lg text-white group-hover:text-food-orange transition-all truncate leading-tight">
                      {stall.name}
                    </h4>
                    <p className="text-xs text-gray-400 line-clamp-3">
                      {stall.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin size={13} className="text-gray-400" />
                      <span className="truncate max-w-[120px]">{stall.location?.section_name || 'Lucena Central'}</span>
                    </div>
                    {getCrowdBadge(stall.crowd_level)}
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 glass-card rounded-2xl text-gray-400">
            🍢 No food vendors matched your search filters. Try resetting terms.
          </div>
        )}
      </div>

    </div>
  );
};
