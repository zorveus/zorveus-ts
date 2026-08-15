export interface Model {
  id: string;
  object: "model";
  created: number;
  owned_by: string;
  provider?: string;
  route_status?: "available" | "degraded" | "unavailable";
}

export interface ModelListParams {
  routeStatus?: "available" | "degraded" | "unavailable";
}

export interface ModelListResponse {
  object: "list";
  data: Model[];
}
