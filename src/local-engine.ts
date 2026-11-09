import { IEngineAdapter, InferenceRequest } from "./types.js";

export class OnDeviceEngineAdapter implements IEngineAdapter {
  private modelName: string;
  private shouldSimulateFailure: boolean = false;
  private latencyMultiplier: number;

  constructor(modelName: string = "gemma-2b-it", latencyMultiplier: number = 1.0) {
    this.modelName = modelName;
    this.latencyMultiplier = latencyMultiplier;
  }

  public setSimulateFailure(fail: boolean): void {
    this.shouldSimulateFailure = fail;
  }

  public async isAvailable(): Promise<boolean> {
    return !this.shouldSimulateFailure;
  }

  public async infer(request: InferenceRequest): Promise<{ text: string; tokenCount: number }> {
    if (this.shouldSimulateFailure) {
      throw new Error(`[OnDeviceEngine] Local model '${this.modelName}' out of memory or unavailable.`);
    }

    // Simulate fast local token generation latency (15ms - 40ms)
    const simulatedLatency = Math.floor((15 + Math.random() * 25) * this.latencyMultiplier);
    await new Promise((resolve) => setTimeout(resolve, simulatedLatency));

    const tokenCount = Math.max(10, Math.ceil(request.prompt.length / 4));
    const generatedText = `[OnDevice:${this.modelName}] Processed: "${request.prompt.substring(0, 40)}..." (Executed locally on-device with zero cloud latency/cost).`;

    return {
      text: generatedText,
      tokenCount,
    };
  }
}
