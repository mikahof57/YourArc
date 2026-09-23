import { LocalIapService } from '../features/economy/localIapService';
import { localEconomyService } from './localSaveService';
import { nativeRuntimeService } from './nativeRuntimeService';

export const localIapService = new LocalIapService(nativeRuntimeService, localEconomyService);
