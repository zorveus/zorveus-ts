import { describe, it, expect } from "vitest";
import {
  ZorveusError,
  APIConnectionError,
  APIStatusError,
  AuthenticationError,
  PermissionDeniedError,
  NotFoundError,
  UnprocessableEntityError,
  RateLimitError,
  InternalServerError,
  InsufficientFundsError,
  CapExceededError,
  CreditGrantExpiredError,
  createAPIError
} from "../src/index";

describe("Error Hierarchy", () => {
  it("creates proper hierarchy for AuthenticationError (401)", () => {
    const err = createAPIError(401, { error: { message: "Invalid key", code: "invalid_api_key" } });
    expect(err).toBeInstanceOf(AuthenticationError);
    expect(err).toBeInstanceOf(APIStatusError);
    expect(err).toBeInstanceOf(ZorveusError);
    expect(err.status).toBe(401);
    expect(err.code).toBe("invalid_api_key");
    expect(err.message).toBe("Invalid key");
  });

  it("creates InsufficientFundsError on 402 or balance error code", () => {
    const err402 = createAPIError(402, { error: { message: "Balance exhausted", code: "insufficient_funds" } });
    expect(err402).toBeInstanceOf(InsufficientFundsError);
    expect(err402.status).toBe(402);

    const errCode = createAPIError(400, { error: { message: "Wallet is empty", code: "wallet_empty" } });
    expect(errCode).toBeInstanceOf(InsufficientFundsError);
  });

  it("creates CapExceededError on spend cap code", () => {
    const err = createAPIError(403, { error: { message: "Monthly cap reached", code: "cap_exceeded" } });
    expect(err).toBeInstanceOf(CapExceededError);
    expect(err.status).toBe(403);
    expect(err.code).toBe("cap_exceeded");
  });

  it("creates CreditGrantExpiredError on grant expired code", () => {
    const err = createAPIError(403, { error: { message: "Grant expired", code: "grant_expired" } });
    expect(err).toBeInstanceOf(CreditGrantExpiredError);
  });

  it("creates PermissionDeniedError (403)", () => {
    const err = createAPIError(403, { error: { message: "Forbidden" } });
    expect(err).toBeInstanceOf(PermissionDeniedError);
    expect(err.status).toBe(403);
  });

  it("creates NotFoundError (404)", () => {
    const err = createAPIError(404, { error: { message: "Not found" } });
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err.status).toBe(404);
  });

  it("creates UnprocessableEntityError (422)", () => {
    const err = createAPIError(422, { detail: [{ msg: "Field required" }] });
    expect(err).toBeInstanceOf(UnprocessableEntityError);
    expect(err.status).toBe(422);
    expect(err.message).toBe("Field required");
  });

  it("creates RateLimitError (429)", () => {
    const err = createAPIError(429, { error: { message: "Rate limit exceeded" } });
    expect(err).toBeInstanceOf(RateLimitError);
    expect(err.status).toBe(429);
  });

  it("creates InternalServerError (500)", () => {
    const err = createAPIError(500, { error: { message: "Internal error" } });
    expect(err).toBeInstanceOf(InternalServerError);
    expect(err.status).toBe(500);
  });

  it("creates APIConnectionError with cause", () => {
    const cause = new Error("Network timeout");
    const connErr = new APIConnectionError("Failed to connect", { cause });
    expect(connErr).toBeInstanceOf(APIConnectionError);
    expect(connErr).toBeInstanceOf(ZorveusError);
    expect(connErr.cause).toBe(cause);
  });
});
