import React, { useState, useEffect, useMemo, memo } from 'react';
import { Search, Play, Sparkles, Clock, Users, ChevronLeft, X, Loader2, Home, Bell, TrendingUp, Menu, Music, Gamepad2, Newspaper, Film, Dumbbell, GraduationCap, Lightbulb, Car, Shirt, ChefHat, Zap, Star, Check, Heart, Radio, Video, Clapperboard } from 'lucide-react';

const PIPED_API = 'https://api.piped.private.coffee';

// Categorías de YouTube
const CATEGORIES = [
    { id: 'trending', name: 'Tendencias', icon: TrendingUp, region: 'AR' },
    { id: 'favorites', name: 'Favoritos', icon: Heart, region: 'AR' },
    { id: 'music', name: 'Música', icon: Music, region: 'AR' },
    { id: 'gaming', name: 'Gaming', icon: Gamepad2, region: 'AR' },
    { id: 'news', name: 'Noticias', icon: Newspaper, region: 'AR' },
    { id: 'movies', name: 'Películas', icon: Film, region: 'AR' },
    { id: 'sports', name: 'Deportes', icon: Dumbbell, region: 'AR' },
    { id: 'learning', name: 'Educación', icon: GraduationCap, region: 'AR' },
    { id: 'science', name: 'Ciencia', icon: Lightbulb, region: 'AR' },
    { id: 'autos', name: 'Autos', icon: Car, region: 'AR' },
    { id: 'style', name: 'Moda', icon: Shirt, region: 'AR' },
    { id: 'food', name: 'Cocina', icon: ChefHat, region: 'AR' },
];

// Subcategorías (filtros tipo píldora)
const SUBCATEGORIES = [
    { id: 'all', name: 'Todos', icon: null },
    { id: 'live', name: 'En vivo', icon: Radio },
    { id: 'videos', name: 'Videos', icon: Video },
    { id: 'shorts', name: 'Shorts', icon: Clapperboard },
];

interface Video {
    url: string;
    title: string;
    thumbnail: string;
    uploaderName: string;
    uploaderUrl: string;
    uploaderAvatar: string;
    uploadedDate: string | null;
    duration: number;
    views: number;
    uploaderVerified: boolean;
    isShort: boolean;
    uploaded?: number; // timestamp
}

interface Channel {
    id: string;
    name: string;
    avatar: string;
    subscribedAt: string;
}

// Componente separado para el reproductor - evita re-renders
const VideoPlayer = memo(({ videoId }: { videoId: string }) => {
    return (
        <div className="relative bg-black w-full">
            <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                className="w-full aspect-video"
                style={{ border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
            />
        </div>
    );
});

const YouTubeClientTab: React.FC = () => {
    const [view, setView] = useState<'home' | 'search' | 'subscriptions' | 'history' | 'player'>('home');
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Video[]>([]);
    const [trendingVideos, setTrendingVideos] = useState<Video[]>([]);
    const [subscriptions, setSubscriptions] = useState<Channel[]>([]);
    const [history, setHistory] = useState<Video[]>([]);
    const [watchLater, setWatchLater] = useState<Video[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentVideo, setCurrentVideo] = useState<{ id: string; title: string; channel: string; channelId: string } | null>(null);
    const [videoStreams, setVideoStreams] = useState<any>(null);
    const [activeCategory, setActiveCategory] = useState('trending');
    const [activeSubcategory, setActiveSubcategory] = useState('all');

    // Estados para resumen AI
    const [summary, setSummary] = useState<any>(null);
    const [showSummary, setShowSummary] = useState(false);
    const [summaryLoading, setSummaryLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [isCurated, setIsCurated] = useState(false);

    // Toast auto-hide
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Detect production vs development for backend API
    const isProduction = typeof window !== 'undefined' &&
        !window.location.hostname.includes('localhost') &&
        !window.location.hostname.includes('127.0.0.1');
    const BACKEND_API = isProduction ? 'https://api.websopen.com' : 'http://localhost:8080';

    // Función para iniciar resumen
    const startSummary = async (mode: 'simple' | 'deepgram') => {
        if (!currentVideo) return;

        setSummaryLoading(mode);
        setSummary(null);

        try {
            // Iniciar procesamiento
            const res = await fetch(`${BACKEND_API}/api/youtube/summarize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_id: currentVideo.id,
                    video_title: currentVideo.title,
                    transcription_mode: mode,
                    ai_provider: 'deepseek'
                })
            });

            const data = await res.json();

            if (data.success && data.summary) {
                // Resumen cacheado disponible inmediatamente
                setSummary(parseSummary(data.summary));
                // Si es modo simple, no abrir modal automáticamente si no se quiere (pero aquí user clickeó)
                if (mode === 'deepgram') setShowSummary(true);
                else setSummaryLoading(null); // Para simple mostramos en el panel
            } else if (data.status === 'processing') {
                // Polling para esperar resultado
                pollForSummary(currentVideo.id);
                return; // IMPORTANTE: Retornar para no limpiar el loading
            } else {
                alert('Error: ' + (data.error || 'No se pudo iniciar el resumen'));
                setSummaryLoading(null);
            }
        } catch (e) {
            console.error('Error starting summary:', e);
            alert('Error de conexión con el backend');
            setSummaryLoading(null);
        }
    };

    // Función para sanitizar y parsear el summary
    const parseSummary = (rawSummary: any) => {
        if (!rawSummary) return rawSummary;

        const summary = { ...rawSummary };

        // Si ya tiene sections válidas, usarlas directamente
        if (summary.sections && Array.isArray(summary.sections) && summary.sections.length > 0) {
            console.log('✅ Summary has valid sections:', summary.sections.length);
            return summary;
        }

        // Si ya tiene keyPoints válidos, usarlos directamente
        if (summary.keyPoints && Array.isArray(summary.keyPoints) && summary.keyPoints.length > 0) {
            console.log('✅ Summary has valid keyPoints:', summary.keyPoints.length);
            return summary;
        }

        // Solo intentar parsear overview si parece contener JSON y no hay datos estructurados
        if (typeof summary.overview === 'string' && summary.overview.includes('"')) {
            // Intentar extraer keyPoints del texto con regex simple
            const pointsMatch = summary.overview.match(/"([^"]{10,200})"/g);
            if (pointsMatch && pointsMatch.length > 2) {
                const extractedPoints = pointsMatch
                    .map(s => s.replace(/"/g, '').trim())
                    .filter(s => s.length > 10 && !s.includes(':'));

                if (extractedPoints.length > 0) {
                    console.log('✅ Extracted points from overview:', extractedPoints.length);
                    return {
                        ...summary,
                        overview: '',
                        keyPoints: extractedPoints.slice(0, 10)
                    };
                }
            }
        }

        return summary;
    };

    // Polling para esperar resumen
    const pollForSummary = async (videoId: string, attempts = 0, silent = false) => {
        // Debug visual para Telegram
        if (attempts === 0) {
            setToast(`🔄 Polling iniciado...`);
        }

        if (attempts > 60) {  // 5 minutos máximo
            setSummaryLoading(null);
            if (!silent) alert('El resumen está tardando demasiado. Intenta más tarde.');
            return;
        }

        try {
            const pollUrl = `${BACKEND_API}/api/youtube/poll/${videoId}`;
            const res = await fetch(pollUrl);

            if (!res.ok) {
                setToast(`❌ Error HTTP: ${res.status}`);
                setTimeout(() => pollForSummary(videoId, attempts + 1, silent), 5000);
                return;
            }

            const data = await res.json();

            if (data.status === 'completed' && data.summary) {
                setToast(`✅ Resumen listo!`);
                setSummary(parseSummary(data.summary));
                setShowSummary(true);
                setSummaryLoading(null);
            } else if (data.status === 'processing') {
                // Mostrar progreso cada 3 intentos
                if (attempts % 3 === 0) {
                    setToast(`⏳ Procesando... (${attempts * 5}s)`);
                }
                setTimeout(() => pollForSummary(videoId, attempts + 1, silent), 5000);
            } else if (data.status === 'error') {
                setSummaryLoading(null);
                if (!silent) {
                    alert('Error: ' + data.error);
                }
            } else {
                setToast(`❓ Status: ${data.status}`);
                setTimeout(() => pollForSummary(videoId, attempts + 1, silent), 5000);
            }
        } catch (e: any) {
            setToast(`❌ Error: ${e.message || 'Red'}`);
            setTimeout(() => pollForSummary(videoId, attempts + 1, silent), 5000);
        }
    };

    useEffect(() => {
        const savedSubs = localStorage.getItem('piped_subscriptions');
        const savedHistory = localStorage.getItem('piped_history');
        const savedWatchLater = localStorage.getItem('piped_watch_later');
        if (savedSubs) setSubscriptions(JSON.parse(savedSubs));
        if (savedHistory) setHistory(JSON.parse(savedHistory));
        if (savedWatchLater) setWatchLater(JSON.parse(savedWatchLater));
        loadTrending('trending');
    }, []);

    useEffect(() => {
        localStorage.setItem('piped_subscriptions', JSON.stringify(subscriptions));
    }, [subscriptions]);

    useEffect(() => {
        localStorage.setItem('piped_history', JSON.stringify(history));
    }, [history]);

    useEffect(() => {
        localStorage.setItem('piped_watch_later', JSON.stringify(watchLater));
    }, [watchLater]);

    // Función para agregar/quitar de Ver más tarde
    const toggleWatchLater = (video: Video) => {
        const videoId = video.url.split('=').pop() || video.url;
        const isInList = watchLater.some(v => (v.url.split('=').pop() || v.url) === videoId);
        if (isInList) {
            setWatchLater(prev => prev.filter(v => (v.url.split('=').pop() || v.url) !== videoId));
        } else {
            setWatchLater(prev => [video, ...prev]);
        }
    };

    // Verificar si el video actual está en Ver más tarde
    const isInWatchLater = (videoId: string) => {
        return watchLater.some(v => (v.url.split('=').pop() || v.url) === videoId);
    };

    const loadTrending = async (category: string) => {
        setLoading(true);
        setActiveCategory(category);
        try {
            let url = `${PIPED_API}/trending?region=AR`;

            // Si es una categoría específica, usar búsqueda
            if (category !== 'trending') {
                const categoryKeywords: Record<string, string> = {
                    music: 'música argentina',
                    gaming: 'gaming español',
                    news: 'noticias argentina hoy',
                    movies: 'películas completas español',
                    sports: 'deportes argentina',
                    learning: 'educación cursos',
                    science: 'ciencia tecnología',
                    autos: 'autos coches',
                    style: 'moda belleza',
                    food: 'cocina recetas'
                };
                const keyword = categoryKeywords[category] || category;
                url = `${PIPED_API}/search?q=${encodeURIComponent(keyword)}&filter=videos`;
            }

            const res = await fetch(url);
            const data = await res.json();

            // La respuesta de search tiene formato diferente al de trending
            if (category !== 'trending' && data.items) {
                setTrendingVideos(data.items.filter((v: any) => v.type === 'stream' && !v.isShort).slice(0, 24));
            } else {
                setTrendingVideos(data.filter((v: any) => !v.isShort).slice(0, 24));
            }
        } catch (e) {
            console.error('Error loading category:', e);
        }
        setLoading(false);
    };

    const searchVideos = async () => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        setView('search');
        setMenuOpen(false);

        try {
            const res = await fetch(`${PIPED_API}/search?q=${encodeURIComponent(searchQuery)}&filter=videos`);
            const data = await res.json();
            setSearchResults(data.items?.filter((v: any) => v.type === 'stream' && !v.isShort) || []);
        } catch (e) {
            console.error('Search error:', e);
        }
        setLoading(false);
    };

    const extractVideoId = (url: string) => url.match(/\/watch\?v=([^&]+)/)?.[1] || url.replace('/watch?v=', '');
    const extractChannelId = (url: string) => url.replace('/channel/', '');

    const playVideo = async (video: Video) => {
        const videoId = extractVideoId(video.url);

        // Limpiar resumen anterior
        setSummary(null);
        setShowSummary(false);

        // Primero cambiar a player view
        setCurrentVideo({
            id: videoId,
            title: video.title,
            channel: video.uploaderName,
            channelId: extractChannelId(video.uploaderUrl)
        });
        setView('player');
        setMenuOpen(false);

        // Actualizar historial después de un pequeño delay para evitar re-render del player
        setTimeout(() => {
            setHistory(prev => {
                const filtered = prev.filter(v => extractVideoId(v.url) !== videoId);
                return [video, ...filtered].slice(0, 50);
            });
        }, 100);

        // Cargar streams en background
        setTimeout(async () => {
            try {
                const res = await fetch(`${PIPED_API}/streams/${videoId}`);
                const data = await res.json();
                setVideoStreams(data);
            } catch (e) {
                console.error('Error loading streams:', e);
            }
        }, 500);

        // Iniciar resumen rápido automáticamente (solo si NO es video en vivo)
        // Los títulos de streams en vivo suelen incluir "EN VIVO", "LIVE", "DIRECTO"
        const isLiveVideo = /en vivo|live|directo|24\/7|stream/i.test(video.title);
        console.log('🎬 Video cargado:', video.title, '| isLive:', isLiveVideo);
        if (!isLiveVideo) {
            console.log('📝 Iniciando resumen automático en 1s...');
            setTimeout(() => {
                startAutoSummary(videoId, video.title);
            }, 1000);
        } else {
            console.log('🔴 Video en vivo detectado - no se genera resumen');
        }
    };

    // Detectar si el video actual es en vivo
    const isCurrentVideoLive = currentVideo && /en vivo|live|directo|24\/7|stream/i.test(currentVideo.title);

    // Resumen automático separado para evitar problemas de estado
    const startAutoSummary = async (videoId: string, videoTitle: string) => {
        console.log('🚀 startAutoSummary llamado para:', videoId);
        setSummaryLoading('simple');

        try {
            const res = await fetch(`${BACKEND_API}/api/youtube/summarize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_id: videoId,
                    video_title: videoTitle,
                    transcription_mode: 'simple',
                    ai_provider: 'deepseek'
                })
            });

            if (!res.ok) {
                console.log('Backend no disponible para resumen');
                setSummaryLoading(null);
                return;
            }

            const data = await res.json();

            if (data.success && data.summary) {
                setSummary(data.summary);
            } else if (data.status === 'processing') {
                pollForSummary(videoId, 0, true); // true = silent mode
                return; // No limpiar summaryLoading aún
            }
        } catch (e) {
            console.log('Backend no disponible:', e);
        }
        setSummaryLoading(null);
    };

    const toggleSubscription = (channel: { id: string; name: string; avatar: string }) => {
        setSubscriptions(prev => {
            const exists = prev.find(c => c.id === channel.id);
            if (exists) return prev.filter(c => c.id !== channel.id);
            return [...prev, { ...channel, subscribedAt: new Date().toISOString() }];
        });
    };

    const isSubscribed = (channelId: string) => subscriptions.some(c => c.id === channelId);

    const formatDuration = (seconds: number) => {
        if (seconds < 0) return 'LIVE';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const formatViews = (views: number | undefined | null) => {
        if (views === undefined || views === null || views < 0) return '';
        if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
        if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
        return views.toString();
    };

    const navigateTo = (newView: 'home' | 'subscriptions' | 'history') => {
        setView(newView);
        setMenuOpen(false);
    };

    // ========== COMPONENTS ==========

    const VideoCard = ({ video, compact = false, ...props }: { video: Video; compact?: boolean } & React.HTMLAttributes<HTMLDivElement>) => (
        <div
            {...props}
            onClick={() => playVideo(video)}
            className={`bg-[var(--tg-theme-secondary-bg-color)] rounded-xl overflow-hidden cursor-pointer hover:bg-gray-800/50 transition-all active:scale-[0.98] ${compact ? 'flex gap-3' : ''}`}
        >
            <div className={`relative ${compact ? 'w-40 shrink-0' : ''}`}>
                <img src={video.thumbnail} alt={video.title} className="w-full aspect-video object-cover" loading="lazy" />
                <span className={`absolute bottom-1 right-1 text-white text-xs px-1.5 py-0.5 rounded font-mono ${video.duration < 0 ? 'bg-red-600' : 'bg-black/80'}`}>
                    {formatDuration(video.duration)}
                </span>
            </div>
            <div className={`${compact ? 'flex-1 py-1' : 'p-3'}`}>
                <h3 className={`text-white font-medium line-clamp-2 ${compact ? 'text-sm' : 'text-sm mb-1'}`}>{video.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                    {!compact && video.uploaderAvatar && (
                        <img src={video.uploaderAvatar} className="w-6 h-6 rounded-full" alt="" />
                    )}
                    <div>
                        <p className="text-gray-400 text-xs flex items-center gap-1">
                            {video.uploaderName}
                            {video.uploaderVerified && <span className="text-blue-500">✓</span>}
                        </p>
                        <p className="text-gray-500 text-xs">
                            {formatViews(video.views)} vistas
                            {video.uploadedDate && ` • ${video.uploadedDate}`}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    // ========== SIDEBAR MENU ==========
    const SideMenu = () => (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setMenuOpen(false)}
            />

            {/* Sidebar */}
            <div className={`fixed left-0 top-0 h-full w-72 bg-gray-900 z-50 transform transition-transform duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                            <Play size={18} fill="white" className="text-white ml-0.5" />
                        </div>
                        <span className="text-white font-bold text-lg">YouTube</span>
                    </div>
                    <button onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white p-1">
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <div className="p-2 border-b border-gray-800">
                    <button
                        onClick={() => navigateTo('home')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'home' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}
                    >
                        <Home size={20} /> Inicio
                    </button>
                    <button
                        onClick={() => navigateTo('subscriptions')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'subscriptions' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}
                    >
                        <Bell size={20} /> Suscripciones
                        {subscriptions.length > 0 && (
                            <span className="ml-auto bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">{subscriptions.length}</span>
                        )}
                    </button>
                    <button
                        onClick={() => navigateTo('history')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'history' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}
                    >
                        <Clock size={20} /> Historial
                        {history.length > 0 && (
                            <span className="ml-auto text-gray-500 text-xs">{history.length}</span>
                        )}
                    </button>
                </div>

                {/* Categories */}
                <div className="p-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                    <p className="text-gray-500 text-xs uppercase px-4 py-2 font-semibold">Categorías</p>
                    {CATEGORIES.map(cat => {
                        const Icon = cat.icon;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => { loadTrending(cat.id); setMenuOpen(false); setView('home'); }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${activeCategory === cat.id ? 'bg-red-600/20 text-red-500' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}
                            >
                                <Icon size={18} /> {cat.name}
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );

    // ========== RENDER VIEWS ==========

    const renderHome = () => (
        <div className="min-h-screen">
            {/* Sticky Header with Search and Hamburger */}
            <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-gray-800 shadow-sm">
                <div className="p-4 pb-2">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMenuOpen(true)}
                            className="p-2 text-white hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && searchVideos()}
                                placeholder="Buscar videos..."
                                className="w-full bg-gray-800 text-white rounded-full py-2.5 px-4 pr-10 outline-none focus:ring-2 focus:ring-red-600 border border-gray-700 text-sm transition-all"
                            />
                            <button onClick={searchVideos} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-red-600 rounded-full text-white hover:bg-red-500 transition-colors">
                                <Search size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sticky Subcategory Pills */}
                <div className="flex gap-2 overflow-x-auto pb-3 px-4 hide-scrollbar">
                    {SUBCATEGORIES.map(sub => {
                        const SubIcon = sub.icon;
                        return (
                            <button
                                key={sub.id}
                                onClick={() => setActiveSubcategory(sub.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${activeSubcategory === sub.id
                                    ? 'bg-white text-black border-white'
                                    : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                {SubIcon && <SubIcon size={12} className={sub.id === 'live' ? 'text-red-500' : ''} />}
                                {sub.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Active Category Title */}
                <div className="flex items-center gap-2">
                    {(() => {
                        const cat = CATEGORIES.find(c => c.id === activeCategory);
                        const Icon = cat?.icon || TrendingUp;
                        return (
                            <>
                                <Icon size={20} className="text-red-500" />
                                <h2 className="text-white font-semibold">{cat?.name || 'Tendencias'}</h2>
                            </>
                        );
                    })()}
                </div>

                {/* Quick Subscriptions */}
                {subscriptions.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {subscriptions.slice(0, 10).map(ch => (
                            <div key={ch.id} className="flex flex-col items-center min-w-[56px]">
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-500 to-pink-600 p-0.5">
                                    {ch.avatar ? (
                                        <img src={ch.avatar} className="w-full h-full rounded-full object-cover" alt={ch.name} />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-sm">
                                            {ch.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <span className="text-gray-400 text-[9px] mt-1 text-center line-clamp-1 w-14">{ch.name}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Videos Grid */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-red-500" size={32} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {trendingVideos
                            .filter(video => {
                                if (activeSubcategory === 'all') return true;
                                if (activeSubcategory === 'live') return video.duration < 0; // Live videos have negative duration
                                if (activeSubcategory === 'shorts') return video.isShort;
                                if (activeSubcategory === 'videos') return !video.isShort && video.duration >= 0;
                                return true;
                            })
                            .map((video, i) => (
                                <VideoCard key={i} video={video} />
                            ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderSearch = () => (
        <div className="min-h-screen pb-[100px]">
            <div className="sticky top-0 z-30 bg-[var(--tg-theme-bg-color)] backdrop-blur-md p-4 flex items-center gap-3 shadow-sm">
                <button onClick={() => setView('home')} className="text-[var(--tg-theme-text-color)] p-2 hover:bg-gray-800/50 rounded-full transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchVideos()}
                        placeholder="Buscar..."
                        className="w-full bg-gray-800 text-white rounded-full py-2 px-4 pr-10 outline-none border border-gray-700 focus:border-red-600 transition-colors"
                        autoFocus
                    />
                    <button onClick={searchVideos} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-white">
                        <Search size={18} />
                    </button>
                </div>
            </div>

            <div className="p-4">

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-red-500" size={32} />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {searchResults.map((video, i) => (
                            <VideoCard key={i} video={video} compact />
                        ))}
                        {searchResults.length === 0 && !loading && (
                            <div className="text-center py-12 text-gray-500">
                                <Search size={48} className="mx-auto mb-4 opacity-30" />
                                <p>Busca videos de YouTube</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    const [subscriptionVideos, setSubscriptionVideos] = useState<Video[]>([]);
    const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);

    // Cargar videos de suscripciones
    const loadSubscriptionVideos = async () => {
        if (subscriptions.length === 0) return;
        setLoadingSubscriptions(true);

        try {
            const allVideos: Video[] = [];

            // Cargar videos de cada canal suscrito (máximo 3 por canal para velocidad)
            for (const channel of subscriptions.slice(0, 10)) {
                try {
                    const res = await fetch(`${PIPED_API}/channel/${channel.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        const channelVideos = (data.relatedStreams || [])
                            .filter((v: any) => !v.isShort)
                            .slice(0, 3)
                            .map((v: any) => ({
                                ...v,
                                uploaderName: channel.name,
                                uploaderUrl: `/channel/${channel.id}`,
                                uploaderAvatar: channel.avatar
                            }));
                        allVideos.push(...channelVideos);
                    }
                } catch (e) {
                    console.error(`Error loading channel ${channel.name}:`, e);
                }
            }

            // Ordenar por fecha (más recientes primero)
            allVideos.sort((a, b) => (b.uploaded || 0) - (a.uploaded || 0));
            setSubscriptionVideos(allVideos.slice(0, 30));
        } catch (e) {
            console.error('Error loading subscription videos:', e);
        }
        setLoadingSubscriptions(false);
    };

    // Cargar videos cuando se abre la vista de suscripciones
    useEffect(() => {
        if (view === 'subscriptions' && subscriptions.length > 0) {
            loadSubscriptionVideos();
        }
    }, [view, subscriptions.length]);

    const renderSubscriptions = () => (
        <div className="min-h-screen pb-[100px]">
            <div className="sticky top-0 z-30 bg-[var(--tg-theme-bg-color)] backdrop-blur-md p-4 flex items-center gap-3 shadow-sm">
                <button onClick={() => setMenuOpen(true)} className="text-[var(--tg-theme-text-color)] p-2 hover:bg-gray-800/50 rounded-full transition-colors">
                    <Menu size={24} />
                </button>
                <h2 className="text-white font-semibold text-lg flex-1">Suscripciones</h2>
                {subscriptions.length > 0 && (
                    <button
                        onClick={loadSubscriptionVideos}
                        className="text-red-500 text-xs font-medium hover:bg-red-500/10 px-3 py-1.5 rounded-full transition-colors"
                    >
                        Actualizar
                    </button>
                )}
            </div>

            <div className="p-4">

                {subscriptions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Users size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No tienes suscripciones</p>
                        <p className="text-sm mt-2">Mira videos y suscríbete a canales</p>
                    </div>
                ) : (
                    <>
                        {/* Lista de canales suscritos */}
                        <div className="flex gap-3 overflow-x-auto pb-4 mb-4 border-b border-gray-800">
                            {subscriptions.map(ch => (
                                <div key={ch.id} className="flex flex-col items-center min-w-[70px]">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-pink-600 p-0.5 relative">
                                        {ch.avatar ? (
                                            <img src={ch.avatar} className="w-full h-full rounded-full object-cover" alt={ch.name} />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-white text-lg font-bold">
                                                {ch.name.charAt(0)}
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleSubscription(ch); }}
                                            className="absolute -top-1 -right-1 bg-gray-800 text-gray-400 rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 hover:text-white"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <span className="text-gray-400 text-[10px] mt-1 text-center line-clamp-1 w-16">{ch.name}</span>
                                </div>
                            ))}
                        </div>

                        {/* Videos de suscripciones */}
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Bell size={18} className="text-red-500" /> Videos recientes
                        </h3>

                        {loadingSubscriptions ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="animate-spin text-red-500" size={32} />
                            </div>
                        ) : subscriptionVideos.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {subscriptionVideos.map((video, i) => (
                                    <VideoCard key={i} video={video} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>No se pudieron cargar los videos</p>
                                <button
                                    onClick={loadSubscriptionVideos}
                                    className="mt-2 text-red-500 text-sm hover:underline"
                                >
                                    Reintentar
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );

    const renderHistory = () => (
        <div className="min-h-screen pb-[100px]">
            <div className="sticky top-0 z-30 bg-[var(--tg-theme-bg-color)] backdrop-blur-md p-4 flex items-center gap-3 shadow-sm">
                <button onClick={() => setMenuOpen(true)} className="text-[var(--tg-theme-text-color)] p-2 hover:bg-gray-800/50 rounded-full transition-colors">
                    <Menu size={24} />
                </button>
                <h2 className="text-white font-semibold text-lg flex-1">Historial</h2>
                {history.length > 0 && (
                    <button onClick={() => { setHistory([]); localStorage.removeItem('piped_history'); }} className="text-red-500 text-xs font-medium hover:bg-red-500/10 px-3 py-1.5 rounded-full transition-colors">
                        Limpiar
                    </button>
                )}
            </div>

            <div className="p-4">

                {history.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Clock size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No hay videos en tu historial</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((video, i) => (
                            <VideoCard key={i} video={video} compact />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderPlayer = () => {
        if (!currentVideo) return null;
        const channelId = currentVideo.channelId;

        return (
            <div className="flex flex-col min-h-screen bg-[var(--tg-theme-bg-color)]">
                {/* Toast de notificación */}
                {toast && (
                    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-full shadow-lg text-sm animate-pulse">
                        {toast}
                    </div>
                )}
                {/* Botón de volver discreto en la esquina */}
                <button
                    onClick={() => { setView('home'); setCurrentVideo(null); setVideoStreams(null); setIsCurated(false); }}
                    className="fixed top-2 left-2 z-20 p-2 bg-black/60 backdrop-blur rounded-full text-white/70 hover:text-white hover:bg-black/80 transition-all"
                >
                    <ChevronLeft size={20} />
                </button>

                {/* Video Player memoizado */}
                <VideoPlayer videoId={currentVideo.id} />

                <div className="p-4 border-b border-gray-800">
                    <h2 className="text-white font-semibold text-lg leading-tight">{currentVideo.title}</h2>
                    {videoStreams && (
                        <p className="text-gray-400 text-sm mt-2">
                            {formatViews(videoStreams.views)} vistas • {videoStreams.uploadDate}
                        </p>
                    )}

                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-800">
                        {/* Avatar del canal */}
                        {videoStreams?.uploaderAvatar && (
                            <img src={videoStreams.uploaderAvatar} className="w-10 h-10 rounded-full shrink-0" alt="" />
                        )}
                        {/* Info del canal */}
                        <div className="flex-1 min-w-0">
                            <span className="text-white font-medium text-sm line-clamp-1">{currentVideo.channel}</span>
                            {videoStreams?.uploaderSubscriberCount && (
                                <p className="text-gray-500 text-xs">{formatViews(videoStreams.uploaderSubscriberCount)} subs</p>
                            )}
                        </div>
                        {/* Botones en fila: Suscribirse + Ver más tarde + Resumen */}
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => toggleSubscription({
                                    id: channelId,
                                    name: currentVideo.channel,
                                    avatar: videoStreams?.uploaderAvatar || ''
                                })}
                                className={`px-3 py-1.5 rounded-full font-medium text-xs ${isSubscribed(channelId) ? 'bg-gray-700 text-white' : 'bg-red-600 text-white hover:bg-red-500'}`}
                            >
                                {isSubscribed(channelId) ? '✓' : 'Suscribirse'}
                            </button>
                            {/* Botón Ver más tarde */}
                            <button
                                onClick={() => {
                                    const videoForWL: Video = {
                                        url: `/watch?v=${currentVideo.id}`,
                                        title: currentVideo.title,
                                        thumbnail: `https://i.ytimg.com/vi/${currentVideo.id}/mqdefault.jpg`,
                                        uploaderName: currentVideo.channel,
                                        uploaderUrl: currentVideo.channelId,
                                        uploaderAvatar: videoStreams?.uploaderAvatar || '',
                                        uploadedDate: videoStreams?.uploadDate || '',
                                        duration: videoStreams?.duration || 0,
                                        views: videoStreams?.views || 0,
                                        uploaderVerified: false,
                                        isShort: false
                                    };
                                    toggleWatchLater(videoForWL);
                                }}
                                className={`p-2 rounded-full text-xs transition-all ${isInWatchLater(currentVideo.id) ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                                title={isInWatchLater(currentVideo.id) ? 'Quitar de Ver más tarde' : 'Ver más tarde'}
                            >
                                <Clock size={16} />
                            </button>
                            {/* Botones de resumen solo para videos NO en vivo */}
                            {!isCurrentVideoLive && (
                                <>
                                    <button
                                        onClick={() => summary ? setShowSummary(true) : startSummary('simple')}
                                        disabled={!!summaryLoading}
                                        className={`p-2 rounded-full text-xs ${summary ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'} hover:opacity-90 disabled:opacity-50`}
                                        title="Resumen Rápido"
                                    >
                                        {summaryLoading === 'simple' ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                                    </button>
                                    <button
                                        onClick={() => startSummary('deepgram')}
                                        disabled={!!summaryLoading}
                                        className="p-2 rounded-full bg-purple-600 text-white hover:opacity-90 disabled:opacity-50"
                                        title="Resumen Detallado"
                                    >
                                        {summaryLoading === 'deepgram' ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                    </button>
                                    {/* Botón Curar - solo si hay resumen */}
                                    {summary && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch(`${BACKEND_API}/api/curated/videos`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            video_id: currentVideo.id,
                                                            title: currentVideo.title,
                                                            summary: summary,
                                                            channel: currentVideo.channel,
                                                            rating: summary.rating || 0
                                                        })
                                                    });
                                                    if (res.ok) {
                                                        setIsCurated(true);
                                                        setToast('⭐ Video agregado a Curados');
                                                    } else if (res.status === 409) {
                                                        setToast('Ya está en Curados');
                                                    }
                                                } catch (e) {
                                                    console.error('Error al curar:', e);
                                                }
                                            }}
                                            disabled={isCurated}
                                            className={`p-2 rounded-full text-xs transition-all ${isCurated ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-yellow-400 hover:bg-yellow-500 hover:text-black'}`}
                                            title="Agregar a Curados"
                                        >
                                            {isCurated ? <Check size={16} /> : <Star size={16} />}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Indicador de video en vivo */}
                {isCurrentVideoLive && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-900/30 text-red-400 text-xs">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        Transmisión en Vivo - Resumen no disponible
                    </div>
                )}

                {/* Modal de Resumen */}
                {showSummary && summary && (
                    <div className="fixed inset-0 bg-black/90 z-50 overflow-auto">
                        <div className="min-h-screen p-4">
                            <div className="flex items-center justify-between mb-4 sticky top-0 bg-black/80 backdrop-blur py-2 -mx-4 px-4">
                                <h2 className="text-white font-bold text-lg">📝 Resumen AI</h2>
                                <button onClick={() => setShowSummary(false)} className="text-white p-2">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Secciones con timestamps - Formato principal */}
                            {summary.sections && summary.sections.length > 0 && (
                                <div className="space-y-4">
                                    {summary.sections.map((section: any, i: number) => (
                                        <div key={i} className="bg-gray-900/50 rounded-lg p-3 border-l-4 border-purple-500">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-blue-400 font-mono text-sm bg-blue-900/30 px-2 py-0.5 rounded">
                                                    {section.time}
                                                </span>
                                                <span className="text-xl">{section.emoji}</span>
                                                <span className="text-white font-semibold text-sm">{section.title}</span>
                                            </div>
                                            {section.bullets && section.bullets.length > 0 && (
                                                <ul className="space-y-1 ml-4">
                                                    {section.bullets.map((bullet: string, j: number) => (
                                                        <li key={j} className="text-gray-300 text-xs flex gap-2">
                                                            <span className="text-purple-400">•</span>
                                                            {bullet}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Fallback: Overview si no hay sections */}
                            {!summary.sections && summary.overview && (
                                <div className="mb-4">
                                    <h3 className="text-red-500 font-semibold mb-2">📌 Resumen</h3>
                                    <p className="text-gray-300 text-sm leading-relaxed">{summary.overview}</p>
                                </div>
                            )}

                            {/* Fallback: KeyPoints si no hay sections */}
                            {!summary.sections && summary.keyPoints && summary.keyPoints.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-red-500 font-semibold mb-2">💡 Puntos Clave</h3>
                                    <ul className="space-y-2">
                                        {summary.keyPoints.map((point: string, i: number) => (
                                            <li key={i} className="text-gray-300 text-sm flex gap-2">
                                                <span className="text-red-500">•</span>
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {summary.rating && (
                                <div className="mt-4 bg-gray-900/50 p-4 rounded-xl">
                                    <h3 className="text-red-500 font-semibold mb-2">⭐ Valoración: {summary.rating}/10</h3>
                                    {summary.ratingReason && (
                                        <p className="text-gray-400 text-sm">{summary.ratingReason}</p>
                                    )}
                                </div>
                            )}

                            {summary.cached && (
                                <p className="text-gray-600 text-xs text-center mt-4">
                                    📦 Resumen cacheado
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Resumen AI o Videos relacionados */}
                <div className="p-4 pb-20">
                    {/* Mostrar resumen si está disponible */}
                    {summary ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                                    <Sparkles size={16} className="text-purple-400" />
                                    Resumen AI
                                </h3>
                                {summary.cached && <span className="text-xs text-gray-600">📦 cacheado</span>}
                            </div>

                            {/* Secciones con timestamps - TODAS las secciones */}
                            {summary.sections && summary.sections.length > 0 ? (
                                <div className="space-y-2">
                                    {summary.sections.map((section: any, i: number) => {
                                        // Support both 'bullets' and 'points' field names
                                        const bulletPoints = section.bullets || section.points || [];
                                        return (
                                            <div key={i} className="bg-gray-900/40 rounded-lg p-3 border-l-2 border-purple-500">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-blue-400 font-mono text-xs bg-blue-900/30 px-2 py-0.5 rounded">
                                                        {section.time}
                                                    </span>
                                                    <span className="text-lg">{section.emoji}</span>
                                                    <span className="text-white text-sm font-medium">{section.title}</span>
                                                </div>
                                                {bulletPoints.length > 0 && (
                                                    <ul className="space-y-1 ml-4">
                                                        {bulletPoints.map((bullet: string, j: number) => (
                                                            <li key={j} className="text-gray-300 text-xs flex gap-2">
                                                                <span className="text-purple-400">•</span>
                                                                {bullet}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* Fallback: Overview y KeyPoints para formatos antiguos */
                                <>
                                    {summary.overview && (
                                        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 p-3 rounded-lg border border-purple-500/20">
                                            <p className="text-gray-200 text-sm leading-relaxed">{summary.overview}</p>
                                        </div>
                                    )}

                                    {summary.keyPoints && Array.isArray(summary.keyPoints) && summary.keyPoints.length > 0 && (
                                        <div className="bg-gray-900/40 p-3 rounded-lg">
                                            <h4 className="text-purple-400 font-medium text-xs mb-2 uppercase tracking-wide">Puntos Clave</h4>
                                            <ul className="space-y-1.5">
                                                {summary.keyPoints.map((point: string, i: number) => (
                                                    <li key={i} className="text-gray-300 text-xs flex gap-2 items-start">
                                                        <span className="text-purple-400 mt-0.5">→</span>
                                                        <span className="flex-1">{typeof point === 'string' ? point : JSON.stringify(point)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Rating */}
                            {summary.rating && (
                                <div className="bg-gray-900/50 p-3 rounded-lg">
                                    <span className="text-yellow-400 font-bold">⭐ Valoración: {summary.rating}/10</span>
                                    {summary.ratingReason && (
                                        <p className="text-gray-400 text-xs mt-1">{summary.ratingReason}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Placeholder o Loading State */
                        summaryLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 border-t border-gray-900 mt-4">
                                <Loader2 className="animate-spin text-purple-400 mb-3" size={32} />
                                <p className="text-gray-400 text-sm font-medium">
                                    {summaryLoading === 'deepgram' ? 'Procesando con IA...' : 'Generando resumen...'}
                                </p>
                                <p className="text-gray-600 text-xs mt-1">
                                    {summaryLoading === 'deepgram' ? 'Descargando audio y transcribiendo (1-2 min)' : 'Analizando subtítulos (20-30 seg)'}
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 border-t border-gray-900 mt-4 bg-gray-900/20 rounded-xl mx-4">
                                <Sparkles size={32} className="text-gray-700 mb-3" />
                                <p className="text-gray-400 text-sm mb-4 font-medium">Generar resumen con Inteligencia Artificial</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => startSummary('simple')}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-900/30 border border-blue-500/30 rounded-lg text-blue-400 text-xs hover:bg-blue-900/50 hover:text-blue-300 transition-all"
                                    >
                                        <Zap size={14} />
                                        Resumen Rápido
                                    </button>
                                    <button
                                        onClick={() => startSummary('deepgram')}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg text-purple-400 text-xs hover:bg-purple-900/50 hover:text-purple-300 transition-all"
                                    >
                                        <Sparkles size={14} />
                                        Resumen Detallado
                                    </button>
                                </div>
                                <p className="text-gray-600 text-[10px] mt-4 max-w-xs text-center">
                                    El resumen rápido usa subtítulos. El detallado escucha el audio del video (más preciso).
                                </p>
                            </div>
                        )
                    )
                    }
                </div >
            </div >
        );
    };

    // ========== MAIN RENDER ==========
    return (
        <div className="min-h-screen bg-black pb-20">
            <SideMenu />

            {view === 'home' && renderHome()}
            {view === 'search' && renderSearch()}
            {view === 'subscriptions' && renderSubscriptions()}
            {view === 'history' && renderHistory()}
            {view === 'player' && renderPlayer()}
        </div>
    );
};

export default YouTubeClientTab;
// Build timestamp: 1765048511
