import { hr } from '@/content/text/hr';
import { nextMove } from '@/room/hint';
import { pinRight } from '@/room/pin';
import { currentStageSpec } from '@/room/room';
import { scaleView } from '@/room/scale';
import type { RoomState, ToolId } from '@/room/types';

/** What he is doing right now, in one plain sentence; null where nothing waits on him. */
export function nowText(room: RoomState | null, tools: readonly ToolId[]): string | null {
  if (!room) return null;
  const { phase } = room.stage;
  if (phase === 'arrive') return null;
  const { planted, lines } = room.stage;
  if (planted?.found && !lines.some((line) => line.verdict.kind === 'answer')) {
    return hr.handover.rewrite;
  }
  const { pin } = room.stage;
  const spec = currentStageSpec(room);
  const missed =
    spec.pin?.kind === 'level-x' && pin?.locked && !pinRight(spec, room.stage.machine, pin.value);
  if (missed && !scaleView(room).level) {
    return room.spec.id === 'r06' ? hr.now.compareWrong : hr.now.wrongPin;
  }
  const move = nextMove(room, tools);
  if (!move) return room.stage.draft.length > 0 ? hr.now.clear : null;
  switch (move.kind) {
    case 'slide':
      return hr.now.slide;
    case 'answer':
      return hr.now.answer;
    case 'check':
      return hr.now.check;
    case 'tray':
      return hr.now[move.piece === 'weight' ? 'weight' : move.piece === 'float' ? 'float' : 'gear'];
    case 'take-off':
      return hr.now.takeOff;
    case 'split':
      return hr.now.split;
    case 'pin': {
      if (room.spec.id === 'r06') return hr.now.compare;
      const pin = currentStageSpec(room).pin;
      return pin ? `${hr.pin.questions[pin.kind]} ${hr.now.confirm}` : hr.now.confirm;
    }
    case 'jam':
      return hr.now.jam;
    case 'chain':
      return hr.now.chain;
    case 'story':
      return hr.now.story;
    case 'blank':
      return hr.now.blank;
  }
}
