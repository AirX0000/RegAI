import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, X, Send, Bot, Sparkles, BookOpen } from 'lucide-react';
import api from '../lib/api';
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: any[];
}

const SUGGESTED_QUESTIONS = [
    "What are the latest IFRS updates?",
    "Explain GDPR compliance requirements",
    "How to calculate tax for SaaS?",
    "Summarize recent ESG regulations"
];

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I am your RegAI assistant. Ask me anything about regulations.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
                history: messages.map(m => ({ role: m.role, content: m.content }))
            });

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: res.data.response,
                sources: res.data.sources
            }]);
        } catch (error) {
            console.error("Chat error", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
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
                                <h3 className="font-semibold">RegAI Assistant</h3>
                                <p className="text-xs text-blue-100 flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" /> AI Powered
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
                                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Suggested Questions</p>
                                {SUGGESTED_QUESTIONS.map((q, i) => (
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
                                            <BookOpen className="h-3 w-3" /> Sources
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
                                placeholder="Ask about regulations..."
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
