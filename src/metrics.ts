import { InferenceTier, RouterMetrics } from "./types.js";

export class InferenceMetricsTracker {
  private totalRequests = 0;
  private onDeviceRequests = 0;
  private cloudRequests = 0;
  private fallbackCount = 0;
  private totalTokens = 0;
  private onDeviceTokens = 0;
  private totalLatencyMs = 0;
  private cloudCostPer1k: number;

  constructor(cloudCostPer1k: number = 0.00035) {
    this.cloudCostPer1k = cloudCostPer1k;
  }

  public recordRequest(
    tier: InferenceTier,
    tokens: number,
    latencyMs: number,
    isFallback: boolean
  ): number {
    this.totalRequests++;
    this.totalTokens += tokens;
    this.totalLatencyMs += latencyMs;

    if (isFallback) {
      this.fallbackCount++;
    }

    if (tier === "on-device") {
      this.onDeviceRequests++;
      this.onDeviceTokens += tokens;
      // Money saved by NOT routing this query to cloud
      return (tokens / 1000) * this.cloudCostPer1k;
    } else {
      this.cloudRequests++;
      return 0.0;
    }
  }

  public getMetrics(): RouterMetrics {
    const totalCostSavedUsd = (this.onDeviceTokens / 1000) * this.cloudCostPer1k;
    const averageLatencyMs =
      this.totalRequests > 0 ? this.totalLatencyMs / this.totalRequests : 0;

    return {
      totalRequests: this.totalRequests,
      onDeviceRequests: this.onDeviceRequests,
      cloudRequests: this.cloudRequests,
      fallbackCount: this.fallbackCount,
      totalTokensProcessed: this.totalTokens,
      onDeviceTokensProcessed: this.onDeviceTokens,
      totalCostSavedUsd,
      averageLatencyMs: Math.round(averageLatencyMs * 10) / 10,
    };
  }

  public reset(): void {
    this.totalRequests = 0;
    this.onDeviceRequests = 0;
    this.cloudRequests = 0;
    this.fallbackCount = 0;
    this.totalTokens = 0;
    this.onDeviceTokens = 0;
    this.totalLatencyMs = 0;
  }
}
