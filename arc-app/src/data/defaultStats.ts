import { StatAttribute } from '../types';
import { get365PresetTasksForStat } from './taskDatabase';

export const DEFAULT_STATS: StatAttribute[] = [
  {
    id: 'wissen',
    name: 'Wissen',
    emoji: '📚',
    value: 1,
    taskSelectionMode: 'random',
    tasks: get365PresetTasksForStat('wissen', 'Wissen'),
  },
  {
    id: 'muskeln',
    name: 'Muskeln',
    emoji: '💪',
    value: 1,
    taskSelectionMode: 'random',
    tasks: get365PresetTasksForStat('muskeln', 'Muskeln'),
  },
  {
    id: 'geist',
    name: 'Geist',
    emoji: '🧘‍♂️',
    value: 1,
    taskSelectionMode: 'random',
    tasks: get365PresetTasksForStat('geist', 'Geist'),
  },
  {
    id: 'beweglichkeit',
    name: 'Beweglichkeit',
    emoji: '⚡',
    value: 1,
    taskSelectionMode: 'random',
    tasks: get365PresetTasksForStat('beweglichkeit', 'Beweglichkeit'),
  },
  {
    id: 'business',
    name: 'Business',
    emoji: '💼',
    value: 1,
    taskSelectionMode: 'random',
    tasks: get365PresetTasksForStat('business', 'Business'),
  },
  {
    id: 'geld',
    name: 'Geld',
    emoji: '💎',
    value: 1,
    taskSelectionMode: 'random',
    tasks: get365PresetTasksForStat('geld', 'Geld'),
  },
];

