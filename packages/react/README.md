# `@zorveus/react`

React hooks and components for Zorveus authentication, inference, model discovery, and spend display.

## Install the package

```bash
npm install @zorveus/react @zorveus/sdk
```

The package supports React 18 and later. Install `openai` if your application uses the `openAIClient` exposed by `useZorveusContext()`:

```bash
npm install openai
```

## Pick an authentication method

`ZorveusProvider` accepts an OAuth session, an inference key, or a token resolver.

| Provider prop | Use it for |
| --- | --- |
| `clientId` and `redirectUri` | OAuth PKCE connection |
| `inferenceKey` | A non-OAuth application with a Zorveus inference key |
| `accessToken` | A token that your application already resolved |
| `tokenProvider` | An asynchronous token or session resolver |

Do not put an organization service key in a React application. `ZorveusServiceClient` belongs on your server.

## Connect with OAuth

Wrap the application in `ZorveusProvider`:

```tsx
import { OAuthCallbackHandler, ZorveusProvider } from "@zorveus/react";

export function App({ children }: { children: React.ReactNode }) {
	return (
		<ZorveusProvider
			clientId="your_oauth_client_id"
			redirectUri="http://localhost:5173/oauth/callback"
		>
			<OAuthCallbackHandler />
			{children}
		</ZorveusProvider>
	);
}
```

`OAuthCallbackHandler` supports both popup and full-page redirect flows. Render it on the route configured by `redirectUri`.

Add a connection button:

```tsx
import { ConnectWalletButton } from "@zorveus/react";

export function ConnectZorveus() {
	return (
		<ConnectWalletButton
			scopes={["inference:write", "models:*"]}
			authMode="popup"
			onError={(error) => console.error(error)}
		/>
	);
}
```

Request at least one model scope, such as `models:*`. The authorization server rejects a request without a model scope.

Tokens stay in memory by default. Set `persistToken` to store the OAuth session in `localStorage`. Persistent browser tokens have more exposure to cross-site scripting attacks.

## Keep Business credentials on your server

For a product that pays for customer inference, send requests through your own authenticated backend. Choose the customer ID and plan key there. A `VITE_` environment variable is included in the browser bundle, so it cannot keep a Business inference key secret

For user-funded browser applications, use OAuth. `accessToken` and `tokenProvider` can supply a token that your application has already obtained for the current user. Do not use a session endpoint to hand out a shared Business key

## Disconnect

`useZorveusAuth().disconnect()` clears local session state. To end remote access, first call `ZorveusOAuth.revokeToken({ clientId, token: accessToken })` from `@zorveus/sdk`, then clear the local session after a confirmed response. Public browser clients omit the client secret. A network failure leaves remote revocation uncertain

## Stream chat in the connected session

Call inference with the current user's OAuth connection. Its consent policy controls funding and spend limits. Business customer attribution and plan selection belong on your backend

```tsx
import { useState } from "react";
import { useZorveusInference, useZorveusModels } from "@zorveus/react";

export function Chat() {
	const { models, isLoading: modelsLoading } = useZorveusModels();
	const [model, setModel] = useState("");
	const { messages, input, setInput, submitPrompt, isStreaming, abort, error } =
		useZorveusInference({
			model,
			systemPrompt: "Answer clearly and briefly."
		});

	return (
		<section>
			<select
				value={model}
				disabled={modelsLoading}
				onChange={(event) => setModel(event.target.value)}
			>
				<option value="" disabled>Select an available model</option>
				{models.map((item) => (
					<option key={item.id} value={item.id}>
						{item.name || item.id}
					</option>
				))}
			</select>

			{messages.map((message, index) => (
				<p key={`${message.role}-${index}`}>
					<strong>{message.role}:</strong> {message.content}
				</p>
			))}

			<input value={input} onChange={(event) => setInput(event.target.value)} />
			<button onClick={() => void submitPrompt()} disabled={isStreaming || !model || !input.trim()}>
				Send
			</button>
			{isStreaming && <button onClick={abort}>Stop</button>}
			{error && <p role="alert">{error.message}</p>}
		</section>
	);
}
```

Use the session's available model catalog to choose a model before sending a request

## Call other inference resources

`useZorveusContext()` exposes the native `client` and the OpenAI-compatible `openAIClient`. The native client supports chat, embeddings, images, speech, transcription, models, and usage.

Pass `zorveusMetadata` on every native inference request that needs product-user attribution:

```tsx
import { useZorveusContext } from "@zorveus/react";

export function GenerateImage({ customerId }: { customerId: string }) {
	const { client } = useZorveusContext();

	async function generate() {
		if (!client) return;

		const result = await client.images.generate({
			model: "dall-e-3",
			prompt: "A geometric illustration of an AI gateway",
			zorveusMetadata: { externalUserId: customerId }
		});

		console.log(result.data[0]?.url);
	}

	return <button onClick={() => void generate()}>Generate image</button>;
}
```

The provider does not add a global product user to the native client. Pass attribution to each native request. For the OpenAI adapter, pass attribution in request metadata because the provider creates `openAIClient` without constructor-level attribution.

## Display spend

`SpendCapIndicator` reads usage from the current connection when you omit both `current` and `limit`:

```tsx
import { SpendCapIndicator } from "@zorveus/react";

export function AccountSpend() {
	return <SpendCapIndicator theme="light" warningThreshold={0.8} />;
}
```

You can also pass values yourself:

```tsx
<SpendCapIndicator
	current="12.340000"
	limit="50.000000"
	currency="USD"
	period="monthly"
/>
```

Prefer decimal strings for money. JavaScript numbers can lose precision.

## Public exports

### Hooks

| Hook | Main values |
| --- | --- |
| `useZorveusAuth()` | `isConnected`, `accessToken`, `appConnectionId`, `isLoading`, `error`, `connect`, `disconnect` |
| `useZorveusInference(options)` | `messages`, `input`, `setInput`, `submitPrompt`, `isStreaming`, `error`, `abort`, `clearMessages` |
| `useZorveusModels(options)` | `models`, `isLoading`, `error`, `refetch` |
| `useZorveusSpend(options)` | Usage data, decimal and numeric amounts, loading state, errors, and `refresh` |
| `useZorveusContext()` | Authentication state, the native `client`, the `openAIClient`, and session methods |

`useZorveusModels()` and `useZorveusSpend()` accept `{ autoFetch?: boolean }`. `useZorveusModels()` also accepts `routeStatus`.

### Components

| Component | Purpose |
| --- | --- |
| `ZorveusProvider` | Stores authentication state and creates SDK clients |
| `ConnectWalletButton` | Starts an OAuth popup or redirect flow |
| `OAuthCallbackHandler` | Validates the OAuth callback and exchanges the authorization code |
| `SpendCapIndicator` | Displays current spend against a cap |
| `ZorveusIcon` | Renders the Zorveus icon |

`ConnectWalletButton` and `SpendCapIndicator` support custom classes, inline styles, an `unstyled` mode, and render props.

## Provider options

| Prop | Type | Default |
| --- | --- | --- |
| `clientId` | `string` | Required |
| `redirectUri` | `string` | Required |
| `clientSecret` | `string` | None |
| `accessToken` | `string \| null` | None |
| `tokenProvider` | `() => Promise<string \| ZorveusOAuthSessionPayload \| null>` | None |
| `inferenceKey` | `string` | None |
| `baseURL` | `string` | `https://api.zorveus.com` |
| `gatewayBaseURL` | `string` | `${baseURL}/v1` |
| `authBaseUrl` | `string` | The value of `baseURL` |
| `persistToken` | `boolean` | `false` |

Do not expose `clientSecret` in public browser code. Use it only when your runtime keeps the secret on a trusted server.

## License

MIT © [Zorveus Inc.](https://zorveus.com)
