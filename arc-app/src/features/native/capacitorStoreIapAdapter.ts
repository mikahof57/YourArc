import { ErrorCode, Platform, ProductType, store, type IError, type Transaction } from 'capacitor-plugin-cdv-purchase';
import { ARC_IAP_PRODUCT_CATALOG, storeProductId, type ArcIapPlatform } from '../economy/arcIapCatalog';
import type { ArcNativeIapPort, ArcNativePurchaseProduct, ArcNativePurchaseResult } from './nativeRuntimeTypes';

type PendingWaiter = { resolve: (result: ArcNativePurchaseResult) => void; reject: (error: Error) => void };

function errorFromStore(error: IError): Error {
  const code = error.code === ErrorCode.PAYMENT_CANCELLED ? 'cancelled'
    : error.code === ErrorCode.COMMUNICATION || error.code === ErrorCode.CLOUD_SERVICE_NETWORK_CONNECTION_FAILED ? 'offline'
      : 'failed';
  return new Error(`arc_iap_${code}`);
}

export class CapacitorStoreIapAdapter implements ArcNativeIapPort {
  private initialization: Promise<void> | null = null;
  private readonly waiters = new Map<string, PendingWaiter>();
  private readonly observed = new Map<string, ArcNativePurchaseResult>();

  constructor(private readonly platform: ArcIapPlatform | null) {}

  get available(): boolean {
    return this.platform !== null && ARC_IAP_PRODUCT_CATALOG.some((product) => storeProductId(product, this.platform!) !== null);
  }

  private storePlatform() { return this.platform === 'ios' ? Platform.APPLE_APPSTORE : Platform.GOOGLE_PLAY; }

  private result(transaction: Transaction, state: 'pending' | 'confirmed'): ArcNativePurchaseResult | null {
    const productId = transaction.products[0]?.id;
    if (!productId || !this.platform) return null;
    const receipt = transaction.parentReceipt as typeof transaction.parentReceipt & { purchaseToken?: string; orderId?: string; environment?: string };
    const purchaseToken = receipt.purchaseToken;
    const orderId = receipt.orderId;
    const externalPurchaseId = this.platform === 'android'
      ? purchaseToken ?? orderId ?? transaction.transactionId
      : transaction.transactionId;
    return {
      productId, state, externalPurchaseId,
      purchaseTimestamp: (transaction.purchaseDate ?? new Date()).toISOString(),
      transactionId: transaction.transactionId,
      originalTransactionId: transaction.purchaseId,
      purchaseToken, orderId, storeEnvironment: receipt.environment,
      acknowledged: transaction.isAcknowledged, consumed: transaction.isConsumed,
    };
  }

  private observe(transaction: Transaction, state: 'pending' | 'confirmed'): void {
    const result = this.result(transaction, state);
    if (!result) return;
    if (result.externalPurchaseId) this.observed.set(result.externalPurchaseId, result);
    const waiter = this.waiters.get(result.productId);
    if (waiter) { this.waiters.delete(result.productId); waiter.resolve(result); }
  }

  private initialize(): Promise<void> {
    if (!this.available) return Promise.reject(new Error('arc_iap_store_unavailable'));
    if (!this.initialization) this.initialization = (async () => {
      const platform = this.storePlatform();
      store.register(ARC_IAP_PRODUCT_CATALOG.flatMap((product) => {
        const id = storeProductId(product, this.platform!);
        return id ? [{ id, platform, type: ProductType.CONSUMABLE }] : [];
      }));
      store.when()
        .pending((transaction) => this.observe(transaction, 'pending'), 'arc-native-iap-pending')
        .approved((transaction) => this.observe(transaction, 'confirmed'), 'arc-native-iap-approved');
      store.error((error) => {
        if (!error.productId) return;
        const waiter = this.waiters.get(error.productId);
        if (waiter) { this.waiters.delete(error.productId); waiter.reject(errorFromStore(error)); }
      });
      const errors = await store.initialize([platform]);
      if (errors.length) throw errorFromStore(errors[0]);
    })();
    return this.initialization;
  }

  async loadProducts(productIds: readonly string[]): Promise<ArcNativePurchaseProduct[]> {
    await this.initialize();
    await store.update();
    const platform = this.storePlatform();
    return productIds.flatMap((id) => {
      const product = store.get(id, platform);
      if (!product?.pricing) return [];
      return [{ id: product.id, displayName: product.title, description: product.description,
        displayPrice: product.pricing.price, currencyCode: product.pricing.currency }];
    });
  }

  async purchase(productId: string): Promise<ArcNativePurchaseResult> {
    await this.initialize();
    if (this.waiters.has(productId)) throw new Error('arc_iap_purchase_in_progress');
    const product = store.get(productId, this.storePlatform());
    const offer = product?.offers[0];
    if (!offer?.canPurchase) throw new Error('arc_iap_product_unavailable');
    const result = new Promise<ArcNativePurchaseResult>((resolve, reject) => this.waiters.set(productId, { resolve, reject }));
    const orderError = await offer.order();
    if (orderError) {
      this.waiters.delete(productId);
      if (orderError.code === ErrorCode.PAYMENT_CANCELLED) return { productId, state: 'cancelled' };
      throw errorFromStore(orderError);
    }
    return result;
  }

  async reconcile(): Promise<ArcNativePurchaseResult[]> {
    await this.initialize();
    await store.update();
    for (const transaction of store.localTransactions) {
      if (transaction.state === 'approved') this.observe(transaction, 'confirmed');
      else if (transaction.state === 'pending') this.observe(transaction, 'pending');
    }
    return [...this.observed.values()];
  }

  async finish(confirmedPurchase: ArcNativePurchaseResult): Promise<void> {
    if (confirmedPurchase.state !== 'confirmed' || !confirmedPurchase.externalPurchaseId) throw new Error('arc_iap_finish_invalid');
    const transaction = store.localTransactions.find((candidate) => {
      const mapped = this.result(candidate, 'confirmed');
      return mapped?.externalPurchaseId === confirmedPurchase.externalPurchaseId;
    });
    if (!transaction) throw new Error('arc_iap_transaction_not_found');
    await transaction.finish();
  }
}
