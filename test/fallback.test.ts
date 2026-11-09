import { describe, it, expect } from "vitest";
import { HybridAIRouter } from "../src/router.js";
import { OnDeviceEngineAdapter } from "../src/local-engine.js";
import { CloudEngineAdapter } from "../src/cloud-engine.js";

describe("HybridAIRouter Fallback Circuit Breaker", () => {
  it("escalates to cloud when local on-device engine throws OOM or failure", async () => {
    const localEngine = new OnDeviceEngineAdapter("gemma-2b-it");
    localEngine.setSimulateFailure(true); // simulate local failure

    const cloudEngine = new CloudEngineAdapter("gemini-1.5-flash");

    const router = new HybridAIRouter(
      { complexityThreshold: 0.65 },
      localEngine,
      cloudEngine
    );

    const response = await router.complete({
      prompt: "Routine simple greeting", // would normally route to on-device
    });

    expect(response.tierUsed).toBe("cloud");
    expect(response.isFallback).toBe(true);
    expect(response.reason).toContain("On-device failed");
    expect(response.text).toContain("[Cloud:");

    const metrics = router.getMetrics();
    expect(metrics.fallbackCount).toBe(1);
    expect(metrics.cloudRequests).toBe(1);
  });

  it("recovers via on-device local engine when cloud engine experiences network drop", async () => {
    const localEngine = new OnDeviceEngineAdapter("gemma-2b-it");
    const cloudEngine = new CloudEngineAdapter("gemini-1.5-flash");
    cloudEngine.setSimulateNetworkDrop(true); // simulate cloud network drop

    const router = new HybridAIRouter(
      { complexityThreshold: 0.65 },
      localEngine,
      cloudEngine
    );

    const response = await router.complete({
      prompt:
        "Architect a distributed consensus protocol and calculate proof for fault tolerance step-by-step.", // would normally route to cloud
    });

    expect(response.tierUsed).toBe("on-device");
    expect(response.isFallback).toBe(true);
    expect(response.reason).toContain("Cloud failed");
    expect(response.text).toContain("[OnDevice:");

    const metrics = router.getMetrics();
    expect(metrics.fallbackCount).toBe(1);
    expect(metrics.onDeviceRequests).toBe(1);
  });
});
