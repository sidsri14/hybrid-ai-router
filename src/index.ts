export * from "./types.js";
export * from "./classifier.js";
export * from "./local-engine.js";
export * from "./cloud-engine.js";
export * from "./metrics.js";
export * from "./router.js";

import { HybridAIRouter } from "./router.js";
import { RouterConfig } from "./types.js";

export function createHybridRouter(config?: RouterConfig): HybridAIRouter {
  return new HybridAIRouter(config);
}
