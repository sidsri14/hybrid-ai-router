import { IEngineAdapter, InferenceRequest } from "./types.js";

export class CloudEngineAdapter implements IEngineAdapter {
  private modelName: string;
  private shouldSimulateNetworkDrop: boolean = false;

  constructor(modelName: string = "gemini-1.5-flash") {
    this.modelName = modelName;
  }

  public setSimulateNetworkDrop(drop: boolean): void {
    this.shouldSimulateNetworkDrop = drop;
  }

  public async isAvailable(): Promise<boolean> {
    return !this.shouldSimulateNetworkDrop;
  }

  public async infer(request: InferenceRequest): Promise<{ text: string; tokenCount: number }> {
    if (this.shouldSimulateNetworkDrop) {
      throw new Error(`[CloudEngine] Network timeout or connection refused connecting to cloud endpoint '${this.modelName}'.`);
    }

    // Simulate round-trip cloud latency (180ms - 350ms)
    const simulatedLatency = Math.floor(180 + Math.random() * 170);
    await new Promise((resolve) => setTimeout(resolve, simulatedLatency));

    const tokenCount = Math.max(25, Math.ceil(request.prompt.length / 3.8));
    const generatedText = `[Cloud:${this.modelName}] High-capacity cloud synthesis for complex prompt: "${request.prompt.substring(0, 50)}...". Includes full multi-step reasoning.`;

    return {
      text: generatedText,
      tokenCount,
    };
  }
}
