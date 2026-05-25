import React, { useState, useEffect, useCallback, memo } from 'react';
import { RefreshCw, AlertCircle, Star, Play, Sparkles, ChevronLeft, X } from 'lucide-react';
import { fetchCuratedVideos, CuratedVideo } from '../services/apiService';

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

const YouTubeTab: React.FC = () => {
  const [videos, setVideos] = useState<CuratedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<CuratedVideo | null>(null);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const curatedVideos = await fetchCuratedVideos();
      setVideos(curatedVideos);
    } catch (err) {
      console.error('Error loading curated videos:', err);
      setError('Error al cargar videos curados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const openVideo = (video: CuratedVideo) => {
    setSelectedVideo(video);
  };

  const closePlayer = () => {
    setSelectedVideo(null);
  };

  // ========== VISTA DEL REPRODUCTOR (PANTALLA COMPLETA) ==========
  const renderPlayer = () => {
    if (!selectedVideo) return null;
    const summary = selectedVideo.summary;

    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Botón de volver */}
        <button
          onClick={closePlayer}
          className="fixed top-3 left-3 z-50 p-2 bg-black/60 backdrop-blur rounded-full text-white/70 hover:text-white hover:bg-black/80 transition-all"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Video Player */}
        <VideoPlayer videoId={selectedVideo.video_id} />

        {/* Info del video */}
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-white font-semibold text-lg leading-tight">{selectedVideo.title}</h2>
          <div className="flex items-center gap-3 mt-2">
            {selectedVideo.channel && (
              <span className="text-gray-400 text-sm">{selectedVideo.channel}</span>
            )}
            {selectedVideo.rating > 0 && (
              <span className="bg-yellow-600/20 text-yellow-300 text-xs px-2 py-0.5 rounded-full">
                ⭐ {selectedVideo.rating}/10
              </span>
            )}
          </div>
        </div>

        {/* Panel de Resumen - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          {summary ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-purple-400" />
                <h3 className="text-white font-semibold text-sm">Resumen AI</h3>
              </div>

              {/* Secciones con timestamps */}
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
                <>
                  {/* Overview */}
                  {summary.overview && (
                    <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 p-3 rounded-lg border border-purple-500/20">
                      <p className="text-gray-200 text-sm leading-relaxed">{summary.overview}</p>
                    </div>
                  )}

                  {/* KeyPoints */}
                  {summary.keyPoints && summary.keyPoints.length > 0 && (
                    <div className="bg-gray-900/40 p-3 rounded-lg">
                      <h4 className="text-purple-400 font-medium text-xs mb-2 uppercase tracking-wide">Puntos Clave</h4>
                      <ul className="space-y-1.5">
                        {summary.keyPoints.map((point: string, i: number) => (
                          <li key={i} className="text-gray-300 text-xs flex gap-2 items-start">
                            <span className="text-purple-400 mt-0.5">→</span>
                            <span>{typeof point === 'string' ? point : JSON.stringify(point)}</span>
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
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Sparkles size={32} className="mb-3 opacity-30" />
              <p className="text-sm">Este video no tiene resumen guardado</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ========== VISTA PRINCIPAL - GRID DE VIDEOS ==========
  return (
    <>
      {/* Player a pantalla completa */}
      {selectedVideo && renderPlayer()}

      {/* Grid de videos */}
      <div className="min-h-screen bg-[var(--tg-theme-bg-color)] pb-[100px] pt-4">
        {/* Header */}
        <div className="px-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="text-yellow-500" size={20} />
            <h1 className="text-white text-lg font-bold">Videos Curados</h1>
            <span className="text-gray-500 text-xs">({videos.length})</span>
          </div>
          <button
            onClick={loadVideos}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-3 mb-4 p-2 bg-red-900/20 border border-red-600/30 rounded-lg flex items-center gap-2 text-red-500 text-xs">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Feed Grid - 2 videos por fila */}
        <div className="px-2">
          {loading ? (
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse bg-gray-900/50 rounded-xl overflow-hidden">
                  <div className="aspect-video bg-gray-800" />
                  <div className="p-2.5 space-y-1.5">
                    <div className="h-3 bg-gray-800 rounded w-full" />
                    <div className="h-2 bg-gray-800 rounded w-2/3" />
                    <div className="h-16 bg-gray-800/50 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Sparkles size={40} className="mb-4 opacity-30" />
              <p className="text-sm font-medium mb-1">No hay videos curados</p>
              <p className="text-xs text-center max-w-xs px-4">
                Los videos resumidos aparecerán aquí cuando sean seleccionados
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {videos.map((video) => (
                <div
                  key={video.video_id}
                  onClick={() => openVideo(video)}
                  className="bg-[var(--tg-theme-secondary-bg-color)] rounded-xl overflow-hidden border border-gray-800 cursor-pointer active:scale-[0.98] transition-transform"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video group">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                        <Play size={20} className="text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    {/* Rating badge */}
                    {video.rating > 0 && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Star size={10} className="fill-current" />
                        {video.rating}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2.5">
                    <h3 className="text-white font-semibold text-xs line-clamp-2 mb-0.5">{video.title}</h3>
                    {video.channel && (
                      <p className="text-gray-500 text-[10px] mb-1.5">{video.channel}</p>
                    )}

                    {/* RESUMEN COMPACTO - String o Estructura */}
                    {video.summary && (
                      <div className="bg-purple-900/20 border-l-2 border-purple-500 pl-2 py-1.5 space-y-1">
                        {/* Si summary es string, mostrarlo directamente */}
                        {typeof video.summary === 'string' ? (
                          <p className="text-gray-300 text-[10px] leading-relaxed line-clamp-4">
                            {video.summary}
                          </p>
                        ) : (
                          /* Si es objeto con estructura */
                          <>
                            {video.summary.sections && video.summary.sections.length > 0 ? (
                              video.summary.sections.slice(0, 2).map((section: any, i: number) => {
                                const bulletPoints = section.bullets || section.points || [];
                                return (
                                  <div key={i} className="space-y-0.5">
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs shrink-0">{section.emoji}</span>
                                      <span className="text-gray-200 text-[9px] font-medium">{section.title}</span>
                                    </div>
                                    {bulletPoints.length > 0 && (
                                      <div className="ml-4 space-y-0.5">
                                        {bulletPoints.slice(0, 2).map((bullet: string, j: number) => (
                                          <div key={j} className="flex items-start gap-1">
                                            <span className="text-purple-400 text-[8px] mt-0.5">•</span>
                                            <span className="text-gray-400 text-[8px] leading-tight line-clamp-2">{bullet}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : video.summary.keyPoints && video.summary.keyPoints.length > 0 ? (
                              video.summary.keyPoints.slice(0, 3).map((point: string, i: number) => (
                                <div key={i} className="flex items-start gap-1">
                                  <span className="text-purple-400 text-[9px]">→</span>
                                  <span className="text-gray-300 text-[9px] line-clamp-2">
                                    {typeof point === 'string' ? point : JSON.stringify(point)}
                                  </span>
                                </div>
                              ))
                            ) : video.summary.overview ? (
                              <p className="text-gray-300 text-[10px] leading-relaxed line-clamp-3">{video.summary.overview}</p>
                            ) : null}

                            {/* Rating */}
                            {video.summary.rating && (
                              <div className="pt-0.5 border-t border-purple-500/20 mt-1">
                                <span className="text-yellow-400 text-[9px]">⭐ {video.summary.rating}/10</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default YouTubeTab;