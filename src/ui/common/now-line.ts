import { hr } from '@/content/text/hr';
import { nextMove } from '@/room/hint';
import { currentStageSpec } from '@/room/room';
import type { RoomState, ToolId } from '@/room/types';

/** What he is doing right now, in one plain sentence; null where nothing waits on him. */
export function nowText(room: RoomState | null, tools: readonly ToolId[]): string | null {
  if (!room) return null;
  const { phase } = room.stage;
  if (phase === 'arrive') return hr.now.touch;
  const { planted, lines } = room.stage;
  if (planted?.found && !lines.some((line) => line.verdict.kind === 'answer')) {
    return hr.handover.rewrite;
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
