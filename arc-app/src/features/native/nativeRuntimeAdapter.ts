import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import type {
  ArcDeepLink, ArcLifecycleState, ArcNativeCompanionTransportPort,
  ArcNativeRuntimeAdapter, ArcNativeSecureStoragePort, ArcPlatform,
} from './nativeRuntimeTypes';

const unsupported = (feature: string): Error => new Error(`arc_native_${feature}_not_available`);

export const unsupportedSecureStorage: ArcNativeSecureStoragePort = {
  available: false,
  async get() { return null; },
  async set() { throw unsupported('secure_storage'); },
  async remove() { throw unsupported('secure_storage'); },
};

export const disabledCompanionTransport: ArcNativeCompanionTransportPort = {
  available: false,
  async detect() { return false; },
  async subscribe() { return () => undefined; },
};

export function normalizePlatform(value: string): ArcPlatform {
  return value === 'ios' || value === 'android' ? value : 'web';
}

export function parseArcDeepLink(url: string): ArcDeepLink | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'arc:') return null;
    return { url, protocol: parsed.protocol, route: 'unhandled' };
  } catch { return null; }
}

export class CapacitorNativeRuntimeAdapter implements ArcNativeRuntimeAdapter {
  readonly secureStorage = unsupportedSecureStorage;
  readonly companionTransport = disabledCompanionTransport;

  platform(): ArcPlatform { return normalizePlatform(Capacitor.getPlatform()); }

  async addLifecycleListener(listener: (state: ArcLifecycleState) => void): Promise<() => void> {
    if (!Capacitor.isNativePlatform()) {
      if (typeof document === 'undefined') return () => undefined;
      const handler = () => listener(document.visibilityState === 'visible' ? 'foreground' : 'background');
      document.addEventListener('visibilitychange', handler);
      return () => document.removeEventListener('visibilitychange', handler);
    }
    const handle = await CapacitorApp.addListener('appStateChange', ({ isActive }) => listener(isActive ? 'foreground' : 'background'));
    return () => { void handle.remove(); };
  }

  async addDeepLinkListener(listener: (link: ArcDeepLink) => void): Promise<() => void> {
    if (!Capacitor.isNativePlatform()) return () => undefined;
    const handle = await CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      const link = parseArcDeepLink(url);
      if (link) listener(link);
    });
    return () => { void handle.remove(); };
  }
}
