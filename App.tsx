import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Monitor, Calendar, User, ChevronRight, Cpu, HardDrive, Zap, Clock, CreditCard, CheckCircle2, XCircle, LayoutGrid, Loader2, Settings, Trash2, Edit3, LogOut, MessageSquare } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, addHours, startOfHour, isAfter, isBefore, parseISO } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { GoogleGenAI } from "@google/genai";
import type { Computer, Booking } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Navbar = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Play', icon: Monitor },
    { path: '/status', label: 'Status', icon: Clock },
    { path: '/booking', label: 'Booking', icon: Calendar },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/admin', label: 'Admin', icon: Settings },
    { path: 'https://discord.gg/YargZqRf2p', label: 'Discord', icon: MessageSquare, external: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-2 pb-4 md:top-0 md:bottom-auto md:pt-6 md:px-4">
      <div className="mx-auto w-full max-w-2xl glass rounded-2xl p-1 flex items-center justify-between md:p-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          if (item.external) {
            return (
              <a
                key={item.path}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex flex-col items-center gap-1 px-2 py-2 sm:px-4 md:px-6 rounded-xl transition-all duration-300 text-zinc-500 hover:text-[#5865F2]"
              >
                <Icon size={20} />
                <span className="hidden sm:block text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
              </a>
            );
          }

          return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-2 py-2 sm:px-4 md:px-6 rounded-xl transition-all duration-300",
                  isActive ? "text-brand-accent" : "text-zinc-500 hover:text-zinc-800"
                )}
              >
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 bg-brand-accent/10 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon size={20} />
              <span className="hidden sm:block text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

// --- Views ---

const PlayView = () => {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPC, setSelectedPC] = useState<Computer | null>(null);
  const [settings, setSettings] = useState<any>({});

  const fetchData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch('/api/computers').then(res => res.json()),
      fetch('/api/settings').then(res => res.json())
    ])
      .then(([pcData, setData]) => {
        setComputers(pcData);
        setSettings(setData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const zones = ['Standard', 'VIP'];

  return (
    <div className="pb-32 pt-8 px-4 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">{settings.business_name || 'DuoPC'}</h1>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-brand-success rounded-full animate-pulse" />
            <p className="text-zinc-500 text-sm font-medium">Live Status</p>
          </div>
        </div>
        <button 
          onClick={fetchData}
          disabled={loading}
          className="p-3 bg-white/5 rounded-2xl text-zinc-500 hover:text-brand-accent transition-all active:scale-95 disabled:opacity-50"
        >
          <Zap size={20} className={cn(loading && "animate-spin")} />
        </button>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-brand-card animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="glass p-12 rounded-[2.5rem] text-center space-y-4">
          <XCircle size={48} className="mx-auto text-brand-danger opacity-50" />
          <h2 className="text-xl font-bold">Unable to load data</h2>
          <p className="text-zinc-500 text-sm max-w-xs mx-auto">{error}</p>
          <button 
            onClick={fetchData}
            className="px-6 py-2 bg-brand-accent text-white rounded-xl font-bold text-sm"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {zones.map(zone => (
            <section key={zone}>
              <div className="flex items-center gap-3 mb-6">
                <div className={cn("w-1 h-6 rounded-full", zone === 'VIP' ? "bg-brand-warning" : "bg-brand-accent")} />
                <h2 className="text-xl font-semibold">{zone} Zone</h2>
                <span className="text-xs text-zinc-500 font-mono ml-auto">
                  {computers.filter(c => c.zone === zone && c.status === 'available').length} Available
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {computers.filter(c => c.zone === zone).map(pc => (
                  <motion.button
                    key={pc.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPC(pc)}
                    className={cn(
                      "glass p-4 rounded-2xl text-left transition-colors group",
                      pc.status === 'occupied' && "opacity-60 grayscale cursor-not-allowed",
                      pc.status === 'reserved' && "border-brand-warning/30"
                    )}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={cn(
                        "status-dot",
                        pc.status === 'available' ? "bg-brand-success shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                        pc.status === 'occupied' ? "bg-brand-danger" : "bg-brand-warning"
                      )} />
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">{pc.status}</span>
                    </div>
                    <h3 className="text-lg font-bold mb-1">{pc.name}</h3>
                    <p className="text-xs text-zinc-500 font-mono">฿{pc.price_per_hour}/hr</p>
                  </motion.button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedPC && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPC(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="relative w-full max-w-md glass rounded-3xl p-6 overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className={cn(
                    "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2 inline-block",
                    selectedPC.zone === 'VIP' ? "bg-brand-warning/20 text-brand-warning" : "bg-brand-accent/20 text-brand-accent"
                  )}>
                    {selectedPC.zone} Zone
                  </span>
                  <h2 className="text-3xl font-bold">{selectedPC.name}</h2>
                </div>
                <button onClick={() => setSelectedPC(null)} className="p-2 hover:bg-black/5 rounded-full">
                  <XCircle size={24} className="text-zinc-500" />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 p-3 rounded-xl bg-black/5">
                  <Cpu size={20} className="text-brand-accent" />
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Processor</p>
                    <p className="text-sm font-medium">{selectedPC.cpu}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-xl bg-black/5">
                  <Zap size={20} className="text-brand-warning" />
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Graphics</p>
                    <p className="text-sm font-medium">{selectedPC.gpu}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-xl bg-black/5">
                  <HardDrive size={20} className="text-brand-success" />
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Memory</p>
                    <p className="text-sm font-medium">{selectedPC.ram}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500">Price</span>
                  <span className="text-2xl font-bold">฿{selectedPC.price_per_hour}<span className="text-sm font-normal text-zinc-500">/hr</span></span>
                </div>
                <Link
                  to={`/booking?pc=${selectedPC.id}`}
                  className={cn(
                    "flex-1 py-4 rounded-2xl font-bold text-center transition-all",
                    selectedPC.status === 'available' 
                      ? "bg-brand-accent text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]" 
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  )}
                >
                  {selectedPC.status === 'available' ? 'Book Now' : 'Currently Unavailable'}
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatusView = () => {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/computers').then(res => res.json()),
      fetch('/api/admin/bookings').then(res => res.json())
    ]).then(([pcData, bookingData]) => {
      setComputers(pcData);
      setBookings(bookingData);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 size={40} className="text-brand-accent animate-spin" />
      <p className="text-zinc-500 font-medium">Loading status...</p>
    </div>
  );

  const now = new Date();

  return (
    <div className="pb-32 pt-8 px-4 max-w-4xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Machine Status</h1>
        <p className="text-zinc-500">Real-time availability and upcoming reservations.</p>
      </header>

      <div className="grid gap-6">
        {computers.map(pc => {
          const pcBookings = bookings
            .filter(b => b.computer_id === pc.id && b.status !== 'cancelled')
            .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());

          const currentBooking = pcBookings.find(b => {
            const start = parseISO(b.start_time);
            const end = parseISO(b.end_time);
            return isBefore(start, now) && isAfter(end, now);
          });

          const upcomingBookings = pcBookings.filter(b => isAfter(parseISO(b.start_time), now));

          return (
            <div key={pc.id} className="glass rounded-3xl overflow-hidden">
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    pc.zone === 'VIP' ? "bg-brand-warning/10 text-brand-warning" : "bg-brand-accent/10 text-brand-accent"
                  )}>
                    <Monitor size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{pc.name}</h3>
                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">{pc.zone} Zone</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest",
                    currentBooking ? "bg-brand-danger/10 text-brand-danger" : "bg-brand-success/10 text-brand-success"
                  )}>
                    {currentBooking ? 'Occupied' : 'Available Now'}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {currentBooking && (
                  <div className="p-4 rounded-2xl bg-brand-danger/5 border border-brand-danger/10">
                    <p className="text-[10px] text-brand-danger font-bold uppercase mb-2">Current Session</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{currentBooking.user_name}</p>
                        <p className="text-xs text-zinc-500">
                          Ends at {format(parseISO(currentBooking.end_time), 'HH:mm')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-zinc-400 uppercase font-bold">Time Remaining</p>
                        <RemainingTime endTime={currentBooking.end_time} className="text-sm font-mono font-bold text-brand-danger" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Upcoming Bookings</p>
                  {upcomingBookings.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic">No upcoming reservations today.</p>
                  ) : (
                    <div className="grid gap-2">
                      {upcomingBookings.slice(0, 3).map(b => (
                        <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-black/5 border border-brand-border/50">
                          <div className="flex items-center gap-3">
                            <Clock size={14} className="text-zinc-400" />
                            <span className="text-xs font-medium">
                              {format(parseISO(b.start_time), 'HH:mm')} - {format(parseISO(b.end_time), 'HH:mm')}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase">{b.user_name}</span>
                        </div>
                      ))}
                      {upcomingBookings.length > 3 && (
                        <p className="text-[10px] text-center text-zinc-400">+{upcomingBookings.length - 3} more reservations</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RemainingTime = ({ endTime, className }: { endTime: string, className?: string }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculate = () => {
      const end = parseISO(endTime);
      const now = new Date();
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  return <span className={className}>{timeLeft}</span>;
};

const BookingView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialPcId = queryParams.get('pc');

  const isAdmin = sessionStorage.getItem('adminToken') === 'admin-token-xyz';

  const [computers, setComputers] = useState<Computer[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [selectedPcId, setSelectedPcId] = useState<string>(initialPcId || '');
  const [userName, setUserName] = useState('');
  const [duration, setDuration] = useState(1);
  const [startTime, setStartTime] = useState(format(startOfHour(addHours(new Date(), 1)), "yyyy-MM-dd'T'HH:mm"));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/computers').then(res => res.json()),
      fetch('/api/settings').then(res => res.json())
    ]).then(([pcData, setData]) => {
      setComputers(pcData);
      setSettings(setData);
    });
  }, []);

  useEffect(() => {
    if (isAdmin && !userName) {
      setUserName('Administrator');
    }
  }, [isAdmin, userName]);

  const selectedPC = computers.find(c => c.id.toString() === selectedPcId);
  const totalPrice = selectedPC ? selectedPC.price_per_hour * duration : 0;

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPcId || !userName) return;

    setSubmitting(true);
    setError('');

    const end = format(addHours(parseISO(startTime), duration), "yyyy-MM-dd'T'HH:mm");

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          computer_id: parseInt(selectedPcId),
          user_name: userName,
          start_time: startTime,
          end_time: end,
          total_price: totalPrice,
          status: isAdmin ? 'paid' : 'pending'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book');

      localStorage.setItem('userName', userName);
      navigate(`/booking/${data.id}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-32 pt-8 px-4 max-w-2xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-2">{settings.business_name || 'Reserve'}</h1>
        <p className="text-zinc-500">Choose your machine and time slot.</p>
      </header>

      {isAdmin && (
        <div className="mb-6 p-4 rounded-2xl bg-brand-success/10 border border-brand-success/20 text-brand-success text-xs font-bold flex items-center gap-3">
          <CheckCircle2 size={18} />
          <div>
            <p className="uppercase tracking-widest mb-1">Admin Mode Active</p>
            <p className="font-medium opacity-80">This booking will be automatically activated and marked as paid.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleBooking} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Select Computer</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {computers.map(pc => (
              <button
                key={pc.id}
                type="button"
                onClick={() => setSelectedPcId(pc.id.toString())}
                className={cn(
                  "p-3 rounded-xl border transition-all text-left",
                  selectedPcId === pc.id.toString() 
                    ? "bg-brand-accent/10 border-brand-accent text-brand-accent" 
                    : "bg-brand-card border-brand-border text-zinc-400 hover:border-zinc-600"
                )}
              >
                <p className="text-sm font-bold">{pc.name}</p>
                <p className="text-[10px] opacity-60">{pc.zone}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Your Name</label>
            <input
              type="text"
              required
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 focus:outline-none focus:border-brand-accent transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Start Time</label>
            <input
              type="datetime-local"
              required
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 focus:outline-none focus:border-brand-accent transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Duration (Hours)</label>
          <div className="flex gap-3">
            {[1, 2, 3, 5, 8].map(h => (
              <button
                key={h}
                type="button"
                onClick={() => setDuration(h)}
                className={cn(
                  "flex-1 py-3 rounded-xl border transition-all font-bold",
                  duration === h 
                    ? "bg-brand-accent text-white border-brand-accent" 
                    : "bg-brand-card border-brand-border text-zinc-400 hover:border-zinc-600"
                )}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-sm flex items-center gap-3">
            <XCircle size={18} />
            {error}
          </div>
        )}

        <div className="glass p-6 rounded-3xl mt-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Total Amount</p>
              <div className="flex items-baseline gap-2">
                <p className={cn("text-3xl font-bold", isAdmin && "line-through opacity-40")}>฿{totalPrice}</p>
                {isAdmin && <p className="text-2xl font-bold text-brand-success">฿0</p>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Rate</p>
              <p className="text-sm font-medium">฿{selectedPC?.price_per_hour || 0}/hr</p>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting || !selectedPcId || !userName}
            className="w-full py-4 bg-brand-accent text-white rounded-2xl font-bold hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Processing...' : 'Confirm Booking'}
          </button>
        </div>
      </form>
    </div>
  );
};

const DetailView = () => {
  const { pathname } = useLocation();
  const id = pathname.split('/').pop();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>({});

  const fetchBooking = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`/api/bookings/${id}`).then(res => {
        if (!res.ok) throw new Error('Booking not found');
        return res.json();
      }),
      fetch('/api/settings').then(res => res.json())
    ])
      .then(([bData, sData]) => {
        setBooking(bData);
        setSettings(sData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const [verifying, setVerifying] = useState(false);
  const [slipImage, setSlipImage] = useState<string | null>(null);
  const [angpaoLink, setAngpaoLink] = useState('');

  const handleSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const verifyAngpao = async () => {
    if (!angpaoLink || !booking) return;
    setVerifying(true);
    setError(null);

    try {
      console.log(`[AI] Verifying Angpao link: ${angpaoLink}`);
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an automated payment processor. 
        Verify this TrueMoney Angpao link: ${angpaoLink}. 
        The expected amount is ${booking.total_price} THB. 
        The recipient phone number is 0967404809.
        
        Rules:
        1. The link MUST start with https://gift.truemoney.com/campaign/?v=
        2. The link MUST be a valid format.
        3. If the link is valid, assume the AI will "press receive" and the money will go to 0967404809.
        
        Respond ONLY with a JSON object: {"valid": boolean, "reason": string, "amount_detected": number | null}`
      });

      const text = response.text || '{}';
      const result = JSON.parse(text);
      
      if (result.valid) {
        console.log('[AI] Angpao verified successfully');
        const res = await fetch(`/api/bookings/${id}/pay`, { method: 'PATCH' });
        if (res.ok) {
          fetchBooking();
          alert('ชำระเงินผ่านซองอั่งเปาสำเร็จ! ระบบกำลังอัปเดตสถานะ...');
        } else {
          throw new Error('Failed to update booking status on server');
        }
      } else {
        throw new Error(result.reason || 'ลิงก์อั่งเปาไม่ถูกต้อง หรือถูกใช้งานไปแล้ว');
      }
    } catch (err: any) {
      console.error('[AI] Angpao verification error:', err);
      setError(`การตรวจสอบล้มเหลว: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const verifySlip = async () => {
    if (!slipImage || !booking) return;
    setVerifying(true);
    setError(null);

    try {
      const base64Data = slipImage.split(',')[1];
      const mimeType = slipImage.split(';')[0].split(':')[1] || 'image/jpeg';
      
      console.log(`[AI] Verifying slip image (${mimeType})...`);
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { inlineData: { data: base64Data, mimeType: mimeType } },
              { text: `You are an expert payment auditor for a gaming center. 
              Verify this Thai bank transfer slip.
              
              Expected Details:
              - Amount: ${booking.total_price} THB
              - Receiver: "${settings.promptpay_name || 'ปิยะวัฒน์ แปรนุ่น'}"
              - Receiver Phone/ID: "${settings.promptpay_number || '0967404809'}"
              
              Verification Steps:
              1. Extract the transaction ID.
              2. Extract the amount and compare with ${booking.total_price}.
              3. Extract the receiver name and compare with "${settings.promptpay_name || 'ปิยะวัฒน์ แปรนุ่น'}".
              4. Check if the slip looks like a real bank slip (has bank logo, QR code, etc.).
              5. Check if the date is recent (today is ${new Date().toLocaleDateString('th-TH')}).
              
              Respond ONLY with a JSON object: {
                "valid": boolean, 
                "reason": string, 
                "details": {
                  "amount": number,
                  "transaction_id": string,
                  "receiver": string,
                  "date": string
                }
              }` }
            ]
          }
        ],
        config: { 
          responseMimeType: "application/json"
        }
      });

      const text = response.text || '{}';
      const result = JSON.parse(text);
      
      console.log('[AI] Slip verification result:', result);

      if (result.valid) {
        const res = await fetch(`/api/bookings/${id}/pay`, { method: 'PATCH' });
        if (res.ok) {
          fetchBooking();
          alert('ตรวจสอบสลิปสำเร็จ! ยอดเงินถูกต้อง ขอบคุณที่ใช้บริการ');
        } else {
          throw new Error('Failed to update booking status on server');
        }
      } else {
        throw new Error(result.reason || 'สลิปไม่ถูกต้อง หรือข้อมูลไม่ตรงกับรายการจอง');
      }
    } catch (err: any) {
      console.error('[AI] Slip verification error:', err);
      setError(`การตรวจสอบสลิปล้มเหลว: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await fetch(`/api/bookings/${id}/cancel`, { method: 'PATCH' });
      fetchBooking();
    } catch (err) {
      alert('Failed to cancel booking');
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 size={40} className="text-brand-accent animate-spin" />
      <p className="text-zinc-500 font-medium">Fetching your reservation...</p>
    </div>
  );

  if (error || !booking) return (
    <div className="pb-32 pt-12 px-4 max-w-lg mx-auto text-center space-y-6">
      <div className="glass p-12 rounded-[2.5rem] space-y-4">
        <XCircle size={48} className="mx-auto text-brand-danger opacity-50" />
        <h2 className="text-xl font-bold">Something went wrong</h2>
        <p className="text-zinc-500 text-sm">{error || 'Booking details could not be loaded.'}</p>
        <button 
          onClick={fetchBooking}
          className="px-8 py-3 bg-brand-accent text-white rounded-2xl font-bold"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  const isCancelled = booking.status === 'cancelled';

  return (
    <div className="pb-32 pt-8 px-4 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-[2.5rem] overflow-hidden"
      >
        <div className={cn(
          "p-8 text-center",
          isCancelled ? "bg-brand-danger/10" : "bg-brand-accent/10"
        )}>
          <div className="mx-auto w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
            {isCancelled ? <XCircle size={32} className="text-brand-danger" /> : <CheckCircle2 size={32} className="text-brand-accent" />}
          </div>
          <h1 className="text-2xl font-bold mb-1">Booking {isCancelled ? 'Cancelled' : 'Confirmed'}</h1>
          <p className="text-sm text-zinc-500">Order ID: #{booking.id.toString().padStart(6, '0')}</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Machine</p>
              <p className="font-bold">{booking.computer_name}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Zone</p>
              <p className="font-bold">{booking.zone}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Start</p>
              <p className="text-sm">{format(parseISO(booking.start_time), 'MMM d, HH:mm')}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">End</p>
              <p className="text-sm">{format(parseISO(booking.end_time), 'MMM d, HH:mm')}</p>
            </div>
          </div>

          {booking.status === 'paid' && isBefore(parseISO(booking.start_time), new Date()) && isAfter(parseISO(booking.end_time), new Date()) && (
            <div className="p-4 rounded-2xl bg-brand-accent/5 border border-brand-accent/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-brand-accent animate-pulse" />
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Time Remaining</span>
              </div>
              <RemainingTime endTime={booking.end_time} className="text-lg font-mono font-bold text-brand-accent" />
            </div>
          )}

          <div className="h-px bg-brand-border" />

          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-zinc-400">Total Amount</p>
            <p className="text-2xl font-bold">฿{booking.total_price}</p>
          </div>

          {booking.status === 'paid' && (
            <div className="p-8 space-y-6 border-t border-brand-border bg-brand-success/5">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-success/20 text-brand-success text-[10px] font-bold uppercase tracking-widest">
                  Payment Successful
                </div>
                <h2 className="text-xl font-bold">Official Receipt</h2>
                <p className="text-xs text-zinc-500">Thank you for choosing {settings.business_name || 'DuoPC Gaming Center'}</p>
              </div>
              
              <div className="space-y-3 p-6 rounded-3xl bg-black/5 border border-brand-border">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Transaction ID</span>
                  <span className="font-mono">TXN-{booking.id}-{Date.now().toString().slice(-6)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Payment Method</span>
                  <span>Digital Transfer (Verified)</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Date & Time</span>
                  <span>{format(new Date(), 'MMM d, yyyy HH:mm')}</span>
                </div>
                <div className="pt-3 border-t border-brand-border flex justify-between items-center">
                  <span className="font-bold">Total Paid</span>
                  <span className="text-xl font-bold text-brand-success">฿{booking.total_price}</span>
                </div>
              </div>

              {/* Remote Access Section */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={16} className="text-brand-accent" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">ข้อมูลการเข้าใช้งาน (Remote Access)</h3>
                </div>
                
                <div className="grid gap-3">
                  <div className="p-4 rounded-2xl bg-black/5 border border-brand-border hover:border-brand-accent/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-zinc-900">1. Moonlight + Tailscale</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-brand-accent/20 text-brand-accent font-bold">แนะนำ</span>
                    </div>
                    <p className="text-xs text-zinc-500">เหมาะสำหรับ: <span className="text-zinc-800">ต่อเมาส์และคีย์บอร์ด</span></p>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/5 border border-brand-border hover:border-brand-accent/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-zinc-900">2. Oslink</span>
                    </div>
                    <p className="text-xs text-zinc-500">เหมาะสำหรับ: <span className="text-zinc-800">ไม่มีเมาส์และคีย์บอร์ด (มือถือ/แท็บเล็ต)</span></p>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/5 border border-brand-border hover:border-brand-accent/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-zinc-900">3. Parsec</span>
                    </div>
                    <p className="text-xs text-zinc-500">เหมาะสำหรับ: <span className="text-zinc-800">ใช้งานผ่าน PC/Laptop</span></p>
                  </div>
                </div>
                
                <div className="p-4 rounded-2xl bg-brand-accent/10 border border-brand-accent/20">
                  <p className="text-[10px] text-brand-accent font-bold uppercase mb-1">คำแนะนำเพิ่มเติม</p>
                  <p className="text-[11px] text-zinc-700 leading-relaxed mb-3">
                    กรุณาติดต่อแอดมินเพื่อรับรหัสผ่านและ IP Address สำหรับเครื่อง <span className="font-bold text-zinc-900">{booking.computer_name}</span> ของคุณ
                  </p>
                  <a 
                    href="https://discord.gg/YargZqRf2p" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 bg-[#5865F2] text-white rounded-xl text-xs font-bold hover:bg-[#4752C4] transition-all"
                  >
                    <MessageSquare size={14} />
                    ติดต่อแอดมินผ่าน Discord
                  </a>
                </div>
              </div>

              <div className="text-center pt-4">
                <p className="text-[10px] text-zinc-500">กรุณาแสดงหน้าจอนี้ให้พนักงานเพื่อเริ่มใช้งานเครื่องของคุณ</p>
              </div>
              
              <button 
                onClick={() => window.print()}
                className="w-full py-4 bg-black/5 text-zinc-600 rounded-2xl font-bold text-sm hover:bg-black/10 transition-all"
              >
                Download Receipt (PDF)
              </button>
            </div>
          )}

          {!isCancelled && booking.status !== 'paid' && (
            <div className="space-y-6 pt-4">
              <div className="flex flex-col items-center gap-4 p-6 rounded-3xl bg-white text-black overflow-hidden">
                <p className="text-xs font-bold uppercase tracking-widest opacity-60">Scan to Pay (PromptPay)</p>
                <div className="relative w-full aspect-[2/3] max-w-[280px]">
                  <img 
                    src="/qr-payment.png" 
                    alt="PromptPay QR Code" 
                    className="w-full h-full object-contain rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-bold text-zinc-900">{settings.promptpay_name || 'ปิยะวัฒน์ แปรนุ่น'}</p>
                  <p className="text-[10px] font-mono text-zinc-500">ยอดเงินที่ต้องชำระ: ฿{booking.total_price}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Option 1: TrueMoney Angpao</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://gift.truemoney.com/..."
                      value={angpaoLink}
                      onChange={(e) => setAngpaoLink(e.target.value)}
                      className="flex-1 bg-white/5 border border-brand-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-accent"
                    />
                    <button
                      onClick={verifyAngpao}
                      disabled={verifying || !angpaoLink}
                      className="px-4 bg-brand-accent text-white rounded-xl font-bold text-xs disabled:opacity-50"
                    >
                      Verify
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500 italic">AI will verify the link and credit your account instantly.</p>
                </div>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-brand-border"></div></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold"><span className="bg-brand-bg px-2 text-zinc-500">OR</span></div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Option 2: Upload Transfer Slip</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSlipUpload}
                      className="hidden"
                      id="slip-upload"
                    />
                    <label
                      htmlFor="slip-upload"
                      className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-brand-border rounded-3xl cursor-pointer hover:border-brand-accent transition-colors bg-white/5"
                    >
                      {slipImage ? (
                        <img src={slipImage} alt="Slip" className="max-h-40 rounded-xl" />
                      ) : (
                        <>
                          <CreditCard size={32} className="text-zinc-500" />
                          <span className="text-sm text-zinc-500">Click to upload slip</span>
                        </>
                      )}
                    </label>
                  </div>
                  
                  {slipImage && (
                    <button
                      onClick={verifySlip}
                      disabled={verifying}
                      className="w-full py-4 bg-brand-success text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {verifying ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          AI Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={20} />
                          Verify Slip with AI
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleCancel}
                className="w-full py-4 text-brand-danger font-bold hover:bg-brand-danger/5 rounded-2xl transition-all"
              >
                Cancel Booking
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const ProfileView = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');

  useEffect(() => {
    if (userName) {
      fetch(`/api/bookings/user/${encodeURIComponent(userName)}`)
        .then(res => res.json())
        .then(data => {
          setBookings(data);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [userName]);

  const totalHours = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((acc, b) => {
      const start = parseISO(b.start_time);
      const end = parseISO(b.end_time);
      return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);

  if (!userName) {
    return (
      <div className="pb-32 pt-8 px-4 max-w-lg mx-auto text-center">
        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Profile</h1>
          <p className="text-zinc-500">Please make a booking first to see your profile.</p>
        </header>
        <Link to="/booking" className="inline-block py-4 px-8 bg-brand-accent text-white rounded-2xl font-bold">
          Go to Booking
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-8 px-4 max-w-lg mx-auto">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Profile</h1>
          <p className="text-zinc-500">Manage your account and history.</p>
        </div>
        <button 
          onClick={() => { if(confirm('Logout and clear history?')) { localStorage.removeItem('userName'); window.location.reload(); } }}
          className="p-3 bg-white/5 rounded-2xl text-zinc-500 hover:text-brand-danger transition-all"
        >
          <LogOut size={20} />
        </button>
      </header>
      
      <div className="space-y-4">
        <div className="glass p-6 rounded-3xl flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-accent/20 flex items-center justify-center">
            <User size={32} className="text-brand-accent" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{userName}</h2>
            <p className="text-sm text-zinc-500">Member since {bookings.length > 0 ? format(parseISO(bookings[bookings.length - 1].created_at), 'MMM yyyy') : 'Today'}</p>
          </div>
          <Link to="/admin" className="p-3 bg-black/5 rounded-2xl text-zinc-500 hover:text-brand-accent transition-all">
            <Settings size={20} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass p-6 rounded-3xl">
            <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Total Hours</p>
            <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
          </div>
          <div className="glass p-6 rounded-3xl">
            <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Bookings</p>
            <p className="text-2xl font-bold">{bookings.length}</p>
          </div>
        </div>

        <div className="glass rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-brand-border bg-white/5">
            <h3 className="text-sm font-bold uppercase tracking-wider">Recent Activity</h3>
          </div>
          <div className="divide-y divide-brand-border">
            {loading ? (
              <div className="p-8 text-center text-zinc-500">Loading history...</div>
            ) : bookings.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 text-sm py-12">
                <LayoutGrid size={32} className="mx-auto mb-3 opacity-20" />
                No recent activity found.
              </div>
            ) : (
              bookings.map(b => (
                <Link 
                  key={b.id} 
                  to={`/booking/${b.id}`}
                  className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      b.status === 'cancelled' ? "bg-brand-danger/10 text-brand-danger" : "bg-brand-accent/10 text-brand-accent"
                    )}>
                      <Monitor size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{b.computer_name}</p>
                      <p className="text-[10px] text-zinc-500">{format(parseISO(b.start_time), 'MMM d, HH:mm')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">฿{b.total_price}</p>
                    <p className={cn(
                      "text-[10px] font-bold uppercase",
                      b.status === 'cancelled' ? "text-brand-danger" : "text-brand-success"
                    )}>{b.status}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(sessionStorage.getItem('adminToken') === 'admin-token-xyz');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'bookings' | 'computers' | 'stats' | 'settings'>('stats');
  const [stats, setStats] = useState({ revenue: 0, bookings: 0, users: 0, pending: 0 });
  const [bookings, setBookings] = useState<any[]>([]);
  const [computers, setComputers] = useState<Computer[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingComputer, setEditingComputer] = useState<Computer | null>(null);
  const [isAddingComputer, setIsAddingComputer] = useState(false);
  const [newComputer, setNewComputer] = useState<Partial<Computer>>({
    name: '',
    zone: 'Standard',
    cpu: 'Intel i5',
    gpu: 'RTX 3060',
    ram: '16GB',
    price_per_hour: 20
  });
  const [settings, setSettings] = useState<any>({});
  const [savingSettings, setSavingSettings] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok) {
        sessionStorage.setItem('adminToken', data.token);
        setIsLoggedIn(true);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Connection failed');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, bRes, cRes, setRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/bookings'),
        fetch('/api/computers'),
        fetch('/api/settings')
      ]);
      setStats(await sRes.json());
      setBookings(await bRes.json());
      setComputers(await cRes.json());
      setSettings(await setRes.json());
    } catch (err) {
      console.error('Failed to fetch admin data');
    }
    setLoading(false);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        alert('Settings updated successfully');
      }
    } catch (err) {
      alert('Failed to update settings');
    }
    setSavingSettings(false);
  };

  useEffect(() => {
    if (isLoggedIn) fetchData();
  }, [isLoggedIn]);

  const updateBookingStatus = async (id: number, status: string) => {
    await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchData();
  };

  const deleteBooking = async (id: number) => {
    if (!confirm('Delete this booking?')) return;
    await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleUpdateComputer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComputer) return;
    
    try {
      const res = await fetch(`/api/admin/computers/${editingComputer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingComputer)
      });
      if (res.ok) {
        setEditingComputer(null);
        fetchData();
        alert('Computer updated successfully');
      }
    } catch (err) {
      alert('Failed to update computer');
    }
  };

  const handleAddComputer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/computers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newComputer)
      });
      if (res.ok) {
        setIsAddingComputer(false);
        setNewComputer({
          name: '',
          zone: 'Standard',
          cpu: 'Intel i5',
          gpu: 'RTX 3060',
          ram: '16GB',
          price_per_hour: 20
        });
        fetchData();
        alert('Computer added successfully');
      }
    } catch (err) {
      alert('Failed to add computer');
    }
  };

  const handleDeleteComputer = async (id: number) => {
    console.log(`[Admin] Attempting to delete computer with ID: ${id}`);
    if (id === undefined || id === null) {
      alert('ไม่พบรหัสเครื่องคอมพิวเตอร์ (ID is missing)');
      return;
    }
    
    const confirmed = window.confirm('ยืนยันการลบเครื่องคอมพิวเตอร์นี้? (ข้อมูลการจองทั้งหมดของเครื่องนี้จะถูกลบไปด้วย)');
    if (!confirmed) {
      console.log('[Admin] Delete cancelled by user');
      return;
    }
    
    try {
      setLoading(true);
      console.log(`[Admin] Sending DELETE request for computer ID: ${id}`);
      
      const res = await fetch(`/api/admin/computers/${id}`, { 
        method: 'DELETE',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      console.log('[Admin] Server response:', data);
      
      if (res.ok && data.success) {
        console.log('[Admin] Delete successful, refreshing data...');
        await fetchData();
        alert('ลบเครื่องคอมพิวเตอร์เรียบร้อยแล้ว');
      } else {
        console.error('[Admin] Delete failed:', data);
        alert(`ไม่สามารถลบได้: ${data.error || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`);
      }
    } catch (err: any) {
      console.error('[Admin] Connection error during delete:', err);
      alert(`เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass p-8 rounded-[2.5rem] w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-brand-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Settings className="text-brand-accent" size={32} />
            </div>
            <h1 className="text-2xl font-bold">Admin Login</h1>
            <p className="text-zinc-500 text-sm">Enter password to access dashboard</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-brand-border rounded-2xl px-6 py-4 focus:outline-none focus:border-brand-accent"
            />
            {error && <p className="text-brand-danger text-xs text-center">{error}</p>}
            <button className="w-full py-4 bg-brand-accent text-white rounded-2xl font-bold">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-8 px-4 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Admin Panel</h1>
          <p className="text-zinc-500">Manage your gaming center</p>
        </div>
        <button 
          onClick={() => { sessionStorage.removeItem('adminToken'); setIsLoggedIn(false); }}
          className="p-3 bg-white/5 rounded-2xl text-zinc-500 hover:text-brand-danger transition-colors"
        >
          <LogOut size={20} />
        </button>
      </header>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {[
          { id: 'stats', label: 'Overview', icon: LayoutGrid },
          { id: 'bookings', label: 'Bookings', icon: Calendar },
          { id: 'computers', label: 'Computers', icon: Monitor },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all",
              tab === t.id ? "bg-brand-accent text-white" : "glass text-zinc-500"
            )}
          >
            <t.icon size={18} />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-brand-accent" size={40} /></div>
      ) : (
        <div className="space-y-6">
          {tab === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass p-8 rounded-[2.5rem] space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Total Revenue</p>
                <p className="text-4xl font-bold text-brand-success">฿{stats.revenue.toLocaleString()}</p>
              </div>
              <div className="glass p-8 rounded-[2.5rem] space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Total Bookings</p>
                <p className="text-4xl font-bold">{stats.bookings}</p>
              </div>
              <div className="glass p-8 rounded-[2.5rem] space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Active Users</p>
                <p className="text-4xl font-bold">{stats.users}</p>
              </div>
              <div className="glass p-8 rounded-[2.5rem] space-y-2 border-brand-warning/20 border">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-warning">Pending Payments</p>
                <p className="text-4xl font-bold text-brand-warning">{stats.pending}</p>
              </div>
            </div>
          )}

          {tab === 'bookings' && (
            <div className="glass rounded-[2.5rem] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="p-6 text-xs font-bold uppercase tracking-widest text-zinc-500">User / PC</th>
                      <th className="p-6 text-xs font-bold uppercase tracking-widest text-zinc-500">Time</th>
                      <th className="p-6 text-xs font-bold uppercase tracking-widest text-zinc-500">Status</th>
                      <th className="p-6 text-xs font-bold uppercase tracking-widest text-zinc-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {bookings.map(b => (
                      <tr key={b.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-6">
                          <p className="font-bold">{b.user_name}</p>
                          <p className="text-xs text-zinc-500">{b.computer_name} ({b.zone})</p>
                        </td>
                        <td className="p-6">
                          <p className="text-sm">{format(parseISO(b.start_time), 'MMM d, HH:mm')}</p>
                          <p className="text-xs text-zinc-500">฿{b.total_price}</p>
                        </td>
                        <td className="p-6">
                          <select 
                            value={b.status}
                            onChange={(e) => updateBookingStatus(b.id, e.target.value)}
                            className={cn(
                              "bg-transparent font-bold text-xs uppercase focus:outline-none",
                              b.status === 'paid' ? "text-brand-success" : b.status === 'cancelled' ? "text-brand-danger" : "text-brand-warning"
                            )}
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="p-6 text-right">
                          <button onClick={() => deleteBooking(b.id)} className="p-2 text-zinc-500 hover:text-brand-danger transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'computers' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">Manage Computers</h3>
                  <p className="text-zinc-500 text-sm">Add, edit, or remove machines from your center.</p>
                </div>
                <button 
                  onClick={() => setIsAddingComputer(true)}
                  className="px-6 py-2 bg-brand-accent text-white rounded-xl font-bold text-sm flex items-center gap-2"
                >
                  <Monitor size={16} />
                  Add Computer
                </button>
              </div>

              {isAddingComputer && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass p-8 rounded-[2.5rem] border-2 border-brand-accent/20"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-bold">Add New Computer</h4>
                    <button onClick={() => setIsAddingComputer(false)} className="text-zinc-400 hover:text-zinc-600">
                      <XCircle size={20} />
                    </button>
                  </div>
                  <form onSubmit={handleAddComputer} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">Name</label>
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. PC-16"
                        value={newComputer.name} 
                        onChange={e => setNewComputer({...newComputer, name: e.target.value})}
                        className="w-full bg-white/5 border border-brand-border rounded-xl px-4 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">Zone</label>
                      <select 
                        value={newComputer.zone} 
                        onChange={e => setNewComputer({...newComputer, zone: e.target.value})}
                        className="w-full bg-white/5 border border-brand-border rounded-xl px-4 py-2 text-sm"
                      >
                        <option value="Standard">Standard</option>
                        <option value="VIP">VIP</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">CPU</label>
                      <input 
                        type="text" 
                        value={newComputer.cpu} 
                        onChange={e => setNewComputer({...newComputer, cpu: e.target.value})}
                        className="w-full bg-white/5 border border-brand-border rounded-xl px-4 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">GPU</label>
                      <input 
                        type="text" 
                        value={newComputer.gpu} 
                        onChange={e => setNewComputer({...newComputer, gpu: e.target.value})}
                        className="w-full bg-white/5 border border-brand-border rounded-xl px-4 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">RAM</label>
                      <input 
                        type="text" 
                        value={newComputer.ram} 
                        onChange={e => setNewComputer({...newComputer, ram: e.target.value})}
                        className="w-full bg-white/5 border border-brand-border rounded-xl px-4 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">Price per Hour</label>
                      <input 
                        required
                        type="number" 
                        value={newComputer.price_per_hour} 
                        onChange={e => setNewComputer({...newComputer, price_per_hour: parseInt(e.target.value)})}
                        className="w-full bg-white/5 border border-brand-border rounded-xl px-4 py-2 text-sm"
                      />
                    </div>
                    <button className="md:col-span-2 py-4 bg-brand-accent text-white rounded-2xl font-bold mt-4">
                      Create Computer
                    </button>
                  </form>
                </motion.div>
              )}

              {editingComputer && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass p-8 rounded-[2.5rem] border-brand-accent/30 border-2"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Edit {editingComputer.name}</h3>
                    <button onClick={() => setEditingComputer(null)} className="text-zinc-500 hover:text-white">Cancel</button>
                  </div>
                  <form onSubmit={handleUpdateComputer} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">PC Name</label>
                      <input 
                        type="text" 
                        value={editingComputer.name} 
                        onChange={e => setEditingComputer({...editingComputer, name: e.target.value})}
                        className="w-full bg-white/5 border border-brand-border rounded-xl px-4 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">Zone</label>
                      <select 
                        value={editingComputer.zone} 
                        onChange={e => setEditingComputer({...editingComputer, zone: e.target.value})}
                        className="w-full bg-white/5 border border-brand-border rounded-xl px-4 py-2 text-sm"
                      >
                        <option value="Standard">Standard</option>
                        <option value="VIP">VIP</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">CPU</label>
                      <input 
                        type="text" 
                        value={editingComputer.cpu} 
                        onChange={e => setEditingComputer({...editingComputer, cpu: e.target.value})}
                        className="w-full bg-white/5 border border-brand-border rounded-xl px-4 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">GPU</label>
                      <input 
                        type="text" 
                        value={editingComputer.gpu} 
                        onChange={e => setEditingComputer({...editingComputer, gpu: e.target.value})}
                        className="w-full bg-white/5 border border-brand-border rounded-xl px-4 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">RAM</label>
                      <input 
                        type="text" 
                        value={editingComputer.ram} 
                        onChange={e => setEditingComputer({...editingComputer, ram: e.target.value})}
                        className="w-full bg-white/5 border border-brand-border rounded-xl px-4 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">Price per Hour</label>
                      <input 
                        type="number" 
                        value={editingComputer.price_per_hour} 
                        onChange={e => setEditingComputer({...editingComputer, price_per_hour: parseInt(e.target.value)})}
                        className="w-full bg-white/5 border border-brand-border rounded-xl px-4 py-2 text-sm"
                      />
                    </div>
                    <button className="md:col-span-2 py-4 bg-brand-accent text-white rounded-2xl font-bold mt-4">
                      Save Changes
                    </button>
                  </form>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {computers.map(pc => (
                  <div key={pc.id} className="glass p-6 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        pc.zone === 'VIP' ? "bg-brand-warning/10 text-brand-warning" : "bg-brand-accent/10 text-brand-accent"
                      )}>
                        <Monitor size={24} />
                      </div>
                      <div>
                        <p className="font-bold">{pc.name}</p>
                        <p className="text-xs text-zinc-500">{pc.cpu} • ฿{pc.price_per_hour}/hr</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setEditingComputer(pc)}
                        className="p-3 bg-black/5 rounded-xl text-zinc-500 hover:text-brand-accent transition-colors"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          console.log('Delete button clicked for PC ID:', pc.id);
                          handleDeleteComputer(pc.id);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-brand-danger/10 rounded-2xl text-brand-danger hover:bg-brand-danger hover:text-white transition-all active:scale-95"
                        title="Delete Computer"
                      >
                        <Trash2 size={24} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === 'settings' && (
            <div className="glass p-8 rounded-[2.5rem] space-y-8">
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Business Configuration</h3>
                <p className="text-zinc-500 text-sm">Update your gaming center details and payment info.</p>
              </div>
              
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Business Name</label>
                    <input 
                      type="text" 
                      value={settings.business_name || ''} 
                      onChange={e => setSettings({...settings, business_name: e.target.value})}
                      className="w-full bg-white/5 border border-brand-border rounded-xl px-4 py-3 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Admin Password</label>
                    <input 
                      type="text" 
                      value={settings.admin_password || ''} 
                      onChange={e => setSettings({...settings, admin_password: e.target.value})}
                      className="w-full bg-white/5 border border-brand-border rounded-xl px-4 py-3 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">PromptPay Number</label>
                    <input 
                      type="text" 
                      value={settings.promptpay_number || ''} 
                      onChange={e => setSettings({...settings, promptpay_number: e.target.value})}
                      className="w-full bg-white/5 border border-brand-border rounded-xl px-4 py-3 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">PromptPay Name</label>
                    <input 
                      type="text" 
                      value={settings.promptpay_name || ''} 
                      onChange={e => setSettings({...settings, promptpay_name: e.target.value})}
                      className="w-full bg-white/5 border border-brand-border rounded-xl px-4 py-3 text-sm"
                    />
                  </div>
                </div>
                
                <button 
                  disabled={savingSettings}
                  className="w-full py-4 bg-brand-accent text-white rounded-2xl font-bold flex items-center justify-center gap-2"
                >
                  {savingSettings && <Loader2 size={20} className="animate-spin" />}
                  Save All Settings
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Main App ---

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-brand-bg">
        <Navbar />
        <main className="container mx-auto">
          <Routes>
            <Route path="/" element={<PlayView />} />
            <Route path="/status" element={<StatusView />} />
            <Route path="/booking" element={<BookingView />} />
            <Route path="/booking/:id" element={<DetailView />} />
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
