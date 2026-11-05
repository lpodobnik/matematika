import { extend } from '@pixi/react';
import { Container, Graphics, Text, type TextStyleOptions } from 'pixi.js';
import { useCallback, useMemo } from 'react';
import { palette } from '@/art/palette';
import { type PieceShape, scaleSkin } from '@/art/skins/scale';
import type { PieceView } from '@/room/scale';
import type { PieceBox } from '@/ui/scene/scale/layout';

extend({ Container, Graphics, Text });

interface Props {
  piece: PieceView;
  box: PieceBox;
  /** Scene units; at least 20 CSS px on screen (see labelFontSize). */
  fontSize: number;
  /** The pan's tween places the piece (and fades it) through this ref; no position props. */
  nodeRef: (node: Container | null) => void;
}

/**
 * One piece on a pan, with its number drawn as Pixi text (architecture, Text in the scene).
 * Each dial notch gives new piece objects with new labels; the Graphics is redrawn only
 * when the piece's shape changes, never just because its label did.
 */
export function Piece({ piece, box, fontSize, nodeRef }: Props) {
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
  const label = scaleSkin.labelSpot(shape);
  const divider = scaleSkin.dividerSpot(shape);
  return (
    <pixiContainer ref={nodeRef}>
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
  );
}
