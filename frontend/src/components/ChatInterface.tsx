import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { ChatMessage } from '../App';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold flex items-center space-x-2">
          <Bot className="h-5 w-5 text-blue-400" />
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
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'assistant' ? (
                  <Bot className="h-4 w-4 mt-0.5 text-blue-400 flex-shrink-0" />
                ) : (
                  <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.sql && (
                    <div className="mt-2 p-2 bg-gray-900 rounded border">
                      <pre className="text-xs text-green-400 font-mono overflow-x-auto">
                        {message.sql}
                      </pre>
                    </div>
                  )}
                  <p className="text-xs opacity-70 mt-1">{formatTime(message.timestamp)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
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