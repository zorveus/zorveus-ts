import fs from "fs";
import path from "path";
import { Zorveus, ZorveusServiceClient, parseZorveusGatewayError } from "../../packages/sdk/src/index";
import { ZorveusOpenAI } from "../../packages/sdk/src/adapters/openai";

// Auto-load examples/node-scripts/.env if present
const envPath = path.resolve(__dirname, ".env");
if (fs.existsSync(envPath) && typeof (process as any).loadEnvFile === "function") {
  try {
    (process as any).loadEnvFile(envPath);
  } catch {}
}

const serviceKey = process.env.ZORVEUS_SERVICE_KEY;
const appId = process.env.ZORVEUS_APP_ID;
const inferenceKey = process.env.ZORVEUS_INFERENCE_KEY;
const baseURL = process.env.ZORVEUS_BASE_URL || "http://localhost:8000";
const gatewayBaseURL = process.env.ZORVEUS_GATEWAY_URL || "http://localhost:4000/v1";

interface Check {
  category: string;
  name: string;
  ok: boolean;
  info: string;
}

const checks: Check[] = [];

function pass(category: string, name: string, info: string) {
  checks.push({ category, name, ok: true, info });
  console.log(`[PASS] [${category}] ${name}: ${info}`);
}

function fail(category: string, name: string, info: string) {
  checks.push({ category, name, ok: false, info });
  console.log(`[FAIL] [${category}] ${name}: ${info}`);
}

async function testServicePlane() {
  console.log("\n--- Testing ZorveusServiceClient (Management Control Plane) ---");

  if (!serviceKey || !appId) {
    fail("ServicePlane", "Environment", "Missing ZORVEUS_SERVICE_KEY or ZORVEUS_APP_ID");
    return;
  }

  const service = new ZorveusServiceClient({
    apiKey: serviceKey,
    baseURL
  });

  const testExternalId = `test_runner_${Date.now()}`;

  // 1. productUsers.createOrUpdate
  try {
    const res = await service.productUsers.createOrUpdate({
      appId,
      externalUserId: testExternalId,
      displayName: "Live Test Runner",
      email: "runner@test.local",
      metadata: { env: "local_test", automated: true }
    });
    pass("ServicePlane", "productUsers.createOrUpdate", `User created: ${res.created}, ID: ${res.product_user?.product_end_user_id}`);
  } catch (err: any) {
    fail("ServicePlane", "productUsers.createOrUpdate", err.message);
  }

  // 2. productUsers.getByExternalId
  try {
    const user = await service.productUsers.getByExternalId({
      appId,
      externalUserId: testExternalId
    });
    pass("ServicePlane", "productUsers.getByExternalId", `Status: ${user.status}, External ID: ${user.external_user_id}`);
  } catch (err: any) {
    fail("ServicePlane", "productUsers.getByExternalId", err.message);
  }

  // 3. productUsers.grantCreditByExternalId
  try {
    const grant = await service.productUsers.grantCreditByExternalId({
      appId,
      externalUserId: testExternalId,
      amount: "20.000000000000",
      currency: "USD",
      source: "promotion",
      reason: "Live suite grant"
    });
    pass("ServicePlane", "productUsers.grantCreditByExternalId", `Grant ID: ${grant.credit_grant?.credit_grant_id}, Amount: $${grant.credit_grant?.amount}`);
  } catch (err: any) {
    fail("ServicePlane", "productUsers.grantCreditByExternalId", err.message);
  }

  // 4. productUsers.getCreditSummaryByExternalId
  try {
    const summary = await service.productUsers.getCreditSummaryByExternalId({
      appId,
      externalUserId: testExternalId
    });
    pass("ServicePlane", "productUsers.getCreditSummaryByExternalId", `Available: $${summary.available_credits}, Spent: $${summary.spent_this_month}`);
  } catch (err: any) {
    fail("ServicePlane", "productUsers.getCreditSummaryByExternalId", err.message);
  }

  // 5. productUsers.listCreditGrantsByExternalId
  try {
    const ledger = await service.productUsers.listCreditGrantsByExternalId({
      appId,
      externalUserId: testExternalId
    });
    pass("ServicePlane", "productUsers.listCreditGrantsByExternalId", `Grants in ledger: ${ledger.credit_grants?.length ?? 0}`);
  } catch (err: any) {
    fail("ServicePlane", "productUsers.listCreditGrantsByExternalId", err.message);
  }

  // 6. providerCredentials.list (via /provider-credentials/org-programmatic)
  try {
    const creds = await service.providerCredentials.list();
    pass("ServicePlane", "providerCredentials.list", `Registered credentials: ${creds.credentials?.length ?? 0}`);
  } catch (err: any) {
    fail("ServicePlane", "providerCredentials.list", err.message);
  }

  // 7. providerCredentials.listProviders
  try {
    const catalog = await service.providerCredentials.listProviders();
    pass("ServicePlane", "providerCredentials.listProviders", `Supported providers in catalog: ${catalog.providers?.length ?? 0}`);
  } catch (err: any) {
    fail("ServicePlane", "providerCredentials.listProviders", err.message);
  }
}

async function testInferencePlane() {
  console.log("\n--- Testing Zorveus (Inference Gateway Data Plane) ---");

  if (!inferenceKey) {
    fail("InferencePlane", "Environment", "Missing ZORVEUS_INFERENCE_KEY");
    return;
  }

  const zorveus = new Zorveus({
    apiKey: inferenceKey,
    baseURL,
    gatewayBaseURL
  });

  // 1. zorveus.getUsage()
  try {
    const usage = await zorveus.getUsage();
    pass("InferencePlane", "zorveus.getUsage", `Spent: $${usage.spent_this_period}, Spend Cap: $${usage.spend_cap}, Balance: $${usage.remaining_balance}`);
  } catch (err: any) {
    fail("InferencePlane", "zorveus.getUsage", err.message);
  }

  // 2. zorveus.models.list()
  let chosenModel = "gemini/gemini-2.5-flash";
  try {
    const models = await zorveus.models.list();
    const count = models.data?.length ?? 0;
    const foundFlash = models.data?.find((m) => m.id.includes("gemini-2.5-flash"))?.id;
    if (foundFlash) {
      chosenModel = foundFlash;
    }
    pass("InferencePlane", "zorveus.models.list", `Total models: ${count}, Selected for chat: ${chosenModel}`);
  } catch (err: any) {
    fail("InferencePlane", "zorveus.models.list", err.message);
  }

  // 3. zorveus.chat.completions.create (non-streaming with attribution)
  try {
    const completion = await zorveus.chat.completions.create({
      model: chosenModel,
      messages: [
        { role: "system", content: "You are a short test assistant." },
        { role: "user", content: "Return the single word: OK" }
      ],
      zorveusMetadata: {
        externalUserId: "test_runner_ext",
        productEndUserId: "test_runner_peu",
        displayName: "Live Suite Runner",
        userEmail: "suite@test.local"
      }
    });
    const text = completion.choices?.[0]?.message?.content?.trim() ?? "";
    pass("InferencePlane", "chat.completions.create (non-streaming)", `Model: ${completion.model}, Content: "${text}"`);
  } catch (err: any) {
    fail("InferencePlane", "chat.completions.create (non-streaming)", err.message);
  }

  // 4. zorveus.chat.completions.create (streaming SSE)
  try {
    const stream = await zorveus.chat.completions.create({
      model: chosenModel,
      messages: [{ role: "user", content: "Count 1, 2" }],
      stream: true,
      zorveusMetadata: {
        externalUserId: "test_stream_runner"
      }
    });

    let buffer = "";
    for await (const chunk of stream) {
      buffer += chunk.choices?.[0]?.delta?.content ?? "";
    }
    pass("InferencePlane", "chat.completions.create (streaming)", `Received chunks: "${buffer.trim()}"`);
  } catch (err: any) {
    fail("InferencePlane", "chat.completions.create (streaming)", err.message);
  }
}

async function testAdaptersAndErrors() {
  console.log("\n--- Testing Adapters & Error Handling ---");

  // 1. ZorveusOpenAI Adapter initialization
  try {
    const adapter = new ZorveusOpenAI({
      apiKey: inferenceKey || "zrv_test",
      baseURL: gatewayBaseURL
    });
    const hasCreate = typeof adapter.chat?.completions?.create === "function";
    pass("Adapters", "ZorveusOpenAI.chat.completions", `Completions function ready: ${hasCreate}`);
  } catch (err: any) {
    fail("Adapters", "ZorveusOpenAI", err.message);
  }

  // 2. parseZorveusGatewayError unpacks nested gateway payload
  try {
    const sampleGatewayPayload = {
      status: 403,
      error: {
        provider_specific_fields: {
          error: {
            code: "zorveus_product_user_allowance_insufficient",
            message: "Credit allowance depleted",
            params: {
              metric_name: "tokens",
              credit_mode: "enforce",
              available_allowance: "0.00"
            }
          }
        }
      }
    };

    const parsed: any = parseZorveusGatewayError(sampleGatewayPayload);
    const isValid =
      parsed?.code === "zorveus_product_user_allowance_insufficient" &&
      parsed?.params?.metric_name === "tokens" &&
      parsed?.params?.credit_mode === "enforce";

    if (isValid) {
      pass("ErrorHandling", "parseZorveusGatewayError", `Parsed code: ${parsed.code}, metric: ${parsed.params?.metric_name}`);
    } else {
      fail("ErrorHandling", "parseZorveusGatewayError", `Expected allowance error, received code=${parsed?.code}`);
    }
  } catch (err: any) {
    fail("ErrorHandling", "parseZorveusGatewayError", err.message);
  }

  // 3. Live 401 AuthenticationError check
  try {
    const badClient = new ZorveusServiceClient({
      apiKey: "zrv_svc_invalid_key_for_test",
      baseURL
    });
    await badClient.productUsers.getByExternalId({ appId: "app_fake", externalUserId: "ext_fake" });
    fail("ErrorHandling", "Live 401 AuthenticationError", "Expected 401 failure, but request succeeded");
  } catch (err: any) {
    const isAuth = err.status === 401 || err.name === "AuthenticationError" || err.code === "zorveus_missing_session";
    if (isAuth) {
      pass("ErrorHandling", "Live 401 AuthenticationError", `Caught expected auth error: ${err.name} (${err.status})`);
    } else {
      fail("ErrorHandling", "Live 401 AuthenticationError", `Unexpected error: ${err.message}`);
    }
  }
}

async function main() {
  console.log("==================================================");
  console.log("Zorveus Live Functions Test Suite");
  console.log(`Backend Base URL: ${baseURL}`);
  console.log(`Gateway Base URL: ${gatewayBaseURL}`);
  console.log("==================================================");

  await testServicePlane();
  await testInferencePlane();
  await testAdaptersAndErrors();

  const total = checks.length;
  const passed = checks.filter((c) => c.ok).length;
  const failed = total - passed;

  console.log("\n==================================================");
  console.log("Summary");
  console.log(`Total:  ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log("==================================================");
}

void main();
