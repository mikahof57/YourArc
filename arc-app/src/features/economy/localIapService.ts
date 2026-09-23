import type { Language } from '../../utils/i18n';
import type { ArcSaveGame } from '../savegame/arcSaveGame';
import type { ArcNativePurchaseProduct, ArcNativePurchaseResult, ArcPlatform } from '../native/nativeRuntimeTypes';
import type { LocalEconomyService } from './localEconomyService';
import { ARC_IAP_PRODUCT_CATALOG, getArcIapProduct, getArcIapProductByStoreId, storeProductId, type ArcIapPackagePositioning, type ArcIapPlatform } from './arcIapCatalog';

export interface ArcIapDisplayProduct {
  internalProductId: string;
  credits: number;
  title: string;
  description: string;
  positioning: ArcIapPackagePositioning;
  displayPrice: string | null;
  available: boolean;
}

export type ArcIapPurchaseOutcome =
  | { state: 'pending' | 'cancelled' }
  | { state: 'success'; save: ArcSaveGame; creditsAdded: number; balance: number; completionPending: boolean };

export interface ArcIapRuntime {
  platform(): ArcPlatform;
  capabilities(): { iap: boolean };
  loadIapProducts(productIds: readonly string[]): Promise<ArcNativePurchaseProduct[]>;
  purchaseIapProduct(productId: string): Promise<ArcNativePurchaseResult>;
  reconcileIapPurchases(): Promise<ArcNativePurchaseResult[]>;
  finishIapPurchase(purchase: ArcNativePurchaseResult): Promise<void>;
}

function nativePlatform(platform: ArcPlatform): ArcIapPlatform | null {
  return platform === 'ios' || platform === 'android' ? platform : null;
}

export class LocalIapService {
  constructor(private readonly runtime: ArcIapRuntime, private readonly economy: LocalEconomyService) {}

  isAvailable(): boolean { return nativePlatform(this.runtime.platform()) !== null && this.runtime.capabilities().iap; }

  async loadProducts(language: Language): Promise<ArcIapDisplayProduct[]> {
    const platform = nativePlatform(this.runtime.platform());
    const configuredIds = platform ? ARC_IAP_PRODUCT_CATALOG.flatMap((product) => storeProductId(product, platform) ?? []) : [];
    let nativeProducts: ArcNativePurchaseProduct[] = [];
    if (platform && this.runtime.capabilities().iap && configuredIds.length) nativeProducts = await this.runtime.loadIapProducts(configuredIds);
    const nativeById = new Map(nativeProducts.map((product) => [product.id, product]));
    return ARC_IAP_PRODUCT_CATALOG.map((product) => {
      const id = platform ? storeProductId(product, platform) : null;
      const native = id ? nativeById.get(id) : undefined;
      return {
        internalProductId: product.internalProductId, credits: product.credits,
        title: native?.displayName || product.fallbackName[language],
        description: native?.description || product.fallbackDescription[language],
        positioning: product.positioning,
        displayPrice: native?.displayPrice ?? null,
        available: Boolean(native && id),
      };
    });
  }

  async purchase(internalProductId: string): Promise<ArcIapPurchaseOutcome> {
    const platform = nativePlatform(this.runtime.platform());
    const product = getArcIapProduct(internalProductId);
    if (!platform || !this.runtime.capabilities().iap) throw new Error('arc_iap_native_app_required');
    if (!product) throw new Error('arc_iap_unknown_product');
    const id = storeProductId(product, platform);
    if (!id) throw new Error('arc_iap_product_unconfigured');
    return this.process(await this.runtime.purchaseIapProduct(id), platform);
  }

  async reconcile(): Promise<ArcIapPurchaseOutcome[]> {
    const platform = nativePlatform(this.runtime.platform());
    if (!platform || !this.runtime.capabilities().iap) return [];
    const results = await this.runtime.reconcileIapPurchases();
    const outcomes: ArcIapPurchaseOutcome[] = [];
    for (const result of results) outcomes.push(await this.process(result, platform));
    return outcomes;
  }

  private async process(result: ArcNativePurchaseResult, platform: ArcIapPlatform): Promise<ArcIapPurchaseOutcome> {
    if (result.state === 'pending' || result.state === 'cancelled') return { state: result.state };
    const product = getArcIapProductByStoreId(platform, result.productId);
    if (!product || !result.externalPurchaseId || !result.purchaseTimestamp) throw new Error('arc_iap_unknown_external_transaction');
    const save = await this.economy.applyVerifiedExternalPurchase({
      externalPurchaseId: result.externalPurchaseId, productId: result.productId, platform,
      purchaseTimestamp: result.purchaseTimestamp,
      metadata: {
        transactionId: result.transactionId, originalTransactionId: result.originalTransactionId,
        purchaseToken: result.purchaseToken, orderId: result.orderId,
        storeEnvironment: result.storeEnvironment, acknowledged: result.acknowledged, consumed: result.consumed,
      },
    });
    let completionPending = false;
    try { await this.runtime.finishIapPurchase(result); } catch { completionPending = true; }
    return { state: 'success', save, creditsAdded: product.credits, balance: save.economy.credits, completionPending };
  }
}
