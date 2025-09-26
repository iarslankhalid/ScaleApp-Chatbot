'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  apiClient, 
  ChatMessage, 
  createUserMessage, 
  createBotMessage, 
  createErrorMessage 
} from '../lib/api';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Test connection to backend
  const testConnection = useCallback(async () => {
    try {
      const isHealthy = await apiClient.testConnection();
      setIsConnected(isHealthy);
    } catch (error) {
      setIsConnected(false);
    }
  }, []);

  // Initial connection test and periodic checks
  useEffect(() => {
    testConnection();
    const interval = setInterval(testConnection, 30000);
    return () => clearInterval(interval);
  }, [testConnection]);

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = createUserMessage(inputValue);
    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await apiClient.sendMessage({
        message: currentInput,
        conversation_id: 'test-session-1'
      });
      
      const botMessage = createBotMessage(
        response.response,
        response.sources || []
      );

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = createErrorMessage(error as Error);
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  // Auto-resize textarea
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setInputValue(textarea.value);
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set the height to scrollHeight (content height)
    const newHeight = Math.min(textarea.scrollHeight, 120); // Max height of 120px
    textarea.style.height = `${newHeight}px`;
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-900/50 rounded-lg">
              <Bot className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">RAG Chatbot Tester</h1>
              <div className="flex items-center gap-2 text-sm">
                <div 
                  className={`w-2 h-2 rounded-full transition-colors ${
                    isConnected ? 'bg-green-400' : 'bg-red-400'
                  }`}
                />
                <span className={`transition-colors ${
                  isConnected ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isConnected ? 'Connected to backend' : 'Backend disconnected'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            Clear Chat
          </button>
        </div>
      </header>

      {/* Messages Container */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-lg font-medium text-white mb-2">
                  Start Testing Your RAG Chatbot
                </h2>
                <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                  Send a message to test your Pinecone + OpenAI integration. The bot will search your knowledge base and provide contextual responses.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 animate-fade-in ${
                    message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div className={`flex-shrink-0 p-2 rounded-lg ${
                    message.sender === 'user' 
                      ? 'bg-blue-900/50' 
                      : message.isError 
                        ? 'bg-red-900/50' 
                        : 'bg-gray-700'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Bot className={`w-5 h-5 ${
                        message.isError ? 'text-red-400' : 'text-gray-300'
                      }`} />
                    )}
                  </div>
                  <div className={`flex-1 max-w-3xl ${
                    message.sender === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    <div className={`inline-block p-3 rounded-lg transition-colors ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.isError
                          ? 'bg-red-900/50 text-red-200 border border-red-700/50'
                          : 'bg-gray-800 text-gray-100 border border-gray-700'
                    }`}>
                      {message.sender === 'user' ? (
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                      ) : (
                        <div className="markdown-content">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              // Style markdown elements to match our theme
                              p: ({children}) => <p className="mb-3 last:mb-0 leading-relaxed text-gray-100">{children}</p>,
                              strong: ({children}) => <strong className="font-bold text-white">{children}</strong>,
                              em: ({children}) => <em className="italic text-blue-300">{children}</em>,
                              ul: ({children}) => <ul className="list-none mb-3 space-y-2">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-2 pl-2">{children}</ol>,
                              li: ({children}) => (
                                <li className="text-gray-100 flex items-start">
                                  <span className="text-blue-400 mr-2 flex-shrink-0">•</span>
                                  <span>{children}</span>
                                </li>
                              ),
                              blockquote: ({children}) => (
                                <blockquote className="border-l-4 border-blue-500 pl-4 italic text-blue-300 my-3 bg-gray-900/50 py-2 rounded-r">
                                  {children}
                                </blockquote>
                              ),
                              code: ({children}) => (
                                <code className="bg-gray-900 text-blue-300 px-2 py-1 rounded text-sm font-mono">
                                  {children}
                                </code>
                              ),
                              h1: ({children}) => <h1 className="text-xl font-bold text-white mb-3 border-b border-gray-600 pb-2">{children}</h1>,
                              h2: ({children}) => <h2 className="text-lg font-bold text-white mb-3">{children}</h2>,
                              h3: ({children}) => <h3 className="text-base font-bold text-blue-300 mb-2">{children}</h3>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-600">
                          <p className="text-xs text-gray-400 mb-1 font-medium">
                            Sources:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {message.sources.map((source, idx) => {
                              const isUrl = source.startsWith('http://') || source.startsWith('https://');
                              
                              if (isUrl) {
                                return (
                                  <a
                                    key={idx}
                                    href={source}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs bg-gray-700 text-blue-300 px-2 py-1 rounded transition-colors hover:bg-blue-600 hover:text-white underline underline-offset-2 decoration-dotted decoration-1"
                                    title={`Open source: ${source}`}
                                  >
                                    {source.length > 50 ? `${source.substring(0, 47)}...` : source}
                                  </a>
                                );
                              } else {
                                return (
                                  <span
                                    key={idx}
                                    className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded transition-colors hover:bg-gray-600"
                                    title={source}
                                  >
                                    {source.length > 50 ? `${source.substring(0, 47)}...` : source}
                                  </span>
                                );
                              }
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-start gap-3 animate-fade-in">
                <div className="flex-shrink-0 p-2 bg-gray-700 rounded-lg">
                  <Bot className="w-5 h-5 text-gray-300" />
                </div>
                <div className="flex-1">
                  <div className="inline-block p-3 bg-gray-800 border border-gray-700 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      <span className="text-gray-300">Searching knowledge base...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Ask your RAG chatbot anything..."
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 text-white placeholder-gray-400 focus:outline-none"
                rows={1}
                style={{
                  minHeight: '48px',
                  maxHeight: '120px',
                }}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChatInterface;