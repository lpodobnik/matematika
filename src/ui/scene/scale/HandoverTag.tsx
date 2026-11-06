import { extend } from '@pixi/react';
import { Container, Graphics, Text, type TextStyleOptions } from 'pixi.js';
import { useCallback, useMemo } from 'react';
import { palette } from '@/art/palette';
import { pinSkin } from '@/art/skins/pin';
import { hr } from '@/content/text/hr';
import { formatEquation } from '@/math/format';
import { handoverView } from '@/room/handover';
import { pinView } from '@/room/pin';
import { scaleView } from '@/room/scale';
import { splitterOffered } from '@/room/splitter';
import { trayOffered } from '@/room/tray';
import type { RoomState, ToolId } from '@/room/types';
import { useGame } from '@/store/store';
import { dialLayout } from '@/ui/scene/scale/dial-layout';
import {
  type HandoverTagLayout,
  handoverAnchor,
  handoverObstacles,
  handoverTagLayout,
  isSceneHandover,
  type SceneHandover,
} from '@/ui/scene/scale/handover-tag-layout';
import type { Point } from '@/ui/scene/scale/layout';

extend({ Container, Graphics, Text });

interface Props {
  /** CSS px per scene unit: the text keeps at least 20 CSS px. */
  sceneScale: number;
  /** Where the scene's top-left corner sits in the scene area, in CSS px (the reset control). */
  origin: Point;
}

/**
 * What the tag is laid out around, as one string: it changes only when the tag would move
 * (a new step, stage, pans or tools), not with every notch of the dial, so the layout is
 * not redone while he drags. The dial's tag follows the knob, so its x counts for it.
 */
function layoutKey(id: SceneHandover, room: RoomState, tools: readonly ToolId[]): string {
  const { stage } = room;
  const pin = pinView(room);
  return [
    id,
    room.spec.id,
    room.stageIndex,
    formatEquation(stage.pans),
    scaleView(room).actingOut,
    `${stage.dialOpen.min}-${stage.dialOpen.max}`,
    trayOffered(room, tools),
    splitterOffered(room, tools),
    pin ? `${pin.kind}:${pin.slot}` : '',
    id === 'dial' ? stage.dialX : '',
  ].join('|');
}

/**
 * The handover tag in the scene (story 1.15): the paper tag with the next step's text from
 * hr.ts, for the steps that hang in the scene (the dial, the tray, the splitter, the goal
 * of Balance; room/handover.ts decides which). It hangs where handover-tag-layout.ts finds
 * room, on a string to what it is about or from a nail, and is drawn over the tools. It
 * takes no touches, so everything under it still works. The `write` and `check` steps hang
 * at the notebook instead (ui/notebook/HandoverNote.tsx).
 */
export function HandoverTag({ sceneScale, origin }: Props) {
  const id = useGame((s) => handoverView(s.room, s.save.progress.firstUse, s.save.progress.tools));
  const room = useGame((s) => s.room);
  const tools = useGame((s) => s.save.progress.tools);
  const sceneId = isSceneHandover(id) ? id : null;
  const key = sceneId && room ? layoutKey(sceneId, room, tools) : null;
  const ready = sceneScale > 0;

  // biome-ignore lint/correctness/useExhaustiveDependencies: laid out again only when `key` says the tag would move, not on every store change
  const tag = useMemo(() => {
    if (!sceneId || !room || !ready) return null;
    const anchor = handoverAnchor(sceneId, room, sceneScale);
    if (!anchor) return null;
    const obstacles = handoverObstacles(sceneId, room, tools, sceneScale, origin);
    return handoverTagLayout(hr.handover[sceneId], sceneScale, anchor, obstacles);
  }, [key, ready, sceneScale, origin.x, origin.y]);

  const lineWidth = useMemo(
    () => (ready ? dialLayout(sceneScale, 0).lineWidth : 1),
    [ready, sceneScale],
  );
  if (!tag) return null;
  return <Tag tag={tag} lineWidth={lineWidth} />;
}

interface TagProps {
  tag: HandoverTagLayout;
  lineWidth: number;
}

/** The card, its string and its text, drawn once per layout; it takes no touches. */
function Tag({ tag, lineWidth }: TagProps) {
  const draw = useCallback(
    (g: Graphics) =>
      pinSkin.tag(g, { box: tag.box, hole: tag.hole, tie: tag.tie, nail: tag.nail, lineWidth }),
    [tag, lineWidth],
  );
  const style: TextStyleOptions = useMemo(
    () => ({
      fontFamily: 'system-ui, sans-serif',
      fontSize: tag.fontSize,
      lineHeight: tag.lineHeight,
      fill: palette.ink,
    }),
    [tag],
  );
  return (
    <pixiContainer eventMode="none">
      <pixiGraphics draw={draw} />
      <pixiText text={tag.lines.join('\n')} x={tag.text.x} y={tag.text.y} style={style} />
    </pixiContainer>
  );
}
