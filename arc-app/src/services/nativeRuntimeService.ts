import { CapacitorNativeRuntimeAdapter } from '../features/native/nativeRuntimeAdapter';
import { ArcNativeRuntimeService } from '../features/native/nativeRuntimeService';
import { localCompanionBridgeService, localGameService } from './localSaveService';

export const nativeRuntimeService = new ArcNativeRuntimeService(
  new CapacitorNativeRuntimeAdapter(),
  () => localGameService.initializeDay(),
  localCompanionBridgeService,
);
