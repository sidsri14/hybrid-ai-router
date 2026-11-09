import { describe, it, expect } from "vitest";
import { ComplexityClassifier } from "../src/classifier.js";

describe("ComplexityClassifier", () => {
  const classifier = new ComplexityClassifier({
    complexityThreshold: 0.65,
    maxLocalTokenLength: 1024,
  });

  it("routes short, everyday queries to on-device tier", () => {
    const decision = classifier.classify({
      prompt: "Summarize this reminder: buy milk and bread at 5pm.",
    });

    expect(decision.targetTier).toBe("on-device");
    expect(decision.complexityScore).toBeLessThan(0.65);
    expect(decision.reason).toContain("Routine query");
  });

  it("routes queries containing PII or sensitive keys to on-device tier", () => {
    const decision = classifier.classify({
      prompt: "Extract user info for account with SSN 123-45-6789 and email user@example.com",
    });

    expect(decision.targetTier).toBe("on-device");
    expect(decision.reason).toContain("Privacy-sensitive data detected");
  });

  it("routes queries requiring tool calling to cloud tier", () => {
    const decision = classifier.classify({
      prompt: "Check the weather in Tokyo and book the flight",
      requiresTools: true,
    });

    expect(decision.targetTier).toBe("cloud");
    expect(decision.reason).toContain("Tool calling requires");
  });

  it("routes highly complex multi-step reasoning queries to cloud tier", () => {
    const decision = classifier.classify({
      prompt:
        "Architect a distributed multi-step transaction consensus protocol. Calculate proof and optimize algorithm for high concurrency.",
    });

    expect(decision.targetTier).toBe("cloud");
    expect(decision.complexityScore).toBeGreaterThanOrEqual(0.65);
    expect(decision.reason).toContain("High semantic complexity");
  });

  it("honors explicit forceTier override", () => {
    const forcedLocal = classifier.classify({
      prompt: "Complex multi-step quantum physics deduction",
      forceTier: "on-device",
    });
    expect(forcedLocal.targetTier).toBe("on-device");

    const forcedCloud = classifier.classify({
      prompt: "Hello",
      forceTier: "cloud",
    });
    expect(forcedCloud.targetTier).toBe("cloud");
  });

  it("forces on-device routing when in offline mode", () => {
    const offlineClassifier = new ComplexityClassifier({
      offlineMode: true,
    });

    const decision = offlineClassifier.classify({
      prompt: "Architect and synthesize a complex fullstack application with proof",
    });

    expect(decision.targetTier).toBe("on-device");
    expect(decision.reason).toContain("Offline mode active");
  });
});
