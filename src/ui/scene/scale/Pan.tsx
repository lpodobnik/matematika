import { extend } from '@pixi/react';
import { Container, Graphics, Text, type TextStyleOptions } from 'pixi.js';
import { type RefObject, useCallback, useMemo } from 'react';
import { palette } from '@/art/palette';
import { scaleSkin } from '@/art/skins/scale';
import type { PanView } from '@/room/scale';
import type { Side } from '@/room/types';
import { layoutPan, readoutBox, scaleGeometry } from '@/ui/scene/scale/layout';
import { Piece } from '@/ui/scene/scale/Piece';

extend({ Container, Graphics, Text });

interface Props {
  side: Side;
  pan: PanView;
  /** The side's value, or null when the stage hides the readouts. */
  readout: string | null;
  fontSize: number;
  /** The scale moves the pan through this ref as the beam tips; no position props here. */
  containerRef: RefObject<Container | null>;
}

/** One pan, level at its beam end, with its pieces stacked on it and its readout under it. */
export function Pan({ side, pan, readout, fontSize, containerRef }: Props) {
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
      {readout !== null && <Readout side={side} label={readout} fontSize={fontSize} />}
    </pixiContainer>
  );
}

interface ReadoutProps {
  side: Side;
  label: string;
  fontSize: number;
}

/** FR4: a side's value, in a display window under its pan. Redrawn only when its size changes. */
function Readout({ side, label, fontSize }: ReadoutProps) {
  const { x, y, width, height } = readoutBox(side, label, fontSize);
  const draw = useCallback((g: Graphics) => scaleSkin.readout(g, width, height), [width, height]);
  const style: TextStyleOptions = useMemo(
    () => ({ fontFamily: 'system-ui, sans-serif', fontSize, fontWeight: '400', fill: palette.ink }),
    [fontSize],
  );
  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={draw} />
      <pixiText text={label} anchor={0.5} style={style} />
    </pixiContainer>
  );
}
