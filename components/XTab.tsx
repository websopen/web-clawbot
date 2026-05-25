import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Heart, Share, BadgeCheck, Sparkles, RefreshCw, AlertCircle, ExternalLink, Star } from 'lucide-react';
import { fetchCuratedTweets, CuratedTweet } from '../services/apiService';

const XTab: React.FC = () => {
  const [tweets, setTweets] = useState<CuratedTweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTweets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const curatedTweets = await fetchCuratedTweets();
      setTweets(curatedTweets);
    } catch (err) {
      console.error('Error loading curated tweets:', err);
      setError('Error al cargar tweets curados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTweets();
  }, [loadTweets]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color)] pb-[100px] pt-4">
      {/* Header */}
      <div className="px-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="text-blue-400" size={24} />
          <h1 className="text-white text-xl font-bold">Tweets Destacados</h1>
        </div>
        <button
          onClick={loadTweets}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-4 p-3 bg-red-900/20 border border-red-600/30 rounded-lg flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Tweets List */}
      <div className="px-4 space-y-4">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-900 rounded-xl p-4">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-gray-800 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-1/3" />
                  <div className="h-3 bg-gray-800 rounded w-full" />
                  <div className="h-3 bg-gray-800 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))
        ) : tweets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Sparkles size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">No hay tweets curados aún</p>
            <p className="text-sm text-center max-w-xs">
              Los tweets más relevantes aparecerán aquí cuando sean seleccionados
            </p>
          </div>
        ) : (
          tweets.map((tweet) => (
            <div
              key={tweet.tweet_id}
              className="bg-[var(--tg-theme-secondary-bg-color)] border border-gray-800 rounded-xl p-4 transition-colors"
            >
              {/* Header del tweet */}
              <div className="flex items-start gap-3 mb-3">
                <img
                  src={tweet.avatar_url || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png'}
                  alt={tweet.author_name}
                  className="w-12 h-12 rounded-full bg-gray-800"
                  onError={(e) => {
                    e.currentTarget.src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-white font-bold text-sm truncate">{tweet.author_name}</span>
                    <BadgeCheck size={14} className="text-blue-400 shrink-0" />
                  </div>
                  <span className="text-gray-500 text-sm">@{tweet.author_handle}</span>
                </div>
                {/* Logo X */}
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600 shrink-0" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>

              {/* Contenido del tweet */}
              <p className="text-white text-sm leading-relaxed mb-3 whitespace-pre-wrap">
                {tweet.content}
              </p>

              {/* Análisis AI */}
              {tweet.analysis && (
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-1 text-purple-400 text-xs mb-1">
                    <Sparkles size={12} />
                    <span className="font-medium">Análisis AI</span>
                  </div>
                  <p className="text-purple-200 text-xs">{tweet.analysis}</p>
                </div>
              )}

              {/* Footer - Acciones */}
              <div className="flex items-center justify-between text-gray-500 text-xs">
                <span className="text-gray-600">
                  Curado: {new Date(tweet.curated_at).toLocaleDateString('es-AR')}
                </span>
                <button
                  onClick={() => window.open(`https://twitter.com/${tweet.author_handle}`, '_blank')}
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink size={14} />
                  Ver perfil
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default XTab;