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
  ProductUserAllowanceInsufficientError,
  ReservationConflictError,
  AppConnectionNotFoundError,
  createAPIError,
  parseZorveusGatewayError
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
    const err402 = createAPIError(402, {
      error: { message: "Balance exhausted", code: "zorveus_reservation_insufficient_balance" }
    });
    expect(err402).toBeInstanceOf(InsufficientFundsError);
    expect(err402.status).toBe(402);
    expect(err402.code).toBe("zorveus_reservation_insufficient_balance");

    const errCode = createAPIError(400, { error: { message: "Wallet is empty", code: "wallet_empty" } });
    expect(errCode).toBeInstanceOf(InsufficientFundsError);

    const defaultInst = new InsufficientFundsError();
    expect(defaultInst.status).toBe(402);
    expect(defaultInst.code).toBe("zorveus_reservation_insufficient_balance");
  });

  it("creates CapExceededError with status 403 on spend cap code", () => {
    const err = createAPIError(403, { error: { message: "Monthly cap reached", code: "zorveus_cap_exceeded" } });
    expect(err).toBeInstanceOf(CapExceededError);
    expect(err.status).toBe(403);
    expect(err.code).toBe("zorveus_cap_exceeded");

    const defaultCapErr = new CapExceededError();
    expect(defaultCapErr.status).toBe(403);
    expect(defaultCapErr.code).toBe("zorveus_cap_exceeded");
  });

  it("creates ProductUserAllowanceInsufficientError on zorveus_product_user_allowance_insufficient", () => {
    const params = {
      cap_rule_id: "cap_123",
      cap_period: "monthly",
      currency: "USD",
      cap_amount: "10.000000000000",
      settled_spend_this_period: "8.000000000000",
      active_reservations_amount: "0.000000000000",
      remaining_base_allowance: "2.000000000000",
      promotional_credit_balance: "0.500000000000",
      available_allowance: "2.500000000000",
      estimated_request_cost: "5.000000000000",
      shortfall: "2.500000000000"
    };

    const err = createAPIError(403, {
      error: {
        code: "zorveus_product_user_allowance_insufficient",
        message: "AI allowance insufficient",
        params
      }
    });

    expect(err).toBeInstanceOf(ProductUserAllowanceInsufficientError);
    expect(err.status).toBe(403);
    expect(err.code).toBe("zorveus_product_user_allowance_insufficient");
    expect(err.params).toEqual(params);
    expect((err as ProductUserAllowanceInsufficientError).params?.shortfall).toBe("2.500000000000");
  });

  it("unwraps nested gateway error from error.provider_specific_fields.error", () => {
    const nestedPayload = {
      error: {
        message: "Upstream provider returned an error",
        provider_specific_fields: {
          error: {
            code: "zorveus_product_user_allowance_insufficient",
            message: "Allowance exhausted for product user",
            params: {
              cap_rule_id: "cap_456",
              shortfall: "1.000000000000"
            }
          }
        }
      }
    };

    const err = createAPIError(403, nestedPayload);
    expect(err).toBeInstanceOf(ProductUserAllowanceInsufficientError);
    expect(err.message).toBe("Allowance exhausted for product user");
    expect(err.code).toBe("zorveus_product_user_allowance_insufficient");
    expect(err.params?.shortfall).toBe("1.000000000000");
  });

  it("recognizes legacy zorveus_product_user_credits_insufficient code", () => {
    const err = createAPIError(403, {
      error: {
        code: "zorveus_product_user_credits_insufficient",
        message: "Credits insufficient"
      }
    });
    expect(err).toBeInstanceOf(ProductUserAllowanceInsufficientError);
    expect(err.status).toBe(403);
  });

  it("creates ReservationConflictError on 409 conflict", () => {
    const err = createAPIError(409, {
      error: { message: "Idempotency key reused with different body", code: "zorveus_reservation_conflict" }
    });
    expect(err).toBeInstanceOf(ReservationConflictError);
    expect(err.status).toBe(409);
    expect(err.code).toBe("zorveus_reservation_conflict");
  });

  it("creates AppConnectionNotFoundError on zorveus_app_connection_not_found", () => {
    const err = createAPIError(403, {
      error: { message: "Connection not found", code: "zorveus_app_connection_not_found" }
    });
    expect(err).toBeInstanceOf(AppConnectionNotFoundError);
    expect(err.status).toBe(403);
    expect(err.code).toBe("zorveus_app_connection_not_found");
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

  it("parseZorveusGatewayError turns an external OpenAI error object into typed Zorveus error", () => {
    const openAIError = {
      status: 403,
      error: {
        code: "zorveus_product_user_allowance_insufficient",
        message: "Allowance exhausted",
        params: { shortfall: "0.500000000000" }
      }
    };

    const parsed = parseZorveusGatewayError(openAIError);
    expect(parsed).toBeInstanceOf(ProductUserAllowanceInsufficientError);
    expect((parsed as ProductUserAllowanceInsufficientError).params?.shortfall).toBe("0.500000000000");

    // Returns original object if not parseable
    expect(parseZorveusGatewayError("plain string")).toBe("plain string");
  });
});

