import fs from "fs";
import path from "path";
import { Zorveus } from "../../packages/sdk/src/index";
import { ZorveusOpenAI } from "../../packages/sdk/src/adapters/openai";

// Load environment variables if present
const envPath = path.resolve(__dirname, ".env");
if (fs.existsSync(envPath) && typeof (process as any).loadEnvFile === "function") {
  try {
    (process as any).loadEnvFile(envPath);
  } catch {}
}

async function main() {
  const apiKey = process.env.ZORVEUS_INFERENCE_KEY;
  const baseURL = process.env.ZORVEUS_BASE_URL || "http://localhost:8000";
  const gatewayBaseURL = process.env.ZORVEUS_GATEWAY_URL || "http://localhost:4000/v1";

  if (!apiKey) {
    console.error("Missing ZORVEUS_INFERENCE_KEY in environment.");
    return;
  }

  console.log("==================================================");
  console.log("Zorveus Inference Gateway Data Plane Demo");
  console.log(`Control Plane: ${baseURL}`);
  console.log(`Gateway URL:   ${gatewayBaseURL}`);
  console.log("==================================================\n");

  const zorveus = new Zorveus({
    apiKey,
    baseURL,
    gatewayBaseURL
  });

  // 1. Query live spend cap and remaining allowance
  console.log("1. Querying live inference key usage...");
  try {
    const usage = await zorveus.getUsage();
    console.log(`Spend Cap:         $${usage.spend_cap}`);
    console.log(`Spent This Period: $${usage.spent_this_period}`);
    console.log(`Remaining Balance: $${usage.remaining_balance}`);
    console.log(`Currency:          ${usage.currency}`);
  } catch (err: any) {
    console.log(`Usage query notice: ${err.message}`);
  }

  // 2. Discover available models on the gateway
  console.log("\n2. Discovering models on the gateway...");
  const modelList = await zorveus.models.list();
  const models = modelList.data ?? [];
  console.log(`Available Models: ${models.length}`);

  // Select an active model
  const activeModel =
    models.find((m) => m.id.includes("gemini-2.5-flash"))?.id ||
    models.find((m) => m.id.includes("flash"))?.id ||
    "gemini/gemini-2.5-flash";

  console.log(`Selected Model:   ${activeModel}`);

  // 3. Create non-streaming chat completion with end-user attribution
  console.log("\n3. Creating chat completion with request attribution...");
  try {
    const completion = await zorveus.chat.completions.create({
      model: activeModel,
      messages: [
        { role: "system", content: "You are a concise AI assistant. Answer in one short sentence." },
        { role: "user", content: "Explain why unified AI gateways help SaaS startups." }
      ],
      zorveusMetadata: {
        externalUserId: "user_demo_8842",
        productEndUserId: "peu_demo_8842",
        displayName: "Demo User",
        userEmail: "demo@startup.com"
      }
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() ?? "";
    console.log(`Model Response: ${reply}`);
    console.log(`Tokens: Prompt=${completion.usage?.prompt_tokens ?? "N/A"}, Completion=${completion.usage?.completion_tokens ?? "N/A"}`);
  } catch (err: any) {
    console.log(`Chat completion notice: ${err.message}`);
  }

  // 4. Streaming chat completion using SSE async iterator
  console.log("\n4. Streaming chat completion (SSE)...");
  try {
    const stream = await zorveus.chat.completions.create({
      model: activeModel,
      messages: [{ role: "user", content: "Count from 1 to 5, one per line." }],
      stream: true,
      zorveusMetadata: {
        externalUserId: "user_demo_8842"
      }
    });

    process.stdout.write("Stream output: ");
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content ?? "";
      process.stdout.write(delta);
    }
    console.log("\nStream finished.");
  } catch (err: any) {
    console.log(`Streaming notice: ${err.message}`);
  }

  // 5. ZorveusOpenAI Adapter check
  console.log("\n5. Testing ZorveusOpenAI adapter wrapper...");
  const adapter = new ZorveusOpenAI({
    apiKey,
    baseURL: gatewayBaseURL
  });
  console.log(`Adapter chat completions initialized: ${typeof adapter.chat?.completions?.create === "function"}`);

  console.log("\n==================================================");
  console.log("Inference demo finished successfully.");
  console.log("==================================================");
}

void main();
