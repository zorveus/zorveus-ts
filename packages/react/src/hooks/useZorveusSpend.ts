import { useState, useEffect, useCallback, useRef } from "react";
import {
  AuthenticationError,
  formatDecimalString,
  type InferenceKeyUsageResponse,
  type ZorveusError
} from "@zorveus/sdk";
import { useOptionalZorveusContext } from "../context/ZorveusContext";

export interface UseZorveusSpendOptions {
  autoFetch?: boolean;
}

export interface UseZorveusSpendReturn {
  usage: InferenceKeyUsageResponse | null;
  spentDecimal: string;
  /**
   * Reference-priced virtual spend recorded on this key during the current period.
   */
  spent: number;
  spentFormatted: string;
  /**
   * Base virtual allowance cap on this key (null if uncapped).
   */
  spendCap: number | null;
  spendCapDecimal: string | null;
  spendCapFormatted: string | null;
  /**
   * Remaining base virtual allowance on this key (null if uncapped).
   */
  remainingBalance: number | null;
  remainingBalanceDecimal: string | null;
  remainingBalanceFormatted: string | null;
  currency: string;
  period: string;
  resetAt: string | null;
  status: string | null;
  isLoading: boolean;
  error: ZorveusError | Error | null;
  refresh: () => Promise<void>;
}

/**
 * React hook that queries live spending, budget caps, and balances for the active Zorveus connection.
 * Guarantees zero network calls when unauthenticated.
 */
export function useZorveusSpend(options: UseZorveusSpendOptions = {}): UseZorveusSpendReturn {
  const { autoFetch = true } = options;
  const context = useOptionalZorveusContext();
  const client = context?.client ?? null;

  const [usage, setUsage] = useState<InferenceKeyUsageResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ZorveusError | Error | null>(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchUsage = useCallback(async () => {
    if (!client) {
      if (isMountedRef.current) {
        setIsLoading(false);
        setUsage(null);
        setError(
          new AuthenticationError("Authentication required. Connect your AI wallet to view spend and usage.", {
            code: "unauthenticated"
          })
        );
      }
      return;
    }

    if (isMountedRef.current) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const data = await client.getUsage();
      if (isMountedRef.current) {
        setUsage(data);
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setUsage(null);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [client]);

  useEffect(() => {
    if (autoFetch) {
      void fetchUsage();
    }
  }, [autoFetch, fetchUsage]);

  const spentDecimal = usage?.virtual_spend_this_period ?? usage?.spent_this_period ?? "0";
  const spendCapDecimal = usage?.spend_cap ?? null;
  const remainingBalanceDecimal = usage?.remaining_balance ?? null;

  // Numeric aliases remain for compatibility. Use the Decimal fields for money calculations.
  const spent = Number(spentDecimal);
  const spendCap = spendCapDecimal === null ? null : Number(spendCapDecimal);
  const remainingBalance = remainingBalanceDecimal === null ? null : Number(remainingBalanceDecimal);

  return {
    usage,
    spentDecimal,
    spent,
    spentFormatted: formatDecimalString(spentDecimal),
    spendCapDecimal,
    spendCap,
    spendCapFormatted: spendCapDecimal !== null ? formatDecimalString(spendCapDecimal) : null,
    remainingBalanceDecimal,
    remainingBalance,
    remainingBalanceFormatted: remainingBalanceDecimal !== null
      ? formatDecimalString(remainingBalanceDecimal)
      : null,
    currency: usage?.currency || "USD",
    period: usage?.period || "monthly",
    resetAt: usage?.reset_at || null,
    status: usage?.status || null,
    isLoading,
    error,
    refresh: fetchUsage
  };
}
