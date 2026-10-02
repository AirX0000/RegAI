import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, X, Send, Bot, Sparkles, BookOpen } from 'lucide-react';
import api from '../lib/api';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: any[];
}

const SUGGESTIONS_BY_LANG: Record<string, string[]> = {
    en: [
        "What are the latest IFRS updates?",
        "Explain GDPR compliance requirements",
        "How to calculate tax for SaaS?",
        "Summarize recent ESG regulations"
    ],
    ru: [
        "Какие последние обновления в МСФО?",
        "Объясни требования соответствия GDPR",
        "Как рассчитать налог для SaaS?",
        "Сводка актуальных ESG нормативов"
    ]
};

const GREETINGS: Record<string, string> = {
    en: "Hello! I am your RegAI assistant. Ask me anything about regulations, taxes, or IFRS.",
    ru: "Здравствуйте! Я ваш ассистент RegAI. Задайте мне любой вопрос по нормативам, налогам или МСФО."
};

const UI_TEXT: Record<string, {
    title: string;
    subtitle: string;
    suggested: string;
    placeholder: string;
    sources: string;
    error: string;
    fallback: string;
}> = {
    en: {
        title: "RegAI Assistant",
        subtitle: "AI Powered",
        suggested: "Suggested Questions",
        placeholder: "Ask about regulations, taxes, IFRS...",
        sources: "Sources",
        error: "Sorry, an error occurred. Please try again.",
        fallback: "Response generated from RegAI compliance database."
    },
    ru: {
        title: "RegAI Ассистент",
        subtitle: "На базе ИИ",
        suggested: "Рекомендуемые вопросы",
        placeholder: "Задайте вопрос о нормативах, налогах...",
        sources: "Источники",
        error: "Извините, произошла ошибка. Пожалуйста, попробуйте еще раз.",
        fallback: "Ответ сформирован на основе регуляторной базы RegAI."
    }
};

export function ChatWidget() {
    const { i18n } = useTranslation();
    const activeLang = (i18n.language || 'ru').toLowerCase().startsWith('en') ? 'en' : 'ru';
    const textConfig = UI_TEXT[activeLang] || UI_TEXT.ru;
    const suggestedQuestions = SUGGESTIONS_BY_LANG[activeLang] || SUGGESTIONS_BY_LANG.ru;

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: GREETINGS[activeLang] || GREETINGS.ru }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Update greeting if user changes language and hasn't started conversation yet
    useEffect(() => {
        setMessages(prev => {
            if (prev.length === 1 && prev[0].role === 'assistant') {
                return [{ role: 'assistant', content: GREETINGS[activeLang] || GREETINGS.ru }];
            }
            return prev;
        });
    }, [activeLang]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const sendMessage = async (e?: React.FormEvent, textOverride?: string) => {
        e?.preventDefault();
        const textToSend = textOverride || input.trim();

        if (!textToSend || isLoading) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
        setIsLoading(true);

        try {
            const res = await api.post('/chat/', {
                message: textToSend,
                history: messages.map(m => ({ role: m.role, content: m.content })),
                locale: activeLang
            });

            const replyContent = res?.data?.response || res?.data?.message || textConfig.fallback;
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: replyContent,
                sources: res?.data?.sources || []
            }]);
        } catch (error) {
            console.error("Chat error", error);
            setMessages(prev => [...prev, { role: 'assistant', content: textConfig.error }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:scale-110"
                >
                    <MessageCircle className="h-6 w-6 text-white" />
                </Button>
            )}

            {isOpen && (
                <Card className="w-[400px] h-[600px] flex flex-col shadow-2xl border-0 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 rounded-2xl">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                                <Bot className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold">{textConfig.title}</h3>
                                <p className="text-xs text-blue-100 flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" /> {textConfig.subtitle}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsOpen(false)}
                            className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50">
                        {messages.length === 1 && (
                            <div className="grid grid-cols-1 gap-2 mb-4">
                                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">{textConfig.suggested}</p>
                                {suggestedQuestions.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(undefined, q)}
                                        className="text-left text-sm bg-white border hover:border-blue-300 hover:bg-blue-50 p-2.5 rounded-lg transition-colors text-gray-700 shadow-sm"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl p-4 text-sm shadow-sm ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white border text-gray-800 rounded-bl-none'
                                        }`}
                                >
                                    {msg.role === 'assistant' ? (
                                        <div className="prose prose-sm max-w-none dark:prose-invert">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        msg.content
                                    )}
                                </div>

                                {/* Sources */}
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-2 ml-2 max-w-[85%]">
                                        <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                                            <BookOpen className="h-3 w-3" /> {textConfig.sources}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {msg.sources.map((source, i) => (
                                                <span key={i} className="text-[10px] bg-gray-100 border px-2 py-1 rounded text-gray-600 font-mono">
                                                    {source.metadata?.code || 'Ref'}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border shadow-sm rounded-2xl p-4 rounded-bl-none">
                                    <div className="flex gap-1.5">
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white border-t">
                        <form onSubmit={(e) => sendMessage(e)} className="flex gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={textConfig.placeholder}
                                className="flex-1 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                autoFocus
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={isLoading || !input.trim()}
                                className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </Card>
            )}
        </div>
    );
}
