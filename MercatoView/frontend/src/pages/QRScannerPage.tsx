import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, Scan, ShieldCheck, Flame, Zap } from 'lucide-react';
import { api } from '../services/api';

interface Stall {
  id: number;
  name: string;
  cuisine_type: string;
}

export const QRScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [demoStalls, setDemoStalls] = useState<Stall[]>([]);
  const [scanResult, setScanResult] = useState<string | null>(null);

  useEffect(() => {
    // Fetch mock stalls for simulation buttons
    api.get('stalls/').then((res) => {
      setDemoStalls(res.data);
    }).catch(() => {});

    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      "qr-reader-container",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    const onScanSuccess = (decodedText: string) => {
      scanner.clear();
      setScanResult(decodedText);
      
      // Log event view
      api.post('analytics/event/', { event_type: 'QR_SCAN', target_name: decodedText }).catch(() => {});

      // Decoded text will be a URL like http://localhost:5173/stalls/1?scan=true
      // Extract the path and redirect
      try {
        const urlObj = new URL(decodedText);
        navigate(urlObj.pathname + urlObj.search);
      } catch (err) {
        // Fallback if not a full URL
        alert(`Decoded QR code text: ${decodedText}`);
      }
    };

    const onScanFailure = (error: any) => {
      // Quietly ignore failed frame decodes
    };

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [navigate]);

  const handleSimulateScan = (stallId: number) => {
    // Log scanner analytics
    api.post('analytics/event/', { event_type: 'QR_SCAN', target_id: stallId, target_name: 'QR Simulation Click' }).catch(() => {});
    navigate(`/stalls/${stallId}?scan=true`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn pb-12">
      
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-food-orange text-xs font-semibold">
          <QrCode size={12} />
          <span>Interactive Check-In</span>
        </div>
        <h2 className="text-3xl font-extrabold">QR Scan & Review</h2>
        <p className="text-sm text-gray-400">
          Point your camera at a physical stall sign or product menu QR code inside the market to instantly view menus and write reviews with a **Verified Badge**.
        </p>
      </div>

      {/* WEBCAM SCAN BOX */}
      <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-white/5">
          <Scan size={18} className="text-food-orange" />
          <h3 className="font-bold text-white text-sm">Live Camera Scanner</h3>
        </div>
        
        <div className="bg-[#111] overflow-hidden rounded-xl border border-white/10 relative">
          <div id="qr-reader-container" className="w-full"></div>
        </div>
      </div>

      {/* DEVELOPER SIMULATION DECK */}
      <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-white/5 justify-between">
          <div className="flex items-center gap-3">
            <Zap size={18} className="text-food-amber" />
            <h3 className="font-bold text-white text-sm">QR Code Simulation Deck</h3>
          </div>
          <span className="text-[9px] bg-white/5 text-gray-500 px-2 py-0.5 rounded uppercase font-mono">Developer Testing</span>
        </div>

        <p className="text-xs text-gray-400">
          No camera connected? Don't worry! Click any of the vendors below to simulate scanning their physical QR code check-in, unlocking verified customer reviews:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {demoStalls.map((stall) => (
            <button
              key={stall.id}
              onClick={() => handleSimulateScan(stall.id)}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-food-orange/30 text-left rounded-xl transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-xs text-white">{stall.name}</span>
                <span className="text-[8px] bg-food-orange/10 text-food-orange px-1.5 py-0.5 rounded font-mono">Simulate Pin</span>
              </div>
              <span className="text-[10px] text-gray-500 mt-1">{stall.cuisine_type}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
