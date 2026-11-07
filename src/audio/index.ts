// The game's one audio engine (architecture, Audio Architecture). The audio effect
// (store/effects/audio.ts) and the app shell's unlock (app/sound.ts) drive it; ui never
// imports it (architecture, Architectural Boundaries).

import { createAudioEngine } from '@/audio/engine';

export type { LoopLevels } from '@/audio/ambience';
export type { AudioEngine } from '@/audio/engine';
export type { SoundId } from '@/audio/voices';

export const audio = createAudioEngine();
