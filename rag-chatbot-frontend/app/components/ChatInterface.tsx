'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of messages with improved behavior
  const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Different scroll behavior for streaming vs new messages
  useEffect(() => {
    if (isStreaming) {
      // During streaming, scroll smoothly but less frequently
      const timeoutId = setTimeout(() => {
        scrollToBottom('auto'); // Use auto scroll during streaming to reduce jumping
      }, 100);
      return () => clearTimeout(timeoutId);
    } else {
      // For new messages, scroll smoothly
      scrollToBottom('smooth');
    }
  }, [messages.length, scrollToBottom]); // Only trigger on message count change

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
    setIsStreaming(false);

    // Create a temporary bot message that will be updated with streaming content
    const tempBotMessageId = Date.now() + 1;
    const tempBotMessage = createBotMessage('');
    tempBotMessage.id = tempBotMessageId;
    
    setMessages(prev => [...prev, tempBotMessage]);

    try {
      let streamingContent = '';
      let hasStartedStreaming = false;

      for await (const chunk of apiClient.sendMessageStream({
        message: currentInput,
        conversation_id: 'test-session-1'
      })) {
        if (chunk.error) {
          throw new Error(chunk.error);
        }
        
        if (chunk.content) {
          // First content chunk - switch from loading to streaming
          if (!hasStartedStreaming) {
            setIsLoading(false);
            setIsStreaming(true);
            hasStartedStreaming = true;
          }
          
          streamingContent += chunk.content;
          
          // Update the temporary message with streaming content
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempBotMessageId 
                ? { ...msg, content: streamingContent }
                : msg
            )
          );
        }
        
        if (chunk.done) {
          // Final update
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempBotMessageId 
                ? { ...msg, content: streamingContent }
                : msg
            )
          );
          break;
        }
      }
    } catch (error) {
      // Replace the temporary message with an error message
      const errorMessage = createErrorMessage(error as Error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempBotMessageId ? errorMessage : msg
        )
      );
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
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
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
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
              messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 animate-fade-in w-full ${
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
                  <div className={`flex-1 min-w-0 max-w-full ${
                    message.sender === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    <div className={`inline-block p-3 rounded-lg transition-colors max-w-full break-words ${
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
                                                <div className={`markdown-content overflow-hidden ${
                          isStreaming && index === messages.length - 1 ? 'streaming-cursor' : ''
                        }`}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              // Style markdown elements to match our theme
                              p: ({children}) => {
                                // Check if this paragraph is empty or just whitespace
                                const content = children?.toString().trim();
                                if (!content || content === '' || content === '\n') {
                                  return null; // Don't render empty paragraphs
                                }
                                return <p className="mb-1 last:mb-0 leading-normal text-gray-100 break-words overflow-wrap-anywhere">{children}</p>;
                              },
                              strong: ({children}) => <strong className="font-bold text-white break-words">{children}</strong>,
                              em: ({children}) => <em className="italic text-blue-300 break-words">{children}</em>,
                              ul: ({children}) => <ul className="list-none mb-3 space-y-2 pl-0">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-2 pl-2">{children}</ol>,
                              li: ({children}) => (
                                <li className="text-gray-100 flex flex-row items-start gap-3 break-words overflow-wrap-anywhere">
                                  <div className="text-blue-400 flex-shrink-0 mt-1 text-sm">•</div>
                                  <div className="break-words inline-flex overflow-wrap-anywhere min-w-0 flex-1 leading-normal">
                                    {children}
                                  </div>
                                </li>
                              ),
                              blockquote: ({children}) => (
                                <blockquote className="border-l-4 border-blue-500 pl-4 italic text-blue-300 my-3 bg-gray-900/50 py-2 rounded-r break-words overflow-wrap-anywhere">
                                  {children}
                                </blockquote>
                              ),
                              code: ({children}) => (
                                <code className="bg-gray-900 text-blue-300 px-2 py-1 rounded text-sm font-mono break-all">
                                  {children}
                                </code>
                              ),
                              h1: ({children}) => <h1 className="text-xl font-bold text-blue-300 mb-2 mt-3 border-b border-gray-600 pb-1 break-words">{children}</h1>,
                              h2: ({children}) => <h2 className="text-lg font-bold text-blue-300 mb-1 mt-2 break-words">{children}</h2>,
                              h3: ({children}) => <h3 className="text-base font-bold text-blue-400 mb-1 mt-1 break-words">{children}</h3>,
                              a: ({children, href}) => (
                                <a 
                                  href={href} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-300 hover:text-blue-200 underline underline-offset-2 decoration-dotted transition-colors break-all"
                                >
                                  {children}
                                </a>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
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
              <div className="flex items-start gap-3 animate-fade-in w-full">
                <div className="flex-shrink-0 p-2 bg-gray-700 rounded-lg">
                  <Bot className="w-5 h-5 text-gray-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-block p-3 bg-gray-800 border border-gray-700 rounded-lg max-w-full">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400 flex-shrink-0" />
                      <span className="text-gray-300">Searching knowledge base...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Streaming indicator */}
            {isStreaming && (
              <div className="flex items-start gap-3 animate-fade-in w-full">
                <div className="flex-shrink-0 p-2 bg-gray-700 rounded-lg">
                  <Bot className="w-5 h-5 text-gray-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-block p-3 bg-gray-800 border border-gray-700 rounded-lg max-w-full">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-gray-300">AI is responding...</span>
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
              disabled={!inputValue.trim() || isLoading || isStreaming}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              aria-label="Send message"
            >
              {isLoading || isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
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