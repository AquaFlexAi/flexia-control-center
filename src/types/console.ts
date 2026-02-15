export interface ConsoleExecRequest {
  serviceId: string;
  instanceId?: string;
  cmd: string[];
}

export interface ConsoleExecResponse {
  output?: string;
  error?: string;
}
