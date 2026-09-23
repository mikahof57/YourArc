import type { LocalCompanionBridgeService } from '../companion/localCompanionBridgeService';
import type { ArcNativePurchaseResult, ArcNativeRuntimeAdapter, ArcPlatform } from './nativeRuntimeTypes';
import type { ArcSaveGame } from '../savegame/arcSaveGame';

export class ArcNativeRuntimeService {
  private resumeWork: Promise<ArcSaveGame | undefined> | null = null;
  private stopListeners: Array<() => void> = [];

  constructor(
    private readonly adapter: ArcNativeRuntimeAdapter,
    private readonly initializeArcDay: () => Promise<ArcSaveGame | undefined>,
    private readonly companionBridge: LocalCompanionBridgeService,
  ) {}

  platform(): ArcPlatform { return this.adapter.platform(); }
  capabilities() {
    return {
      iap: this.adapter.iap.available,
      secureStorage: this.adapter.secureStorage.available,
      companionTransport: this.adapter.companionTransport.available,
    };
  }
  loadIapProducts(productIds: readonly string[]) { return this.adapter.iap.loadProducts(productIds); }
  purchaseIapProduct(productId: string) { return this.adapter.iap.purchase(productId); }
  reconcileIapPurchases() { return this.adapter.iap.reconcile(); }
  finishIapPurchase(purchase: ArcNativePurchaseResult) { return this.adapter.iap.finish(purchase); }

  /** Native ingress must always pass through the Phase-8 validation/domain boundary. */
  processCompanionEvent(event: unknown) { return this.companionBridge.processEvent(event); }

  async resume(): Promise<ArcSaveGame | undefined> {
    if (!this.resumeWork) {
      this.resumeWork = this.initializeArcDay().finally(() => { this.resumeWork = null; });
    }
    return this.resumeWork;
  }

  async start(onForegroundSave: (save: ArcSaveGame | undefined) => Promise<void> | void): Promise<() => void> {
    const removeLifecycle = await this.adapter.addLifecycleListener((state) => {
      if (state === 'foreground') void this.resume().then(onForegroundSave).catch((error) => console.warn('ARC resume initialization failed:', error));
    });
    const removeDeepLinks = await this.adapter.addDeepLinkListener(() => {
      // Routing is intentionally inactive until a production deep-link contract exists.
    });
    this.stopListeners.push(removeLifecycle, removeDeepLinks);
    return () => this.stop();
  }

  stop(): void {
    for (const remove of this.stopListeners.splice(0)) remove();
  }
}
