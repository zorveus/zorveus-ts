/**
 * Demo: Server-Side Startup Control Plane with ZorveusServiceClient
 *
 * To run:
 * npm run demo:management
 */

import { ZorveusServiceClient } from "../../packages/sdk/src/index";

async function main() {
  const serviceKey = process.env.ZORVEUS_SERVICE_KEY || "zrv_service_live_demo_12345";
  console.log("==================================================");
  console.log("Zorveus Server-Side Startup Control Plane Demo");
  console.log(`Using Service Key: ${serviceKey.slice(0, 15)}...`);
  console.log("==================================================\n");

  const serviceClient = new ZorveusServiceClient({
    apiKey: serviceKey,
    baseURL: process.env.ZORVEUS_BASE_URL || "https://api.zorveus.com"
  });

  const orgId = "org_demo_123";

  console.log("1. Upserting Product End-User Server-Side...");
  try {
    const res = await serviceClient.productUsers.createOrUpdate({
      orgId,
      externalUserId: "usr_ext_demo_8842",
      displayName: "Jane Doe",
      email: "jane@startup.com",
      metadata: { tier: "enterprise", plan: "pro" }
    });
    console.log(`Product User Response: ID=${res.product_user.product_end_user_id}, Created=${res.created}`);

    console.log("\n2. Granting Startup-Funded AI Credits (Decimal String Safety)...");
    const grantRes = await serviceClient.productUsers.grantCredit(
      res.product_user.product_end_user_id,
      {
        orgId,
        appId: "app_demo_789",
        amount: "25.0000", // Decimal string for financial safety
        currency: "USD",
        reason: "Monthly enterprise allowance"
      }
    );
    console.log(`Credit Grant ID=${grantRes.credit_grant.credit_grant_id}, Amount=$${grantRes.credit_grant.amount}`);
    console.log(`Updated Total Remaining=$${grantRes.credit_summary.total_remaining}`);
  } catch (error) {
    console.log(`[Demo Notice] Simulated or Live Request: ${(error as Error).message}`);
  }

  console.log("\n--------------------------------------------------");
  console.log("3. Registering Organization BYOK Provider Credential...");
  try {
    const cred = await serviceClient.providerCredentials.create({
      orgId,
      provider: "openai",
      credentialName: "Startup OpenAI Production Key",
      apiKey: "sk-proj-demo123",
      routingMode: "auto_resolve",
      routingPriority: 100
    });
    console.log(`Provider Credential Registered: ID=${cred.provider_credential_id}, Provider=${cred.provider}`);
  } catch (error) {
    console.log(`[Demo Notice] Simulated or Live Request: ${(error as Error).message}`);
  }

  console.log("\n==================================================");
  console.log("Startup Server Control Plane Demo Completed!");
  console.log("==================================================");
}

void main();
