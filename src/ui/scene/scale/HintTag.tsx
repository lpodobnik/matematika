import { extend } from '@pixi/react';
import { animate } from 'motion';
import { Container, Graphics, Text, type TextStyleOptions } from 'pixi.js';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { palette } from '@/art/palette';
import { pinSkin } from '@/art/skins/pin';
import { formatEquation } from '@/math/format';
import { hintView } from '@/room/hint';
import { splitterOffered } from '@/room/splitter';
import { trayOffered } from '@/room/tray';
import { useGame } from '@/store/store';
import { hintSpot } from '@/ui/common/hint-text';
import { dialLayout } from '@/ui/scene/scale/dial-layout';
import {
  type HandoverTagLayout,
  handoverAnchor,
  handoverObstacles,
  handoverTagLayout,
} from '@/ui/scene/scale/handover-tag-layout';
import type { Point } from '@/ui/scene/scale/layout';
import { usePrefersReducedMotion } from '@/ui/scene/scale/use-balloon-bob';

extend({ Container, Graphics, Text });

interface Props {
  /** CSS px per scene unit: the text keeps at least 20 CSS px. */
  sceneScale: number;
  /** Where the scene's top-left corner sits in the scene area, in CSS px (the HTML controls). */
  origin: Point;
}

/** How long a tag's pop takes as a press shows it. */
const popMs = 260;

/**
 * The hint button's tag in the scene (story 1.16): while a hint shows, it takes the
 * handover tag's place (SceneRoot draws one or the other). The first press hangs the current
 * step's tag where its handover tag hangs, met or not; the second, the next move's tag by
 * the dial, the tray or the splitter (ui/common/hint-text.ts), with its ghost
 * (HintGhost.tsx). A tag about writing hangs at the notebook instead. Each press pops it
 * in, so a press always shows something, also when its tag was already there. It takes no
 * touches.
 */
export function HintTag({ sceneScale, origin }: Props) {
  const room = useGame((s) => s.room);
  const tools = useGame((s) => s.save.progress.tools);
  const hint = useGame((s) => s.ui.hint);
  const view = useMemo(() => hintView(room, tools, hint), [room, tools, hint]);
  const spot = view ? hintSpot(view) : null;
  const scene = spot?.place === 'scene' ? spot : null;
  const ready = sceneScale > 0;
  // What the tag is laid out around: it moves only with a new text, stage, pans or tools.
  const key =
    scene && room
      ? [
          scene.about,
          scene.text,
          room.spec.id,
          room.stageIndex,
          formatEquation(room.stage.pans),
          room.stage.dialX,
          trayOffered(room, tools),
          splitterOffered(room, tools),
        ].join('|')
      : null;

  // biome-ignore lint/correctness/useExhaustiveDependencies: laid out again only when `key` says the tag would move, not on every store change
  const tag = useMemo(() => {
    if (!scene || !room || !ready) return null;
    const anchor = handoverAnchor(scene.about, room, sceneScale);
    if (!anchor) return null;
    const obstacles = handoverObstacles(scene.about, room, tools, sceneScale, origin);
    return handoverTagLayout(scene.text, sceneScale, anchor, obstacles);
  }, [key, ready, sceneScale, origin.x, origin.y]);

  const lineWidth = useMemo(
    () => (ready ? dialLayout(sceneScale, 0).lineWidth : 1),
    [ready, sceneScale],
  );
  if (!tag || !view) return null;
  return <Tag tag={tag} lineWidth={lineWidth} presses={view.presses} />;
}

interface TagProps {
  tag: HandoverTagLayout;
  lineWidth: number;
  presses: number;
}

/** The card, its string and its text, as the handover tag draws them; it pops in on each press. */
function Tag({ tag, lineWidth, presses }: TagProps) {
  const ref = useRef<Container>(null);
  const reduced = usePrefersReducedMotion();
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: each press pops the tag again
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const { box } = tag;
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const at = (s: number, alpha: number) => {
      if (node.destroyed) return;
      node.scale.set(s);
      node.position.set(centre.x * (1 - s), centre.y * (1 - s));
      node.alpha = alpha;
    };
    const controls = animate(0, 1, {
      duration: popMs / 1000,
      ease: 'easeOut',
      onUpdate: (t) => (reduced ? at(1, 0.4 + 0.6 * t) : at(0.88 + 0.12 * t, 0.3 + 0.7 * t)),
      onComplete: () => at(1, 1),
    });
    return () => {
      controls.stop();
      at(1, 1);
    };
  }, [presses, tag, reduced]);

  return (
    <pixiContainer ref={ref} eventMode="none">
      <pixiGraphics draw={draw} />
      <pixiText text={tag.lines.join('\n')} x={tag.text.x} y={tag.text.y} style={style} />
    </pixiContainer>
  );
}
