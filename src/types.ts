export type InferenceTier = "on-device" | "cloud";

export interface InferenceRequest {
  prompt: string;
  systemInstruction?: string;
  maxTokens?: number;
  temperature?: number;
  requiresTools?: boolean;
  privacySensitive?: boolean;
  forceTier?: InferenceTier;
}

export interface InferenceResponse {
  text: string;
  tierUsed: InferenceTier;
  latencyMs: number;
  estimatedTokens: number;
  costSavedUsd: number;
  isFallback: boolean;
  reason: string;
}

export interface RoutingDecision {
  targetTier: InferenceTier;
  reason: string;
  complexityScore: number;
  tokenEstimate: number;
}

export interface RouterConfig {
  cloudModel?: string;
  localModel?: string;
  cloudCostPer1kTokens?: number; // e.g. 0.00035 for Gemini 1.5 Flash
  complexityThreshold?: number; // 0.0 to 1.0 (above threshold escalates to cloud)
  maxLocalTokenLength?: number; // max prompt tokens local model can handle safely
  offlineMode?: boolean;
}

export interface IEngineAdapter {
  infer(request: InferenceRequest): Promise<{ text: string; tokenCount: number }>;
  isAvailable(): Promise<boolean>;
}

export interface RouterMetrics {
  totalRequests: number;
  onDeviceRequests: number;
  cloudRequests: number;
  fallbackCount: number;
  totalTokensProcessed: number;
  onDeviceTokensProcessed: number;
  totalCostSavedUsd: number;
  averageLatencyMs: number;
}
