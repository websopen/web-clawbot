import React, { useState, useEffect, useRef } from 'react';
import { fetchConversations } from '../services/apiService';
import type { ChatConversation, ChatMessage } from '../types';

// --- Sub-components for WhatsApp UI ---

const BackArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

const ReadReceiptIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-500">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m.75 12.75 6 6 9-13.5" transform="translate(3)" />
    </svg>
);

interface ChatListItemProps {
    conversation: ChatConversation;
    onSelect: (id: number) => void;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ conversation, onSelect }) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return (
        <div onClick={() => onSelect(conversation.id)} className="flex items-center p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl mr-4">{conversation.avatar}</div>
            <div className="flex-1">
                <div className="flex justify-between">
                    <p className="font-semibold">{conversation.name}</p>
                    <p className="text-xs text-gray-500">{lastMessage?.timestamp}</p>
                </div>
                <p className="text-sm text-gray-600 truncate">{lastMessage?.text}</p>
            </div>
        </div>
    );
};


interface ChatDetailViewProps {
    conversation: ChatConversation;
    onBack: () => void;
    onSendMessage: (chatId: number, messageText: string) => void;
}

const ChatDetailView: React.FC<ChatDetailViewProps> = ({ conversation, onBack, onSendMessage }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [conversation.messages]);

    const handleSend = () => {
        if (newMessage.trim()) {
            onSendMessage(conversation.id, newMessage.trim());
            setNewMessage('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#E5DDD5] bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')]">
            {/* Header */}
            <header className="flex items-center p-2 bg-[#005E54] text-white shadow-md z-10">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-white/20"><BackArrowIcon/></button>
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xl mx-2">{conversation.avatar}</div>
                <h2 className="font-semibold text-lg">{conversation.name}</h2>
            </header>

            {/* Messages */}
            <main className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col gap-2">
                    {conversation.messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-md p-2.5 rounded-lg shadow ${msg.sender === 'me' ? 'bg-[#DCF8C6]' : 'bg-white'}`}>
                                <p className="text-sm break-words">{msg.text}</p>
                                <div className="flex items-center justify-end gap-1 mt-1">
                                    <p className="text-xs text-gray-500">{msg.timestamp}</p>
                                    {msg.sender === 'me' && msg.status === 'read' && <ReadReceiptIcon />}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                 <div ref={messagesEndRef} />
            </main>

            {/* Input */}
            <footer className="p-2 bg-transparent">
                 <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 p-3 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                    />
                    <button onClick={handleSend} className="w-12 h-12 flex items-center justify-center rounded-full bg-[#005E54] text-white disabled:opacity-50" disabled={!newMessage.trim()}>
                        <SendIcon />
                    </button>
                 </div>
            </footer>
        </div>
    );
};

// --- Main WhatsApp View Component ---

export const WhatsAppView: React.FC = () => {
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadConversations = async () => {
            const data = await fetchConversations();
            setConversations(data);
            setLoading(false);
        };
        loadConversations();
    }, []);

    const handleSendMessage = (chatId: number, messageText: string) => {
        const newMessage: ChatMessage = {
            id: Date.now(),
            text: messageText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: 'me',
            status: 'sent'
        };

        setConversations(prev =>
            prev.map(convo =>
                convo.id === chatId
                    ? { ...convo, messages: [...convo.messages, newMessage] }
                    : convo
            )
        );
    };

    if (loading) {
        return <div className="text-center p-10">Cargando chats...</div>;
    }

    const selectedConversation = conversations.find(c => c.id === selectedChatId);

    return (
        <div className="h-full bg-white rounded-xl overflow-hidden shadow-md">
            {selectedConversation ? (
                <ChatDetailView
                    conversation={selectedConversation}
                    onBack={() => setSelectedChatId(null)}
                    onSendMessage={handleSendMessage}
                />
            ) : (
                <div>
                    <header className="p-4 bg-[#005E54] text-white">
                        <h2 className="text-xl font-bold">Redes</h2>
                    </header>
                    <div>
                        {conversations.map(convo => (
                            <ChatListItem key={convo.id} conversation={convo} onSelect={setSelectedChatId} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};