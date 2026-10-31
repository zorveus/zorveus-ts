# Zorveus TypeScript SDKs

Build with Zorveus from a server or connect a user's own Zorveus account through OAuth in React

| Package | Use |
| --- | --- |
| [`@zorveus/sdk`](packages/sdk/README.md) | Inference, service clients, OpenAI and Vercel adapters, and OAuth utilities |
| [`@zorveus/react`](packages/react/README.md) | OAuth connection, inference hooks, and spend display for React 18+ |

## Start on your server

```bash
npm install @zorveus/sdk
```

```typescript
import { Zorveus, ZorveusServiceClient } from "@zorveus/sdk";

const client = new Zorveus({ apiKey: process.env.ZORVEUS_INFERENCE_KEY! });
const service = new ZorveusServiceClient({ apiKey: process.env.ZORVEUS_SERVICE_KEY! });

const response = await client.chat.completions.create({
  model: process.env.ZORVEUS_MODEL_ID!,
  messages: [{ role: "user", content: "Hello" }],
  zorveusMetadata: { externalUserId: authenticatedUserId },
});

const profile = await service.productUsers.getByExternalId({
  appId: process.env.ZORVEUS_APP_ID!,
  externalUserId: authenticatedUserId,
});
console.log(response.choices[0]?.message.content);
console.log(profile.getTotalAvailableToSpend());
```

Get `authenticatedUserId` from your server's authenticated session. Choose an available model with `client.models.list()`. The inference key authorizes model calls. The service key authorizes its scoped customer and credit actions and stays on your server

Follow [Integrate your product](https://docs.zorveus.com/getting-started/integrate-your-product) for Business setup, [service clients](https://docs.zorveus.com/startups/service-keys) for backend actions, or [OAuth](https://docs.zorveus.com/oauth/overview) for user-funded inference

Attach request activity through `zorveusMetadata.usageMetadata`. See [business context on usage](packages/sdk/README.md#attach-business-context-to-usage) for examples, header support, and validation rules

## Develop locally

```bash
npm install
npm run build
npm test
npm run --workspace=@zorveus/sdk typecheck
npm run --workspace=@zorveus/react typecheck
```

The [examples](examples) directory includes Node and React applications. Use local example environment files for secrets and never put Business inference or service keys into browser bundles

## License

MIT


## Read allowance before the first AI request

Use the service client and pass the inference key selected by your application's subscription logic. For a routing key, supply its member alias or use its configured default. Your database remains the source of the customer's plan

```typescript
const user = await service.productUsers.getByExternalId({
	appId,
	externalUserId: authenticatedUserId,
	inferenceKey: selectedInferenceOrRoutingKey,
	keyAlias: selectedRoutingAlias,
	upsertIfMissing: true,
});
console.log(user.allowance?.remaining_credit_units);
```

```python
user = service.product_users.get_by_external_id(
	app_id=app_id,
	external_user_id=authenticated_user_id,
	inference_key=selected_inference_or_routing_key,
	key_alias=selected_routing_alias,
	upsert_if_missing=True,
)
print(user.allowance.remaining_credit_units if user.allowance else None)
```

Python supports the same arguments on the asynchronous service client. Omit the alias for a direct inference key. Both SDKs send the selection in headers, keeping the service key in `Authorization`

```http
GET /product-users/by-external-id?app_id=app_example&external_user_id=shop_123
Authorization: Bearer <organization-service-key>
X-Zorveus-Inference-Key: <inference-or-routing-key>
X-Zorveus-Key-Alias: pro
X-Zorveus-Upsert-Product-User: true
```

The selected key must be active and belong to the service key's app and organization. An invalid selection returns an error without falling back or creating a user. Read-only product-user permission is sufficient. Keep both credentials on your backend

For a $5 monthly allowance at 1,000 credit units per USD, a first read with no usage or grants returns `allowance.remaining_credit_units: "5000"`. Selecting a new plan key on the next read reflects that policy immediately, using the customer's shared usage and grants. The read does not assign a plan or change the last-used connection

Without the optional key, the profile continues to use its direct cap or last-used connection. A user with no usable cap has null allowance. `credits.remaining_credit_units` counts grants only. The complete base-plus-grants total is in `allowance.remaining_credit_units`


## Credit units and conversion rates

Set your app's `credit_units_per_usd` in app settings. A USD grant can supply its own rate. Omit the override to save the app default on the new grant

```typescript
const receipt = await service.productUsers.grantCreditByExternalId({
	appId,
	externalUserId: authenticatedUserId,
	externalReference: `purchase:${verifiedPayment.id}`,
	amount: "2.000000000000",
	creditUnitsPerUsd: "1500",
	source: "purchase",
});
console.log(receipt.credit_grant.remaining_credit_units);
```

```python
receipt = service.product_users.grant_credit_by_external_id(
	app_id=app_id,
	external_user_id=authenticated_user_id,
	external_reference=f"purchase:{verified_payment.id}",
	amount="2.000000000000",
	credit_units_per_usd="1500",
	source="purchase",
)
print(receipt.credit_grant.remaining_credit_units)
```

The $2 grant above starts with 3,000 credit units. Its saved rate stays fixed when the app default changes. Referenced retries preserve the original rate. Changing an explicitly supplied rate under the same reference returns HTTP 409

Grant creation, lists, reference lookup, and revocation return `credit_units_per_usd` and `remaining_credit_units`. An older grant without a saved rate uses the current app default. If neither rate exists, a positive balance has null credit units. Zero remaining USD returns zero units

`credit_summary.remaining_credit_units` sums all usable grants at their respective rates, independently of the grant list limit. If any positive usable grant has no conversion, the total is null. USD fields such as `remaining_amount` and `available_credits` retain their existing meaning

`allowance.remaining_credit_units` includes the remaining base allowance at the current app rate plus grants permitted by the selected connection. It is the field to display for the customer's total remaining credit units. Credit units and rates are exact decimal strings. Keep their precision when displaying or processing them

Rates must be positive finite decimal values with at most 12 digits before and 12 digits after the decimal point. An explicit grant rate requires USD. Existing grants in other currencies remain supported without conversion


## Credit units charged

Usage items include nullable `charged_credit_units`. Zorveus saves this quantity at settlement from the actual base and grant allocations. For example, $0.01 from base allowance at 1,000 units/USD plus $0.01 from a grant at 1,500 units/USD produces `charged_credit_units: "25"`

The original `amount` remains the signed USD charge. The unit charge is a positive exact decimal string. Changing app defaults does not recalculate old usage. Reservations and releases are not settled charges. Refunds do not reprice the original usage row

Historical usage without a recorded quantity returns null. A charge with a missing conversion or funding that has not been allocated also returns null rather than a partial total. Known zero charges return zero
