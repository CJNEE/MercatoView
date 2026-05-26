import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { Star, Flame, MapPin, Navigation } from 'lucide-react';

interface Stall {
  id: number;
  name: string;
  cuisine_type: string;
  average_rating: number;
  price_range: string;
  crowd_level: 'LOW' | 'MEDIUM' | 'HIGH';
  location?: {
    latitude: number;
    longitude: number;
    section_name: string;
    description: string;
  };
}

interface MapComponentProps {
  stalls: Stall[];
  selectedStallId?: number;
  userCoords?: [number, number];
  showHeatmap?: boolean;
}

// Custom Div Icon Builder to avoid asset loading bugs
const createStallIcon = (cuisine: string) => {
  let emoji = '🍔';
  const c = cuisine.toLowerCase();
  if (c.includes('grill') || c.includes('bbq') || c.includes('meat')) emoji = '🍖';
  else if (c.includes('dessert') || c.includes('sweet') || c.includes('ice')) emoji = '🍧';
  else if (c.includes('asian') || c.includes('ramen') || c.includes('noodle')) emoji = '🍜';
  else if (c.includes('drink') || c.includes('beverage')) emoji = '🥤';
  else if (c.includes('seafood') || c.includes('fish')) emoji = '🐟';

  return L.divIcon({
    html: `
      <div class="relative group">
        <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-food-orange to-food-amber border-2 border-white shadow-glow-orange flex items-center justify-center text-lg transform hover:scale-110 active:scale-95 transition-all duration-200">
          ${emoji}
        </div>
        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-food-orange border-r border-b border-white rotate-45"></div>
      </div>
    `,
    className: 'custom-stall-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

const createUserIcon = () => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-6 h-6 bg-blue-500 rounded-full animate-ping opacity-75"></div>
        <div class="relative w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg"></div>
      </div>
    `,
    className: 'user-marker',
    iconSize: [24, 24],
  });
};

// Map Recenter Helper Component
const RecenterMap: React.FC<{ coords: [number, number] }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, 17);
  }, [coords, map]);
  return null;
};

export const MapComponent: React.FC<MapComponentProps> = ({ 
  stalls, 
  selectedStallId, 
  userCoords,
  showHeatmap = false
}) => {
  const navigate = useNavigate();
  const [center, setCenter] = useState<[number, number]>([13.9373, 121.6131]); // Mercato Lucena center coordinate

  // Recenter if a stall is highlighted
  useEffect(() => {
    if (selectedStallId) {
      const selected = stalls.find(s => s.id === selectedStallId);
      if (selected && selected.location) {
        setCenter([selected.location.latitude, selected.location.longitude]);
      }
    }
  }, [selectedStallId, stalls]);

  // Color mappings for crowd circle heatmaps
  const getCrowdColor = (level: string) => {
    switch (level) {
      case 'HIGH': return '#ef4444'; // Red
      case 'MEDIUM': return '#f97316'; // Orange
      case 'LOW':
      default: return '#10b981'; // Green
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden rounded-2xl border border-white/5 shadow-2xl">
      <MapContainer 
        center={center} 
        zoom={17} 
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Location Pin */}
        {userCoords && (
          <>
            <Marker position={userCoords} icon={createUserIcon()}>
              <Popup>You are here</Popup>
            </Marker>
            <RecenterMap coords={userCoords} />
          </>
        )}

        {/* Dynamic Center Recenter Map */}
        {selectedStallId && <RecenterMap coords={center} />}

        {/* Stall Pins */}
        {stalls.map((stall) => {
          if (!stall.location) return null;
          const pos: [number, number] = [stall.location.latitude, stall.location.longitude];
          
          return (
            <React.Fragment key={stall.id}>
              {/* Markers */}
              <Marker position={pos} icon={createStallIcon(stall.cuisine_type)}>
                <Popup>
                  <div className="p-2 space-y-2 text-white font-sans max-w-[200px]">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-sm text-food-orange leading-tight">{stall.name}</h4>
                      {stall.crowd_level === 'HIGH' && (
                        <span className="flex items-center text-[10px] text-red-400 font-mono gap-0.5">
                          <Flame size={12} className="fill-red-400" /> Hot
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium">{stall.cuisine_type}</p>
                    
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
                      <span className="flex items-center gap-1">
                        <Star size={12} className="text-food-amber fill-food-amber" />
                        {stall.average_rating}
                      </span>
                      <span className="text-gray-400">{stall.price_range}</span>
                    </div>

                    <p className="text-[10px] text-gray-400 italic">
                      📍 {stall.location.section_name}
                    </p>

                    <button 
                      onClick={() => navigate(`/stalls/${stall.id}`)}
                      className="w-full text-center text-[11px] bg-food-orange text-black font-semibold py-1 rounded hover:opacity-90 active:scale-95 transition-all mt-1"
                    >
                      View Vendor Menu
                    </button>
                  </div>
                </Popup>
              </Marker>

                {/* Draw crowd Level Heatmap Circle (Rendered around the stall pin) */}
                {showHeatmap && (
                  <Circle 
                    center={pos} 
                    radius={15} 
                    pathOptions={{
                      color: getCrowdColor(stall.crowd_level),
                      fillColor: getCrowdColor(stall.crowd_level),
                      fillOpacity: 0.25,
                      weight: 1.5
                    }}
                  />
                )}
              </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Floating map guide overlay */}
      <div className="absolute bottom-4 left-4 z-[400] glass-card px-4 py-3 rounded-xl pointer-events-none text-xs flex flex-col gap-1.5 max-w-[180px]">
        <div className="font-semibold text-food-orange">Crowd Levels</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ef4444]/60 border border-[#ef4444]"></div>
          <span className="text-[10px] text-gray-300">High Crowd Level (Busy)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#f97316]/60 border border-[#f97316]"></div>
          <span className="text-[10px] text-gray-300">Medium Crowd Level</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#10b981]/60 border border-[#10b981]"></div>
          <span className="text-[10px] text-gray-300">Low Crowd Level</span>
        </div>
      </div>
    </div>
  );
};
