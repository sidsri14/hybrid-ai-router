import { ComplexityClassifier } from "./classifier.js";
import { CloudEngineAdapter } from "./cloud-engine.js";
import { OnDeviceEngineAdapter } from "./local-engine.js";
import { InferenceMetricsTracker } from "./metrics.js";
import {
  IEngineAdapter,
  InferenceRequest,
  InferenceResponse,
  RouterConfig,
  RouterMetrics,
  RoutingDecision,
} from "./types.js";

export class HybridAIRouter {
  private classifier: ComplexityClassifier;
  private localEngine: IEngineAdapter;
  private cloudEngine: IEngineAdapter;
  private metrics: InferenceMetricsTracker;

  constructor(
    config?: RouterConfig,
    customLocalEngine?: IEngineAdapter,
    customCloudEngine?: IEngineAdapter
  ) {
    this.classifier = new ComplexityClassifier(config);
    this.localEngine =
      customLocalEngine ?? new OnDeviceEngineAdapter(config?.localModel);
    this.cloudEngine =
      customCloudEngine ?? new CloudEngineAdapter(config?.cloudModel);
    this.metrics = new InferenceMetricsTracker(config?.cloudCostPer1kTokens);
  }

  public getClassifier(): ComplexityClassifier {
    return this.classifier;
  }

  public getMetrics(): RouterMetrics {
    return this.metrics.getMetrics();
  }

  public classify(request: InferenceRequest): RoutingDecision {
    return this.classifier.classify(request);
  }

  public async complete(request: InferenceRequest): Promise<InferenceResponse> {
    const decision = this.classifier.classify(request);
    const startTime = performance.now();

    if (decision.targetTier === "on-device") {
      try {
        const result = await this.localEngine.infer(request);
        const latencyMs = Math.round(performance.now() - startTime);
        const costSaved = this.metrics.recordRequest(
          "on-device",
          result.tokenCount,
          latencyMs,
          false
        );

        return {
          text: result.text,
          tierUsed: "on-device",
          latencyMs,
          estimatedTokens: result.tokenCount,
          costSavedUsd: costSaved,
          isFallback: false,
          reason: decision.reason,
        };
      } catch (localError: any) {
        // Fallback Circuit Breaker: escalate to Cloud
        const cloudResult = await this.cloudEngine.infer(request);
        const latencyMs = Math.round(performance.now() - startTime);
        this.metrics.recordRequest("cloud", cloudResult.tokenCount, latencyMs, true);

        return {
          text: cloudResult.text,
          tierUsed: "cloud",
          latencyMs,
          estimatedTokens: cloudResult.tokenCount,
          costSavedUsd: 0.0,
          isFallback: true,
          reason: `On-device failed (${localError.message}). Escalated to cloud fallback.`,
        };
      }
    } else {
      // Target tier: Cloud
      try {
        const result = await this.cloudEngine.infer(request);
        const latencyMs = Math.round(performance.now() - startTime);
        this.metrics.recordRequest("cloud", result.tokenCount, latencyMs, false);

        return {
          text: result.text,
          tierUsed: "cloud",
          latencyMs,
          estimatedTokens: result.tokenCount,
          costSavedUsd: 0.0,
          isFallback: false,
          reason: decision.reason,
        };
      } catch (cloudError: any) {
        // Fallback Circuit Breaker: fallback to local on-device
        const localResult = await this.localEngine.infer(request);
        const latencyMs = Math.round(performance.now() - startTime);
        const costSaved = this.metrics.recordRequest(
          "on-device",
          localResult.tokenCount,
          latencyMs,
          true
        );

        return {
          text: localResult.text,
          tierUsed: "on-device",
          latencyMs,
          estimatedTokens: localResult.tokenCount,
          costSavedUsd: costSaved,
          isFallback: true,
          reason: `Cloud failed (${cloudError.message}). Recovered via on-device local fallback.`,
        };
      }
    }
  }
}
