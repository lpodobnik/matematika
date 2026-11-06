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
import { type PieceShape, scaleSkin } from '@/art/skins/scale';
import type { PieceView } from '@/room/scale';
import { grabArea, type PieceBox } from '@/ui/scene/scale/layout';

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
 * One piece on a pan, with its number drawn as Pixi text (architecture, Text in the scene).
 * Each dial notch gives new piece objects with new labels; the Graphics is redrawn only
 * when the piece's shape changes, never just because its label did.
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
  const { width, height, dividerHeight } = box;
  const shape: PieceShape = useMemo(
    () => ({ kind, width, height, dividerHeight, large }),
    [kind, width, height, dividerHeight, large],
  );
  const draw = useCallback((g: Graphics) => scaleSkin.piece(g, shape), [shape]);
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
  const divider = scaleSkin.dividerSpot(shape);
  return (
    <pixiContainer
      ref={nodeRef}
      eventMode={grabbable ? 'static' : 'passive'}
      interactiveChildren={false}
      hitArea={hitArea}
      onPointerDown={onGrab ?? undefined}
    >
      <pixiContainer visible={!hidden}>
        <pixiGraphics draw={draw} />
        <pixiText text={piece.label} anchor={0.5} x={label.x} y={label.y} style={style} />
        {piece.divisorLabel !== null && (
          <pixiText
            text={piece.divisorLabel}
            anchor={0.5}
            x={divider.x}
            y={divider.y}
            style={style}
          />
        )}
      </pixiContainer>
    </pixiContainer>
  );
}
