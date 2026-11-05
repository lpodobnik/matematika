import { extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { type RefObject, useCallback, useMemo } from 'react';
import { scaleSkin } from '@/art/skins/scale';
import type { PanView } from '@/room/scale';
import { layoutPan, scaleGeometry } from '@/ui/scene/scale/layout';
import { Piece } from '@/ui/scene/scale/Piece';

extend({ Container, Graphics });

interface Props {
  pan: PanView;
  fontSize: number;
  /** The scale moves the pan through this ref as the beam tips; no position props here. */
  containerRef: RefObject<Container | null>;
}

/** One pan, level at its beam end, with its pieces stacked on it. */
export function Pan({ pan, fontSize, containerRef }: Props) {
  const boxes = useMemo(() => layoutPan(pan.pieces, fontSize), [pan.pieces, fontSize]);
  const drawPan = useCallback(
    (g: Graphics) => scaleSkin.pan(g, scaleGeometry.panWidth, scaleGeometry.postHeight),
    [],
  );
  return (
    <pixiContainer ref={containerRef}>
      <pixiGraphics draw={drawPan} />
      {pan.pieces.map((piece, i) => {
        const box = boxes[i];
        return box ? <Piece key={piece.key} piece={piece} box={box} fontSize={fontSize} /> : null;
      })}
    </pixiContainer>
  );
}
