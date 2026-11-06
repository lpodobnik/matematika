import { extend } from '@pixi/react';
import {
  Container,
  type FederatedPointerEvent,
  Graphics,
  Rectangle,
  Text,
  type TextStyleOptions,
} from 'pixi.js';
import { useCallback, useMemo } from 'react';
import { palette } from '@/art/palette';
import { balloonParts, isBalloon, type PieceShape, scaleSkin } from '@/art/skins/scale';
import type { PieceView } from '@/room/scale';
import { grabArea, type PieceBox, pieceText } from '@/ui/scene/scale/layout';
import { useBalloonBob } from '@/ui/scene/scale/use-balloon-bob';

extend({ Container, Graphics, Text });

interface Props {
  piece: PieceView;
  box: PieceBox;
  /** Scene units; at least 20 CSS px on screen (see labelFontSize). */
  fontSize: number;
  /** The pan's tween places the piece (and fades it) through this ref; no position props. */
  nodeRef: (node: Container | null) => void;
  /** He is carrying it away (story 1.10): it isn't drawn where it was. */
  hidden?: boolean;
  /**
   * Grabbing it starts carrying it: a weight or float on a pan while the tray works, or a
   * piece on the tray. Null when it can't be grabbed.
   */
  onGrab?: ((event: FederatedPointerEvent) => void) | null;
  /** The smallest grab area, in scene units (48 CSS px). */
  minHit?: number;
}

/**
 * One piece on a pan or the tray, with its number drawn as Pixi text (architecture, Text in
 * the scene). Each dial notch gives new piece objects with new labels; the Graphics is
 * redrawn only when the piece's shape changes, never just because its label did. A float or
 * spring is a balloon (story 1.15): it bobs gently on its string, its body and labels moved
 * and its string stretched on the ticker, never redrawn.
 */
export function Piece({
  piece,
  box,
  fontSize,
  nodeRef,
  hidden = false,
  onGrab = null,
  minHit = 0,
}: Props) {
  const { kind } = piece;
  const large = (piece.kind === 'gear' || piece.kind === 'spring') && piece.count > 1n;
  const { width, height, slices, tagWidth, tagHeight, string } = box;
  const shape: PieceShape = useMemo(
    () => ({ kind, width, height, slices, tagWidth, tagHeight, large, string }),
    [kind, width, height, slices, tagWidth, tagHeight, large, string],
  );
  const balloon = isBalloon(kind);
  const knot = balloon ? balloonParts(shape).knot : 0;
  const { bodyRef, stringRef } = useBalloonBob(balloon && !hidden, piece.key, knot);
  const draw = useCallback((g: Graphics) => scaleSkin.piece(g, shape), [shape]);
  const drawString = useCallback((g: Graphics) => scaleSkin.balloonString(g, shape), [shape]);
  const style: TextStyleOptions = useMemo(
    () => ({ fontFamily: 'system-ui, sans-serif', fontSize, fontWeight: '700', fill: palette.ink }),
    [fontSize],
  );
  const grabbable = onGrab !== null;
  const hitArea = useMemo(() => {
    if (!grabbable) return null;
    const area = grabArea(width, height, minHit);
    return new Rectangle(area.x, area.y, area.width, area.height);
  }, [grabbable, width, height, minHit]);
  const label = scaleSkin.labelSpot(shape);
  const tag = slices > 0 ? scaleSkin.tagSpot(shape) : null;
  return (
    <pixiContainer
      ref={nodeRef}
      eventMode={grabbable ? 'static' : 'passive'}
      interactiveChildren={false}
      hitArea={hitArea}
      onPointerDown={onGrab ?? undefined}
    >
      <pixiContainer visible={!hidden}>
        {balloon && (
          <pixiContainer ref={stringRef}>
            <pixiGraphics draw={drawString} />
          </pixiContainer>
        )}
        <pixiContainer ref={bodyRef}>
          <pixiGraphics draw={draw} />
          <pixiText text={pieceText(piece)} anchor={0.5} x={label.x} y={label.y} style={style} />
          {piece.divisorLabel !== null && tag !== null && (
            <pixiText text={piece.divisorLabel} anchor={0.5} x={tag.x} y={tag.y} style={style} />
          )}
        </pixiContainer>
      </pixiContainer>
    </pixiContainer>
  );
}
