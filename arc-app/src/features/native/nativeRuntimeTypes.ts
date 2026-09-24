import type { ArcCompanionEventEnvelope, ArcCompanionProcessResult } from '../companion/companionTypes';

export type ArcPlatform = 'web' | 'ios' | 'android';
export type ArcLifecycleState = 'foreground' | 'background';

export interface ArcDeepLink {
  url: string;
  protocol: string;
  route: 'unhandled';
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
  secureStorage: ArcNativeSecureStoragePort;
  companionTransport: ArcNativeCompanionTransportPort;
}

export interface ArcCompanionGateway {
  processValidatedEvent(event: unknown): Promise<ArcCompanionProcessResult>;
}
