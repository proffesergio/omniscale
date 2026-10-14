'use client';
import { useSyncExternalStore } from 'react';
const subscribe = () => () => {};
export function useBrowserTimezone() {
  return useSyncExternalStore(
    subscribe,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => 'UTC',
  );
}
