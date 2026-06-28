import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { createClientStateSlice } from './storeFilters';
import { createServerStateSlice } from './storeServerState';
import type { ConsoleState, ServerStateDeps } from './storeTypes';

export function createConsoleStore(
  deps: ServerStateDeps,
): UseBoundStore<StoreApi<ConsoleState>> {
  return create<ConsoleState>((set, get) => ({
    ...createClientStateSlice(set),
    ...createServerStateSlice(set, get, deps),
  }));
}
