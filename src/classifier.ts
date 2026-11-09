import { InferenceRequest, RoutingDecision, RouterConfig } from "./types.js";

export class ComplexityClassifier {
  private config: Required<RouterConfig>;

  // Keywords that signal high cognitive demand or complex multi-step reasoning
  private static readonly COMPLEX_PATTERNS = [
    /\b(solve|calculate|proof|theorem|derive|deduce)\b/i,
    /\b(architect|refactor|design pattern|optimize algorithm|algorithm)\b/i,
    /\b(critique|analyze|compare and contrast|evaluate)\b/i,
    /\b(synthesize|multi-step|step-by-step|reasoning|chain-of-thought)\b/i,
    /\b(consensus|distributed|fault tolerance|concurrency|database)\b/i,
    /\b(code|function|class|sql|regex|typescript|python)\s*\{/i,
  ];

  // PII or privacy-sensitive patterns that mandate on-device execution
  private static readonly PII_PATTERNS = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/, // Credit Card
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /\b(password|secret_key|api_key|bearer token|auth)\b/i,
  ];

  constructor(config?: RouterConfig) {
    this.config = {
      cloudModel: config?.cloudModel ?? "gemini-1.5-flash",
      localModel: config?.localModel ?? "gemma-2b-it",
      cloudCostPer1kTokens: config?.cloudCostPer1kTokens ?? 0.00035,
      complexityThreshold: config?.complexityThreshold ?? 0.65,
      maxLocalTokenLength: config?.maxLocalTokenLength ?? 1024,
      offlineMode: config?.offlineMode ?? false,
    };
  }

  public estimateTokenCount(text: string): number {
    // Rough ~4 chars per token approximation for fast synchronous classification
    return Math.max(1, Math.ceil(text.length / 4));
  }

  public classify(request: InferenceRequest): RoutingDecision {
    const fullText = `${request.systemInstruction ?? ""} ${request.prompt}`.trim();
    const tokenEstimate = this.estimateTokenCount(fullText);

    // 1. Force Tier Override
    if (request.forceTier) {
      return {
        targetTier: request.forceTier,
        reason: `Explicit override: forced ${request.forceTier}`,
        complexityScore: request.forceTier === "cloud" ? 1.0 : 0.0,
        tokenEstimate,
      };
    }

    // 2. Offline Mode
    if (this.config.offlineMode) {
      return {
        targetTier: "on-device",
        reason: "Offline mode active: routing to local on-device engine",
        complexityScore: 0.0,
        tokenEstimate,
      };
    }

    // 3. Privacy / PII Guardrail: Zero Cloud Leakage
    if (request.privacySensitive || this.hasPII(fullText)) {
      return {
        targetTier: "on-device",
        reason: "Privacy-sensitive data detected: forced on-device execution",
        complexityScore: 0.0,
        tokenEstimate,
      };
    }

    // 4. Tool Calling Requirement (Local SLMs generally lack reliable tool synthesis)
    if (request.requiresTools) {
      return {
        targetTier: "cloud",
        reason: "Tool calling requires frontier cloud model capabilities",
        complexityScore: 0.95,
        tokenEstimate,
      };
    }

    // 5. Context Length Exceeded
    if (tokenEstimate > this.config.maxLocalTokenLength) {
      return {
        targetTier: "cloud",
        reason: `Token length (${tokenEstimate}) exceeds local model threshold (${this.config.maxLocalTokenLength})`,
        complexityScore: 0.9,
        tokenEstimate,
      };
    }

    // 6. Linguistic & Semantic Complexity Scoring
    const complexityScore = this.computeComplexityScore(fullText, tokenEstimate);
    if (complexityScore >= this.config.complexityThreshold) {
      return {
        targetTier: "cloud",
        reason: `High semantic complexity score (${complexityScore.toFixed(2)} >= ${this.config.complexityThreshold})`,
        complexityScore,
        tokenEstimate,
      };
    }

    return {
      targetTier: "on-device",
      reason: `Routine query suitable for on-device inference (complexity ${complexityScore.toFixed(2)} < ${this.config.complexityThreshold})`,
      complexityScore,
      tokenEstimate,
    };
  }

  private hasPII(text: string): boolean {
    return ComplexityClassifier.PII_PATTERNS.some((pattern) => pattern.test(text));
  }

  private computeComplexityScore(text: string, tokenEstimate: number): number {
    let score = 0.2; // base score

    // Token length weight (up to +0.3)
    const lengthFactor = Math.min(1.0, tokenEstimate / this.config.maxLocalTokenLength);
    score += lengthFactor * 0.3;

    // Pattern matches (each match adds +0.2, capped at +0.6)
    let patternMatches = 0;
    for (const pattern of ComplexityClassifier.COMPLEX_PATTERNS) {
      if (pattern.test(text)) {
        patternMatches++;
      }
    }
    score += Math.min(0.6, patternMatches * 0.2);

    return Math.min(1.0, Math.max(0.0, score));
  }
}
