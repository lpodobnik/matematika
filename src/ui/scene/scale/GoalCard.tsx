import { extend } from '@pixi/react';
import { animate } from 'motion';
import { Container, Graphics, Text, type TextStyleOptions } from 'pixi.js';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { palette } from '@/art/palette';
import { type GoalCardShape, goalPictureParts, goalSkin } from '@/art/skins/goal';
import { hr } from '@/content/text/hr';
import { xVar } from '@/math/expr';
import { formatEquation, formatExpr } from '@/math/format';
import { goalView } from '@/room/goal';
import { pinView } from '@/room/pin';
import type { RoomState, ToolId } from '@/room/types';
import { useGame } from '@/store/store';
import {
  type GoalCardLayout,
  goalBannerFits,
  goalCardLayout,
} from '@/ui/scene/scale/goal-card-layout';
import type { Point } from '@/ui/scene/scale/layout';

extend({ Container, Graphics, Text });

interface Props {
  /** CSS px per scene unit: the label keeps at least 20 CSS px. */
  sceneScale: number;
  /** Where the scene's top-left corner sits in the scene area, in CSS px (the HTML controls). */
  origin: Point;
}

/** How long the card's bump takes as it lights. */
const lightMs = 420;

/**
 * What the card is laid out around, as one string: it changes only when the card could
 * move (a new stage, pans or pin, or Balance earned), not with every notch of the dial.
 */
function layoutKey(room: RoomState, tools: readonly ToolId[]): string {
  const pin = pinView(room);
  return [
    room.spec.id,
    room.stageIndex,
    formatEquation(room.stage.pans),
    pin?.slot ?? '',
    tools.includes('balance'),
  ].join('|');
}

/**
 * The goal card (story 1.16): while the tray is offered, a small paper card stands in the
 * scene, `Cilj: x sam` beside a miniature scale with one x-gear alone on one pan and a
 * weight marked `?` on the other (room/goal.ts; where it stands: goal-card-layout.ts).
 * When the pans match it, its frame grows heavier, a tick stands over the picture's pivot
 * and it lights like a right pin, with a short bump (none under reduced motion). It takes
 * no touches, so the dial under it still turns.
 */
export function GoalCard({ sceneScale, origin }: Props) {
  const matched = useGame((s) => goalView(s.room, s.save.progress.tools)?.matched ?? null);
  const room = useGame((s) => s.room);
  const tools = useGame((s) => s.save.progress.tools);
  const shown = matched !== null;
  const key = shown && room ? layoutKey(room, tools) : null;
  const ready = sceneScale > 0;

  // biome-ignore lint/correctness/useExhaustiveDependencies: laid out again only when `key` says the card could move, not on every store change
  const layout = useMemo(() => {
    if (!shown || !room || !ready) return null;
    return goalCardLayout(hr.goal.label, room, tools, sceneScale, origin);
  }, [key, ready, sceneScale, origin.x, origin.y]);

  if (!layout || matched === null || goalBannerFits(origin.y)) return null;
  return <Card layout={layout} matched={matched} />;
}

interface CardProps {
  layout: GoalCardLayout;
  matched: boolean;
}

function reducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** The card, its picture and its words; it bumps once as it lights. */
function Card({ layout, matched }: CardProps) {
  const ref = useRef<Container>(null);
  const shape: GoalCardShape = useMemo(
    () => ({ box: layout.box, picture: layout.picture, lineWidth: layout.lineWidth }),
    [layout],
  );
  const parts = useMemo(() => goalPictureParts(layout.picture), [layout]);
  const drawCard = useCallback((g: Graphics) => goalSkin.card(g, shape, matched), [shape, matched]);
  const drawPicture = useCallback((g: Graphics) => goalSkin.picture(g, shape), [shape]);
  const drawTick = useCallback((g: Graphics) => goalSkin.tick(g, shape), [shape]);
  const style: TextStyleOptions = useMemo(
    () => ({
      fontFamily: 'system-ui, sans-serif',
      fontSize: layout.fontSize,
      lineHeight: layout.lineHeight,
      fontWeight: '700',
      fill: palette.ink,
    }),
    [layout],
  );
  const pieceStyle: TextStyleOptions = useMemo(
    () => ({
      fontFamily: 'system-ui, sans-serif',
      fontSize: parts.labelSize,
      fontWeight: '700',
      fill: palette.ink,
    }),
    [parts],
  );

  // The bump as it lights, about the card's centre.
  useEffect(() => {
    const node = ref.current;
    if (!matched || !node || reducedMotion()) return;
    const { box } = layout;
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const at = (s: number) => {
      if (node.destroyed) return;
      node.scale.set(s);
      node.position.set(centre.x * (1 - s), centre.y * (1 - s));
    };
    const controls = animate(0, 1, {
      duration: lightMs / 1000,
      ease: 'easeOut',
      onUpdate: (t) => at(1 + 0.12 * Math.sin(Math.PI * t)),
      onComplete: () => at(1),
    });
    return () => {
      controls.stop();
      at(1);
    };
  }, [matched, layout]);

  return (
    <pixiContainer ref={ref} eventMode="none">
      <pixiGraphics draw={drawCard} />
      <pixiText text={layout.lines.join('\n')} x={layout.text.x} y={layout.text.y} style={style} />
      <pixiGraphics draw={drawPicture} />
      <pixiText
        text={formatExpr(xVar())}
        anchor={0.5}
        x={parts.gearLabel.x}
        y={parts.gearLabel.y}
        style={pieceStyle}
      />
      <pixiText
        text="?"
        anchor={0.5}
        x={parts.weightLabel.x}
        y={parts.weightLabel.y}
        style={pieceStyle}
      />
      {matched && <pixiGraphics draw={drawTick} />}
    </pixiContainer>
  );
}
