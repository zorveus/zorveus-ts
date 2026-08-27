export interface Model {
  id: string;
  object: "model";
  created: number;
  owned_by: string;
  provider?: string;
  mode?: string;
  max_input_tokens?: number;
  max_output_tokens?: number;
  route_status?: "available" | "degraded" | "unavailable";
}

export interface ModelListParams {
  routeStatus?: "available" | "degraded" | "unavailable";
}

export interface ModelListResponse {
  object: "list";
  data: Model[];
}
