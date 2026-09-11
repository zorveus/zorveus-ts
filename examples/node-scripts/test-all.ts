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

async function getOpenAIAdapter(withAttribution = false): Promise<ZorveusOpenAI> {
  return new ZorveusOpenAI({
    apiKey: await requireValue("Inference key", "ZORVEUS_INFERENCE_KEY"),
    baseURL: gatewayBaseURL,
    ...(withAttribution ? { externalUserId: await getExternalUserId() } : {})
  });
}

async function testOpenAIResponses(): Promise<void> {
  const client = await getOpenAIAdapter(true);
  const response = await client.responses.create({
    model: await ask("Model", process.env.ZORVEUS_TEST_MODEL || "openai/gpt-4.1-mini"),
    input: await ask("Prompt", "Reply with OK")
  });
  console.log(response.output_text || "No text returned.");
  console.dir(response, { depth: 3 });
}

async function generateSpeech(): Promise<void> {
  const client = await getOpenAIAdapter(true);
  const format = await ask("Audio format", "mp3");
  const response = await client.audio.speech.create({
    model: await ask(
      "Speech model",
      process.env.ZORVEUS_SPEECH_MODEL || "gemini/gemini-2.5-flash-preview-tts"
    ),
    voice: await ask("Voice", "achird"),
    input: await ask("Text", "Hello from the Zorveus TypeScript SDK."),
    response_format: format as "mp3"
  });
  const outputPath = path.resolve(await ask("Output audio path", `examples/output/speech.${format}`));
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, Buffer.from(await response.arrayBuffer()));
  console.log(`Saved speech audio to ${outputPath}`);
}

async function transcribeAudio(): Promise<void> {
  const audioPath = path.resolve(await requireValue("Audio file path", "ZORVEUS_TEST_AUDIO_PATH"));
  if (!fs.existsSync(audioPath)) throw new Error(`Audio file not found: ${audioPath}`);
  const response = await (await getOpenAIAdapter(true)).audio.transcriptions.create({
    model: await ask("Transcription model", process.env.ZORVEUS_TRANSCRIPTION_MODEL || "whisper-1"),
    file: fs.createReadStream(audioPath)
  });
  console.dir(response, { depth: null });
}

async function translateAudio(): Promise<void> {
  const audioPath = path.resolve(await requireValue("Audio file path", "ZORVEUS_TEST_AUDIO_PATH"));
  if (!fs.existsSync(audioPath)) throw new Error(`Audio file not found: ${audioPath}`);
  const response = await (await getOpenAIAdapter(true)).audio.translations.create({
    model: await ask("Translation model", process.env.ZORVEUS_TRANSLATION_MODEL || "whisper-1"),
    file: fs.createReadStream(audioPath)
  });
  console.dir(response, { depth: null });
}

async function generateImage(): Promise<void> {
  const response = await (await getOpenAIAdapter(true)).images.generate({
    model: await ask("Image model", process.env.ZORVEUS_IMAGE_MODEL || "dall-e-3"),
    prompt: await ask("Image prompt", "A geometric illustration of an AI gateway"),
    n: 1,
    size: await ask("Image size", "1024x1024") as "1024x1024",
    response_format: "b64_json"
  });
  const image = response.data?.[0];
  if (image?.b64_json) {
    const outputPath = path.resolve(await ask("Output image path", "examples/output/generated-image.png"));
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, Buffer.from(image.b64_json, "base64"));
    console.log(`Saved generated image to ${outputPath}`);
    return;
  }
  console.log(image?.url ? `Generated image URL: ${image.url}` : "No image returned.");
}

async function moderateContent(): Promise<void> {
  const response = await (await getOpenAIAdapter(true)).moderations.create({
    model: await ask("Moderation model", process.env.ZORVEUS_MODERATION_MODEL || "omni-moderation-latest"),
    input: await ask("Content", "Check this text for safety.")
  });
  console.dir(response, { depth: null });
}

async function listGatewayFiles(): Promise<void> {
  const limit = Number(await ask("File limit", "20"));
  const page = await (await getOpenAIAdapter()).files.list({ limit });
  console.table(page.data.map((file) => ({
    id: file.id,
    filename: file.filename,
    purpose: file.purpose,
    bytes: file.bytes,
    status: file.status
  })));
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
  changesData?: boolean;
}

const actions: RunnerAction[] = [
  { name: "Get inference-key usage", run: testInferenceUsage },
  { name: "List available models", run: testModels },
  { name: "Create one chat completion", run: testChat, changesData: true },
  { name: "Create one streaming chat completion", run: testStreamingChat, changesData: true },
  { name: "Create one embedding", run: testEmbeddings, changesData: true },
  { name: "Create or update a product user", run: upsertProductUser, changesData: true },
  { name: "Get product-user details", run: getProductUser },
  { name: "Give a credit grant by external ID", run: grantCredit, changesData: true },
  { name: "Get a credit summary", run: getCreditSummary },
  { name: "List credit grants by external ID", run: listCreditGrants },
  { name: "List cache-aware usage events", run: listUsageEvents },
  { name: "List provider credentials", run: listProviderCredentials },
  { name: "Get one provider credential", run: getProviderCredential },
  { name: "Create a provider credential", run: createProviderCredential, changesData: true },
  { name: "Rotate a provider credential", run: rotateProviderCredential, changesData: true },
  { name: "Delete a provider credential", run: deleteProviderCredential, changesData: true },
  { name: "List supported providers", run: listProviders },
  { name: "Check the OpenAI and Vercel adapters", run: testAdapters },
  { name: "Create an OpenAI Responses response", run: testOpenAIResponses, changesData: true },
  { name: "Generate speech audio", run: generateSpeech, changesData: true },
  { name: "Transcribe an audio file", run: transcribeAudio, changesData: true },
  { name: "Translate an audio file", run: translateAudio, changesData: true },
  { name: "Generate an image", run: generateImage, changesData: true },
  { name: "Moderate content", run: moderateContent, changesData: true },
  { name: "List gateway files", run: listGatewayFiles },
  { name: "Check finance error parsing", run: testErrorParser }
];

function printMenu(): void {
  console.log("\nZorveus SDK runner\n");
  actions.forEach((action, index) => {
    console.log(`${index + 1}. ${action.name}${action.changesData ? " [changes data or creates usage]" : ""}`);
  });
  console.log("s. Run all read-only tests");
  console.log("a. Run every test, with confirmation");
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

    let selectedActions: Array<RunnerAction | undefined>;
    if (selection === "s") {
      selectedActions = actions.filter((action) => !action.changesData);
    } else if (selection === "a") {
      const confirmation = await ask("Type RUN ALL to create usage and change data");
      if (confirmation !== "RUN ALL") {
        console.log("Run-all cancelled.");
        continue;
      }
      selectedActions = actions;
    } else {
      selectedActions = selection.split(",").map((value) => actions[Number(value.trim()) - 1]);
    }

    const runnableActions = selectedActions.filter((action): action is RunnerAction => Boolean(action));
    if (runnableActions.length === 0 || runnableActions.length !== selectedActions.length) {
      console.error("Choose one or more listed numbers, s, a, or q.");
      continue;
    }

    for (const action of runnableActions) await runAction(action);
  }

  rl.close();
}

void main();
