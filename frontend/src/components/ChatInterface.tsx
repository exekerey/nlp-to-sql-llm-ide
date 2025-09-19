import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Copy } from 'lucide-react';
import { ChatMessage } from '../App';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const formatTime = (date: Date) =>
      new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  const copyText = async (t: string) => {
    try { await navigator.clipboard.writeText(t); } catch {}
  };

  return (
      <div className="flex flex-col h-full bg-gray-800">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold flex items-center space-x-2">
            <Bot className="h-5 w-5 text-blue-400" />
            <span>AI Assistant</span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">Ask questions in natural language</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => {
            const isAssistant = m.type === 'assistant';
            const bubble = isAssistant ? 'bg-gray-700 text-gray-100' : 'bg-blue-600 text-white';
            return (
                <div key={m.id} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${bubble}`}>
                    <div className="flex items-start space-x-2">
                      {isAssistant ? (
                          <Bot className="h-4 w-4 mt-0.5 text-blue-400 flex-shrink-0" />
                      ) : (
                          <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        {m.content && (
                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                              {m.content}
                            </p>
                        )}
                        {m.sql && m.sql.trim() && (
                            <div className="mt-2 bg-gray-900 rounded border border-gray-700">
                              <div className="flex items-center justify-between px-2 py-1 border-b border-gray-800">
                                <span className="text-[11px] uppercase tracking-wider text-gray-400">SQL</span>
                                <button
                                    type="button"
                                    onClick={() => copyText(m.sql!)}
                                    className="flex items-center gap-1 text-xs text-gray-300 hover:text-white px-2 py-1 rounded hover:bg-gray-800"
                                    title="Copy SQL"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                  Copy
                                </button>
                              </div>
                              <pre className="max-h-64 overflow-auto p-2 text-xs text-green-400 font-mono whitespace-pre">
                          {m.sql}
                        </pre>
                            </div>
                        )}
                        <p className="text-xs opacity-70 mt-1">{formatTime(m.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
          <div className="flex space-x-2">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me about your database..."
                className="flex-1 bg-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-600 transition-all"
            />
            <button
                type="submit"
                disabled={!input.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg px-3 py-2 transition-all duration-200 flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Try: "Show me all users", "Get sales by month", "Count total orders"
          </div>
        </form>
      </div>
  );
};

export default ChatInterface;
