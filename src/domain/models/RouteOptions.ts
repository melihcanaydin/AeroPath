export interface RouteOptions {
  withGroundHops: boolean;
  maxHops?: number;
}

export interface RouteResult {
  source: string;
  destination: string;
  distance: number;
  hops: string[];
} 