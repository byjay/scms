import React, { useState, useEffect } from 'react';
import { User, Lock, AlertCircle, Loader2, Eye, EyeOff, Ship, ArrowRight, Plus, X, ShieldCheck } from 'lucide-react';
import CableNetworkBackground from './CableNetworkBackground';

interface LandingPageProps {
    onLoginSuccess: (userData: any) => void;
    availableShips?: string[];
}

const BUILD_VERSION = "2026-03-11";

const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess, availableShips }) => {
    // UI State
    const [step, setStep] = useState<'LOGIN' | 'SHIP_SELECT'>('LOGIN');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Login Form State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Ship Selection State
    const [selectedShip, setSelectedShip] = useState<string | null>(null);
    const [isAddingShip, setIsAddingShip] = useState(false);
    const [newShipId, setNewShipId] = useState('');
    const [scrolled, setScrolled] = useState(false);

    const [isMobile, setIsMobile] = useState(false);

    // Auth context (Mocked for Hono adaptation)
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        // Mobile Detection
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
            if (/android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent)) {
                setIsMobile(true);
            } else {
                setIsMobile(window.innerWidth <= 768);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => {
            clearInterval(timer);
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('SEASTAR_TOKEN', data.token);
                localStorage.setItem('SEASTAR_USER', JSON.stringify(data.user));
                setUser(data.user);
                setStep('SHIP_SELECT');
            } else {
                setError(data.error || '로그인에 실패했습니다.');
            }
        } catch (err) {
            setError('서버 연결 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('구글 로그인은 현재 관리자 전용 서버에서 지원되지 않습니다.');
    };

    const handleAddShip = async () => {
        if (!newShipId.trim()) return;
        try {
            // Adapted for Hono
            const res = await fetch('/api/projects/ships', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('SEASTAR_TOKEN')}`
                },
                body: JSON.stringify({ name: newShipId.trim() })
            });
            if (res.ok) {
                const updatedUser = { ...user, shipAccess: [...(user?.shipAccess || []), newShipId.trim()] };
                setUser(updatedUser);
            }
            setIsAddingShip(false);
            setNewShipId('');
        } catch (e: any) {
            console.error(e);
        }
    };

    const handleEnter = () => {
        if (selectedShip && user) {
            onLoginSuccess({ ...user, selectedShip });
        }
    };

    const shipsToShow: string[] = (Array.isArray(availableShips) && availableShips.length > 0)
        ? availableShips
        : (user?.shipAccess ?? []);

    // RENDER: LOGIN SCREEN
    if (step === 'LOGIN') {
        return (
            <div className="h-[100dvh] flex flex-col items-center justify-center bg-slate-900 overflow-hidden relative font-sans">
                {/* Background - Solid gradient with video overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-900" />

                {/* LOGIN CARD */}
                <div className="w-full max-w-[420px] bg-[#1e293b]/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/5 relative z-20 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">

                    {/* Header Section */}
                    <div className="w-full py-10 text-center relative overflow-hidden bg-slate-900/50">
                        <div className="relative z-10 flex flex-col items-center justify-center gap-3">
                            <div className="w-full h-32 mb-2 overflow-hidden bg-transparent flex items-center justify-center">
                                <img src="/logo.jpg" alt="SCMS Logo" className="w-24 h-24 object-contain rounded-xl opacity-90 shadow-xl" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase">
                                Seastar Cable Management System
                            </p>
                        </div>
                    </div>

                    {/* Login Form */}
                    <div className="px-10 pb-10 pt-4 space-y-6">

                        <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent opacity-20 mb-6"></div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            {/* ID Input */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Account ID</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Employee ID"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500/50 font-medium transition-all"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500/50 font-medium transition-all"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-2 animate-in slide-in-from-top-1">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 mt-6 tracking-wide"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SECURE LOGIN'}
                            </button>

                            <div className="flex items-center gap-4 my-4">
                                <div className="flex-1 h-px bg-slate-700"></div>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">OR</span>
                                <div className="flex-1 h-px bg-slate-700"></div>
                            </div>

                            {/* Google Login Button (Disabled in Hono version) */}
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full py-3.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 opacity-50 cursor-not-allowed"
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                                SIGN IN WITH GOOGLE
                            </button>
                        </form>

                        {/* Integrated Video Section at Bottom of Card */}
                        <div className="mt-6 -mx-10 -mb-10 h-32 relative overflow-hidden group">
                            {!isMobile ? (
                                <video
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover opacity-60 transition-opacity duration-700 group-hover:opacity-80"
                                >
                                    <source src="/video/login.mp4" type="video/mp4" />
                                </video>
                            ) : (
                                <div className="w-full h-full bg-blue-900/40" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                            <div className="absolute inset-x-0 bottom-4 flex flex-col items-center justify-center opacity-40">
                                <span className="text-[8px] font-black text-white tracking-[0.4em] uppercase">Securing Network Integrity</span>
                                <div className="w-8 h-0.5 bg-blue-500 mt-1"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="absolute bottom-6 w-full text-center z-20 space-y-1">
                    <p className="text-[10px] text-slate-500 font-mono tracking-wider">SECURE CONNECTION ESTABLISHED</p>
                    <p className="text-[10px] text-slate-600">v{BUILD_VERSION}</p>
                </div>
            </div>
        );
    }

    // RENDER: SHIP SELECT SCREEN
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Shared Video Background with Overlay */}
            <div className="absolute inset-0 overflow-hidden">
                {!isMobile ? (
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute w-full h-full object-cover opacity-10 grayscale"
                    >
                        <source src="/video/background.mp4" type="video/mp4" />
                    </video>
                ) : (
                    <div className="absolute w-full h-full bg-[#0f172a] opacity-20" />
                )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/20"></div>

            <div className="max-w-6xl w-full relative z-10">
                <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">Welcome back, <span className="text-blue-500">{user?.username}</span></h2>
                    <p className="text-slate-400 text-xl font-light">Select a project to authorize system access</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                    {/* Dynamic User Ships */}
                    {shipsToShow.map((ship, idx) => (
                        <button
                            key={ship}
                            onClick={() => setSelectedShip(ship)}
                            className={`group relative p-8 rounded-3xl border transition-all duration-300 text-left hover:shadow-2xl hover:-translate-y-2 ${selectedShip === ship
                                ? 'border-blue-500 bg-blue-600/10 ring-1 ring-blue-500/50 backdrop-blur-xl'
                                : 'border-white/5 bg-[#0f172a]/60 hover:border-blue-500/30 hover:bg-[#1e293b]/80 backdrop-blur-md'
                                } animate-in fade-in slide-in-from-bottom-8 duration-700 overflow-hidden`}
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="absolute top-0 right-0 p-32 bg-blue-500/10 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:bg-blue-500/20 transition-all"></div>

                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-all duration-300 overflow-hidden bg-slate-900 ${selectedShip === ship ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/40' : 'ring-1 ring-slate-700 group-hover:ring-blue-500 group-hover:shadow-lg group-hover:shadow-blue-500/40'
                                }`}>
                                <img src="/logo.jpg" alt="SEASTAR Logo" className="w-full h-full object-contain p-1.5 opacity-80" />
                            </div>

                            <div className="relative z-10">
                                <h3 className={`font-bold text-2xl mb-2 transition-colors ${selectedShip === ship ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                                    {ship}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${selectedShip === ship ? 'bg-green-400' : 'bg-slate-600 group-hover:bg-blue-400'}`}></div>
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider group-hover:text-blue-200">Active Project</p>
                                </div>
                            </div>

                            {selectedShip === ship && (
                                <div className="absolute bottom-6 right-6 text-blue-500 animate-in zoom-in">
                                    <ShieldCheck size={24} />
                                </div>
                            )}
                        </button>
                    ))}

                    {/* Add New Ship Button */}
                    <button
                        onClick={() => setIsAddingShip(true)}
                        className="group relative p-8 rounded-3xl border-2 border-dashed border-slate-700 hover:border-blue-500/50 bg-transparent hover:bg-slate-800/30 transition-all duration-300 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-8"
                        style={{ animationDelay: `${(shipsToShow.length) * 100}ms` }}
                    >
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-slate-800/50 text-slate-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <Plus size={32} />
                        </div>
                        <h3 className="font-bold text-xl text-slate-500 group-hover:text-white mb-2">Register Project</h3>
                        <p className="text-sm text-slate-600 font-medium group-hover:text-slate-400">Add New Ship Access</p>
                    </button>
                </div>

                {/* Enter System Button */}
                <div className="mt-12 flex justify-center animate-in fade-in slide-in-from-bottom-8 delay-300">
                    <button
                        onClick={handleEnter}
                        disabled={!selectedShip}
                        className={`
                            group flex items-center gap-4 px-16 py-6 rounded-full font-black text-xl transition-all duration-300 shadow-2xl relative overflow-hidden
                            ${selectedShip
                                ? 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-blue-500/40 hover:-translate-y-1 active:scale-95'
                                : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-white/5'
                            }
                        `}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <span>ENTER SYSTEM</span>
                        <ArrowRight size={24} className={`transition-transform duration-300 ${selectedShip ? 'group-hover:translate-x-1' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Add Ship Modal */}
            {isAddingShip && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl scale-100 animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                                Register New Project
                            </h3>
                            <button onClick={() => setIsAddingShip(false)} title="Close" className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <p className="text-slate-400 text-sm mb-8 leading-relaxed bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                            Enter the Ship Project ID (e.g., HK2401) to add it to your dashboard.
                            <span className="block mt-2 text-blue-400 text-xs font-bold">Valid Project ID required for data loading.</span>
                        </p>
                        <input
                            type="text"
                            value={newShipId}
                            onChange={(e) => setNewShipId(e.target.value.toUpperCase())}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-6 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-8 text-xl tracking-wider text-center font-bold"
                            placeholder="PROJECT-ID"
                            autoFocus
                        />
                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsAddingShip(false)}
                                className="flex-1 px-4 py-4 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddShip}
                                disabled={!newShipId.trim()}
                                className="flex-1 px-4 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-lg shadow-blue-900/20"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
