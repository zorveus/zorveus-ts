# `zorveus` Python SDK Specification

Official Python SDK specification for **Zorveus**. Provides sync and async clients for both the OpenAI-compatible inference gateway and the Zorveus management control plane, with built-in support for LangChain, LlamaIndex, LiteLLM, and CrewAI.

---

## 1. Package Metadata & Installation

```bash
pip install zorveus
```

### Supported Environments
- **Python**: 3.9, 3.10, 3.11, 3.12, 3.13+
- **HTTP Transport**: `httpx` (modern HTTP/2, connection pooling, sync & async support)
- **Type Validation**: Pydantic v2
- **Frameworks**: FastAPI, Django, Flask, LangChain, LlamaIndex, LiteLLM, CrewAI

---

## 2. Client Initialization (Sync & Async)

```python
from zorveus import Zorveus, AsyncZorveus
import os

# 1. Sync Client for Gateway Inference (using Inference Key or OAuth Access Token)
client = Zorveus(
    api_key=os.environ["ZORVEUS_INFERENCE_KEY"], # "zrv_live_..."
)

# 2. Async Client for FastAPI / Asyncio
async_client = AsyncZorveus(
    api_key=os.environ["ZORVEUS_INFERENCE_KEY"],
)

# 3. Control Plane Management Client (using Service Key)
admin_client = Zorveus(
    api_key=os.environ["ZORVEUS_SERVICE_KEY"], # "zrv_service_..."
    base_url="https://api.zorveus.com",
)
```

---

## 3. Data Plane: Inference Gateway (`client.chat`, `client.embeddings`, `client.models`)

### A. Standard Chat Completion with Inline Product-User Attribution

```python
response = client.chat.completions.create(
    model="openai/gpt-4o",
    messages=[
        {"role": "system", "content": "You are a financial analyst."},
        {"role": "user", "content": "Generate Q3 financial summary."},
    ],
    temperature=0.7,
    # Zorveus inline product-user attribution:
    zorveus_metadata={
        "external_user_id": "usr_ext_9941",
        "display_name": "Alice Smith",
        "user_email": "alice@startup.com",
        "metadata": {"plan": "enterprise", "department": "finance"},
    },
)

print(response.choices[0].message.content)
print(f"Total Tokens: {response.usage.total_tokens}")
```

### B. Streaming Completion (Sync & Async)

```python
# Synchronous Streaming
stream = client.chat.completions.create(
    model="anthropic/claude-3-5-sonnet",
    messages=[{"role": "user", "content": "Write a 3-stanza poem about coding."}],
    stream=True,
    zorveus_metadata={"external_user_id": "usr_ext_9941"},
)

for chunk in stream:
    content = chunk.choices[0].delta.content or ""
    print(content, end="", flush=True)

# Asynchronous Streaming
async def stream_chat():
    async_stream = await async_client.chat.completions.create(
        model="anthropic/claude-3-5-sonnet",
        messages=[{"role": "user", "content": "Explain quantum computing."}],
        stream=True,
    )
    async for chunk in async_stream:
        content = chunk.choices[0].delta.content or ""
        print(content, end="", flush=True)
```

### C. Embeddings & Model Discovery

```python
# Generate Embeddings
embeddings = client.embeddings.create(
    model="openai/text-embedding-3-small",
    input=["User query chunk", "Document paragraph"],
)

# List Permitted Models
models = client.models.list(route_status="available")
for model in models.data:
    print(f"Model ID: {model.id}, Provider: {model.provider}")
```

---

## 4. LangChain, LlamaIndex, & LiteLLM Integrations

### LangChain Integration

```python
from langchain_openai import ChatOpenAI

# 1-Line Drop-in with standard LangChain
llm = ChatOpenAI(
    base_url="https://api.zorveus.com/v1",
    api_key=os.environ["ZORVEUS_INFERENCE_KEY"],
    model="openai/gpt-4o",
    default_headers={"X-Zorveus-External-User-Id": "usr_ext_9941"},
)

response = llm.invoke("Summarize annual report.")
print(response.content)
```

### LlamaIndex Integration

```python
from llama_index.llms.openai import OpenAI

llm = OpenAI(
    api_base="https://api.zorveus.com/v1",
    api_key=os.environ["ZORVEUS_INFERENCE_KEY"],
    model="openai/gpt-4o",
)
```

---

## 5. Control Plane: Management API (`client.product_users`, `client.wallet`, `client.caps`)

### A. Product Users & Credit Grants

```python
# 1. Create or Update Product User
user = admin_client.product_users.create_or_update(
    org_id="org_startup_123",
    external_user_id="usr_ext_9941",
    display_name="Alice Smith",
    email="alice@startup.com",
    metadata={"tier": "vip"},
)

# 2. Grant Startup-funded AI Credits
grant = admin_client.product_users.grant_credit(
    product_user_id=user.id,
    org_id="org_startup_123",
    app_id="app_456",
    amount="20.0000", # String formatted decimal
    currency="USD",
    reason="New user onboarding grant",
    expires_at="2026-12-31T23:59:59Z",
)

# 3. Revoke Credit Grant
admin_client.product_users.revoke_credit(
    product_user_id=user.id,
    grant_id=grant.id,
    org_id="org_startup_123",
)
```

### B. Bring Your Own Key / Provider Credentials

```python
# Register an Anthropic BYOK Key
credential = admin_client.provider_credentials.create(
    org_id="org_startup_123",
    provider="anthropic",
    credential_name="Startup Claude Production",
    api_key="sk-ant-...",
    model_policies=["anthropic/*"],
)

# List Active Provider Credentials
credentials = admin_client.provider_credentials.list(
    org_id="org_startup_123",
    status="active",
)
```

### C. Wallet, Caps, & Usage

```python
# 1. Get Wallet Overview
wallet = admin_client.wallet.get_overview(org_id="org_startup_123")
print(f"Available: ${wallet.available_balance}, Reserved: ${wallet.reserved_balance}")

# 2. Set Monthly Spending Cap
cap = admin_client.caps.create(
    org_id="org_startup_123",
    target_type="app_connection",
    target_id="conn_789",
    limit_amount="150.0000",
    period="monthly",
)

# 3. Query Usage & Cost
usage = admin_client.usage.query(
    org_id="org_startup_123",
    start_date="2026-08-01T00:00:00Z",
    end_date="2026-08-13T23:59:59Z",
    group_by=["model", "external_user_id"],
)
```

---

## 6. Error Handling

```python
from zorveus import Zorveus
from zorveus.exceptions import (
    AuthenticationError,
    CapExceededError,
    InsufficientFundsError,
    RateLimitError,
    ZorveusError,
)

client = Zorveus(api_key="zrv_...")

try:
    response = client.chat.completions.create(
        model="openai/gpt-4o",
        messages=[{"role": "user", "content": "Hello"}],
    )
except AuthenticationError:
    print("Invalid or expired Zorveus API Key.")
except CapExceededError as e:
    print(f"Spending cap exceeded: {e.message}")
except InsufficientFundsError:
    print("Startup wallet balance is empty. Top up required.")
except RateLimitError:
    print("Rate limit reached. Backing off.")
except ZorveusError as e:
    print(f"Zorveus API Error: {e.status_code} - {e.message}")
```
