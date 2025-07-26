export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCallbacks: Array<(error: string) => void> = [];

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public handleError(error: unknown, context?: string): string {
    let errorMessage = 'An unknown error occurred';

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = (error as { message: string }).message;
    } else if (error) {
      // Handle other types of errors
      errorMessage = String(error);
    }

    // Add context if provided
    if (context) {
      errorMessage = `${context}: ${errorMessage}`;
    }

    // Log the error for debugging with proper formatting
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorHandler:', {
        context,
        errorMessage,
        originalError: error,
        errorType: typeof error,
        isErrorInstance: error instanceof Error
      });
    }

    // Notify all registered callbacks
    this.errorCallbacks.forEach(callback => {
      try {
        callback(errorMessage);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });

    return errorMessage;
  }

  public registerErrorCallback(callback: (error: string) => void): () => void {
    this.errorCallbacks.push(callback);
    
    // Return unregister function
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  public getUserFriendlyMessage(error: unknown): string {
    if (error instanceof Error) {
      // Map technical errors to user-friendly messages
      if (error.message.includes('permission')) {
        return '需要麦克风权限才能使用语音功能，请在浏览器设置中允许麦克风访问';
      }
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return '网络连接出现问题，请检查网络连接后重试';
      }
      
      if (error.message.includes('timeout')) {
        return '请求超时，请稍后重试';
      }
      
      if (error.message.includes('speech') || error.message.includes('recognition')) {
        return '语音识别服务暂时不可用，请稍后重试或使用其他浏览器';
      }
      
      if (error.message.includes('audio') || error.message.includes('media')) {
        return '音频设备出现问题，请检查麦克风和扬声器设置';
      }
      
      if (error.message.includes('API') || error.message.includes('credentials')) {
        return 'API服务暂时不可用，请稍后重试';
      }
    }
    console.error(error);

    return '发生了未知错误，请刷新页面后重试';
  }
}

export const errorHandler = ErrorHandler.getInstance();