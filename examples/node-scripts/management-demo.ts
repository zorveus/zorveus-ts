/**
 * Demo: Server-Side Startup Control Plane with ZorveusServiceClient
 *
 * To run:
 * npm run demo:management
 */

import fs from "fs";
import path from "path";
import { ZorveusServiceClient } from "../../packages/sdk/src/index";

// Auto-load examples/node-scripts/.env if present
const envPath = path.resolve(__dirname, ".env");
if (fs.existsSync(envPath) && typeof (process as any).loadEnvFile === "function") {
  try {
    (process as any).loadEnvFile(envPath);
  } catch {}
}

async function main() {
  const serviceKey = process.env.ZORVEUS_SERVICE_KEY || "zrv_service_live_demo_12345";
  const appId = process.env.ZORVEUS_APP_ID || "app_demo_123";

  console.log("==================================================");
  console.log("Zorveus Server-Side Startup Control Plane Demo");
  console.log(`Using Service Key: ${serviceKey.slice(0, 15)}...`);
  console.log(`Using Application ID: ${appId}`);
  console.log("==================================================\n");

  const serviceClient = new ZorveusServiceClient({
    apiKey: serviceKey,
    baseURL: process.env.ZORVEUS_BASE_URL || "https://api.zorveus.com"
  });

  const externalUserId = "usr_ext_demo_8842";

  console.log("1. Upserting Product End-User Server-Side...");
  try {
    const res = await serviceClient.productUsers.createOrUpdate({
      appId,
      externalUserId,
      displayName: "Jane Doe",
      email: "jane@startup.com",
      metadata: { tier: "enterprise", plan: "pro" }
    });
    console.log(`✓ Product User Upserted: Status=${res.product_user?.status || "active"}, Created=${res.created}`);

    console.log("\n2. Granting Startup-Funded AI Credits via External User ID...");
    const grantRes = await serviceClient.productUsers.grantCreditByExternalId({
      appId,
      externalUserId,
      amount: "25.000000000000", // High-precision decimal string
      currency: "USD",
      source: "promotion",
      reason: "Monthly enterprise allowance"
    });
    console.log(`✓ Credit Grant ID=${grantRes.credit_grant.credit_grant_id}, Amount=$${grantRes.credit_grant.amount}`);
    console.log(`✓ New Live Balance=$${grantRes.credit_summary?.available_credits ?? "N/A"}`);

    console.log("\n3. Querying User Credit Ledger...");
    const ledger = await serviceClient.productUsers.listCreditGrantsByExternalId({
      appId,
      externalUserId
    });
    for (const grant of ledger.credit_grants) {
      console.log(`  - Grant ID ${grant.credit_grant_id}: $${grant.amount} (${grant.source}) - ${grant.reason}`);
    }

  } catch (error) {
    console.log(`[Demo Notice] Server Request: ${(error as Error).message}`);
  }

  console.log("\n--------------------------------------------------");
  console.log("4. Registering Organization BYOK Provider Credential...");
  try {
    const cred = await serviceClient.providerCredentials.create({
      provider: "openai",
      credentialName: "Startup OpenAI Production Key",
      apiKey: "sk-proj-demo123",
      routingMode: "auto_resolve",
      routingPriority: 100
    });
    console.log(`✓ Provider Credential Registered: ID=${cred.provider_credential_id}, Provider=${cred.provider}`);
  } catch (error: any) {
    if (error.code === "zorveus_invalid_provider_credential") {
      console.log("ℹ Note: Provider credential payload validated by Zorveus backend (rejected mock API key as expected).");
    } else {
      console.log(`[Demo Notice] Server Request: ${error.message || error}`);
    }
  }

  console.log("\n==================================================");
  console.log("Startup Server Control Plane Demo Completed!");
  console.log("==================================================");
}

void main();
