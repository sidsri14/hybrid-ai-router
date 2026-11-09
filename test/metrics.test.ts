import { describe, it, expect } from "vitest";
import { InferenceMetricsTracker } from "../src/metrics.js";

describe("InferenceMetricsTracker", () => {
  it("accurately tracks requests, tokens, and computed cost savings", () => {
    const tracker = new InferenceMetricsTracker(0.00035);

    // 1st request: On-device with 2,000 tokens
    const saved1 = tracker.recordRequest("on-device", 2000, 25, false);
    expect(saved1).toBeCloseTo(0.0007, 4);

    // 2nd request: Cloud with 5,000 tokens
    const saved2 = tracker.recordRequest("cloud", 5000, 250, false);
    expect(saved2).toBe(0.0);

    // 3rd request: On-device with 8,000 tokens (fallback)
    const saved3 = tracker.recordRequest("on-device", 8000, 30, true);
    expect(saved3).toBeCloseTo(0.0028, 4);

    const metrics = tracker.getMetrics();
    expect(metrics.totalRequests).toBe(3);
    expect(metrics.onDeviceRequests).toBe(2);
    expect(metrics.cloudRequests).toBe(1);
    expect(metrics.fallbackCount).toBe(1);
    expect(metrics.totalTokensProcessed).toBe(15000);
    expect(metrics.onDeviceTokensProcessed).toBe(10000);
    expect(metrics.totalCostSavedUsd).toBeCloseTo(0.0035, 4);
  });
});
