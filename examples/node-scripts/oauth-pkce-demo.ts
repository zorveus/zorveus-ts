/**
 * Demo: Interactive Isomorphic OAuth PKCE Flow with @zorveus/sdk
 *
 * To run:
 * npm run demo:oauth
 */

import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import fs from "fs";
import path from "path";
import { Zorveus, ZorveusOAuth } from "../../packages/sdk/src/index";

// Auto-load examples/node-scripts/.env if present
const envPath = path.resolve(__dirname, ".env");
if (fs.existsSync(envPath) && typeof (process as any).loadEnvFile === "function") {
  try {
    (process as any).loadEnvFile(envPath);
  } catch {}
}

async function main() {
  const rl = readline.createInterface({ input, output });

  console.log("==================================================");
  console.log("Zorveus Interactive OAuth PKCE Demo (RFC 7636)");
  console.log("==================================================\n");

  const clientId = process.env.ZORVEUS_CLIENT_ID || "zrv_client_demo_123";
  const clientSecret = process.env.ZORVEUS_CLIENT_SECRET || undefined;
  const redirectUri = process.env.ZORVEUS_REDIRECT_URI || "http://localhost:5173/oauth/callback";
  const baseURL = process.env.ZORVEUS_BASE_URL || "https://api.zorveus.com";

  console.log("1. Generating Cryptographic PKCE Data...");
  const { codeVerifier, codeChallenge, state } = await ZorveusOAuth.generatePKCE();

  console.log(`- Code Verifier:  ${codeVerifier}`);
  console.log(`- Code Challenge: ${codeChallenge}`);
  console.log(`- CSRF State:      ${state}`);

  console.log("\n2. Generating Authorization URL...");
  const authUrl = ZorveusOAuth.getAuthorizationUrl({
    clientId,
    redirectUri,
    state,
    codeChallenge,
    baseURL,
    scopes: ["inference:write", "models:*"]
  });

  console.log("\nCopy and paste this URL into your browser to authorize:\n");
  console.log(`👉 ${authUrl}\n`);

  console.log("Waiting for user authorization...\n");
  const rawInput = await rl.question(
    "Paste the full redirect URL (or auth code) from your browser:\n> "
  );
  rl.close();

  const userInput = rawInput.trim();
  if (!userInput) {
    console.error("\nError: No input provided. Demo cancelled.");
    return;
  }

  console.log("\n3. Validating Callback Parameters & CSRF State Token...");
  const hasUrlQuery = userInput.startsWith("http") || userInput.includes("code=");
  const validation = ZorveusOAuth.validateCallback({
    urlOrParams: hasUrlQuery ? userInput : `?code=${userInput}&state=${state}`,
    expectedState: hasUrlQuery ? state : undefined
  });

  if (!validation.valid || !validation.code) {
    console.error(`\nValidation Error (${validation.error}): ${validation.errorDescription || "Invalid response"}`);
    return;
  }

  console.log(`✓ Authorization Code Extracted: ${validation.code}`);

  console.log("\n4. Exchanging Authorization Code for Access Token...");
  try {
    const tokenRes = await ZorveusOAuth.exchangeToken({
      clientId,
      clientSecret,
      code: validation.code,
      codeVerifier,
      redirectUri,
      baseURL
    });

    console.log("\n==================================================");
    console.log("OAuth Token Exchange Successful!");
    console.log(`- Access Token:      ${tokenRes.access_token}`);
    console.log(`- App Connection ID: ${tokenRes.app_connection_id}`);
    console.log("==================================================\n");

    console.log("5. Running Live Inference Test with Issued Access Token...");
    const client = new Zorveus({
      apiKey: tokenRes.access_token,
      gatewayBaseURL: process.env.ZORVEUS_GATEWAY_URL || `${baseURL}/v1`
    });

    const completion = await client.chat.completions.create({
      model: "openai/gpt-4.1-mini",
      messages: [{ role: "user", content: "Hello from Zorveus OAuth PKCE demo!" }]
    });

    console.log("\nAI Response:");
    console.log(completion.choices[0]?.message?.content);

  } catch (err: any) {
    console.log("\nToken exchange step reached.");
    console.log(`Result: ${err.message || err}`);
  }
}

void main();
