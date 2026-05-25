import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { fetchLifeSystemData, updatePersonalityPrompt } from './services/apiService';
import type { View, InteriorSubView, ExteriorSubView, Note, CalendarEvent, LifeSystemData } from './types';
import { WhatsAppView } from './components/WhatsAppView';
import FinanceTab from './components/FinanceTab';
import YouTubeTab from './components/YouTubeTab';
import XTab from './components/XTab';
import YouTubeClientTab from './components/YouTubeClientTab';
// --- Icon Components ---
const InteriorIcon: React.FC<{ className?: string }> = ({ className }) => <span className={className}>🧘‍♂️</span>;
const ExteriorIcon: React.FC<{ className?: string }> = ({ className }) => <span className={className}>🌍</span>;
const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => <span className={className}>📅</span>;
const RedesIcon: React.FC<{ className?: string }> = ({ className }) => <span className={className}>💬</span>;
const SystemIcon: React.FC<{ className?: string }> = ({ className }) => <span className={className}>⚙️</span>;

const StarIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
    <svg className={`w-5 h-5 ${filled ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const InfoIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
);


const categoryIcons: Record<string, string> = {
    mente: '🧠', cuerpo: '💪', espiritu: '✨', relaciones: '👥', recursos: '💼', entorno: '🏡'
};


// --- Helper Components (Defined outside main App component to prevent re-renders) ---

interface BottomNavProps {
    activeView: View;
    onViewChange: (view: View) => void;
}
const BottomNav: React.FC<BottomNavProps> = ({ activeView, onViewChange }) => {
    const navItems: { view: View; icon: React.ReactNode; text: string }[] = [
        { view: 'interior', icon: <InteriorIcon className="text-2xl" />, text: 'Interior' },
        { view: 'exterior', icon: <ExteriorIcon className="text-2xl" />, text: 'Exterior' },
        { view: 'calendario', icon: <CalendarIcon className="text-2xl" />, text: 'Calendario' },
        { view: 'finanzas', icon: <span className="text-2xl">📈</span>, text: 'Finanzas' },
        { view: 'redes', icon: <RedesIcon className="text-2xl" />, text: 'Redes' },
        { view: 'youtube', icon: <span className="text-2xl">▶️</span>, text: 'Curados' },
        { view: 'youtube_client', icon: <span className="text-2xl">📺</span>, text: 'YouTube' },
        { view: 'x', icon: <span className="text-2xl">🐦</span>, text: 'X' },
        { view: 'sistema', icon: <SystemIcon className="text-2xl" />, text: 'Sistema' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 h-[70px] bg-[#E0F2FE] border-t border-gray-200 z-50 flex overflow-x-auto hide-scrollbar" style={{ paddingBottom: 'env(safe-area-inset-bottom)', WebkitOverflowScrolling: 'touch' }}>
            <nav className="flex items-center h-full w-max px-2">
                {navItems.map(({ view, icon, text }) => (
                    <button
                        key={view}
                        onClick={() => onViewChange(view)}
                        className={`flex flex-col items-center justify-center px-1 min-w-[64px] h-full flex-shrink-0 transition-colors duration-200 ${activeView === view ? 'text-[var(--tg-theme-button-color)]' : 'text-[var(--tg-theme-hint-color)]'}`}
                    >
                        {icon}
                        <span className="text-xs mt-1">{text}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
};

interface SubNavProps {
    items: { key: string; label: string }[];
    activeItem: string;
    onItemChange: (item: any) => void;
}
const SubNav: React.FC<SubNavProps> = ({ items, activeItem, onItemChange }) => {
    const navRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({});

    useEffect(() => {
        if (navRef.current) {
            const activeButton = navRef.current.querySelector(`button[data-key="${activeItem}"]`) as HTMLButtonElement;
            if (activeButton) {
                setIndicatorStyle({
                    width: `${activeButton.offsetWidth}px`,
                    transform: `translateX(${activeButton.offsetLeft}px)`,
                });
            }
        }
    }, [activeItem]);

    return (
        <nav ref={navRef} className="relative flex w-full gap-1 bg-[var(--tg-theme-bg-color)] rounded-xl p-1 shadow-lg">
            <div
                className="absolute top-1 bottom-1 left-0 rounded-lg bg-[var(--tg-theme-button-color)] transition-all duration-300 ease-in-out"
                style={indicatorStyle}
            />
            {items.map(({ key, label }) => (
                <button
                    key={key}
                    data-key={key}
                    onClick={() => onItemChange(key)}
                    className={`relative z-10 flex-1 text-center py-2 px-1 text-sm font-semibold rounded-lg transition-colors duration-300 whitespace-nowrap ${activeItem === key ? 'text-[var(--tg-theme-button-text-color)]' : 'text-[var(--tg-theme-hint-color)]'}`}
                >
                    {label}
                </button>
            ))}
        </nav>
    );
};

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <StarIcon key={i} filled={i < rating} />
        ))}
    </div>
);


const ContentCard: React.FC<{ title: string; icon: string; children: React.ReactNode; rating?: number; onShowGuide?: () => void; }> = ({ title, icon, children, rating, onShowGuide }) => (
    <div className="bg-[var(--tg-theme-bg-color)] rounded-xl p-4 shadow-md flex flex-col flex-grow">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <span>{icon}</span> {title}
            </h3>
            {typeof rating !== 'undefined' && (
                <div className="flex items-center gap-2">
                    <StarRating rating={rating} />
                    <button onClick={onShowGuide} className="text-[var(--tg-theme-hint-color)] hover:text-[var(--tg-theme-text-color)] transition-colors">
                        <InfoIcon />
                    </button>
                </div>
            )}
        </div>
        {children}
    </div>
);

const NoteItem: React.FC<{ note: Note }> = ({ note }) => (
    <div className="flex items-start gap-2 p-2 border-l-4 border-[var(--tg-theme-button-color)] bg-[var(--tg-theme-secondary-bg-color)] rounded-r-lg">
        <p className="text-sm break-words whitespace-pre-wrap">
            {note.content}
            <small className="block text-[var(--tg-theme-hint-color)] text-xs mt-1">({note.section})</small>
        </p>
    </div>
);

// --- View Components ---

const LifeSystemView: React.FC<{
    notes: Note[];
    category: InteriorSubView | ExteriorSubView;
    scores: LifeSystemData['scores'];
    onShowGuide: (category: InteriorSubView | ExteriorSubView) => void;
}> = ({ notes, category, scores, onShowGuide }) => {
    const notesForCategory = notes.filter(note => note.section.startsWith(category));
    const rating = scores[category];
    return (
        <ContentCard
            title={category.charAt(0).toUpperCase() + category.slice(1)}
            icon={categoryIcons[category]}
            rating={rating}
            onShowGuide={() => onShowGuide(category)}
        >
            <div className="flex flex-col gap-2 overflow-y-auto">
                {notesForCategory.length > 0 ? (
                    notesForCategory.map((note, index) => <NoteItem key={index} note={note} />)
                ) : (
                    <p className="text-[var(--tg-theme-hint-color)] p-2 text-sm">Aún no hay notas en esta sección.</p>
                )}
            </div>
        </ContentCard>
    );
};

const CalendarView: React.FC<{ events: CalendarEvent[] }> = ({ events }) => {
    const tg = useTelegram();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const changeMonth = (amount: number) => {
        tg?.HapticFeedback.impactOccurred('light');
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };

    const monthName = currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() + 6) % 7; // Monday is 0

    const eventDates = new Set(events.map(e => e.event_date));
    const todayStr = new Date().toISOString().split('T')[0];

    const calendarDays = Array.from({ length: firstDayOfMonth }, () => null).concat(
        Array.from({ length: daysInMonth }, (_, i) => i + 1)
    );

    const eventsForSelectedDay = events
        .filter(e => e.event_date === selectedDate)
        .sort((a, b) => (a.event_time || '23:59').localeCompare(b.event_time || '23:59'));

    const selectedDateObj = new Date(selectedDate + 'T12:00:00');
    const dayHeader = `Eventos del ${selectedDateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`;

    return (
        <div className="flex flex-col gap-2.5 h-full">
            <div className="bg-[var(--tg-theme-bg-color)] rounded-xl p-4 shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => changeMonth(-1)} className="text-2xl text-[var(--tg-theme-hint-color)]">‹</button>
                    <h3 className="text-lg font-semibold flex items-center gap-2"><CalendarIcon /> {monthName}</h3>
                    <button onClick={() => changeMonth(1)} className="text-2xl text-[var(--tg-theme-hint-color)]">›</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <div key={d} className="font-semibold text-[var(--tg-theme-hint-color)]">{d}</div>)}
                    {calendarDays.map((day, index) => {
                        if (!day) return <div key={`empty-${index}`} />;
                        const dayStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isToday = dayStr === todayStr;
                        const isSelected = dayStr === selectedDate;
                        const hasEvent = eventDates.has(dayStr);

                        return (
                            <div key={day} className="relative">
                                <button onClick={() => { setSelectedDate(dayStr); tg?.HapticFeedback.selectionChanged(); }} className={`w-full aspect-square rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]' : isToday ? 'bg-blue-200 text-blue-800' : 'hover:bg-gray-100'}`}>
                                    {day}
                                </button>
                                {hasEvent && <div className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[var(--tg-theme-button-text-color)]' : 'bg-[var(--tg-theme-button-color)]'}`} />}
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="bg-[var(--tg-theme-bg-color)] rounded-xl p-4 shadow-md flex-grow overflow-y-auto">
                <h3 className="font-semibold mb-3 flex items-center gap-2">📌 {dayHeader}</h3>
                {eventsForSelectedDay.length > 0 ? (
                    <div className="space-y-2">
                        {eventsForSelectedDay.map((event, i) => (
                            <div key={i} className="py-2 border-b border-gray-100 last:border-b-0">
                                <p className="font-medium text-sm">{event.title}</p>
                                <small className="text-[var(--tg-theme-hint-color)] text-xs">
                                    {event.event_time ? `A las ${event.event_time}` : 'Todo el día'}
                                    {event.description && ` - ${event.description}`}
                                </small>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-[var(--tg-theme-hint-color)] p-2 text-sm">No hay eventos programados para este día.</p>
                )}
            </div>
        </div>
    );
};

const SystemView: React.FC<{ prompt: string; botId: number | null }> = ({ prompt, botId }) => {
    const tg = useTelegram();
    const [currentPrompt, setCurrentPrompt] = useState(prompt);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setCurrentPrompt(prompt);
    }, [prompt]);

    const handleSave = async () => {
        if (!botId || isSaving) return;
        setIsSaving(true);
        tg?.MainButton.setText('GUARDANDO...').show().showProgress();
        try {
            await updatePersonalityPrompt(botId, currentPrompt);
            tg?.MainButton.hideProgress();
            tg?.showAlert('¡Personalidad actualizada! El asistente se reiniciará para aplicar los cambios.');
        } catch (error) {
            console.error('Error al guardar prompt:', error);
            tg?.MainButton.hideProgress();
            tg?.showAlert(`Error al guardar el prompt: ${(error as Error).message}`);
        } finally {
            tg?.MainButton.hide();
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-2.5 h-full">
            <ContentCard title="Personalidad y Memoria" icon="🧠">
                <div className="flex flex-col h-full">
                    <p className="text-[var(--tg-theme-hint-color)] text-sm mb-4">Este es el "Prompt de Personalidad" de tu asistente. Contiene sus instrucciones base, tus preferencias y sus recuerdos a largo plazo.</p>
                    <textarea
                        value={currentPrompt}
                        onChange={(e) => setCurrentPrompt(e.target.value)}
                        className="w-full flex-grow p-2.5 rounded-lg border border-gray-200 bg-[var(--tg-theme-secondary-bg-color)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--tg-theme-button-color)]"
                        placeholder="Cargando prompt..."
                        disabled={isSaving}
                    />
                    <button
                        onClick={handleSave}
                        disabled={isSaving || prompt === currentPrompt}
                        className="w-full mt-4 p-3 rounded-lg bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] font-bold disabled:opacity-50 transition-opacity"
                    >
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </ContentCard>
        </div>
    );
};

const guideData = {
    '🧠 Mente': [
        'Me siento abrumado, desenfocado y con pensamientos negativos recurrentes. No estoy aprendiendo nada nuevo.',
        'A veces logro concentrarme, pero la mayor parte del tiempo me siento estresado o mentalmente cansado.',
        'Tengo un equilibrio. Gestiono el estrés de forma aceptable y dedico algo de tiempo a aprender o reflexionar.',
        'Me siento mentalmente claro y enfocado la mayor parte del tiempo. Soy proactivo en mi aprendizaje y crecimiento.',
        'Mi mente está en calma, clara y creativa. Abrazo los desafíos, aprendo constantemente y tengo una mentalidad positiva.',
    ],
    '💪 Cuerpo': [
        'Llevo una vida sedentaria, mi dieta es pobre y no descanso lo suficiente. Me siento sin energía.',
        'Hago algo de ejercicio esporádicamente y a veces como bien, pero no es una rutina constante.',
        'Intento mantener una rutina de ejercicio semanal y una dieta equilibrada, aunque a veces fallo. Duermo lo justo.',
        'Soy constante con el ejercicio, mi alimentación es mayormente saludable y priorizo mi descanso. Me siento con energía.',
        'Mi cuerpo se siente fuerte, enérgico y saludable. Disfruto del movimiento, me nutro conscientemente y mi descanso es óptimo.',
    ],
    '✨ Espíritu': [
        'Me siento perdido, sin propósito y desconectado de mí mismo y de lo que me rodea.',
        'A veces tengo momentos de conexión o reflexión, pero son escasos y poco profundos.',
        'Dedico tiempo a actividades que me dan paz (meditar, pasear, etc.), aunque no siempre con la frecuencia que me gustaría.',
        'Tengo un sentido claro de mis valores y propósito. Practico la gratitud o la atención plena con regularidad.',
        'Vivo alineado con mi propósito, siento una profunda conexión conmigo mismo y el mundo, y experimento paz y gratitud a diario.',
    ],
    '👥 Relaciones': [
        'Me siento solo o mis relaciones son fuente de conflicto y estrés. No dedico tiempo a cultivar vínculos.',
        'Mis interacciones sociales son superficiales o poco frecuentes. Me cuesta conectar de verdad.',
        'Mantengo un círculo social estable, aunque podría mejorar la calidad y la profundidad de mis relaciones.',
        'Invierto tiempo y energía en cultivar relaciones sanas y de apoyo mutuo. Me siento conectado y valorado.',
        'Mis relaciones son una fuente de alegría, apoyo y crecimiento. Me comunico de forma abierta y empática.',
    ],
    '💼 Recursos': [
        'Siento un gran estrés financiero y/o laboral. No tengo control sobre mis recursos y me siento estancado.',
        'Llego justo a fin de mes y mi trabajo no me satisface, pero no hago nada para cambiarlo.',
        'Tengo una situación estable, pero sin un plan claro de crecimiento. Mis finanzas están controladas, pero no optimizadas.',
        'Estoy satisfecho con mi situación laboral/financiera y tengo un plan para seguir creciendo y mejorando.',
        'Mis recursos trabajan para mí. Me siento realizado en mi trabajo, tengo libertad financiera y un futuro próspero.',
    ],
    '🏡 Entorno': [
        'Mi espacio vital (hogar, trabajo) es caótico, desordenado y me resta energía.',
        'Mi entorno está funcional, pero no me inspira ni me siento del todo a gusto en él.',
        'Mantengo mi espacio ordenado y limpio la mayor parte del tiempo. Es un lugar funcional.',
        'Mi entorno está organizado, es agradable y me ayuda a ser productivo y a relajarme.',
        'Mi entorno es un santuario. Es un espacio que refleja quién soy, me inspira, me recarga de energía y me da paz.',
    ],
};

const categoryTitleMap: Record<string, string> = {
    mente: '🧠 Mente',
    cuerpo: '💪 Cuerpo',
    espiritu: '✨ Espíritu',
    relaciones: '👥 Relaciones',
    recursos: '💼 Recursos',
    entorno: '🏡 Entorno',
};

const ScoringGuideModal: React.FC<{ category: InteriorSubView | ExteriorSubView; onClose: () => void }> = ({ category, onClose }) => {
    const modalTitle = categoryTitleMap[category];
    const descriptions = guideData[modalTitle as keyof typeof guideData];

    if (!descriptions) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[var(--tg-theme-bg-color)] rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">Guía de Puntuación: {modalTitle}</h2>
                <p className="text-sm text-[var(--tg-theme-hint-color)] mb-6">Evalúa de 1 (muy descuidado) a 5 (floreciente) tu estado actual en esta área.</p>
                <div className="space-y-2">
                    {descriptions.map((desc, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <div className="flex items-center text-yellow-400 mt-0.5">
                                {[...Array(5)].map((_, i) => <StarIcon key={i} filled={i <= index} />)}
                            </div>
                            <p className="text-xs text-[var(--tg-theme-text-color)] flex-1">{desc}</p>
                        </div>
                    ))}
                </div>
                <button
                    onClick={onClose}
                    className="w-full mt-6 p-3 rounded-lg bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] font-bold"
                >
                    Entendido
                </button>
            </div>
        </div>
    );
};


// --- Main App Component ---

const App: React.FC = () => {
    const tg = useTelegram();
    const [data, setData] = useState<LifeSystemData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mainContentRef = useRef<HTMLDivElement>(null);

    const [activeView, setActiveView] = useState<View>('interior');
    const [activeInteriorSubView, setActiveInteriorSubView] = useState<InteriorSubView>('mente');
    const [activeExteriorSubView, setActiveExteriorSubView] = useState<ExteriorSubView>('relaciones');
    const [guideForCategory, setGuideForCategory] = useState<InteriorSubView | ExteriorSubView | null>(null);

    useEffect(() => {
        if (tg) {
            tg.ready();
            tg.expand();
            // Use a fixed color instead of theme variable for the background
            tg.setBackgroundColor('#F0F9FF');
            // Set header color to match the card color for consistency
            const headerColor = getComputedStyle(document.documentElement).getPropertyValue('--tg-theme-bg-color').trim();
            tg.setHeaderColor(headerColor);
        }

        const loadData = async () => {
            try {
                const fetchedData = await fetchLifeSystemData();
                setData(fetchedData);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [tg]);

    const handleViewChange = useCallback((view: View) => {
        tg?.HapticFeedback.impactOccurred('light');
        setActiveView(view);
        if (mainContentRef.current) {
            mainContentRef.current.scrollTop = 0;
        }
    }, [tg]);

    const handleInteriorSubViewChange = useCallback((subView: InteriorSubView) => {
        tg?.HapticFeedback.selectionChanged();
        setActiveInteriorSubView(subView);
    }, [tg]);

    const handleExteriorSubViewChange = useCallback((subView: ExteriorSubView) => {
        tg?.HapticFeedback.selectionChanged();
        setActiveExteriorSubView(subView);
    }, [tg]);

    const showGuide = useCallback((category: InteriorSubView | ExteriorSubView) => {
        tg?.HapticFeedback.impactOccurred('light');
        setGuideForCategory(category);
    }, [tg]);

    const renderContent = () => {
        if (loading) return <div className="text-center p-10">Cargando...</div>;
        if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
        if (!data) return <div className="text-center p-10">No se pudieron cargar los datos.</div>;

        switch (activeView) {
            case 'interior':
                return <LifeSystemView notes={data.notes} category={activeInteriorSubView} scores={data.scores} onShowGuide={showGuide} />;
            case 'exterior':
                return <LifeSystemView notes={data.notes} category={activeExteriorSubView} scores={data.scores} onShowGuide={showGuide} />;
            case 'calendario':
                return <CalendarView events={data.calendar_events} />;
            case 'redes':
                return <WhatsAppView />;
            case 'sistema':
                return <SystemView prompt={data.personality_prompt} botId={data.bot_id} />;
            case 'finanzas':
                return <FinanceTab />;
            case 'youtube':
                return <YouTubeTab />;
            case 'youtube_client':
                return <YouTubeClientTab />;
            case 'x':
                return <XTab />;
            default:
                return null;
        }
    };

    const isSubNavVisible = activeView === 'interior' || activeView === 'exterior';

    return (
        <div className="flex flex-col h-[100dvh] overflow-hidden font-sans">
            <main
                ref={mainContentRef}
                className={`flex-1 overflow-y-auto transition-all duration-200 ${['interior', 'exterior', 'calendario', 'sistema', 'redes'].includes(activeView) ? 'p-2.5' : 'p-0'}`}
                style={{ paddingBottom: isSubNavVisible ? '140px' : '80px' }}
            >
                {renderContent()}
            </main>

            {guideForCategory && <ScoringGuideModal category={guideForCategory} onClose={() => setGuideForCategory(null)} />}

            {isSubNavVisible && (
                <div className="fixed bottom-[70px] left-0 right-0 z-40 p-2.5" style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}>
                    {activeView === 'interior' && (
                        <SubNav
                            items={[
                                { key: 'mente', label: '🧠 Mente' },
                                { key: 'cuerpo', label: '💪 Cuerpo' },
                                { key: 'espiritu', label: '✨ Espíritu' },
                            ]}
                            activeItem={activeInteriorSubView}
                            onItemChange={handleInteriorSubViewChange}
                        />
                    )}
                    {activeView === 'exterior' && (
                        <SubNav
                            items={[
                                { key: 'relaciones', label: '👥 Relaciones' },
                                { key: 'recursos', label: '💼 Recursos' },
                                { key: 'entorno', label: '🏡 Entorno' },
                            ]}
                            activeItem={activeExteriorSubView}
                            onItemChange={handleExteriorSubViewChange}
                        />
                    )}
                </div>
            )}

            <BottomNav activeView={activeView} onViewChange={handleViewChange} />
        </div>
    );
};

export default App;