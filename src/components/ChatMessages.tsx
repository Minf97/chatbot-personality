"use client";

import React from 'react';
import { ChatMessage } from '@/types';
import { Clock, Shield, Brain } from 'lucide-react';
import { usePhoneAIStore } from "@/lib/store";

interface ChatMessageItemProps {
  message: ChatMessage;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const timestamp = new Date(message.timestamp);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse gap-3' : 'flex-row gap-3'} items-start`}>
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center relative
          ${isUser 
            ? 'bg-[--accent-olive]' 
            : 'bg-[--accent-amber]'
          }
          border border-[--border-soft]
        `}>
          {isUser ? (
            <Shield className="w-5 h-5 text-white" />
          ) : (
            <Brain className="w-5 h-5 text-white" />
          )}
          
          {/* Status indicator */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white">
            <div className="w-full h-full bg-green-300 rounded-full animate-ping opacity-70" />
          </div>
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* User/AI Label */}
          <div className={`text-xs font-mono mb-1 text-[--text-muted]`}>
            {isUser ? '[USER_TERMINAL]' : '[AI_CORE]'}
          </div>
          
          {/* Message Bubble */}
          <div className={`
            px-4 py-3 rounded-2xl max-w-full break-words relative
            ${isUser 
              ? 'bg-[--surface-2] text-white border border-[--border-soft]' 
              : 'bg-[--surface-2] text-gray-100 border border-[--border-soft]'
            }
            backdrop-blur-sm shadow-lg
          `}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono">
              {message.content}
            </p>
            
            {/* Message type indicator */}
            <div className={`absolute -bottom-1 ${isUser ? '-right-1' : '-left-1'} w-3 h-3 rotate-45 ${
              'bg-[--surface-2] border-r border-b border-[--border-soft]'
            }`} />
          </div>

          {/* Timestamp */}
          <div className={`
            flex items-center mt-2 text-xs text-gray-400 font-mono
            ${isUser ? 'flex-row-reverse' : 'flex-row'}
          `}>
            <Clock className="w-3 h-3 mx-1 text-[--text-muted]" />
            <span>[{formatTime(timestamp)}]</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StreamingChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
}

// Component for rendering the streaming message with typing animation
export const StreamingChatMessage: React.FC<StreamingChatMessageProps> = ({
  content,
  role
}) => {
  const isUser = role === "user";
  const timestamp = new Date();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Gaming-style cursor with neon effect
  const cursorClass = !isUser ? 
    "after:content-['▋'] after:inline-block after:text-cyan-400 after:animate-pulse after:ml-1" 
    : "";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse gap-3' : 'flex-row gap-3'} items-start`}>
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center relative
          ${isUser 
            ? 'bg-[--accent-olive]' 
            : 'bg-[--accent-amber]'
          }
          border border-[--border-soft]
        `}>
          {isUser ? (
            <Shield className="w-5 h-5 text-white" />
          ) : (
            <Brain className="w-5 h-5 text-white" />
          )}
          
          {/* Streaming indicator */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white animate-pulse">
            <div className="w-full h-full bg-yellow-300 rounded-full animate-ping opacity-70" />
          </div>
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Streaming Label */}
          <div className={`text-xs font-mono mb-1 text-[--text-muted]`}>
            {isUser ? '[USER_TERMINAL]' : '[AI_CORE] > STREAMING...'}
          </div>
          
          {/* Message Bubble */}
          <div className={`
            px-4 py-3 rounded-2xl max-w-full break-words relative
            ${isUser 
              ? 'bg-[--surface-2] text-white border border-[--border-soft]' 
              : 'bg-[--surface-2] text-gray-100 border border-[--border-soft]'
            }
            backdrop-blur-sm shadow-lg
          `}>
            <p className={`text-sm leading-relaxed whitespace-pre-wrap font-mono ${cursorClass}`}>
              {content}
            </p>
            
            {/* Message type indicator */}
            <div className={`absolute -bottom-1 ${isUser ? '-right-1' : '-left-1'} w-3 h-3 rotate-45 ${
              'bg-[--surface-2] border-r border-b border-[--border-soft]'
            }`} />
          </div>

          {/* Timestamp */}
          <div className={`
            flex items-center mt-2 text-xs text-gray-400 font-mono
            ${isUser ? 'flex-row-reverse' : 'flex-row'}
          `}>
            <Clock className="w-3 h-3 mx-1 text-[--text-muted]" />
            <span>[{formatTime(timestamp)}]</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ 
  messages, 
  isLoading = false 
}) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const { streamingMessage } = usePhoneAIStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage?.content]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-2 relative">
      {messages.length === 0 && !streamingMessage ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-[--text-muted]">
            <Brain className="w-12 h-12 mx-auto text-[--text-muted]" />
            <h3 className="text-xl font-bold headline mb-2">NEURAL INTERFACE READY</h3>
            <p className="text-sm font-mono">Activate neural link to begin AI communication protocol</p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <ChatMessageItem key={message.id} message={message} />
          ))}

          {/* Streaming message (message being typed) */}
          {streamingMessage && (
            <StreamingChatMessage 
              content={streamingMessage.content}
              role={streamingMessage.role}
            />
          )}

          {/* Loading indicator */}
          {isLoading && !streamingMessage && (
            <div className="flex justify-start mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center border border-white/20">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 px-4 py-3 rounded-2xl border border-purple-400/30 backdrop-blur-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <div className="text-xs text-purple-400 font-mono mt-1">AI_CORE PROCESSING...</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};