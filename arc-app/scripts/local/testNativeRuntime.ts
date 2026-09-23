import assert from 'node:assert/strict';
import { ArcNativeRuntimeService } from '../../src/features/native/nativeRuntimeService';
import { disabledCompanionTransport, normalizePlatform, parseArcDeepLink, unsupportedIap, unsupportedSecureStorage } from '../../src/features/native/nativeRuntimeAdapter';
import type { ArcLifecycleState, ArcNativeRuntimeAdapter, ArcPlatform } from '../../src/features/native/nativeRuntimeTypes';
import { ArcSaveRepository } from '../../src/features/savegame/arcSaveRepository';
import { MemoryArcSaveStorage } from '../../src/features/savegame/arcSaveStorage';
import { LocalCompanionBridgeService } from '../../src/features/companion/localCompanionBridgeService';

class ControlledAdapter implements ArcNativeRuntimeAdapter {
  readonly iap = unsupportedIap;
  readonly secureStorage = unsupportedSecureStorage;
  readonly companionTransport = disabledCompanionTransport;
  private lifecycle: ((state: ArcLifecycleState) => void) | null = null;
  constructor(private readonly value: ArcPlatform) {}
  platform() { return this.value; }
  async addLifecycleListener(listener: (state: ArcLifecycleState) => void) { this.lifecycle = listener; return () => { this.lifecycle = null; }; }
  async addDeepLinkListener() { return () => undefined; }
  emit(state: ArcLifecycleState) { this.lifecycle?.(state); }
}

assert.equal(normalizePlatform('web'), 'web');
assert.equal(normalizePlatform('ios'), 'ios');
assert.equal(normalizePlatform('android'), 'android');
assert.equal(normalizePlatform('unknown'), 'web');
assert.equal(parseArcDeepLink('https://example.com'), null);
assert.equal(parseArcDeepLink('arc://companion/event')?.route, 'unhandled');

for (const platform of ['web', 'ios', 'android'] as const) {
  const storage = new MemoryArcSaveStorage();
  const repository = new ArcSaveRepository(storage);
  await repository.initialize({ language: 'en', legacyStorage: null });
  const before = await repository.load();
  let initializations = 0;
  const adapter = new ControlledAdapter(platform);
  const service = new ArcNativeRuntimeService(adapter, async () => {
    initializations += 1;
    await new Promise((resolve) => setTimeout(resolve, 5));
    return (await repository.load()) ?? undefined;
  }, new LocalCompanionBridgeService(repository));
  assert.equal(service.platform(), platform);
  assert.deepEqual(service.capabilities(), { iap: false, secureStorage: false, companionTransport: false });
  const stop = await service.start(() => undefined);
  adapter.emit('background');
  assert.equal(initializations, 0);
  adapter.emit('foreground');
  adapter.emit('foreground');
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(initializations, 1, `${platform} concurrent resume must coalesce`);
  assert.deepEqual(await repository.load(), before, `${platform} detection/lifecycle must not mutate gameplay by itself`);
  const rejected = await service.processCompanionEvent({ source_app: 'forged' });
  assert.equal(rejected.accepted, false, 'native companion ingress must retain Phase-8 validation');
  await assert.rejects(() => adapter.iap.purchase('fake-product'), /not_available/);
  stop();
}

console.log('Native runtime foundation tests passed.');
