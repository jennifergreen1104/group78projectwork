import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  History, 
  Flag as FlagIcon, 
  Menu, 
  Camera, 
  LogOut, 
  User, 
  Car, 
  ShieldCheck, 
  AlertTriangle,
  ChevronRight,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createWorker } from 'tesseract.js';
import { User as UserType, Vehicle, Lookup, Flag } from './types';

// --- Components ---

const LoginPage = ({ onLogin }: { onLogin: (user: UserType, token: string) => void }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.user, data.token);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#151619] border border-white/10 rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20">
            <ShieldCheck className="text-emerald-500 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AutoVerify GH</h1>
          <p className="text-white/40 text-sm mt-1 italic">Ghana Police Service Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 ml-1">Officer Service ID</label>
            <input 
              type="text" 
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="w-full bg-[#1A1B1F] border border-white/5 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
              placeholder="e.g. 10298787"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 ml-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1A1B1F] border border-white/5 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-red-400 text-xs mt-2 ml-1">{error}</p>}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-4 rounded-xl mt-4 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'AUTHENTICATE'}
          </button>
        </form>
      </motion.div>
      <p className="text-white/20 text-[10px] mt-8 uppercase tracking-[0.2em]">Secure Law Enforcement Network</p>
    </div>
  );
};

const Scanner = ({ onScan, onClose }: { onScan: (text: string) => void, onClose: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          } 
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        setError('Camera access denied');
      }
    };
    startCamera();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current || scanning) return;
    setScanning(true);
    setError('');
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas to a fixed size for OCR processing (helps consistency)
    canvas.width = 1000;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Capture the center portion of the video stream
      const sourceWidth = video.videoWidth;
      const sourceHeight = video.videoHeight;
      const cropWidth = sourceWidth * 0.8;
      const cropHeight = sourceHeight * 0.4;
      const sx = (sourceWidth - cropWidth) / 2;
      const sy = (sourceHeight - cropHeight) / 2;
      
      ctx.drawImage(video, sx, sy, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
      
      // Step 1: Grayscale and high contrast
      ctx.filter = 'contrast(200%) grayscale(100%) brightness(110%)';
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';

      // Step 2: Manual thresholding (Binarization)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        // Average the RGB channels (it's already grayscale but this ensures clean binary)
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        // Threshold around 128 (midpoint)
        const val = avg > 120 ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = val;
      }
      ctx.putImageData(imageData, 0, 0);
    }

    try {
      const worker = await createWorker('eng');
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ- ',
        tessedit_pageseg_mode: '7' as any, 
      });
      const { data: { text } } = await worker.recognize(canvas);
      await worker.terminate();
      
      // Remove all non-alphanumeric except space and hyphen
      const cleaned = text.toUpperCase().replace(/[^A-Z0-9\s-]/g, '').trim();
      
      // Match Ghana formats: "GW 1234-22", "GW 1234A-22", etc.
      // 1. ([A-Z]{2}) : Region code (2 letters)
      // 2. [\s-]? : Potential separator
      // 3. (\d{1,4}[A-Z]?) : 1 to 4 digits followed by optional suffix letter
      // 4. [\s-]? : Potential separator
      // 5. (\d{2}) : Year (2 digits)
      const plateMatch = cleaned.match(/([A-Z]{2})[\s-]?(\d{1,4}[A-Z]?)[\s-]?(\d{2})/);
      
      if (plateMatch) {
        // Normalize to standard "XX 1234 - YY" or "XX 1234A - YY"
        const formattedPlate = `${plateMatch[1]} ${plateMatch[2]} - ${plateMatch[3]}`;
        onScan(formattedPlate);
      } else {
        // Broad search: just look for chunks that look like plates
        const broadMatch = cleaned.match(/[A-Z]{2}\s?\d{2,4}.?\d{2}/);
        if (broadMatch) {
          onScan(broadMatch[0]);
        } else {
          setError('Could not read plate clearly. Position plate in center and try again.');
        }
      }
    } catch (err) {
      setError('Scanning failed');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] z-[100] flex flex-col">
      <div className="p-6 flex justify-between items-center bg-[#0A0A0A]/80 backdrop-blur-2xl border-b border-white/5">
        <div>
          <h2 className="text-white font-bold tracking-tight">AI Plate Scanner</h2>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Scanning High Resolution Feed</p>
        </div>
        <button onClick={onClose} className="bg-white/5 hover:bg-white/10 p-2 rounded-xl text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 relative bg-black">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        
        {/* Scanner HUD Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[85%] h-[35%] relative">
            {/* Corners */}
            <div className="absolute -top-1 -left-1 w-10 h-10 border-t-2 border-l-2 border-emerald-500 rounded-tl-2xl" />
            <div className="absolute -top-1 -right-1 w-10 h-10 border-t-2 border-r-2 border-emerald-500 rounded-tr-2xl" />
            <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-2 border-l-2 border-emerald-500 rounded-bl-2xl" />
            <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-2 border-r-2 border-emerald-500 rounded-br-2xl" />
            
            {/* Scanning Line Animation */}
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-pulse" 
                 style={{ top: '50%' }} />
            
            {/* Darkened area outside the scanner */}
            <div className="absolute inset-0 shadow-[0_0_0_2000px_rgba(0,0,0,0.6)] rounded-2xl" />
          </div>
        </div>

        {scanning && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-10">
            <div className="bg-emerald-500/20 backdrop-blur-xl border border-emerald-500/30 px-6 py-3 rounded-2xl shadow-2xl">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                <span className="text-emerald-500 text-xs font-bold uppercase tracking-[0.2em]">Processing OCR Data...</span>
              </div>
            </div>
          </div>
        )}
        
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="p-10 bg-[#0A0A0A] border-t border-white/5 flex flex-col items-center gap-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl">
            <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest">{error}</p>
          </div>
        )}
        
        <button 
          onClick={captureAndScan}
          disabled={scanning}
          className="relative group disabled:opacity-50"
        >
          <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl relative active:scale-95 transition-transform">
            {scanning ? (
              <Loader2 className="w-10 h-10 text-black animate-spin" />
            ) : (
              <Camera className="w-10 h-10 text-black" />
            )}
          </div>
        </button>
        
        <div className="flex flex-col items-center gap-1 opacity-40">
          <p className="text-white text-[10px] font-bold uppercase tracking-[0.3em]">Ghana Law Enforcement Utility</p>
          <p className="text-white text-[8px] uppercase tracking-widest">Ensure plate is inside the marked area</p>
        </div>
      </div>
    </div>
  );
};

const LookupPage = ({ token }: { token: string }) => {
  const [plate, setPlate] = useState('');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const handleSearch = async (searchPlate?: string) => {
    const p = searchPlate || plate;
    if (!p) return;
    setLoading(true);
    setError('');
    setVehicle(null);
    try {
      const res = await fetch(`/api/vehicles/${p}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setVehicle(data);
      } else {
        setError(data.message || 'Lookup failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 pb-32">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Plate Lookup</h1>
        <p className="text-white/40 text-sm">Instant vehicle verification</p>
      </div>

      <div className="flex gap-2 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-5 h-5" />
          <input 
            type="text"
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            placeholder="ENTER PLATE (e.g. GW 1234-22)"
            className="w-full bg-[#151619] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-emerald-500/50 uppercase font-mono tracking-wider"
          />
        </div>
        <button 
          onClick={() => setShowScanner(true)}
          className="bg-[#151619] border border-white/10 p-4 rounded-2xl text-white hover:bg-white/5 transition-colors"
        >
          <Camera className="w-6 h-6" />
        </button>
      </div>

      <button 
        onClick={() => handleSearch()}
        disabled={loading || !plate}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-4 rounded-2xl mb-8 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'VERIFY VEHICLE'}
      </button>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-400"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}

        {vehicle && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="bg-[#151619] border border-white/10 rounded-3xl p-6 shadow-xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Registration</div>
                  <div className="text-2xl font-mono font-bold text-white tracking-wider">{vehicle.plate_number}</div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider">Verified</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Owner</div>
                  <div className="text-white font-medium">{vehicle.owner_name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Vehicle</div>
                  <div className="text-white font-medium">{vehicle.make} {vehicle.model}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Color</div>
                  <div className="text-white font-medium">{vehicle.color}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Insurance Co.</div>
                  <div className="text-white font-medium">{vehicle.insurance_company}</div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Insurance Expiry</div>
                    <div className={`font-medium ${new Date(vehicle.insurance_expiry) < new Date() ? 'text-red-400' : 'text-emerald-400'}`}>
                      {vehicle.insurance_expiry}
                    </div>
                  </div>
                  {new Date(vehicle.insurance_expiry) < new Date() && (
                    <div className="bg-red-500/10 px-2 py-1 rounded text-red-400 text-[10px] font-bold uppercase">Expired</div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showScanner && (
        <Scanner 
          onScan={(p) => {
            setPlate(p);
            setShowScanner(false);
            handleSearch(p);
          }} 
          onClose={() => setShowScanner(false)} 
        />
      )}
    </div>
  );
};

const HistoryPage = ({ token }: { token: string }) => {
  const [history, setHistory] = useState<Lookup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/history', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setHistory(data);
      setLoading(false);
    });
  }, [token]);

  return (
    <div className="p-6 pb-32">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">History</h1>
        <p className="text-white/40 text-sm">Your recent lookups</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-white/20" /></div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div key={item.id} className="bg-[#151619] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                  <Car className="text-white/40 w-5 h-5" />
                </div>
                <div>
                  <div className="text-white font-mono font-bold text-sm tracking-wider">{item.plate_number}</div>
                  <div className="text-white/30 text-[10px] uppercase tracking-wider">{item.make} {item.model}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white/20 text-[10px] uppercase tracking-wider">
                  {new Date(item.timestamp).toLocaleDateString()}
                </div>
                <div className="text-white/20 text-[10px] uppercase tracking-wider">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {history.length === 0 && <p className="text-center text-white/20 py-12 text-sm uppercase tracking-widest">No history found</p>}
        </div>
      )}
    </div>
  );
};

const FlagPage = ({ token }: { token: string }) => {
  const [plate, setPlate] = useState('');
  const [notes, setNotes] = useState('');
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchFlags = () => {
    fetch('/api/flags', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setFlags(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchFlags();
    const interval = setInterval(fetchFlags, 10000); // Poll for updates
    return () => clearInterval(interval);
  }, [token]);

  const handleFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/flags', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plate_number: plate, suspicion_notes: notes })
      });
      if (res.ok) {
        setPlate('');
        setNotes('');
        fetchFlags();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 pb-32">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Flag Vehicle</h1>
        <p className="text-white/40 text-sm">Alert other officers</p>
      </div>

      <form onSubmit={handleFlag} className="bg-[#151619] border border-white/10 rounded-3xl p-6 mb-8 shadow-xl">
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 ml-1">Plate Number</label>
            <input 
              type="text" 
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              className="w-full bg-[#1A1B1F] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 uppercase font-mono tracking-wider"
              placeholder="GW 1234-22"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 ml-1">Suspicion Notes</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#1A1B1F] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 h-24 resize-none text-sm"
              placeholder="Describe the suspicion..."
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : <><AlertTriangle className="w-5 h-5" /> BROADCAST ALERT</>}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">Active Alerts</h2>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-white/20" /></div>
        ) : (
          <div className="space-y-3">
            {flags.map((flag) => (
              <motion.div 
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                key={flag.id} 
                className="bg-red-500/5 border border-red-500/20 p-4 rounded-2xl"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-red-400 font-mono font-bold tracking-wider">{flag.plate_number}</div>
                  <div className="text-red-400/40 text-[10px] uppercase tracking-wider">
                    {new Date(flag.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <p className="text-white/70 text-sm mb-3 italic">"{flag.suspicion_notes}"</p>
                <div className="flex items-center gap-2 pt-3 border-t border-red-500/10">
                  <User className="w-3 h-3 text-red-400/40" />
                  <span className="text-red-400/40 text-[10px] uppercase tracking-widest font-bold">Officer {flag.officer_name}</span>
                </div>
              </motion.div>
            ))}
            {flags.length === 0 && <p className="text-center text-white/20 py-12 text-sm uppercase tracking-widest">No active flags</p>}
          </div>
        )}
      </div>
    </div>
  );
};

const AddOfficerForm = ({ token, onUserAdded }: { token: string, onUserAdded: () => void }) => {
  const [id, setId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('group78');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, username, password, role: 'officer' })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Officer added successfully');
        setId('');
        setUsername('');
        setPassword('group78');
        onUserAdded();
      } else {
        setError(data.message || 'Failed to add officer');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#151619] border border-white/10 rounded-3xl p-6 mb-8 shadow-xl">
      <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Enroll New Officer</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 ml-1">Officer Service ID</label>
          <input 
            type="text" 
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="w-full bg-[#1A1B1F] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50"
            placeholder="e.g. 10298800"
            required
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-[#1A1B1F] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50"
            placeholder="e.g. JUSTICE ADU"
            required
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 ml-1">Assigned Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#1A1B1F] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50"
            placeholder="••••••••"
            required
          />
        </div>
        {message && <p className="text-emerald-400 text-xs ml-1">{message}</p>}
        {error && <p className="text-red-400 text-xs ml-1">{error}</p>}
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'ENROLL OFFICER'}
        </button>
      </div>
    </form>
  );
};

const AdminDashboard = ({ token }: { token: string }) => {
  const [stats, setStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const headers = { 'Authorization': `Bearer ${token}` };
    const [statsRes, auditRes, usersRes] = await Promise.all([
      fetch('/api/admin/stats', { headers }),
      fetch('/api/admin/audit', { headers }),
      fetch('/api/admin/users', { headers })
    ]);
    
    setStats(await statsRes.json());
    setAuditLogs(await auditRes.json());
    setUsers(await usersRes.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 pb-32">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Admin Console</h1>
        <p className="text-white/40 text-sm">System oversight & management</p>
      </div>

      <AddOfficerForm token={token} onUserAdded={fetchData} />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Vehicles', value: stats.vehicles, icon: Car, color: 'text-blue-400' },
          { label: 'Lookups', value: stats.lookups, icon: Search, color: 'text-emerald-400' },
          { label: 'Flags', value: stats.flags, icon: AlertTriangle, color: 'text-red-400' },
          { label: 'Users', value: stats.users, icon: User, color: 'text-purple-400' },
        ].map((s) => (
          <div key={s.label} className="bg-[#151619] border border-white/5 p-4 rounded-2xl">
            <s.icon className={`${s.color} w-5 h-5 mb-2`} />
            <div className="text-2xl font-bold text-white">{s.value.toLocaleString()}</div>
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Management */}
        <section>
          <div className="flex items-center gap-2 mb-4 ml-1">
            <User className="text-white/30 w-4 h-4" />
            <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Officer Management</h2>
          </div>
          <div className="bg-[#151619] border border-white/5 rounded-3xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-bold text-white/30 uppercase">ID</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-white/30 uppercase">Username</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-white/30 uppercase">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-white/60">{u.id}</td>
                    <td className="px-6 py-4 text-xs font-bold text-white">{u.username}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Audit Log */}
        <section>
          <div className="flex items-center gap-2 mb-4 ml-1">
            <ShieldCheck className="text-white/30 w-4 h-4" />
            <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Security Audit Trail</h2>
          </div>
          <div className="bg-[#151619] border border-white/5 rounded-3xl overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{log.action}</span>
                    <span className="text-[10px] text-white/20">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-white/70 mb-2">{log.details}</p>
                  <div className="flex items-center gap-1.5 grayscale opacity-40">
                    <User className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase">{log.username}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'lookup' | 'history' | 'flag' | 'admin'>('lookup');

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      if (parsedUser.role === 'admin') setActiveTab('admin');
    }
  }, []);

  const handleLogin = (u: UserType, t: string) => {
    setUser(u);
    setToken(t);
    // Automatically set admin tab if logged in as admin
    if (u.role === 'admin') setActiveTab('admin');
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setActiveTab('lookup');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (!user || !token) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
            <ShieldCheck className="text-emerald-500 w-5 h-5" />
          </div>
          <span className="font-bold tracking-tight">AutoVerify</span>
          {user.role === 'admin' && (
            <span className="bg-purple-500/10 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-500/20 uppercase tracking-widest ml-2">Admin Panel</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{user.role}</div>
            <div className="text-xs font-medium uppercase">{user.username}</div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'lookup' && (
            <motion.div key="lookup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl mx-auto">
              <LookupPage token={token} />
            </motion.div>
          )}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl mx-auto">
              <HistoryPage token={token} />
            </motion.div>
          )}
          {activeTab === 'flag' && (
            <motion.div key="flag" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl mx-auto">
              <FlagPage token={token} />
            </motion.div>
          )}
          {activeTab === 'admin' && user.role === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <AdminDashboard token={token} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pt-4 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A] to-transparent">
        <div className="max-w-xl mx-auto bg-[#151619]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-1.5 flex items-center justify-around shadow-2xl">
          <button 
            onClick={() => setActiveTab('lookup')}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all ${activeTab === 'lookup' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-white/40 hover:text-white'}`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Lookup</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all ${activeTab === 'history' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-white/40 hover:text-white'}`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
          </button>
          <button 
            onClick={() => setActiveTab('flag')}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all ${activeTab === 'flag' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-white/40 hover:text-white'}`}
          >
            <FlagIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Flag</span>
          </button>
          {user.role === 'admin' && (
            <button 
              onClick={() => setActiveTab('admin')}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all ${activeTab === 'admin' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-white/40 hover:text-white'}`}
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Admin</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
