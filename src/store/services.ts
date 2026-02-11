import { create } from 'zustand';
import { Service } from '@/types/service';

type Instance = {
  id: string;
  name: string;
  status: string;
  statusDetail?: string;
  is_running?: boolean;
  ip?: string;
  node?: string;
  containerName?: string;
};

type NormalizedService = Service & {
  instance_details: Instance[];
  activeInstances: number;
  is_online?: boolean;
  pending_action?: string | null;
};

function normalizeService(s: any): NormalizedService {
  const details = (s.instance_details || s.instanceDetails || []).map((i: any) => ({
    id: i.id,
    name: i.name,
    status: i.status,
    statusDetail: i.statusDetail,
    is_running: i.is_running != null ? i.is_running : i.status === 'running',
    ip: i.ip,
    node: i.node,
    containerName: i.containerName,
  }));
  const active = s.activeInstances ?? s.active_instances ?? details.filter((d: any) => d.is_running).length;
  return {
    ...s,
    instance_details: details,
    activeInstances: active,
    is_online: s.is_online != null ? s.is_online : s.status === 'online',
    pending_action: s.pending_action ?? null,
  };
}

type State = {
  byId: Record<string, NormalizedService>;
  ids: string[];
  inflightActions: Record<string, string | null>;
  upsertServices: (list: any[]) => void;
  patchService: (id: string, partial: Partial<NormalizedService>) => void;
  upsertInstances: (id: string, instances: any[]) => void;
  removeService: (id: string) => void;
  setInflight: (id: string, action: string | null) => void;
  getList: () => NormalizedService[];
};

export const useServicesStore = create<State>((set, get) => ({
  byId: {},
  ids: [],
  inflightActions: {},
  upsertServices: (list) =>
    set((s) => {
      const next: Record<string, NormalizedService> = { ...s.byId };
      for (const item of list) {
        const n = normalizeService(item);
        next[n.id] = { ...(next[n.id] || {} as any), ...n };
      }
      const ids = Array.from(new Set([...s.ids, ...list.map((x: any) => x.id)]));
      return { byId: next, ids };
    }),
  patchService: (id, partial) =>
    set((s) => ({ byId: { ...s.byId, [id]: { ...s.byId[id], ...partial } } })),
  upsertInstances: (id, instances) =>
    set((s) => {
      const svc = s.byId[id];
      if (!svc) return {};
      const normalized = instances.map((i: any) => ({
        ...i,
        is_running: i.is_running != null ? i.is_running : i.status === 'running',
      }));
      const active = normalized.filter((i: any) => i.is_running).length;
      return {
        byId: {
          ...s.byId,
          [id]: { ...svc, instance_details: normalized, activeInstances: active, is_online: active > 0 },
        },
      };
    }),
  removeService: (id) =>
    set((s) => {
      const { [id]: _, ...rest } = s.byId;
      return {
        byId: rest,
        ids: s.ids.filter((i) => i !== id),
      };
    }),
  setInflight: (id, action) =>
    set((s) => ({ inflightActions: { ...s.inflightActions, [id]: action } })),
  getList: () => get().ids.map((id) => get().byId[id]).filter(Boolean),
}));
