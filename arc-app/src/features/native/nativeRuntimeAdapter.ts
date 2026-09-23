import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import type {
  ArcDeepLink, ArcLifecycleState, ArcNativeCompanionTransportPort, ArcNativeIapPort,
  ArcNativeRuntimeAdapter, ArcNativeSecureStoragePort, ArcPlatform,
} from './nativeRuntimeTypes';
import { ARC_IAP_PRODUCT_CATALOG, storeProductId, type ArcIapPlatform } from '../economy/arcIapCatalog';

const unsupported = (feature: string): Error => new Error(`arc_native_${feature}_not_available`);

export const unsupportedIap: ArcNativeIapPort = {
  available: false,
  async loadProducts() { return []; },
  async purchase() { throw unsupported('iap'); },
  async reconcile() { return []; },
  async finish() { throw unsupported('iap'); },
};

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

class LazyCapacitorIapAdapter implements ArcNativeIapPort {
  private implementation: Promise<ArcNativeIapPort> | null = null;
  constructor(private readonly platform: ArcIapPlatform | null) {}
  get available() { return this.platform !== null && ARC_IAP_PRODUCT_CATALOG.some((product) => storeProductId(product, this.platform!) !== null); }
  private load(): Promise<ArcNativeIapPort> {
    if (!this.available || !this.platform) return Promise.reject(new Error('arc_iap_store_unavailable'));
    if (!this.implementation) this.implementation = import('./capacitorStoreIapAdapter')
      .then(({ CapacitorStoreIapAdapter }) => new CapacitorStoreIapAdapter(this.platform));
    return this.implementation;
  }
  async loadProducts(ids: readonly string[]) { return (await this.load()).loadProducts(ids); }
  async purchase(id: string) { return (await this.load()).purchase(id); }
  async reconcile() { return (await this.load()).reconcile(); }
  async finish(purchase: import('./nativeRuntimeTypes').ArcNativePurchaseResult) { return (await this.load()).finish(purchase); }
}

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
  readonly iap = new LazyCapacitorIapAdapter(
    Capacitor.isNativePlatform() && (Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android')
      ? Capacitor.getPlatform() as 'ios' | 'android' : null,
  );
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
