export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled = true;

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public startTimer(name: string, metadata?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata,
    };

    this.metrics.set(name, metric);
  }

  public endTimer(name: string): number | undefined {
    if (!this.isEnabled) return;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance timer '${name}' was not started`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Log performance metrics for development
    if (process.env.NODE_ENV === 'development') {
      const color = duration > 1000 ? 'red' : duration > 500 ? 'orange' : 'green';
      // console.log(
      //   `%c[Performance] ${name}: ${duration.toFixed(2)}ms`,
      //   `color: ${color}; font-weight: bold;`,
      //   metric.metadata
      // );
    }

    // Clean up the metric
    this.metrics.delete(name);

    return duration;
  }

  public measureAsync<T>(
    name: string,
    asyncFunction: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    if (!this.isEnabled) {
      return asyncFunction();
    }

    this.startTimer(name, metadata);

    return asyncFunction()
      .then(result => {
        this.endTimer(name);
        return result;
      })
      .catch(error => {
        this.endTimer(name);
        throw error;
      });
  }

  public measure<T>(
    name: string,
    syncFunction: () => T,
    metadata?: Record<string, unknown>
  ): T {
    if (!this.isEnabled) {
      return syncFunction();
    }

    this.startTimer(name, metadata);
    try {
      const result = syncFunction();
      this.endTimer(name);
      return result;
    } catch (error) {
      this.endTimer(name);
      throw error;
    }
  }

  public getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  public clearMetrics(): void {
    this.metrics.clear();
  }

  // Utility methods for common performance monitoring scenarios
  public monitorAudioProcessing<T>(
    operation: () => Promise<T>,
    operationType: string
  ): Promise<T> {
    return this.measureAsync(
      `audio-${operationType}`,
      operation,
      { type: 'audio', operation: operationType }
    );
  }

  public monitorAPICall<T>(
    operation: () => Promise<T>,
    apiName: string,
    endpoint?: string
  ): Promise<T> {
    return this.measureAsync(
      `api-${apiName}`,
      operation,
      { type: 'api', service: apiName, endpoint }
    );
  }

  public monitorSpeechProcessing<T>(
    operation: () => Promise<T>,
    processingType: 'recognition' | 'synthesis'
  ): Promise<T> {
    return this.measureAsync(
      `speech-${processingType}`,
      operation,
      { type: 'speech', processing: processingType }
    );
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();