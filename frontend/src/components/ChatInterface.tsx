import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Bot, Clipboard, Play, Send, User} from 'lucide-react';
import type {ChatMessage} from '../types';

interface ChatInterfaceProps {
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    onUseSQL?: (sql: string) => void;
    onRunSQL?: (sql: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
                                                         messages,
                                                         onSendMessage,
                                                         onUseSQL,
                                                         onRunSQL,
                                                     }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth', block: 'end'});
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const autosize = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = '0px';
        const h = Math.min(200, el.scrollHeight);
        el.style.height = h + 'px';
    }, []);
    useEffect(() => {
        autosize();
    }, [input, autosize]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        const text = input.trim();
        if (!text) return;
        onSendMessage(text);
        setInput('');
    };

    const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
            return;
        }
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const formatTime = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('en-GB', {hour: '2-digit', minute: '2-digit', hour12: false}).format(d);
    };

    const copySQL = async (sql: string) => {
        try {
            await navigator.clipboard.writeText(sql);
        } catch {
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-800">
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Bot className="h-5 w-5 text-blue-400"/>
                    <span>AI Assistant</span>
                </h2>
                <p className="text-sm text-gray-400 mt-1">Ask questions in natural language</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] w-fit overflow-hidden rounded-lg p-3 ${
                                message.type === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-100'
                            }`}
                        >
                            <div className="flex items-start gap-2">
                                {message.type === 'assistant' ? (
                                    <Bot className="h-4 w-4 mt-0.5 text-blue-300 flex-shrink-0"/>
                                ) : (
                                    <User className="h-4 w-4 mt-0.5 flex-shrink-0"/>
                                )}

                                <div className="flex-1 min-w-0">
                                    {/* Текст сообщения: переносы и обрезка внутри пузыря */}
                                    <div className="text-sm whitespace-pre-wrap break-words max-w-full">
                                        {message.content}
                                    </div>

                                    {/* Сгенерированный SQL */}
                                    {message.sql && (
                                        <div className="mt-2 p-2 bg-gray-900 rounded border border-gray-700">
                      <pre className="text-xs text-green-400 font-mono overflow-x-auto max-w-full">
                        {message.sql}
                      </pre>
                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                                <button
                                                    onClick={() => copySQL(message.sql!)}
                                                    className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 flex items-center gap-1"
                                                    title="Copy SQL"
                                                >
                                                    <Clipboard className="h-3 w-3"/>
                                                    Copy
                                                </button>
                                                {onUseSQL && (
                                                    <button
                                                        onClick={() => onUseSQL(message.sql!)}
                                                        className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200"
                                                    >
                                                        Insert to editor
                                                    </button>
                                                )}
                                                {onRunSQL && (
                                                    <button
                                                        onClick={() => onRunSQL(message.sql!)}
                                                        className="px-2 py-1 rounded bg-green-600 hover:bg-green-500 text-white flex items-center gap-1"
                                                    >
                                                        <Play className="h-3 w-3"/>
                                                        Run
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-xs opacity-70 mt-1">{formatTime(message.timestamp)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef}/>
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
                <div className="flex gap-2 items-end">
          <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me about your database…"
              rows={1}
              className="flex-1 bg-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-600 transition-all resize-none"
              spellCheck={false}
          />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg px-3 py-2 transition-all duration-200 flex items-center justify-center"
                        title="Send (Enter). New line: Shift+Enter"
                    >
                        <Send className="h-4 w-4"/>
                    </button>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                    Try "<b>Number of customers per each year</b>", "<b>Total revenue for whole period</b>", "<b>Show me
                    genres that users listen the most</b>"
                </div>
            </form>
        </div>
    );
};

export default ChatInterface;
