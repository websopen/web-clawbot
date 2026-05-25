export interface Note {
  section: string;
  content: string;
}

export interface CalendarEvent {
  event_date: string; // YYYY-MM-DD
  event_time?: string; // HH:MM
  title: string;
  description?: string;
}

export interface LifeSystemData {
  notes: Note[];
  calendar_events: CalendarEvent[];
  scores: {
    mente: number;
    cuerpo: number;
    espiritu: number;
    relaciones: number;
    recursos: number;
    entorno: number;
  };
  bot_id: number | null;
  personality_prompt: string;
}

export interface ChatMessage {
  id: number;
  text: string;
  timestamp: string;
  sender: 'me' | 'other';
  status: 'sent' | 'delivered' | 'read';
}

export interface ChatConversation {
  id: number;
  name: string;
  avatar: string;
  messages: ChatMessage[];
}


export type View = 'interior' | 'exterior' | 'calendario' | 'redes' | 'sistema' | 'finanzas' | 'youtube' | 'x' | 'youtube_client';
export type InteriorSubView = 'mente' | 'cuerpo' | 'espiritu';
export type ExteriorSubView = 'relaciones' | 'recursos' | 'entorno';
