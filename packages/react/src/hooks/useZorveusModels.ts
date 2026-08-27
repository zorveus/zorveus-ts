import { useState, useEffect, useCallback, useRef } from "react";
import { AuthenticationError, type Model, type ModelListParams, type ZorveusError } from "@zorveus/sdk";
import { useZorveusContext } from "../context/ZorveusContext";

export interface UseZorveusModelsOptions {
  routeStatus?: "available" | "degraded" | "unavailable";
  autoFetch?: boolean;
}

export interface UseZorveusModelsReturn {
  models: Model[];
  isLoading: boolean;
  error: ZorveusError | Error | null;
  refreshModels: () => Promise<void>;
}

export function useZorveusModels(options: UseZorveusModelsOptions = {}): UseZorveusModelsReturn {
  const { routeStatus = "available", autoFetch = true } = options;
  const { client } = useZorveusContext();

  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ZorveusError | Error | null>(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchModels = useCallback(async () => {
    if (!client) {
      if (isMountedRef.current) {
        setIsLoading(false);
        setModels([]);
        setError(
          new AuthenticationError("Authentication required. Connect your AI wallet to load available models.", {
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
      const params: ModelListParams = { routeStatus };
      const response = await client.models.list(params);
      if (isMountedRef.current) {
        if (response && Array.isArray(response.data)) {
          setModels(response.data);
        } else {
          setModels([]);
        }
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setModels([]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [client, routeStatus]);

  useEffect(() => {
    if (autoFetch) {
      void fetchModels();
    }
  }, [autoFetch, fetchModels]);

  return {
    models,
    isLoading,
    error,
    refreshModels: fetchModels
  };
}
