export interface LogEntry {
  id: string;
  type: 'user' | 'agent' | 'info' | 'error' | 'warning' | 'tool' | 'code_exe' | 'response' | 'browser';
  heading: string;
  content: string;
  timestamp?: number;
  temp?: boolean; // temporary message?
  kvps?: Record<string, any>; // key-value pairs
}

export interface AgentContext {
  id: string;
  name?: string;
  created_at?: string;
}

export interface PollResponse {
  logs: LogEntry[];
  notifications: any[];
  contexts: any[]; // List of contexts
  tasks: any[];
  context: AgentContext | null;
}

export type FieldOption = { value: string; label: string };

export type Field =
  | {
      id: string;
      title: string;
      description?: string;
      type:
        | 'select'
        | 'text'
        | 'number'
        | 'range'
        | 'switch'
        | 'textarea'
        | 'password'
        | 'button'
        | 'html';
      value: any;
      options?: FieldOption[];
      min?: number;
      max?: number;
      step?: number;
      style?: string;
      hidden?: boolean;
    };

export type Section = {
  id: string;
  title: string;
  description?: string;
  fields: Field[];
  tab?: string;
};
