import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, Send, Sparkles, BookOpen } from 'lucide-react';
import api from '../lib/api';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { normalizeLang } from '../lib/i18n';

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
    ],
    uz: [
        "MHXS (IFRS) bo'yicha so'nggi o'zgarishlar qanday?",
        "O'zR Soliq kodeksi 2026 stavkalarini tushuntiring",
        "IFRS 16 bo'yicha ijara qanday hisoblanadi?",
        "IFRS 9 ECL zaxiralarini hisoblash tartibi"
    ]
};

const GREETINGS: Record<string, string> = {
    en: "Hello! I am your Axiaris assistant. Ask me anything about regulations, taxes, or IFRS.",
    ru: "Здравствуйте! Я ваш ассистент Axiaris. Задайте мне любой вопрос по нормативам, налогам или МСФО.",
    uz: "Assalomu alaykum! Men sizning Axiaris AI-yordamchingizman. Me'yoriy hujjatlar, soliqlar yoki MHXS (IFRS) bo'yicha istalgan savolingizni bering."
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
        title: "Axiaris Assistant",
        subtitle: "AI Powered",
        suggested: "Suggested Questions",
        placeholder: "Ask about regulations, taxes, IFRS...",
        sources: "Sources",
        error: "Sorry, an error occurred. Please try again.",
        fallback: "Response generated from Axiaris compliance database."
    },
    ru: {
        title: "Axiaris Ассистент",
        subtitle: "На базе ИИ",
        suggested: "Рекомендуемые вопросы",
        placeholder: "Задайте вопрос о нормативах, налогах...",
        sources: "Источники",
        error: "Извините, произошла ошибка. Пожалуйста, попробуйте еще раз.",
        fallback: "Ответ сформирован на основе регуляторной базы Axiaris."
    },
    uz: {
        title: "Axiaris AI-Yordamchi",
        subtitle: "Sun'iy intellekt asosida",
        suggested: "Tavsiya etilgan savollar",
        placeholder: "Me'yorlar, soliqlar yoki MHXS haqida so'rang...",
        sources: "Manbalar",
        error: "Kechirasiz, xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
        fallback: "Javob Axiaris me'yoriy bazasi asosida shakllantirildi."
    }
};

export function ChatWidget() {
    const { i18n } = useTranslation();
    const activeLang = normalizeLang(i18n.language);
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
                <button
                    onClick={() => setIsOpen(true)}
                    className="relative group h-14 w-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer"
                    title={textConfig.title}
                >
                    {/* Ambient Glow Aura */}
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-violet-600 opacity-70 blur-md group-hover:opacity-100 group-hover:blur-lg transition-all duration-500 animate-pulse pointer-events-none" />
                    
                    {/* Button Body with Logo */}
                    <div className="relative w-full h-full rounded-full overflow-hidden ring-2 ring-white/50 dark:ring-cyan-400/40 shadow-xl bg-slate-950 flex items-center justify-center p-0.5">
                        <img
                            src="/axiaris-logo.png"
                            alt="Axiaris AI"
                            className="w-full h-full rounded-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                    </div>
                </button>
            )}

            {isOpen && (
                <Card className="w-[400px] h-[600px] flex flex-col shadow-2xl border border-cyan-500/20 dark:border-[#162244] overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 rounded-2xl dark:bg-[#070c1e]">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-950 via-[#0a1128] to-indigo-950 p-4 flex justify-between items-center text-white border-b border-[#162244]">
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 opacity-70 blur-xs"></div>
                                <img
                                    src="/axiaris-logo.png"
                                    alt="Axiaris Logo"
                                    className="relative w-8 h-8 rounded-lg object-cover ring-1 ring-white/30"
                                />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm flex items-center gap-1.5 text-white">
                                    {textConfig.title}
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">AI</span>
                                </h3>
                                <p className="text-xs text-sky-200/80 flex items-center gap-1">
                                    <Sparkles className="h-3 w-3 text-cyan-400" /> {textConfig.subtitle}
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
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50 dark:bg-[#050814]/80">
                        {messages.length === 1 && (
                            <div className="grid grid-cols-1 gap-2 mb-4">
                                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{textConfig.suggested}</p>
                                {suggestedQuestions.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(undefined, q)}
                                        className="text-left text-sm bg-white dark:bg-[#0b1228] border border-slate-200 dark:border-[#162244] hover:border-cyan-400 dark:hover:border-cyan-500/50 hover:bg-cyan-50 dark:hover:bg-[#0f1738] p-2.5 rounded-lg transition-colors text-gray-700 dark:text-slate-200 shadow-sm"
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
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none shadow-blue-500/10'
                                        : 'bg-white dark:bg-[#0b1228] border border-slate-200 dark:border-[#162244] text-gray-800 dark:text-slate-200 rounded-bl-none'
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
                                        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                                            <BookOpen className="h-3 w-3" /> {textConfig.sources}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {msg.sources.map((source, i) => (
                                                <span key={i} className="text-[10px] bg-gray-100 dark:bg-[#101935] border border-slate-200 dark:border-[#162244] px-2 py-1 rounded text-gray-600 dark:text-slate-300 font-mono">
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
                                <div className="bg-white dark:bg-[#0b1228] border border-slate-200 dark:border-[#162244] shadow-sm rounded-2xl p-4 rounded-bl-none">
                                    <div className="flex gap-1.5">
                                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white dark:bg-[#070c1e] border-t border-slate-200 dark:border-[#162244]">
                        <form onSubmit={(e) => sendMessage(e)} className="flex gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={textConfig.placeholder}
                                className="flex-1 bg-gray-50 dark:bg-[#050814] border-gray-200 dark:border-[#162244] focus:bg-white dark:focus:bg-[#0b1228] text-slate-900 dark:text-slate-100 transition-colors focus-visible:ring-cyan-500"
                                autoFocus
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={isLoading || !input.trim()}
                                className="bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:via-blue-500 hover:to-violet-500 shadow-md shadow-cyan-500/20"
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
