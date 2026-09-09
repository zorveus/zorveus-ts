import fs from "fs";
import path from "path";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import {
  Zorveus,
  ZorveusServiceClient,
  normalInputTokens,
  parseZorveusGatewayError
} from "../../packages/sdk/src/index";
import { ZorveusOpenAI } from "../../packages/sdk/src/adapters/openai";
import { createZorveus } from "../../packages/sdk/src/adapters/vercel";

const envPath = path.resolve(__dirname, ".env");
if (fs.existsSync(envPath) && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(envPath);
}

const baseURL = process.env.ZORVEUS_BASE_URL || "http://localhost:8000";
const gatewayBaseURL = process.env.ZORVEUS_GATEWAY_URL || "http://localhost:4000/v1";
const rl = readline.createInterface({ input, output });

let inferenceClient: Zorveus | undefined;
let serviceClient: ZorveusServiceClient | undefined;

async function ask(label: string, defaultValue?: string): Promise<string> {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  const answer = (await rl.question(`${label}${suffix}: `)).trim();
  return answer || defaultValue || "";
}

async function requireValue(label: string, envName: string): Promise<string> {
  const value = await ask(label, process.env[envName]);
  if (!value) throw new Error(`${envName} is required for this operation.`);
  return value;
}

async function getInferenceClient(): Promise<Zorveus> {
  if (!inferenceClient) {
    inferenceClient = new Zorveus({
      apiKey: await requireValue("Inference key", "ZORVEUS_INFERENCE_KEY"),
      baseURL,
      gatewayBaseURL
    });
  }
  return inferenceClient;
}

async function getServiceClient(): Promise<ZorveusServiceClient> {
  if (!serviceClient) {
    serviceClient = new ZorveusServiceClient({
      apiKey: await requireValue("Service key", "ZORVEUS_SERVICE_KEY"),
      baseURL
    });
  }
  return serviceClient;
}

async function getAppId(): Promise<string> {
  return requireValue("App ID", "ZORVEUS_APP_ID");
}

async function getExternalUserId(): Promise<string> {
  return requireValue("External product user ID", "ZORVEUS_TEST_EXTERNAL_USER_ID");
}

async function selectModel(client: Zorveus): Promise<string> {
  if (process.env.ZORVEUS_TEST_MODEL) return process.env.ZORVEUS_TEST_MODEL;
  const models = await client.models.list({ routeStatus: "available" });
  const model = await ask("Model", models.data[0]?.id);
  if (!model) throw new Error("A model is required for this operation.");
  return model;
}

async function testInferenceUsage(): Promise<void> {
  const usage = await (await getInferenceClient()).getUsage();
  console.table({
    status: usage.status,
    period: usage.period,
    virtual_spend: usage.virtual_spend_this_period ?? usage.spent_this_period,
    spend_cap: usage.spend_cap ?? "uncapped",
    remaining_allowance: usage.remaining_balance ?? "unlimited",
    currency: usage.currency
  });
}

async function testModels(): Promise<void> {
  const models = await (await getInferenceClient()).models.list({ routeStatus: "available" });
  console.table(models.data.map(({ id, provider, mode, route_status }) => ({
    id,
    provider,
    mode,
    route_status
  })));
}

async function testChat(): Promise<void> {
  const client = await getInferenceClient();
  const response = await client.chat.completions.create({
    model: await selectModel(client),
    messages: [{ role: "user", content: await ask("Prompt", "Reply with OK") }],
    zorveusMetadata: { externalUserId: await getExternalUserId() }
  });
  console.log(response.choices[0]?.message?.content ?? "No content returned.");
  console.table({
    prompt_tokens: response.usage?.prompt_tokens ?? "not reported",
    cached_tokens: response.usage?.prompt_tokens_details?.cached_tokens ?? "not reported",
    completion_tokens: response.usage?.completion_tokens ?? "not reported"
  });
}

async function testStreamingChat(): Promise<void> {
  const client = await getInferenceClient();
  const stream = await client.chat.completions.create({
    model: await selectModel(client),
    messages: [{ role: "user", content: await ask("Prompt", "Count from one to five") }],
    stream: true,
    zorveusMetadata: { externalUserId: await getExternalUserId() }
  });
  for await (const chunk of stream) output.write(chunk.choices[0]?.delta?.content ?? "");
  output.write("\n");
}

async function testEmbeddings(): Promise<void> {
  const response = await (await getInferenceClient()).embeddings.create({
    model: await ask("Embedding model", process.env.ZORVEUS_EMBEDDING_MODEL || "text-embedding-3-small"),
    input: await ask("Text to embed", "Zorveus SDK test"),
    zorveusMetadata: { externalUserId: await getExternalUserId() }
  });
  console.table({ vectors: response.data.length, dimensions: response.data[0]?.embedding.length ?? 0 });
}

async function upsertProductUser(): Promise<void> {
  const response = await (await getServiceClient()).productUsers.upsert({
    appId: await getAppId(),
    externalUserId: await getExternalUserId(),
    displayName: await ask("Display name", "SDK Test User"),
    email: await ask("Email", "sdk-test@example.com")
  });
  console.table({ created: response.created, product_end_user_id: response.product_user.product_end_user_id });
}

async function getProductUser(): Promise<void> {
  const user = await (await getServiceClient()).productUsers.getByExternalId({
    appId: await getAppId(),
    externalUserId: await getExternalUserId()
  });
  console.dir(user, { depth: null });
}

async function getProductUserById(): Promise<void> {
  const id = await requireValue("Product end-user ID", "ZORVEUS_TEST_PRODUCT_END_USER_ID");
  console.dir(await (await getServiceClient()).productUsers.get(id), { depth: null });
}

async function listProductUsers(): Promise<void> {
  const page = await (await getServiceClient()).productUsers.list({
    appId: await getAppId(),
    limit: Number(await ask("Limit", "20"))
  });
  console.table(page.product_users.map((user) => ({
    product_end_user_id: user.product_end_user_id,
    external_user_id: user.external_user_id,
    status: user.status,
    display_name: user.display_name
  })));
}

async function grantCredit(): Promise<void> {
  const response = await (await getServiceClient()).productUsers.grantCreditByExternalId({
    appId: await getAppId(),
    externalUserId: await getExternalUserId(),
    amount: await ask("Credit amount as a decimal string", "1.000000000000"),
    currency: await ask("Currency", "USD"),
    source: "service_key",
    reason: await ask("Reason", "SDK runner test grant")
  });
  console.table({
    credit_grant_id: response.credit_grant.credit_grant_id,
    amount: response.credit_grant.amount,
    remaining_amount: response.credit_grant.remaining_amount
  });
}

async function grantCreditById(): Promise<void> {
  const id = await requireValue("Product end-user ID", "ZORVEUS_TEST_PRODUCT_END_USER_ID");
  const response = await (await getServiceClient()).productUsers.grantCredit(id, {
    appId: await getAppId(),
    amount: await ask("Credit amount as a decimal string", "1.000000000000"),
    currency: await ask("Currency", "USD"),
    reason: await ask("Reason", "SDK runner test grant")
  });
  console.dir(response.credit_grant, { depth: null });
}

async function getCreditSummary(): Promise<void> {
  const summary = await (await getServiceClient()).productUsers.getCreditSummaryByExternalId({
    appId: await getAppId(),
    externalUserId: await getExternalUserId(),
    currency: await ask("Currency", "USD")
  });
  console.dir(summary, { depth: null });
}

async function listCreditGrants(): Promise<void> {
  const response = await (await getServiceClient()).productUsers.listCreditGrantsByExternalId({
    appId: await getAppId(),
    externalUserId: await getExternalUserId(),
    limit: Number(await ask("Limit", "20"))
  });
  console.table(response.credit_grants.map((grant) => ({
    credit_grant_id: grant.credit_grant_id,
    amount: grant.amount,
    remaining_amount: grant.remaining_amount,
    status: grant.status,
    reason: grant.reason
  })));
}

async function listCreditGrantsById(): Promise<void> {
  const id = await requireValue("Product end-user ID", "ZORVEUS_TEST_PRODUCT_END_USER_ID");
  const response = await (await getServiceClient()).productUsers.listCreditGrants(id, {
    appId: await getAppId(),
    limit: Number(await ask("Limit", "20"))
  });
  console.table(response.credit_grants);
}

async function revokeCredit(): Promise<void> {
  const service = await getServiceClient();
  const user = await service.productUsers.getByExternalId({
    appId: await getAppId(),
    externalUserId: await getExternalUserId()
  });
  const grantId = await requireValue("Credit grant ID", "ZORVEUS_TEST_CREDIT_GRANT_ID");
  const response = await service.productUsers.revokeCredit(user.product_end_user_id, grantId);
  console.table({ credit_grant_id: grantId, revoked: response.revoked });
}

async function listUsageEvents(): Promise<void> {
  const response = await (await getServiceClient()).usageEvents.list({
    appId: await getAppId(),
    limit: Number(await ask("Limit", "20"))
  });
  console.table(response.events.map((event) => ({
    request_id: event.zorveus_request_id,
    model: event.model,
    virtual_spend: event.virtual_spend,
    wallet_charge: event.sell_cost,
    cache_read_tokens: event.cache_read_input_tokens,
    normal_input_tokens: normalInputTokens(event) ?? "unavailable",
    status: event.status
  })));
  console.log(`More results: ${response.has_more}; next cursor: ${response.next_cursor ?? "none"}`);
}

async function listProviderCredentials(): Promise<void> {
  const response = await (await getServiceClient()).providerCredentials.list();
  console.table(response.provider_credentials.map((credential) => ({
    id: credential.provider_credential_id,
    provider: credential.provider,
    name: credential.credential_name,
    status: credential.status
  })));
}

async function getProviderCredential(): Promise<void> {
  const id = await requireValue("Provider credential ID", "ZORVEUS_TEST_PROVIDER_CREDENTIAL_ID");
  console.dir(await (await getServiceClient()).providerCredentials.get(id), { depth: null });
}

async function createProviderCredential(): Promise<void> {
  const response = await (await getServiceClient()).providerCredentials.create({
    provider: await requireValue("Provider", "ZORVEUS_TEST_PROVIDER"),
    credentialName: await ask("Credential name", `sdk-runner-${Date.now()}`),
    apiKey: await requireValue("Disposable provider API key", "ZORVEUS_TEST_PROVIDER_API_KEY")
  });
  console.dir(response, { depth: null });
}

async function rotateProviderCredential(): Promise<void> {
  const id = await requireValue("Provider credential ID", "ZORVEUS_TEST_PROVIDER_CREDENTIAL_ID");
  const response = await (await getServiceClient()).providerCredentials.rotate(id, {
    apiKey: await requireValue("New disposable provider API key", "ZORVEUS_TEST_PROVIDER_ROTATED_API_KEY")
  });
  console.dir(response, { depth: null });
}

async function deleteProviderCredential(): Promise<void> {
  const id = await requireValue("Provider credential ID", "ZORVEUS_TEST_PROVIDER_CREDENTIAL_ID");
  const confirmation = await ask(`Type ${id} to confirm deletion`);
  if (confirmation !== id) throw new Error("Deletion cancelled.");
  await (await getServiceClient()).providerCredentials.delete(id);
  console.log(`Deleted ${id}.`);
}

async function listProviders(): Promise<void> {
  console.table((await (await getServiceClient()).providerCredentials.listProviders()).providers);
}

async function testAdapters(): Promise<void> {
  const apiKey = await requireValue("Inference key", "ZORVEUS_INFERENCE_KEY");
  const openai = new ZorveusOpenAI({ apiKey, baseURL: gatewayBaseURL });
  const vercel = createZorveus({ apiKey, baseURL: gatewayBaseURL });
  console.table({
    openai_chat: typeof openai.chat.completions.create === "function",
    openai_responses: typeof openai.responses?.create === "function",
    vercel_provider: typeof vercel === "function"
  });
}

async function testErrorParser(): Promise<void> {
  const parsed = parseZorveusGatewayError({
    status: 403,
    error: {
      provider_specific_fields: {
        error: {
          code: "zorveus_product_user_allowance_insufficient",
          message: "Allowance exhausted",
          params: { shortfall: "1.000000000000" }
        }
      }
    }
  });
  console.dir(parsed, { depth: null });
}

interface RunnerAction {
  name: string;
  run: () => Promise<void>;
}

const actions: RunnerAction[] = [
  { name: "Get inference-key usage", run: testInferenceUsage },
  { name: "List available models", run: testModels },
  { name: "Create one chat completion", run: testChat },
  { name: "Create one streaming chat completion", run: testStreamingChat },
  { name: "Create one embedding", run: testEmbeddings },
  { name: "Create or update a product user", run: upsertProductUser },
  { name: "Get product-user details", run: getProductUser },
  { name: "Get a product user by internal ID", run: getProductUserById },
  { name: "List product users", run: listProductUsers },
  { name: "Give a credit grant by external ID", run: grantCredit },
  { name: "Give a credit grant by internal ID", run: grantCreditById },
  { name: "Get a credit summary", run: getCreditSummary },
  { name: "List credit grants by external ID", run: listCreditGrants },
  { name: "List credit grants by internal ID", run: listCreditGrantsById },
  { name: "Revoke one credit grant", run: revokeCredit },
  { name: "List cache-aware usage events", run: listUsageEvents },
  { name: "List provider credentials", run: listProviderCredentials },
  { name: "Get one provider credential", run: getProviderCredential },
  { name: "Create a provider credential", run: createProviderCredential },
  { name: "Rotate a provider credential", run: rotateProviderCredential },
  { name: "Delete a provider credential", run: deleteProviderCredential },
  { name: "List supported providers", run: listProviders },
  { name: "Check the OpenAI and Vercel adapters", run: testAdapters },
  { name: "Check finance error parsing", run: testErrorParser }
];

function printMenu(): void {
  console.log("\nZorveus SDK runner\n");
  actions.forEach((action, index) => console.log(`${index + 1}. ${action.name}`));
  console.log("a. Run all listed tests in order");
  console.log("q. Quit");
}

async function runAction(action: RunnerAction): Promise<void> {
  console.log(`\n--- ${action.name} ---`);
  try {
    await action.run();
    console.log("PASS");
  } catch (error) {
    console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main(): Promise<void> {
  console.log(`Control plane: ${baseURL}`);
  console.log(`Gateway: ${gatewayBaseURL}`);

  while (true) {
    printMenu();
    const selection = (await rl.question("\nChoose a test: ")).trim().toLowerCase();
    if (selection === "q") break;

    const selectedActions = selection === "a"
      ? actions
      : selection.split(",").map((value) => actions[Number(value.trim()) - 1]);

    if (selectedActions.length === 0 || selectedActions.some((action) => !action)) {
      console.error("Choose one or more listed numbers, a, or q.");
      continue;
    }

    for (const action of selectedActions) await runAction(action);
  }

  rl.close();
}

void main();
