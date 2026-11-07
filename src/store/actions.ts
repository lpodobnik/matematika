// Every action the store accepts, named `domain/verb` (architecture, Naming Conventions).

import type { LookId } from '@/city/character';
import type { NodeId } from '@/city/types';
import type { UpgradeId } from '@/economy/types';
import type { FightAction, FightState } from '@/fight/types';
import type { LinkOp } from '@/math/chain';
import type { Token } from '@/math/tokens';
import type { PresentationView } from '@/room/phases';
import type { SavedRoom } from '@/room/resume';
import type { PinValue, RoomId, Side, ToolId, TrayKind } from '@/room/types';
import type { QualityAction } from '@/store/quality';
import type { SaveState, SceneCopies } from '@/store/types';

export type Action =
  /** While loading: how much of the assets has loaded, 0–1 (story 2.1). */
  | { type: 'boot/progress'; loaded: number }
  /**
   * The save is read and the assets are loaded: the game starts from the save, or new with
   * null, back in the room in progress (`room`) or at the next room he hasn't done, or in
   * the fight in progress (`fight`, story 3.1), which resumes on the fight screen.
   */
  | {
      type: 'boot/start';
      save: SaveState | null;
      room: SavedRoom | null;
      fight?: FightState | null;
    }
  /**
   * The map control in a room (story 2.2): he leaves for the map, any time before the stage
   * locks. The room keeps its committed lines for when he comes back.
   */
  | { type: 'map/open' }
  /** He tapped a node on the map: an open room takes him there at once (FR27). */
  | { type: 'map/travel'; node: NodeId }
  /**
   * The naming after room 1 (story 2.4): the name he typed and the look he picked. Only on
   * the naming screen; the next room follows.
   */
  | { type: 'character/set'; name: string; look: LookId }
  /**
   * He taps a written line (room 7, story 2.10): the pans show it at the slider's x, until
   * the dial moves, another line is tapped, or a line is written. By its notebook number.
   */
  | { type: 'notebook/show-line'; line: number }
  /** The story card's "Dalje" (story 2.5): the room's lines are told; on to what comes next. */
  | { type: 'story/next' }
  /** Enters a room at its first stage, or at `stage` (the dev panel jumps to any stage). */
  | { type: 'room/enter'; roomId: RoomId; stage?: number }
  /** A touch anywhere on the machine; the first one ends the stage's arrive. */
  | { type: 'machine/touch' }
  /** The reset control: the stage in play goes back to line 0. */
  | { type: 'stage/reset' }
  /** The machine finished presenting a stage's lock or the room's restart. */
  | ({ type: 'presentation/done' } & PresentationView)
  /** About once a second: ends a presentation the UI never reports done. */
  | { type: 'clock/tick' }
  /** The dial landed on a new notch; the UI sends it once per notch, never per frame. */
  | { type: 'dial/set'; x: number }
  /** Story 4.6: a coarse dial's − or +, one step down or up (room 11). */
  | { type: 'dial/nudge'; by: 1 | -1 }
  /** He dragged the prediction pin onto a place of its track; once per place, never per frame. */
  | { type: 'pin/set'; value: PinValue }
  /** He confirmed the pin where it is: it locks and the stage opens. */
  | { type: 'pin/confirm' }
  /** The tray's − or + for its weight, float or gear; the UI repeats it while the button is held. */
  | { type: 'tray/step'; kind: TrayKind; by: 1 | -1 }
  /**
   * He dropped the tray's weight or float, with its number, or its gear (story 4.2), anywhere
   * over the scale: one copy goes to each side (story 1.15).
   */
  | { type: 'tray/drop'; kind: TrayKind }
  /**
   * He dragged a weight or float off a side, anywhere off the scale; `key` is its key on the
   * scale. The same number comes off both sides (story 1.15).
   */
  | { type: 'tray/take'; side: Side; key: string }
  /** The splitter's − or +: fewer or more parts; the UI repeats it while the button is held. */
  | { type: 'splitter/step'; by: 1 | -1 }
  /** He dropped the splitter, at the parts it is set to, anywhere over the scale. */
  | { type: 'splitter/split' }
  /**
   * Story 4.1: he ran the gear chain's last link backward with the operation and number he
   * picked (room/chain.ts).
   */
  | { type: 'chain/run'; op: LinkOp; n: number }
  /** A pad key (or its keyboard stand-in) typed at the end of the draft line. */
  | { type: 'notebook/type'; token: Token }
  /** Delete: the draft's last token. */
  | { type: 'notebook/delete' }
  /** Enter: the draft is judged. */
  | { type: 'notebook/enter' }
  /** On a phone, the notebook slides over the scale; this pushes it aside or brings it back. */
  | { type: 'notebook/slide'; aside: boolean }
  /**
   * Story 1.16: the hint button. The first press shows the current step's tag, the next ones
   * the exact next move (room/hint.ts). Free, never recorded: it changes nothing in the room.
   */
  | { type: 'hint/press' }
  /**
   * The fight screen (story 3.1): roll, place a die, take one back, set blows, strike, and
   * leave (free before the first strike, a loss after it). See fight/types.ts.
   */
  | FightAction
  /** Story 3.5: buys an upgrade at the old mechanic's counter, with unspent parts. */
  | { type: 'shop/buy'; upgrade: UpgradeId }
  /** Story 3.5: off the counter, back to the map. */
  | { type: 'shop/close' }
  /** Off the end of a fight, back to the map (story 3.2). */
  | { type: 'fight/close' }
  /** The dev panel only: sets his parts (architecture, Debug Tools). */
  | { type: 'dev/set-parts'; parts: number }
  /** The dev panel only: every winding-down automaton rewinds now. */
  | { type: 'dev/wake-lairs' }
  /** The dev panel only: fixes the seed of the next fights' dice, or null for random. */
  | { type: 'dev/fight-seed'; seed: number | null }
  /** The dev panel only: a new game, from room 1; the settings stay. */
  | { type: 'dev/new-game' }
  /** The dev panel only (architecture, Debug Tools): sets the tools he has earned. */
  | { type: 'dev/set-tools'; tools: ToolId[] }
  /** The dev panel only: draws the scene once, or three times side by side for the profile. */
  | { type: 'dev/set-copies'; copies: SceneCopies }
  /** The frame-time test's report, and the dev panel's forced setting (store/quality.ts). */
  | QualityAction;
