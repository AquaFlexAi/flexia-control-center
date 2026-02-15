export interface AgentZeroResolution {
  url: string;
  name: string;
}

export interface AgentZeroParams {
  path: string[];
}

// Since the route uses dynamic params
export interface AgentZeroRouteContext {
  params: Promise<AgentZeroParams>;
}
