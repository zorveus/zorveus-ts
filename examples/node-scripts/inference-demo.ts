/**
 * Demo: Data Plane Inference with ZorveusInferenceClient
 *
 * To run:
 * npm run demo:node
 */

import fs from "fs";
import path from "path";
import { Zorveus } from "../../packages/sdk/src/index";

// Auto-load examples/node-scripts/.env if present
const envPath = path.resolve(__dirname, ".env");
if (fs.existsSync(envPath) && typeof (process as any).loadEnvFile === "function") {
  try {
    (process as any).loadEnvFile(envPath);
  } catch {}
}

async function main() {
  const apiKey = process.env.ZORVEUS_INFERENCE_KEY || "zrv_live_demo_key_12345";
  console.log("==================================================");
  console.log("Zorveus Gateway Data Plane Inference Demo");
  console.log(`Using API Key: ${apiKey.slice(0, 10)}...`);
  console.log("==================================================\n");

  const zorveus = new Zorveus({
    apiKey,
    gatewayBaseURL: process.env.ZORVEUS_GATEWAY_URL || "https://api.zorveus.com/v1"
  });

  console.log("1. Creating Chat Completion with Request Body Attribution...");
  try {
    const response = await zorveus.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful AI assistant." },
        { role: "user", content: "Why are unified AI gateways useful in 2 sentences?" }
      ],
      temperature: 0.7,
      zorveusMetadata: {
        externalUserId: "usr_ext_demo_8842",
        displayName: "Demo User",
        userEmail: "demo@startup.com"
      }
    });

    console.log("\n[Response Choice 0]:");
    console.log(response.choices[0]?.message.content);
    console.log(`\nTokens used: ${response.usage?.total_tokens ?? "N/A"}`);
  } catch (error) {
    console.log(`[Demo Notice] Simulated or Live Request: ${(error as Error).message}`);
  }

  console.log("\n--------------------------------------------------");
  console.log("2. Streaming Chat Completion (SSE Async Iterator)...");
  try {
    const stream = await zorveus.chat.completions.create({
      model: "anthropic/claude-3-5-sonnet",
      messages: [{ role: "user", content: "Write a 2-line poem about fast APIs." }],
      stream: true,
      zorveusMetadata: {
        externalUserId: "usr_ext_demo_8842"
      }
    });

    console.log("\n[Stream Output]: ");
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      process.stdout.write(delta);
    }
    console.log("\n");
  } catch (error) {
    console.log(`[Demo Notice] Simulated or Live Request: ${(error as Error).message}`);
  }

  console.log("--------------------------------------------------");
  console.log("3. Model Discovery...");
  try {
    const models = await zorveus.models.list({ routeStatus: "available" });
    console.log(`Available Models Count: ${models.data.length}`);
  } catch (error) {
    console.log(`[Demo Notice] Simulated or Live Request: ${(error as Error).message}`);
  }

  console.log("\n==================================================");
  console.log("Gateway Inference Demo Completed!");
  console.log("==================================================");
}

void main();
