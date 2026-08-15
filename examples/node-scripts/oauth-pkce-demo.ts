/**
 * Demo: Isomorphic OAuth PKCE with @zorveus/sdk
 *
 * To run:
 * npm run demo:oauth
 */

import { ZorveusOAuth } from "../../packages/sdk/src/index";

async function main() {
  console.log("==================================================");
  console.log("Zorveus OAuth PKCE Helper Demo (RFC 7636)");
  console.log("==================================================\n");

  console.log("1. Generating Cryptographic PKCE Data (Web Crypto SHA-256)...");
  const { codeVerifier, codeChallenge, state } = await ZorveusOAuth.generatePKCE();

  console.log(`Code Verifier (High Entropy): ${codeVerifier}`);
  console.log(`Code Challenge (S256):        ${codeChallenge}`);
  console.log(`CSRF State Token:             ${state}`);

  console.log("\n2. Generating Authorization Consent URL...");
  const authUrl = ZorveusOAuth.getAuthorizationUrl({
    clientId: "zrv_client_demo_123",
    redirectUri: "https://myapp.com/api/oauth/callback",
    state,
    codeChallenge,
    scopes: ["inference:read", "inference:write"]
  });

  console.log(`\nGenerated OAuth URL:\n${authUrl}\n`);

  console.log("3. Explaining Token Exchange Flow...");
  console.log(`
  Once the customer approves access, Zorveus redirects back to redirectUri with '?code=...&state=...'.
  Your backend exchanges the code for a live inference key:

  const tokenResponse = await ZorveusOAuth.exchangeToken({
    clientId: "zrv_client_demo_123",
    clientSecret: "zrv_secret_...", // Optional for public PKCE clients
    code: "auth_code_from_query_param",
    codeVerifier: "${codeVerifier}",
    redirectUri: "https://myapp.com/api/oauth/callback"
  });

  console.log(tokenResponse.access_token); // 'zrv_live_...' (Inference API Key issued via OAuth)
  console.log(tokenResponse.funding_org_id); // Connected org paying for inference
  `);

  console.log("==================================================");
  console.log("PKCE Demo Completed!");
  console.log("==================================================");
}

void main();
