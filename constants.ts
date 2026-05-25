import { VideoSummary, Tweet, FinanceIndicator, ChartDataPoint, FinanceNews } from './types';

export const MOCK_VIDEOS: VideoSummary[] = [
  {
    id: '1',
    title: 'Can we prepare for the impact of melting glaciers? | BBC News',
    channel: 'BBC News',
    videoUrl: 'https://www.youtube.com/watch?v=bAAAmQcDWCA',
    thumbnailUrl: 'https://picsum.photos/400/225?random=1',
    timestamps: [
      {
        time: '00:00',
        seconds: 0,
        emoji: '🧊',
        title: 'Iniciativa del Glaciar Aret y su importancia',
        description: 'Dr. Brent Minshew explica que el proyecto busca mejorar los pronósticos del aumento del nivel del mar. La velocidad del flujo glaciar es clave.'
      },
      {
        time: '01:12',
        seconds: 72,
        emoji: '🗿',
        title: 'Estudio de sedimentos glaciares en Wisconsin',
        description: 'Los científicos estudian sedimentos en Wisconsin similares a los de la Antártida. El Lago Michigan fue tallado por un glaciar enorme.'
      },
      {
        time: '02:25',
        seconds: 145,
        emoji: '🔬',
        title: 'Experimentos con dispositivo de cizallamiento',
        description: 'Una máquina simula las condiciones del fondo de los glaciares, presionando un anillo de hielo contra sustrato real.'
      },
      {
        time: '04:10',
        seconds: 250,
        emoji: '⚙️',
        title: 'Configuración del experimento',
        description: 'Se usa una prensa hidráulica para alinear los dientes. El hielo se congela durante 3-4 días a -8°C antes de girar lentamente.'
      }
    ]
  },
  {
    id: '2',
    title: 'Review: iPhone 16 Pro Max en Español',
    channel: 'SupraPixel',
    videoUrl: 'https://youtube.com',
    thumbnailUrl: 'https://picsum.photos/400/225?random=2',
    timestamps: [
      {
        time: '00:45',
        seconds: 45,
        emoji: '📱',
        title: 'Diseño y Materiales',
        description: 'El nuevo botón de acción es útil, pero el titanio se siente igual que la generación anterior.'
      },
      {
        time: '05:20',
        seconds: 320,
        emoji: '📸',
        title: 'Cámaras y Zoom 5x',
        description: 'La mejora en condiciones de baja luz es notable. El zoom 5x ahora es estándar en ambos modelos Pro.'
      },
      {
        time: '12:10',
        seconds: 730,
        emoji: '🤖',
        title: 'Inteligencia Artificial',
        description: 'Siri es más rápida, pero muchas funciones de IA generativa aún no están disponibles en español latino.'
      }
    ]
  }
];

export const MOCK_TWEETS: Tweet[] = [
  {
    id: '1',
    authorName: 'Elon Musk',
    authorHandle: '@elonmusk',
    avatarUrl: 'https://picsum.photos/50/50?random=4',
    content: 'Big changes coming to X shortly. AI integration will be seamless.',
    likes: 154000,
    retweets: 23000,
    timestamp: '2h',
    isVerified: true,
    analysis: 'Este tweet es relevante porque anticipa cambios en la interfaz de usuario que podrían afectar la visibilidad de cuentas verificadas. Se muestra para monitorear tendencias en la plataforma.'
  },
  {
    id: '2',
    authorName: 'Finanzas Argy',
    authorHandle: '@finanzas_arg',
    avatarUrl: 'https://picsum.photos/50/50?random=5',
    content: 'URGENTE: El Riesgo País perfora los 1000 puntos básicos. El mercado reacciona positivamente a los anuncios fiscales.',
    likes: 4500,
    retweets: 1200,
    timestamp: '45m',
    isVerified: false,
    analysis: 'Indicador clave de estabilidad macroeconómica. La bajada del riesgo país suele correlacionarse con un aumento en los bonos soberanos. Señal de compra potencial.'
  },
  {
    id: '3',
    authorName: 'Tech Daily',
    authorHandle: '@techdaily',
    avatarUrl: 'https://picsum.photos/50/50?random=6',
    content: 'Gemini 2.5 Flash is incredibly fast for reasoning tasks. The new update is live.',
    likes: 8900,
    retweets: 3000,
    timestamp: '5h',
    isVerified: true,
    analysis: 'Noticia tecnológica de alto impacto. Compara el rendimiento con modelos anteriores. Importante para desarrolladores y sector tech.'
  }
];

// Mapa de indicadores por país
export const MARKET_DATA: Record<string, FinanceIndicator[]> = {
  'AR': [
    { name: 'Dólar Blue', buy: 1120, sell: 1140, variation: 0.5, isUp: true },
    { name: 'Dólar Oficial', buy: 980, sell: 1020, variation: 0.1, isUp: true },
    { name: 'Dólar MEP', buy: 1090, sell: 1095, variation: -0.2, isUp: false },
    { name: 'Dólar Crypto', buy: 1135, sell: 1150, variation: 1.2, isUp: true },
  ],
  'US': [
    { name: 'S&P 500', buy: 5100, sell: 5105, variation: 0.8, isUp: true },
    { name: 'Nasdaq', buy: 16000, sell: 16050, variation: 1.2, isUp: true },
    { name: 'Dow Jones', buy: 39000, sell: 39100, variation: -0.1, isUp: false },
    { name: 'Gold', buy: 2150, sell: 2160, variation: 0.4, isUp: true },
  ],
  'BR': [
    { name: 'Bovespa', buy: 128000, sell: 128500, variation: -0.5, isUp: false },
    { name: 'USD/BRL', buy: 4.95, sell: 4.98, variation: 0.1, isUp: true },
    { name: 'Petrobras', buy: 36.5, sell: 36.8, variation: 1.5, isUp: true },
    { name: 'Vale', buy: 62.1, sell: 62.4, variation: -1.2, isUp: false },
  ],
  'GLOBAL': [
    { name: 'Bitcoin', buy: 72000, sell: 72100, variation: 2.5, isUp: true },
    { name: 'Ethereum', buy: 4000, sell: 4050, variation: 1.8, isUp: true },
    { name: 'EUR/USD', buy: 1.09, sell: 1.095, variation: 0.05, isUp: true },
    { name: 'Oil WTI', buy: 78.5, sell: 78.8, variation: -0.3, isUp: false },
  ]
};

// Mantener por compatibilidad temporal si es necesario, pero idealmente usar MARKET_DATA['AR']
export const FINANCE_INDICATORS = MARKET_DATA['AR'];

export const MERVAL_DATA: ChartDataPoint[] = [
  { time: '10:00', value: 1400000 },
  { time: '11:00', value: 1420000 },
  { time: '12:00', value: 1410000 },
  { time: '13:00', value: 1450000 },
  { time: '14:00', value: 1480000 },
  { time: '15:00', value: 1470000 },
];

export const FINANCE_NEWS: FinanceNews[] = [
  {
    id: '1',
    title: 'El superávit comercial alcanzó récord histórico en Enero',
    source: 'Infobae Económico',
    time: 'Hace 30m',
    url: '#'
  },
  {
    id: '2',
    title: 'YPF lidera la suba del Merval tras anuncios de inversión en Vaca Muerta',
    source: 'Cronista',
    time: 'Hace 2h',
    url: '#'
  },
  {
    id: '3',
    title: 'FMI aprueba la octava revisión del acuerdo',
    source: 'Ámbito Financiero',
    time: 'Hace 4h',
    url: '#'
  }
];