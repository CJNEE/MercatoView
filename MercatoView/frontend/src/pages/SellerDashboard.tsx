import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  BarChart3, Plus, Edit2, Check, RefreshCw, QrCode, 
  MapPin, Clock, Save, Image, Star, Eye, Layers, Trash2
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  is_available: boolean;
  average_rating: number;
}

interface QRRecord {
  id: number;
  qr_image: string;
  target_url: string;
  created_at: string;
}

export const SellerDashboard: React.FC = () => {
  const [stall, setStall] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [qrcodes, setQrcodes] = useState<QRRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab views
  const [activeTab, setActiveTab] = useState<'analytics' | 'stall' | 'products' | 'qr'>('analytics');

  // Stall profile form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [priceRange, setPriceRange] = useState('$$');
  const [lat, setLat] = useState(13.937);
  const [lng, setLng] = useState(121.613);
  const [sectionName, setSectionName] = useState('');
  const [sectionDesc, setSectionDesc] = useState('');
  const [savingStall, setSavingStall] = useState(false);

  // Product form
  const [pName, setPName] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [editingProdId, setEditingProdId] = useState<number | null>(null);
  const [submittingProduct, setSubmittingProduct] = useState(false);

  const fetchAllData = () => {
    setLoading(true);
    Promise.all([
      api.get('stalls/my_stall/'),
      api.get('analytics/seller/'),
      api.get('qrcodes/')
    ]).then(([stallRes, analyticsRes, qrsRes]) => {
      setStall(stallRes.data);
      setAnalytics(analyticsRes.data);
      setQrcodes(qrsRes.data);

      // Initialize stall forms
      setName(stallRes.data.name);
      setDescription(stallRes.data.description);
      setCuisineType(stallRes.data.cuisine_type);
      setPriceRange(stallRes.data.price_range);
      if (stallRes.data.location) {
        setLat(stallRes.data.location.latitude);
        setLng(stallRes.data.location.longitude);
        setSectionName(stallRes.data.location.section_name);
        setSectionDesc(stallRes.data.location.description);
      }
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleUpdateStall = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStall(true);
    try {
      const data = {
        name,
        description,
        cuisine_type: cuisineType,
        price_range: priceRange,
        location: {
          latitude: parseFloat(lat as any),
          longitude: parseFloat(lng as any),
          section_name: sectionName,
          description: sectionDesc
        }
      };
      const res = await api.put(`stalls/${stall.id}/`, data);
      setStall(res.data);
      alert('Stall profile updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update stall profile.');
    } finally {
      setSavingStall(false);
    }
  };

  const handleAddEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProduct(true);
    try {
      const data = {
        stall: stall.id,
        name: pName,
        price: parseFloat(pPrice),
        description: pDesc
      };

      if (editingProdId) {
        await api.put(`products/${editingProdId}/`, data);
      } else {
        await api.post('products/', data);
      }
      
      // Reset form
      setPName('');
      setPPrice('');
      setPDesc('');
      setEditingProdId(null);
      
      // Refresh stall
      const stallRes = await api.get('stalls/my_stall/');
      setStall(stallRes.data);
    } catch (err) {
      console.error(err);
      alert('Failed to save product details.');
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleToggleAvailability = async (product: Product) => {
    try {
      await api.patch(`products/${product.id}/`, {
        is_available: !product.is_available
      });
      // Refresh stall
      const stallRes = await api.get('stalls/my_stall/');
      setStall(stallRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateQR = async () => {
    try {
      await api.post('qrcodes/', {
        stall: stall.id,
        target_url: `http://localhost:5173/stalls/${stall.id}?scan=true`
      });
      const qrsRes = await api.get('qrcodes/');
      setQrcodes(qrsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const COLORS = ['#FF6B35', '#FFB627', '#E3B448', '#8884d8', '#82ca9d'];

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading Seller Hub dashboard...</div>;
  }

  if (!stall) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <p className="text-gray-400">🍢 You have not created a vendor stall profile yet.</p>
        <button 
          onClick={async () => {
            try {
              await api.post('stalls/', { name: 'My Stall', cuisine_type: 'Grill' });
              fetchAllData();
            } catch (e) { alert('Failed to initialize stall.'); }
          }} 
          className="btn-primary"
        >
          Create Stall Profile
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-food-orange" />
            <span>Seller Hub: {stall.name}</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Manage your food stall details, menu, QR codes, and review analytics.
          </p>
        </div>
        <button 
          onClick={fetchAllData} 
          className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3 border border-white/10"
        >
          <RefreshCw size={13} />
          <span>Refresh</span>
        </button>
      </div>

      {/* DASHBOARD TABS */}
      <div className="flex border-b border-white/5 gap-2">
        {(['analytics', 'stall', 'products', 'qr'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === tab 
                ? 'border-food-orange text-food-orange' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT 1: ANALYTICS & RECHARTS */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-8">
          
          {/* KPI CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="glass-card p-5 rounded-2xl border border-white/5 text-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Average Rating</span>
              <span className="text-3xl font-black text-white mt-1 block flex justify-center items-center gap-1.5">
                <Star size={24} className="fill-food-amber text-food-amber" />
                {analytics.average_rating}
              </span>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/5 text-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Total Reviews</span>
              <span className="text-3xl font-black text-white mt-1 block">{analytics.reviews_count}</span>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/5 text-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Menu Items Views</span>
              <span className="text-3xl font-black text-white mt-1 block flex justify-center items-center gap-1.5">
                <Eye size={24} className="text-food-orange" />
                {analytics.total_views}
              </span>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/5 text-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">QR Code Scans</span>
              <span className="text-3xl font-black text-white mt-1 block flex justify-center items-center gap-1.5">
                <QrCode size={24} className="text-food-amber" />
                {analytics.qr_scans}
              </span>
            </div>

          </div>

          {/* CHARTS CONTAINER */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* View Traffic Over Time (Bar Chart) */}
            <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
              <h3 className="font-bold text-white text-sm">Customer View Traffic (7 Days)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.views_by_day}>
                    <XAxis dataKey="date" stroke="#666" fontSize={11} />
                    <YAxis stroke="#666" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#222', border: '1px solid #444' }} />
                    <Bar dataKey="views" fill="#FF6B35" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ratings distribution (Pie Chart) */}
            <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
              <h3 className="font-bold text-white text-sm">Rating Feedback Spread</h3>
              <div className="h-64 flex flex-col justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.rating_distribution.filter((d: any) => d.count > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="rating"
                    >
                      {analytics.rating_distribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB CONTENT 2: STALL MANAGEMENT PROFILE FORM */}
      {activeTab === 'stall' && (
        <form onSubmit={handleUpdateStall} className="glass-card p-6 rounded-2xl border border-white/5 space-y-6">
          <h3 className="font-bold text-white text-base">Stall Profile Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Stall Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full input-field text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Cuisine Specialty</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Desserts, Filipino Classics"
                  value={cuisineType}
                  onChange={(e) => setCuisineType(e.target.value)}
                  className="w-full input-field text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Price Tier</label>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-food-orange text-white"
                >
                  <option value="$">Budget ($)</option>
                  <option value="$$">Moderate ($$)</option>
                  <option value="$$$">Premium ($$$)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Stall Biography / Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full input-field text-xs py-2.5"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 md:pt-0 md:pl-6 md:border-l border-white/5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Stall Coordinates (Spatial Pin mapping)
              </span>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                    className="w-full input-field text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={lng}
                    onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                    className="w-full input-field text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Row Section (e.g. Row B, Space 3)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Row A, Stall 12"
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  className="w-full input-field text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Section Details / Landmark Directions</label>
                <input
                  type="text"
                  placeholder="e.g. Near the center band stage"
                  value={sectionDesc}
                  onChange={(e) => setSectionDesc(e.target.value)}
                  className="w-full input-field text-xs"
                />
              </div>
            </div>

          </div>

          <button
            type="submit"
            disabled={savingStall}
            className="btn-primary text-xs py-3 w-full max-w-xs"
          >
            <Save size={14} />
            <span>{savingStall ? 'Saving Changes...' : 'Save Stall Settings'}</span>
          </button>
        </form>
      )}

      {/* TAB CONTENT 3: PRODUCTS / MENU DISH CRUD PANEL */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Add / Edit Dish Form */}
          <form onSubmit={handleAddEditProduct} className="glass-card p-6 rounded-2xl border border-white/5 space-y-4 h-fit">
            <h3 className="font-bold text-white text-base">
              {editingProdId ? 'Edit Menu Dish' : 'Add New Menu Dish'}
            </h3>
            
            <div>
              <label className="text-xs text-gray-400 block mb-1">Dish Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Special Sisig Fries"
                value={pName}
                onChange={(e) => setPName(e.target.value)}
                className="w-full input-field text-xs"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Price (₱ PHP)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 150.00"
                value={pPrice}
                onChange={(e) => setPPrice(e.target.value)}
                className="w-full input-field text-xs"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Ingredients / Description</label>
              <textarea
                required
                placeholder="Briefly describe toppings or serving size..."
                value={pDesc}
                onChange={(e) => setPDesc(e.target.value)}
                rows={3}
                className="w-full input-field text-xs py-2.5"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submittingProduct}
                className="btn-primary text-xs py-2.5 flex-1"
              >
                <span>{editingProdId ? 'Update Dish' : 'Publish Dish'}</span>
              </button>
              {editingProdId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingProdId(null);
                    setPName('');
                    setPPrice('');
                    setPDesc('');
                  }}
                  className="btn-secondary text-xs py-2.5"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Dishes Table */}
          <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="font-bold text-white text-base">Published Dishes</h3>
            
            <div className="space-y-3">
              {stall.products && stall.products.map((product: Product) => (
                <div key={product.id} className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{product.name}</span>
                      <span className="text-[10px] text-food-amber font-semibold">₱{parseFloat(product.price).toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 line-clamp-2 max-w-sm">{product.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleAvailability(product)}
                      className={`px-3 py-1 rounded text-[10px] font-bold border transition-all ${
                        product.is_available
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}
                    >
                      {product.is_available ? 'In Stock' : 'Sold Out'}
                    </button>
                    
                    <button
                      onClick={() => {
                        setEditingProdId(product.id);
                        setPName(product.name);
                        setPPrice(product.price);
                        setPDesc(product.description);
                      }}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded"
                      title="Edit Product"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              {(!stall.products || stall.products.length === 0) && (
                <p className="text-xs text-gray-500 italic">No products added. Publish some dishes!</p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT 4: QR CODE SETTINGS */}
      {activeTab === 'qr' && (
        <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-6 max-w-2xl">
          <div className="space-y-1.5">
            <h3 className="font-bold text-white text-base">Check-In QR Codes</h3>
            <p className="text-xs text-gray-400">
              Generate and download printable QR Codes. Customers can scan these physical stickers at your table to view your online menu, view pricing, and immediately write verified reviews.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleGenerateQR}
              className="btn-primary text-xs py-2.5"
            >
              <QrCode size={14} />
              <span>Generate Stall QR Code</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
            {qrcodes.map((qr) => (
              <div key={qr.id} className="p-4 bg-[#111] rounded-xl border border-white/5 text-center flex flex-col items-center gap-3">
                <span className="text-[10px] text-gray-400 font-semibold truncate max-w-[200px]">Target URL: {qr.target_url}</span>
                {qr.qr_image ? (
                  <div className="bg-white p-2.5 rounded-lg w-44 h-44 flex items-center justify-center">
                    <img 
                      src={`http://localhost:8000${qr.qr_image}`} 
                      alt="Stall QR code" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-44 h-44 bg-white/5 border border-dashed border-white/10 rounded flex items-center justify-center text-xs text-gray-500">
                    Compiling Image...
                  </div>
                )}
                {qr.qr_image && (
                  <a
                    href={`http://localhost:8000${qr.qr_image}`}
                    download={`stall_${stall.id}_qrcode.png`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded text-white font-semibold flex items-center gap-1"
                  >
                    <span>Download PNG File</span>
                  </a>
                )}
              </div>
            ))}
            {qrcodes.length === 0 && (
              <p className="text-xs text-gray-500 italic col-span-2">No QR codes generated. Click generate above.</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
