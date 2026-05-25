import type { LifeSystemData, ChatConversation } from '../types';

const today = new Date();
const year = today.getFullYear();
// getMonth() is 0-indexed, so add 1
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');

// Create a date for 5 days from now
const futureDate = new Date();
futureDate.setDate(today.getDate() + 5);
const futureYear = futureDate.getFullYear();
const futureMonth = String(futureDate.getMonth() + 1).padStart(2, '0');
const futureDay = String(futureDate.getDate()).padStart(2, '0');


const MOCK_DATA: LifeSystemData = {
  notes: [
    { section: 'mente-aprendizaje', content: 'Leer capítulo 3 del libro "Atomic Habits".' },
    { section: 'mente-reflexion', content: 'Escribir en el diario sobre las metas de la semana.' },
    { section: 'cuerpo-ejercicio', content: 'Hacer 30 minutos de cardio.' },
    { section: 'cuerpo-nutricion', content: 'Planificar las comidas de la próxima semana.' },
    { section: 'espiritu-meditacion', content: 'Realizar una meditación guiada de 10 minutos.' },
    { section: 'relaciones-amigos', content: 'Llamar a Juan para ponernos al día.' },
    { section: 'recursos-trabajo', content: 'Preparar la presentación para la reunión del lunes.' },
    { section: 'entorno-hogar', content: 'Organizar el espacio de trabajo.' },
  ],
  calendar_events: [
    { event_date: `${year}-${month}-02`, title: 'Cita con el dentista', event_time: '15:30' },
    { event_date: `${year}-${month}-10`, title: 'Entrega de proyecto X' },
    { event_date: `${year}-${month}-${day}`, title: 'Reunión de equipo', event_time: '10:00', description: 'Revisión semanal' },
    { event_date: `${year}-${month}-${day}`, title: 'Ir al gimnasio', event_time: '18:00' },
    { event_date: `${futureYear}-${futureMonth}-${futureDay}`, title: 'Cena de aniversario', event_time: '20:00', description: 'Restaurante "El Buen Sabor"' },
  ],
  scores: {
    mente: 4,
    cuerpo: 3,
    espiritu: 5,
    relaciones: 4,
    recursos: 2,
    entorno: 3,
  },
  bot_id: 123456,
  personality_prompt: `Eres un asistente virtual llamado Kai. Tu propósito es ayudar al usuario a organizar su vida, reflexionar sobre su progreso y mantener un equilibrio saludable.

Tus características principales son:
- Eres proactivo y ofreces sugerencias.
- Eres empático y comprensivo.
- Te comunicas de forma clara y concisa.

Recuerdos a largo plazo:
- El usuario prefiere recordatorios por la mañana.
- El color favorito del usuario es el azul.
- El usuario está aprendiendo a tocar la guitarra.`,
};

export const MOCK_CONVERSATIONS: ChatConversation[] = [
  {
    id: 1,
    name: 'Mamá',
    avatar: '👩',
    messages: [
      { id: 1, text: 'Hola hijo, ¿cómo estás?', timestamp: '10:30', sender: 'other', status: 'read' },
      { id: 2, text: '¡Hola mamá! Todo bien por aquí, ¿y tú?', timestamp: '10:31', sender: 'me', status: 'read' },
      { id: 3, text: 'Todo bien también. No te olvides de comprar el pan al volver a casa.', timestamp: '10:32', sender: 'other', status: 'read' },
    ]
  },
  {
    id: 2,
    name: 'Grupo del Trabajo',
    avatar: '💼',
    messages: [
       { id: 1, text: 'Recordatorio: La reunión de mañana es a las 9 AM.', timestamp: 'Ayer', sender: 'other', status: 'read' },
       { id: 2, text: 'Entendido, ¡gracias!', timestamp: 'Ayer', sender: 'me', status: 'read' },
    ]
  },
  {
    id: 3,
    name: 'Laura',
    avatar: '👧',
    messages: [
        { id: 1, text: '¿Nos vemos el viernes al final?', timestamp: 'Ayer', sender: 'other', status: 'delivered' },
    ]
  }
];


export const fetchLifeSystemData = async (): Promise<LifeSystemData> => {
    try {
        const token = localStorage.getItem('clawbot_session');
        if (!token) {
            console.error('No session token found, returning mock data');
            return MOCK_DATA;
        }

        const response = await fetch(`${API_BASE_URL}/api/life_system/data`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch life system data, returning mock data');
            return MOCK_DATA;
        }

        const data = await response.json();
        if (data.status === 'success' && data.data) {
            return data.data;
        }
        
        return MOCK_DATA;
    } catch (error) {
        console.error('Error fetching life system data:', error);
        return MOCK_DATA;
    }
};

export const updatePersonalityPrompt = async (botId: number, prompt: string): Promise<any> => {
    try {
        const token = localStorage.getItem('clawbot_session');
        const userJson = localStorage.getItem('clawbot_user');
        let ownerId = 7616797355; // Default admin
        if (userJson) {
            ownerId = JSON.parse(userJson).id;
        }
        
        const response = await fetch(`${API_BASE_URL}/api/life_system/kv`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                owner_id: ownerId,
                category: 'system',
                key: 'personality_prompt',
                value: prompt
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update prompt');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error updating prompt:', error);
        return { status: 'error', message: 'Failed to update prompt' };
    }
};

export const fetchConversations = async (): Promise<ChatConversation[]> => {
    console.log("API SERVICE: Fetching MOCK conversations.");
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return Promise.resolve(MOCK_CONVERSATIONS);
};
// --- IMPORTED FROM INFOSTREAM ---
/**
 * API Service for InfoStream Argentina
 * Connects to the OMNIII backend to fetch real-time data
 */

// Detect production (Cloudflare Pages) vs development (localhost:3003)
const isProduction = typeof window !== 'undefined' &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1');

// In production use the Cloudflare tunnel, in dev use Vite proxy
const API_BASE_URL = isProduction ? 'https://api.websopen.com' : '';

export interface YouTubeVideo {
    id: string;
    title: string;
    url: string;
    summary: string;
    published: string | null;
    channel_id: string | null;
    thumbnailUrl?: string;
}

export interface Tweet {
    id: string;
    author_name: string;
    author_handle: string;
    avatar_url: string;
    content: string;
    likes: number;
    retweets: number;
    timestamp: string;
    is_verified: boolean;
    analysis?: string;
    source_url?: string;
}

export interface FarmingCard {
    id: string;
    name: string;
    telegram_group_id: string;
    enabled: boolean;
    sources: Array<{
        id: string;
        name: string;
        enabled: boolean;
    }>;
}

// ========== YouTube API ==========

export async function fetchYouTubeVideos(): Promise<YouTubeVideo[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/youtube/videos`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
            return data.data.map((video: any) => ({
                id: video.id,
                title: video.title,
                url: video.url,
                summary: video.summary,
                published: video.published,
                channel_id: video.channel_id,
                thumbnailUrl: `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`
            }));
        }
        return [];
    } catch (error) {
        console.error('Error fetching YouTube videos:', error);
        return [];
    }
}

export async function fetchYouTubeCards(): Promise<FarmingCard[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/youtube/cards`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
            return data.data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching YouTube cards:', error);
        return [];
    }
}

// ========== Twitter/X API ==========

export async function fetchTwitterCards(): Promise<FarmingCard[]> {
    try {
        // Fetch from twitter_cards.json via the admin API or public folder
        const response = await fetch('/twitter_cards.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching Twitter cards:', error);
        return [];
    }
}

export async function fetchTweets(): Promise<Tweet[]> {
    try {
        // Try to fetch from the x_scraper output directory via API
        const response = await fetch(`${API_BASE_URL}/api/twitter/tweets`);
        if (!response.ok) {
            // Fallback: return empty array if API not available
            console.warn('Twitter API not available, falling back to mock data');
            return [];
        }
        const data = await response.json();
        if (data.success) {
            return data.data.map((tweet: any) => ({
                id: tweet.id,
                author_name: tweet.author_name || tweet.authorName,
                author_handle: tweet.author_handle || tweet.authorHandle,
                avatar_url: tweet.avatar_url || tweet.avatarUrl || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png',
                content: tweet.content || tweet.text,
                likes: tweet.likes || tweet.like_count || 0,
                retweets: tweet.retweets || tweet.retweet_count || 0,
                timestamp: tweet.timestamp || tweet.created_at || 'Unknown',
                is_verified: tweet.is_verified || tweet.verified || false,
                analysis: tweet.analysis || null,
                source_url: tweet.source_url || tweet.url
            }));
        }
        return [];
    } catch (error) {
        console.error('Error fetching tweets:', error);
        return [];
    }
}

// ========== Finance API (placeholder) ==========

export interface FinanceData {
    dolar_blue_buy: number;
    dolar_blue_sell: number;
    dolar_oficial_buy: number;
    dolar_oficial_sell: number;
    dolar_mep?: number;
    dolar_ccl?: number;
    merval?: number;
    riesgo_pais?: number;
    updated_at: string;
}

export async function fetchFinanceData(): Promise<FinanceData | null> {
    try {
        // TODO: Connect to finance API when available
        // For now return null to use mock data
        return null;
    } catch (error) {
        console.error('Error fetching finance data:', error);
        return null;
    }
}

// ========== Farming Status ==========

export interface FarmingStatus {
    youtube: {
        active: boolean;
        last_scan: string | null;
        cards_count: number;
    };
    twitter: {
        active: boolean;
        last_scan: string | null;
        cards_count: number;
    };
}

export async function fetchFarmingStatus(): Promise<FarmingStatus> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/youtube/status`);
        const ytData = response.ok ? await response.json() : { status: 'error' };

        return {
            youtube: {
                active: ytData.status === 'ready',
                last_scan: null,
                cards_count: 0
            },
            twitter: {
                active: false, // TODO: Add Twitter status endpoint
                last_scan: null,
                cards_count: 0
            }
        };
    } catch (error) {
        console.error('Error fetching farming status:', error);
        return {
            youtube: { active: false, last_scan: null, cards_count: 0 },
            twitter: { active: false, last_scan: null, cards_count: 0 }
        };
    }
}

// ========== Curated Content API ==========

export interface CuratedVideo {
    video_id: string;
    title: string;
    summary: any;
    thumbnail: string;
    channel: string;
    curated_at: string;
    rating: number;
}

export interface CuratedTweet {
    tweet_id: string;
    author_name: string;
    author_handle: string;
    content: string;
    avatar_url: string;
    curated_at: string;
    analysis: string;
}

export async function fetchCuratedVideos(): Promise<CuratedVideo[]> {
    try {
        // Usar endpoint de top rated desde DB
        const response = await fetch(`${API_BASE_URL}/api/curated/top/videos?limit=10`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.success ? data.data : [];
    } catch (error) {
        console.error('Error fetching curated videos:', error);
        return [];
    }
}

export async function fetchCuratedTweets(): Promise<CuratedTweet[]> {
    try {
        // Usar endpoint de top rated desde DB
        const response = await fetch(`${API_BASE_URL}/api/curated/top/tweets?limit=10`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.success ? data.data : [];
    } catch (error) {
        console.error('Error fetching curated tweets:', error);
        return [];
    }
}

export async function addCuratedVideo(video: {
    video_id: string;
    title: string;
    summary?: any;
    channel?: string;
    rating?: number;
}): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/curated/videos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(video)
        });
        return response.ok;
    } catch (error) {
        console.error('Error adding curated video:', error);
        return false;
    }
}

export async function addCuratedTweet(tweet: {
    tweet_id: string;
    author_name: string;
    author_handle: string;
    content: string;
    avatar_url?: string;
    analysis?: string;
}): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/curated/tweets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tweet)
        });
        return response.ok;
    } catch (error) {
        console.error('Error adding curated tweet:', error);
        return false;
    }
}
