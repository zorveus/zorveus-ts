# `zorveus-go` Go SDK Specification

Official Go SDK specification for **Zorveus**. Provides an idiomatic Go client for both the OpenAI-compatible inference gateway and the Zorveus management control plane with full `context.Context` support.

---

## 1. Package Installation

```bash
go get github.com/zorveus/zorveus-go
```

### Supported Environments
- **Go**: 1.21+
- **HTTP Transport**: Standard `net/http` with configurable timeout and transport
- **Context Support**: All network calls require `context.Context`

---

## 2. Client Initialization

```go
package main

import (
	"context"
	"fmt"
	"os"

	"github.com/zorveus/zorveus-go"
)

func main() {
	// 1. Inference Gateway Client
	client := zorveus.NewClient(
		zorveus.WithAPIKey(os.Getenv("ZORVEUS_INFERENCE_KEY")), // "zrv_live_..."
	)

	// 2. Control Plane Admin Client
	adminClient := zorveus.NewClient(
		zorveus.WithAPIKey(os.Getenv("ZORVEUS_SERVICE_KEY")), // "zrv_service_..."
		zorveus.WithBaseURL("https://api.zorveus.com"),
	)

	_ = client
	_ = adminClient
}
```

---

## 3. Data Plane: Inference Gateway

### Standard Chat Completion with Inline Attribution

```go
resp, err := client.Chat.CreateCompletion(context.Background(), zorveus.ChatCompletionRequest{
	Model: "openai/gpt-4o",
	Messages: []zorveus.ChatMessage{
		{Role: zorveus.RoleSystem, Content: "You are a backend engineer."},
		{Role: zorveus.RoleUser, Content: "Explain Goroutines."},
	},
	ZorveusMetadata: &zorveus.Metadata{
		ExternalUserID: "usr_ext_9941",
		DisplayName:    "Alice Smith",
		UserEmail:      "alice@startup.com",
	},
})
if err != nil {
	log.Fatalf("Inference error: %v", err)
}

fmt.Println(resp.Choices[0].Message.Content)
fmt.Printf("Total Tokens: %d\n", resp.Usage.TotalTokens)
```

### Streaming Completion

```go
stream, err := client.Chat.CreateCompletionStream(context.Background(), zorveus.ChatCompletionRequest{
	Model: "anthropic/claude-3-5-sonnet",
	Messages: []zorveus.ChatMessage{
		{Role: zorveus.RoleUser, Content: "Stream a fast response."},
	},
	Stream: true,
})
if err != nil {
	log.Fatalf("Stream error: %v", err)
}
defer stream.Close()

for chunk := range stream.Chunks() {
	if len(chunk.Choices) > 0 {
		fmt.Print(chunk.Choices[0].Delta.Content)
	}
}
```

---

## 4. Control Plane: Management API

### Product Users & Credit Grants

```go
// 1. Create or Update Product User
user, err := adminClient.ProductUsers.CreateOrUpdate(context.Background(), zorveus.ProductUserParams{
	OrgID:          "org_startup_123",
	ExternalUserID: "usr_ext_9941",
	DisplayName:    "Alice Smith",
	Email:          "alice@startup.com",
})

// 2. Grant Credits
grant, err := adminClient.ProductUsers.GrantCredit(context.Background(), user.ID, zorveus.CreditGrantParams{
	OrgID:    "org_startup_123",
	AppID:    "app_456",
	Amount:   "10.0000",
	Currency: "USD",
	Reason:   "Go SDK welcome credit",
})
```

### Wallet & Caps

```go
// Get Wallet Overview
overview, err := adminClient.Wallet.GetOverview(context.Background(), "org_startup_123")
fmt.Printf("Available: %s %s\n", overview.AvailableBalance, overview.Currency)

// Create Monthly Cap
cap, err := adminClient.Caps.Create(context.Background(), zorveus.CapParams{
	OrgID:       "org_startup_123",
	TargetType:  "app_connection",
	TargetID:    "conn_789",
	LimitAmount: "100.0000",
	Period:      "monthly",
})
```

---

## 5. Error Handling

```go
resp, err := client.Chat.CreateCompletion(ctx, req)
if err != nil {
	var capErr *zorveus.CapExceededError
	var authErr *zorveus.AuthenticationError
	var fundErr *zorveus.InsufficientFundsError

	switch {
	case errors.As(err, &capErr):
		fmt.Printf("Spending cap reached: %s\n", capErr.Message)
	case errors.As(err, &fundErr):
		fmt.Println("Wallet balance exhausted.")
	case errors.As(err, &authErr):
		fmt.Println("Invalid API key.")
	default:
		fmt.Printf("Zorveus API error: %v\n", err)
	}
}
```
