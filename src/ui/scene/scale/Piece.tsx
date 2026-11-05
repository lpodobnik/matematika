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
}

/** One piece on a pan, with its number drawn as Pixi text (architecture, Text in the scene). */
export function Piece({ piece, box, fontSize }: Props) {
  const shape: PieceShape = useMemo(
    () => ({
      kind: piece.kind,
      width: box.width,
      height: box.height,
      dividerHeight: box.dividerHeight,
      large: (piece.kind === 'gear' || piece.kind === 'spring') && piece.count > 1n,
    }),
    [piece, box.width, box.height, box.dividerHeight],
  );
  const draw = useCallback((g: Graphics) => scaleSkin.piece(g, shape), [shape]);
  const style: TextStyleOptions = useMemo(
    () => ({ fontFamily: 'system-ui, sans-serif', fontSize, fontWeight: '700', fill: palette.ink }),
    [fontSize],
  );
  const label = scaleSkin.labelSpot(shape);
  const divider = scaleSkin.dividerSpot(shape);
  return (
    <pixiContainer x={box.x} y={box.y}>
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
