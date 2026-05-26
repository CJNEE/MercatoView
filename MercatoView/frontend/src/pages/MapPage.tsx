import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MapComponent } from '../components/MapComponent';
import { Search, Flame, MapPin, Star, Filter, Info } from 'lucide-react';

interface Stall {
  id: number;
  name: string;
  cuisine_type: string;
  average_rating: number;
  price_range: string;
  crowd_level: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  location?: {
    latitude: number;
    longitude: number;
    section_name: string;
    description: string;
  };
}

export const MapPage: React.FC = () => {
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Map Configs
  const [selectedStallId, setSelectedStallId] = useState<number | undefined>(undefined);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | undefined>(undefined);

  // Search & Category Filters
  const [search, setSearch] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const cuisines = ['Grill / BBQ', 'Desserts', 'Filipino Classics', 'Asian Fusion'];

  useEffect(() => {
    // Log event
    api.post('analytics/event/', { event_type: 'SEARCH_QUERY', target_name: 'Interactive Map' }).catch(() => {});

    api.get('stalls/').then((res) => {
      setStalls(res.data);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location: ", error);
          // Set mock user location near Mercato Lucena for demonstration purposes
          setUserLocation([13.9372, 121.6129]);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const filteredStalls = stalls.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.cuisine_type.toLowerCase().includes(search.toLowerCase());
    const matchesCuisine = cuisineFilter ? s.cuisine_type === cuisineFilter : true;
    return matchesSearch && matchesCuisine;
  });

  const getSelectedStall = () => {
    return stalls.find((s) => s.id === selectedStallId);
  };

  const selectedStall = getSelectedStall();

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-10rem)] md:h-[calc(100vh-6rem)] animate-fadeIn">
      
      {/* 1. SIDEBAR CONTROLLER PANEL */}
      <div className="w-full lg:w-96 flex flex-col justify-between glass-card p-5 rounded-2xl border border-white/5 h-full overflow-y-auto gap-4 shrink-0">
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-food-orange to-food-amber bg-clip-text text-transparent">
              Mercato Market Map
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Find and navigate between food stalls in real-time.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Search stall or dish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full input-field pl-10 py-2.5 text-xs"
            />
          </div>

          {/* Map Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                showHeatmap 
                  ? 'bg-food-orange text-black font-bold shadow-glow-orange' 
                  : 'bg-white/5 border border-white/10 text-white'
              }`}
            >
              <Flame size={14} className={showHeatmap ? 'fill-black' : ''} />
              <span>{showHeatmap ? 'Disable Heatmap' : 'Crowd Heatmap'}</span>
            </button>

            <button
              onClick={handleLocateMe}
              className="px-3 bg-white/5 border border-white/10 text-white rounded-xl text-xs hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              <MapPin size={14} />
              <span>Locate</span>
            </button>
          </div>

          <hr className="border-white/5" />

          {/* Category Tabs */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Filter by Cuisine
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setCuisineFilter('')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                  cuisineFilter === '' ? 'bg-food-orange/20 text-food-orange border border-food-orange/30' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                All
              </button>
              {cuisines.map((c) => (
                <button
                  key={c}
                  onClick={() => setCuisineFilter(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    cuisineFilter === c ? 'bg-food-orange/20 text-food-orange border border-food-orange/30' : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {c.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-white/5" />

          {/* Stalls List */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Food Stalls ({filteredStalls.length})
            </span>
            {loading ? (
              <div className="text-xs text-gray-500">Loading map coordinates...</div>
            ) : filteredStalls.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1.5">
                {filteredStalls.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStallId(s.id)}
                    className={`p-3 rounded-xl cursor-pointer border transition-all text-left ${
                      selectedStallId === s.id
                        ? 'bg-food-orange/10 border-food-orange/30'
                        : 'bg-white/5 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-xs text-white">{s.name}</p>
                      <span className="flex items-center text-[10px] text-food-amber font-semibold">
                        <Star size={10} className="fill-food-amber text-food-amber mr-0.5" />
                        {s.average_rating}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                      <span>{s.cuisine_type}</span>
                      <span>📍 {s.location?.section_name || 'Main Row'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500 italic">No food vendors match filters</div>
            )}
          </div>
        </div>

        {/* Selected Stall Mini card drawer */}
        {selectedStall && (
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col gap-2 mt-auto animate-slideUp">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-sm text-food-orange">{selectedStall.name}</h4>
                <p className="text-[10px] text-gray-400">{selectedStall.cuisine_type} • {selectedStall.price_range}</p>
              </div>
              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                selectedStall.crowd_level === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                selectedStall.crowd_level === 'MEDIUM' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {selectedStall.crowd_level}
              </span>
            </div>
            
            <p className="text-[10px] text-gray-300 line-clamp-2">
              {selectedStall.description}
            </p>
            
            <p className="text-[10px] text-gray-400 italic">
              📌 Location: {selectedStall.location?.section_name} ({selectedStall.location?.description})
            </p>

            <a
              href={`/stalls/${selectedStall.id}`}
              className="w-full text-center text-xs bg-food-orange text-black font-semibold py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all mt-1"
            >
              Order & Review Menu
            </a>
          </div>
        )}
      </div>

      {/* 2. MAP RENDER CANVAS */}
      <div className="flex-1 min-h-[400px] h-full rounded-2xl relative">
        <MapComponent 
          stalls={filteredStalls} 
          selectedStallId={selectedStallId} 
          userCoords={userLocation}
          showHeatmap={showHeatmap}
        />
      </div>

    </div>
  );
};
