import { extend } from '@pixi/react';
import {
  Container,
  type FederatedPointerEvent,
  Graphics,
  Text,
  type TextStyleOptions,
} from 'pixi.js';
import { type ReactNode, type RefObject, useCallback, useMemo } from 'react';
import { palette } from '@/art/palette';
import { scaleSkin } from '@/art/skins/scale';
import { isNumberPiece } from '@/room/pieces';
import type { PanView, PieceView } from '@/room/scale';
import type { Side } from '@/room/types';
import { layoutPan, readoutBox, scaleGeometry } from '@/ui/scene/scale/layout';
import { Piece } from '@/ui/scene/scale/Piece';
import type { HiddenPiece } from '@/ui/scene/scale/piece-drag';
import { isHidden, usePieceTween } from '@/ui/scene/scale/use-piece-tween';

extend({ Container, Graphics, Text });

interface Props {
  side: Side;
  pan: PanView;
  /** The side's value, or null when the stage hides the readouts. */
  readout: string | null;
  fontSize: number;
  /** The scale moves the pan through this ref as the beam tips; no position props here. */
  containerRef: RefObject<Container | null>;
  /**
   * Grabbing a weight or float starts carrying it off (story 1.10), while the tray works;
   * null otherwise. Gears and springs can never be grabbed.
   */
  onGrab: ((piece: PieceView, event: FederatedPointerEvent) => void) | null;
  /** The piece he is carrying off this pan, hidden on it, or null. */
  hidden: HiddenPiece | null;
  /** The smallest grab area, in scene units (48 CSS px). */
  minHit: number;
  /** While a split shows (story 1.15), its groups are drawn here in place of the pieces. */
  piecesHidden?: boolean;
  children?: ReactNode;
}

/**
 * One pan, level at its beam end, with its pieces stacked on it and its readout under it.
 * When the pan takes a new layout, its pieces move and fade with one generic tween. While
 * the splitter's groups show on it (`children`), its own pieces are hidden.
 */
export function Pan({
  side,
  pan,
  readout,
  fontSize,
  containerRef,
  onGrab,
  hidden,
  minHit,
  piecesHidden = false,
  children,
}: Props) {
  const boxes = useMemo(() => layoutPan(pan.pieces, fontSize), [pan.pieces, fontSize]);
  const { ghosts, refFor } = usePieceTween(pan.pieces, boxes, hidden);
  const drawPan = useCallback(
    (g: Graphics) => scaleSkin.pan(g, scaleGeometry.panWidth, scaleGeometry.postHeight),
    [],
  );
  return (
    <pixiContainer ref={containerRef}>
      <pixiGraphics draw={drawPan} />
      <pixiContainer visible={!piecesHidden}>
        {pan.pieces.map((piece, i) => {
          const box = boxes[i];
          return box ? (
            <Piece
              key={piece.key}
              piece={piece}
              box={box}
              fontSize={fontSize}
              nodeRef={refFor(piece.key)}
              hidden={isHidden(piece, hidden)}
              onGrab={onGrab && isNumberPiece(piece) ? (event) => onGrab(piece, event) : null}
              minHit={minHit}
            />
          ) : null;
        })}
        {ghosts.map((ghost) => (
          <Piece
            key={ghost.key}
            piece={ghost.piece}
            box={ghost.box}
            fontSize={fontSize}
            nodeRef={refFor(ghost.key)}
            hidden={ghost.hidden}
          />
        ))}
      </pixiContainer>
      {children}
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
