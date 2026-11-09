import { describe, it, expect } from "vitest";
import { HybridAIRouter } from "../src/router.js";

describe("HybridAIRouter Execution", () => {
  it("executes routine queries locally on-device with low latency and recorded savings", async () => {
    const router = new HybridAIRouter({
      cloudCostPer1kTokens: 0.00035,
      complexityThreshold: 0.65,
    });

    const response = await router.complete({
      prompt: "Translate 'Good morning' to Spanish and French.",
    });

    expect(response.tierUsed).toBe("on-device");
    expect(response.isFallback).toBe(false);
    expect(response.text).toContain("[OnDevice:");
    expect(response.costSavedUsd).toBeGreaterThan(0);
    expect(response.latencyMs).toBeLessThan(200);
  });

  it("escalates complex queries to cloud engine", async () => {
    const router = new HybridAIRouter({
      complexityThreshold: 0.65,
    });

    const response = await router.complete({
      prompt:
        "Architect a distributed consensus protocol and calculate proof for fault tolerance step-by-step.",
    });

    expect(response.tierUsed).toBe("cloud");
    expect(response.isFallback).toBe(false);
    expect(response.text).toContain("[Cloud:");
    expect(response.costSavedUsd).toBe(0);
  });
});
