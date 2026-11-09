# Hybrid AI Router (`hybrid-ai-router`)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript: 5.5+](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org/)
[![Tests: 11/11 Passing](https://img.shields.io/badge/tests-11%2F11%20passing-brightgreen.svg)](test/)
[![Challenge: #BuildHybridAI 2026](https://img.shields.io/badge/Hackathon-%23BuildHybridAI%202026-orange.svg)](https://devpost.com)

**Intelligent Hybrid Inference Router blending on-device models with cloud LLMs for zero-cost routing, offline resilience, and latency optimization.**

Engineered for the Google **#BuildHybridAI 2026** Challenge ($30,000 Prize Pool) on Devpost.

---

## 1. The Problem in AI Inference

Modern AI applications suffer from a costly binary trade-off:
1. **100% Cloud-Dependent Inference**: Sending every prompt (even routine summaries, formatting, and classification) to remote frontier APIs causes:
   - High cumulative API bills ($350–$2,000+ per million queries).
   - High latency (250ms–1500ms network round-trips).
   - Complete application failure when users go offline or mobile networks drop.
   - PII and sensitive data leakage (SSNs, API keys, credentials) sent to third-party endpoints.
2. **100% Local / On-Device Models**: Small language models (SLMs like Gemma 2B, SmolLM) offer instant responses and zero cost, but fail on complex multi-step reasoning, large context windows, and tool synthesis.

### The Hybrid Solution
`hybrid-ai-router` provides a dynamic, resilient hybrid inference layer:
- **Zero-Cost On-Device First**: Routes routine, high-frequency, or privacy-sensitive prompts directly to local models (Gemma 2B / WebGPU / local execution) with <30ms latency and $0.00 cost.
- **Cognitive Cloud Escalation**: Seamlessly escalates complex reasoning, multi-step planning, tool-calling, or large-context queries to Google Gemini 1.5 Pro / Flash.
- **Bidirectional Circuit-Breaker Fallback**:
  - If on-device inference encounters memory pressure or crashes, automatically escalates to Cloud.
  - If cloud network times out or drops, automatically recovers via on-device execution.
- **Real-Time Cost & Latency Telemetry**: Tracks cumulative dollars saved and latency gains per session.

---

## 2. Architecture

```mermaid
flowchart TD
    UserQuery["User Prompt / Inference Request"] --> Classifier["ComplexityClassifier"]
    
    Classifier -->|PII / Privacy Sensitive| Local["On-Device Engine (Gemma 2B)"]
    Classifier -->|Offline Mode Active| Local
    Classifier -->|Score < 0.65 (Routine)| Local
    Classifier -->|Score >= 0.65 (Complex Reasoning)| Cloud["Cloud Engine (Gemini 1.5)"]
    Classifier -->|Requires Tool Calling| Cloud
    Classifier -->|Token Length > Threshold| Cloud
    
    Local -->|Success (15-35ms)| Response["Inference Response + Savings Metrics"]
    Local -.->|Local OOM / Crash| CloudFallback["Escalate to Cloud Fallback"]
    CloudFallback --> Response
    
    Cloud -->|Success (180-350ms)| Response
    Cloud -.->|Network Drop / Offline| LocalFallback["Recover via On-Device Fallback"]
    LocalFallback --> Response
```

---

## 3. Key Capabilities

| Capability | On-Device Tier | Cloud Tier (Gemini) |
|---|---|---|
| **Typical Latency** | 15ms – 40ms | 180ms – 350ms |
| **Token Cost** | **$0.00** | $0.00035 / 1k tokens |
| **Offline Capability** | 100% Functional | Fails without network |
| **Privacy / PII** | Zero data leaves device | Subject to cloud transfer |
| **Tool Calling** | Unsupported / Fragile | Native high-accuracy function calling |
| **Reasoning Depth** | Fast heuristics & formatting | Deep multi-step chain-of-thought |

---

## 4. Quickstart

### Installation
```bash
npm install hybrid-ai-router
```

### Usage
```typescript
import { createHybridRouter } from "hybrid-ai-router";

const router = createHybridRouter({
  cloudModel: "gemini-1.5-flash",
  localModel: "gemma-2b-it",
  cloudCostPer1kTokens: 0.00035,
  complexityThreshold: 0.65,
});

// 1. Routine prompt -> automatically routes to on-device ($0.00 cost, <30ms latency)
const routineResponse = await router.complete({
  prompt: "Summarize this reminder: buy milk and bread at 5pm.",
});
console.log(routineResponse.tierUsed);     // "on-device"
console.log(routineResponse.costSavedUsd); // $0.000007 (recorded savings)

// 2. Complex architectural prompt -> automatically escalates to Gemini
const complexResponse = await router.complete({
  prompt: "Architect a distributed multi-step transaction consensus protocol. Calculate proof for fault tolerance.",
});
console.log(complexResponse.tierUsed);     // "cloud"

// 3. Inspect cumulative telemetry
const metrics = router.getMetrics();
console.log(metrics);
// {
//   totalRequests: 2,
//   onDeviceRequests: 1,
//   cloudRequests: 1,
//   totalCostSavedUsd: 0.000007,
//   averageLatencyMs: 112.5
// }
```

---

## 5. Verification & Tests

```bash
npm test
```

Test suite output:
```
 ✓ test/classifier.test.ts (6 tests)
 ✓ test/metrics.test.ts (1 test)
 ✓ test/router.test.ts (2 tests)
 ✓ test/fallback.test.ts (2 tests)

 Test Files  4 passed (4)
      Tests  11 passed (11)
```

---

## 6. Author & Hackathon Alignment

* **Author**: Siddharth Srivastava ([@sidsri14](https://github.com/sidsri14))
* **Contact**: `sidsri1502@gmail.com` | **PayPal Payout**: `sidsri1302@gmail.com`
* **Target Hackathon**: [#BuildHybridAI 2026](https://devpost.com) ($30,000 Devpost Challenge, Nov 9 – Nov 30, 2026)
