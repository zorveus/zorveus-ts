import fs from "fs";
import path from "path";
import { ZorveusServiceClient } from "../../packages/sdk/src/index";

// Load environment variables if present
const envPath = path.resolve(__dirname, ".env");
if (fs.existsSync(envPath) && typeof (process as any).loadEnvFile === "function") {
  try {
    (process as any).loadEnvFile(envPath);
  } catch {}
}

async function main() {
  const serviceKey = process.env.ZORVEUS_SERVICE_KEY;
  const appId = process.env.ZORVEUS_APP_ID;
  const baseURL = process.env.ZORVEUS_BASE_URL || "http://localhost:8000";

  if (!serviceKey || !appId) {
    console.error("Missing ZORVEUS_SERVICE_KEY or ZORVEUS_APP_ID in environment.");
    return;
  }

  console.log("==================================================");
  console.log("Zorveus Service Client Management Demo");
  console.log(`Base URL: ${baseURL}`);
  console.log(`App ID:   ${appId}`);
  console.log("==================================================\n");

  const service = new ZorveusServiceClient({
    apiKey: serviceKey,
    baseURL
  });

  const externalUserId = `user_demo_${Date.now()}`;

  // 1. Upsert product end-user
  console.log("1. Upserting product user by external ID...");
  const upsertRes = await service.productUsers.createOrUpdate({
    appId,
    externalUserId,
    displayName: "Demo Operator",
    email: "operator@example.com",
    metadata: { tier: "pro", department: "engineering" }
  });
  console.log(`Created: ${upsertRes.created}`);
  console.log(`User ID: ${upsertRes.product_user?.product_end_user_id}`);
  console.log(`Status:  ${upsertRes.product_user?.status}`);

  // 2. Retrieve user profile
  console.log("\n2. Getting user profile by external ID...");
  const user = await service.productUsers.getByExternalId({
    appId,
    externalUserId
  });
  console.log(`Email:   ${user.email}`);
  console.log(`Status:  ${user.status}`);

  // 3. Grant financial credits
  console.log("\n3. Granting startup-funded AI credits...");
  const grantRes = await service.productUsers.grantCreditByExternalId({
    appId,
    externalUserId,
    amount: "25.000000000000",
    currency: "USD",
    source: "promotion",
    reason: "Monthly enterprise credit grant"
  });
  console.log(`Grant ID: ${grantRes.credit_grant?.credit_grant_id}`);
  console.log(`Amount:   $${grantRes.credit_grant?.amount}`);

  // 4. Query live credit summary
  console.log("\n4. Querying live credit summary...");
  const summary = await service.productUsers.getCreditSummaryByExternalId({
    appId,
    externalUserId
  });
  console.log(`Available Credits: $${summary.available_credits}`);
  console.log(`Spent This Month:  $${summary.spent_this_month}`);

  // 5. Query credit grant ledger
  console.log("\n5. Listing credit grant ledger...");
  const ledger = await service.productUsers.listCreditGrantsByExternalId({
    appId,
    externalUserId
  });
  const grants = ledger.credit_grants ?? [];
  console.log(`Total Grants: ${grants.length}`);
  for (const grant of grants) {
    console.log(` - ID: ${grant.credit_grant_id} | Amount: $${grant.amount} | Reason: ${grant.reason}`);
  }

  // 6. List programmatic BYOK provider credentials
  console.log("\n6. Listing programmatic provider credentials...");
  try {
    const creds = await service.providerCredentials.list();
    const list = creds.credentials ?? [];
    console.log(`Registered Credentials: ${list.length}`);
    for (const cred of list) {
      console.log(` - ${cred.provider} (${cred.credential_name ?? "default"}) [${cred.status}]`);
    }
  } catch (err: any) {
    console.log(`Credential listing: ${err.message}`);
  }

  // 7. Query supported provider catalog
  console.log("\n7. Listing supported provider catalog...");
  const catalog = await service.providerCredentials.listProviders();
  const providers = catalog.providers ?? [];
  console.log(`Supported AI Providers: ${providers.length}`);
  console.log(`Sample Providers: ${providers.slice(0, 8).join(", ")}...`);

  console.log("\n==================================================");
  console.log("Management demo finished successfully.");
  console.log("==================================================");
}

void main();
