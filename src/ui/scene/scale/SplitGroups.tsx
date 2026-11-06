import { extend } from '@pixi/react';
import { animate } from 'motion';
import { Container } from 'pixi.js';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { PieceView } from '@/room/scale';
import type { SideGroups } from '@/room/splitter';
import { layoutPan, type PieceBox, scaleGeometry } from '@/ui/scene/scale/layout';
import { Piece } from '@/ui/scene/scale/Piece';
import { groupCentres, splitPose, splitShowMs } from '@/ui/scene/scale/split-show';

extend({ Container });

/** Extra room between the groups once they are fully apart, in scene units. */
const spreadGap = 70;
/** How far the leftover lifts out of line in an uneven split, as a share of the label size. */
const leftoverLiftShare = 1.4;

interface Laid {
  pieces: PieceView[];
  boxes: PieceBox[];
  width: number;
}

/** A group laid out like a small pan, centred on its own middle. */
function laid(pieces: PieceView[], fontSize: number): Laid {
  const boxes = layoutPan(pieces, fontSize);
  if (boxes.length === 0) return { pieces, boxes, width: 0 };
  const left = Math.min(...boxes.map((box) => box.x - box.width / 2));
  const right = Math.max(...boxes.map((box) => box.x + box.width / 2));
  const middle = (left + right) / 2;
  return {
    pieces,
    boxes: boxes.map((box) => ({ ...box, x: box.x - middle })),
    width: right - left,
  };
}

function noPlace(): void {}

interface Props {
  groups: SideGroups;
  even: boolean;
  fontSize: number;
  /** Called once the show has played; one side reports it. */
  onDone?: () => void;
}

/**
 * One side's pieces as a split separates them (story 1.15; split-show.ts): its equal groups
 * side by side, drawn on the pan in place of its pieces. The groups move apart, and either
 * all but one fade away (even), or the leftover lifts out of line and they slide back
 * together (uneven). Positions go through refs, frame by frame, never React state.
 */
export function SplitGroups({ groups, even, fontSize, onDone }: Props) {
  const parts = useMemo(
    () => groups.groups.map((each) => laid(each, fontSize)),
    [groups, fontSize],
  );
  const rest = useMemo(() => laid(groups.leftover, fontSize), [groups, fontSize]);
  const nodes = useRef<(Container | null)[]>([]);
  const restNode = useRef<Container | null>(null);
  const done = useRef(onDone);
  useLayoutEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    const widths = parts.map((each) => each.width);
    const apply = (t: number) => {
      const pose = splitPose(t, even);
      const centres = groupCentres(widths, rest.width, scaleGeometry.gap, spreadGap, pose);
      nodes.current.forEach((node, i) => {
        if (!node || node.destroyed) return;
        node.x = centres.groups[i] ?? 0;
        node.alpha = i === 0 ? 1 : pose.othersAlpha;
      });
      const leftover = restNode.current;
      if (leftover && !leftover.destroyed) {
        leftover.x = centres.leftover;
        leftover.y = -fontSize * leftoverLiftShare * pose.leftoverLift;
      }
    };
    apply(0);
    const controls = animate(0, 1, {
      duration: (even ? splitShowMs.even : splitShowMs.uneven) / 1000,
      ease: 'linear',
      onUpdate: apply,
      onComplete: () => done.current?.(),
    });
    return () => controls.stop();
  }, [parts, rest, even, fontSize]);

  const groupRef = useCallback(
    (i: number) => (node: Container | null) => {
      nodes.current[i] = node;
    },
    [],
  );
  // Fully apart, the row fits a little wider than the pan; nine groups of big pieces shrink.
  const fit = useMemo(() => {
    const widths = parts.map((each) => each.width);
    const apart = groupCentres(widths, rest.width, scaleGeometry.gap, spreadGap, {
      spread: 1,
      toMiddle: 0,
    });
    const items = [...widths.map((width, i) => [apart.groups[i] ?? 0, width] as const)];
    if (rest.width > 0) items.push([apart.leftover, rest.width] as const);
    const reach = Math.max(0, ...items.map(([centre, width]) => Math.abs(centre) + width / 2));
    const room = scaleGeometry.panWidth * 0.65;
    return reach > room ? room / reach : 1;
  }, [parts, rest]);
  return (
    <pixiContainer eventMode="none" scale={fit}>
      {parts.map((part, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a group is its place in the row
        <pixiContainer key={`group-${i}`} ref={groupRef(i)}>
          <GroupPieces part={part} fontSize={fontSize} />
        </pixiContainer>
      ))}
      {rest.pieces.length > 0 && (
        <pixiContainer ref={restNode}>
          <GroupPieces part={rest} fontSize={fontSize} />
        </pixiContainer>
      )}
    </pixiContainer>
  );
}

function GroupPieces({ part, fontSize }: { part: Laid; fontSize: number }) {
  return (
    <>
      {part.pieces.map((piece, i) => {
        const box = part.boxes[i];
        if (!box) return null;
        return (
          <pixiContainer key={piece.key} x={box.x} y={box.y}>
            <Piece
              piece={piece}
              box={{ ...box, x: 0, y: 0 }}
              fontSize={fontSize}
              nodeRef={noPlace}
            />
          </pixiContainer>
        );
      })}
    </>
  );
}
