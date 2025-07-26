import axios from 'axios';
import { KimiMessage, KimiResponse } from '@/types';

export class ChatService {
  private static instance: ChatService;

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  public async sendMessage(messages: KimiMessage[]): Promise<string> {
    if (!messages || messages.length === 0) {
      throw new Error('Messages are required');
    }

    try {
      const response = await axios.post<KimiResponse>('/api/chat', {
        messages: messages,
        stream: false
      }, {
        timeout: 60000, // Increase to 60 seconds for better stability
        headers: {
          'Content-Type': 'application/json'
        },
        // Add retry logic for network issues
        validateStatus: function (status) {
          return status < 500; // Don't throw for client errors (4xx)
        }
      });

      const data = response.data;
      
      if (!data) {
        throw new Error('Empty response from chat service');
      }
      
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        const content = data.choices[0].message.content;
        if (!content || content.trim().length === 0) {
          throw new Error('Empty response from AI');
        }
        return content.trim();
      } else {
        throw new Error('Invalid response format from AI service');
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle specific error codes
        if (error.response?.status === 499) {
          throw new Error('请求被取消，请重试');
        } else if (error.response?.status === 400) {
          throw new Error('Invalid request to chat service');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed - please check API key');
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded - please try again later');
        } else if (error.response?.status === 500) {
          throw new Error('Chat service temporarily unavailable');
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('请求超时，请检查网络连接');
        } else if (error.code === 'ERR_CANCELED') {
          throw new Error('请求被取消，请重试');
        } else if (!error.response) {
          throw new Error('Network error - please check your connection');
        }
        
        console.error('Chat Service Axios Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          code: error.code
        });
      } else {
        console.error('Chat Service Error:', error);
      }
      
      throw error instanceof Error ? error : new Error('Failed to get AI response');
    }
  }

  public async sendMessageStream(
    messages: KimiMessage[],
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                onComplete();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.choices && parsed.choices[0]?.delta?.content) {
                  onChunk(parsed.choices[0].delta.content);
                }
              } catch {
                // Skip invalid JSON lines
              }
            }
          }
        }
        onComplete();
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      console.error('Chat Stream Error:', error);
      onError(error instanceof Error ? error : new Error('Unknown streaming error'));
    }
  }

  public createConversationHistory(messages: { role: 'user' | 'assistant'; content: string }[]): KimiMessage[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }
}

export const chatService = ChatService.getInstance();