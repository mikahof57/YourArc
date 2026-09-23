import type { ArcCompanionEventEnvelope, ArcCompanionProcessResult } from '../companion/companionTypes';

export type ArcPlatform = 'web' | 'ios' | 'android';
export type ArcLifecycleState = 'foreground' | 'background';

export interface ArcDeepLink {
  url: string;
  protocol: string;
  route: 'unhandled';
}

export interface ArcNativePurchaseProduct {
  id: string;
  displayName: string;
  description: string;
  displayPrice: string;
  currencyCode?: string;
}
export interface ArcNativePurchaseResult {
  productId: string;
  state: 'pending' | 'confirmed' | 'cancelled';
  externalPurchaseId?: string;
  purchaseTimestamp?: string;
  transactionId?: string;
  originalTransactionId?: string;
  purchaseToken?: string;
  orderId?: string;
  storeEnvironment?: string;
  acknowledged?: boolean;
  consumed?: boolean;
}

export interface ArcNativeIapPort {
  readonly available: boolean;
  loadProducts(productIds: readonly string[]): Promise<ArcNativePurchaseProduct[]>;
  purchase(productId: string): Promise<ArcNativePurchaseResult>;
  reconcile(): Promise<ArcNativePurchaseResult[]>;
  finish(confirmedPurchase: ArcNativePurchaseResult): Promise<void>;
}

export interface ArcNativeSecureStoragePort {
  readonly available: boolean;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface ArcNativeCompanionTransportPort {
  readonly available: boolean;
  detect(appId: string): Promise<boolean>;
  subscribe(listener: (event: ArcCompanionEventEnvelope) => void): Promise<() => void>;
}

export interface ArcNativeRuntimeAdapter {
  platform(): ArcPlatform;
  addLifecycleListener(listener: (state: ArcLifecycleState) => void): Promise<() => void>;
  addDeepLinkListener(listener: (link: ArcDeepLink) => void): Promise<() => void>;
  iap: ArcNativeIapPort;
  secureStorage: ArcNativeSecureStoragePort;
  companionTransport: ArcNativeCompanionTransportPort;
}

export interface ArcCompanionGateway {
  processValidatedEvent(event: unknown): Promise<ArcCompanionProcessResult>;
}
