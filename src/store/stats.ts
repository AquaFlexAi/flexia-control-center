import { create } from 'zustand';

export type TelemetryPoint = { recorded_at: string; value: number; tokens?: number };

type State = {
  telemetry: Record<string, TelemetryPoint[]>;
  setTelemetry: (serviceId: string, points: TelemetryPoint[]) => void;
  appendTelemetry: (serviceId: string, point: TelemetryPoint) => void;
  getTelemetry: (serviceId: string) => TelemetryPoint[];
};

const EMPTY_TELEMETRY: TelemetryPoint[] = [];

export const useStatsStore = create<State>((set, get) => ({
  telemetry: {},
  setTelemetry: (serviceId, points) =>
    set((s) => ({ telemetry: { ...s.telemetry, [serviceId]: points.slice(-200) } })),
  appendTelemetry: (serviceId, point) =>
    set((s) => {
      const prev = s.telemetry[serviceId] || [];
      const next = [...prev, point].slice(-200);
      return { telemetry: { ...s.telemetry, [serviceId]: next } };
    }),
  getTelemetry: (serviceId) => get().telemetry[serviceId] || EMPTY_TELEMETRY,
}));
