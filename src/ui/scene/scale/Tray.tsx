import { extend, useApplication } from '@pixi/react';
import { animate } from 'motion';
import {
  Container,
  type FederatedPointerEvent,
  Graphics,
  type PointData,
  Rectangle,
  Text,
} from 'pixi.js';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { traySkin } from '@/art/skins/tray';
import { canStep, stepTray, trayPiece, trayView } from '@/room/tray';
import type { TrayKind } from '@/room/types';
import { useGame } from '@/store/store';
import { watchDragCancel } from '@/ui/scene/scale/dial-drag';
import { minHitCssPx } from '@/ui/scene/scale/dial-layout';
import { beamPose, labelFontSize, type PieceBox, pieceSize } from '@/ui/scene/scale/layout';
import { Piece } from '@/ui/scene/scale/Piece';
import {
  type Carry,
  cancelWatch,
  type PieceDrag,
  releaseActionAt,
  storeTakes,
} from '@/ui/scene/scale/piece-drag';
import { pinWiggle } from '@/ui/scene/scale/pin-layout';
import { StepButton } from '@/ui/scene/scale/StepButton';
import {
  copyMs,
  landMs,
  type Point,
  returnMs,
  type TrayLayout,
  type TraySlotLayout,
  tapSlopCssPx,
  trayGeometry,
  trayKindsOf,
  trayLayout,
  trayWiggleMs,
} from '@/ui/scene/scale/tray-layout';
import { useCarry } from '@/ui/scene/scale/use-carry';

extend({ Container, Graphics, Text });

interface Props {
  /** CSS px per scene unit: buttons and grab areas are sized in CSS px. */
  sceneScale: number;
  /** Carries pieces between the tray and the pans; shared with the scale. */
  drag: PieceDrag;
  /** A point on the canvas in scene units. */
  toScene(point: PointData): Point;
}

/** A tray that doesn't work now (the machine is jammed) is drawn faint. */
const idleAlpha = 0.45;

function noPlace(): void {}

function boxFor(piece: Carry['piece'], fontSize: number): PieceBox {
  return { key: piece.key, x: 0, y: 0, ...pieceSize(piece, fontSize) };
}

/**
 * The tray of spare pieces (Pattern 1, Balance moves; story 1.15): once Balance is earned
 * and the stage offers it (room/tray.ts), it shows a weight and a float, each with its + above
 * and its − below its number (which repeat when held). He drags either anywhere over the
 * scale, and a copy goes to each side; or drags a weight or float off a pan, and it comes
 * off both sides. The store decides what the move does, and a move it refuses slides back.
 * The first time it is offered it wiggles once. It also draws the piece he carries, above
 * everything, moved through a ref as his finger moves.
 */
export function Tray({ sceneScale, drag, toScene }: Props) {
  const { app, isInitialised } = useApplication();
  const view = useGame(useShallow((s) => trayView(s.room, s.save.progress.tools)));
  const room = useGame((s) => s.room);
  const tools = useGame((s) => s.save.progress.tools);
  const stageKey = room ? `${room.spec.id}.${room.stageIndex}` : null;
  const dispatch = useGame((s) => s.dispatch);
  const fontSize = labelFontSize(sceneScale);
  const gear = view?.gear != null;
  const layout = useMemo(
    () =>
      sceneScale > 0 ? trayLayout(sceneScale, fontSize, trayGeometry, trayKindsOf(gear)) : null,
    [sceneScale, fontSize, gear],
  );
  const carry = useCarry(drag);

  // Handlers read the latest store values without re-registering.
  const latest = useRef({ room, tools, layout, fontSize });
  useLayoutEffect(() => {
    latest.current = { room, tools, layout, fontSize };
  });

  // A pan's piece is back on its pan when let go over the box its pan sweeps (story 1.15
  // review), and a release within a few CSS px of where the finger went down is a tap.
  useEffect(() => {
    drag.setReleaseHandler((held, at) => {
      const current = latest.current;
      if (!current.layout) return false;
      const action = releaseActionAt(current.room, held, at, current.layout, current.fontSize);
      if (!action || !storeTakes(current.room, current.tools, action)) return false;
      dispatch(action);
      return true;
    });
    return () => drag.setReleaseHandler(null);
  }, [drag, dispatch]);

  const tapSlop = layout ? tapSlopCssPx * layout.unitsPerPx : 0;
  useEffect(() => drag.setTapSlop(tapSlop), [drag, tapSlop]);

  // A drag can start on the tray or on a pan, so it is followed on the stage: every move,
  // and up or up outside wherever the finger was let go. A cancelled pointer (the DOM's
  // pointercancel), blur or a hidden page is not a drop: the piece slides back.
  useEffect(() => {
    if (!isInitialised) return;
    const { stage } = app;
    const onMove = (event: FederatedPointerEvent) =>
      drag.move(event.pointerId, toScene(event.global));
    const onUp = (event: FederatedPointerEvent) => drag.end(event.pointerId);
    stage.on('globalpointermove', onMove);
    stage.on('pointerup', onUp);
    stage.on('pointerupoutside', onUp);
    const stopWatching = watchDragCancel(window, document, cancelWatch(drag));
    return () => {
      stage.off('globalpointermove', onMove);
      stage.off('pointerup', onUp);
      stage.off('pointerupoutside', onUp);
      stopWatching();
      drag.cancel();
      drag.settle();
    };
  }, [app, isInitialised, drag, toScene]);

  const step = useCallback(
    (kind: TrayKind, by: 1 | -1) => () => {
      const current = latest.current;
      if (!current.room || !stepTray(current.room, current.tools, kind, by)) return false;
      dispatch({ type: 'tray/step', kind, by });
      return canStep(current.room.stage.tray[kind] + by, by);
    },
    [dispatch],
  );

  // The first-use wiggle (hint level 1): once per stage, when the game first offers the tray.
  const shelfRef = useRef<Container>(null);
  const wiggled = useRef<string | null>(null);
  const wiggle = view?.wiggle ?? false;
  const reach = layout ? layout.box.height * 0.08 : 0;
  useEffect(() => {
    const node = shelfRef.current;
    if (!wiggle || !node || stageKey === null || wiggled.current === stageKey) return;
    wiggled.current = stageKey;
    // The shelf unmounts when the stage locks, while `wiggle` is still on: by the time this
    // effect is cleaned up, its container may already be destroyed.
    const shift = (x: number) => {
      if (!node.destroyed) node.x = x;
    };
    const controls = animate(0, 1, {
      duration: trayWiggleMs / 1000,
      ease: 'linear',
      onUpdate: (t) => shift(pinWiggle(t, reach)),
      onComplete: () => shift(0),
    });
    return () => {
      controls.stop();
      shift(0);
    };
  }, [wiggle, stageKey, reach]);

  if (!layout) return null;
  return (
    <pixiContainer>
      {view && (
        <pixiContainer ref={shelfRef} alpha={view.works ? 1 : idleAlpha}>
          <Shelf layout={layout} />
          {layout.slots.map((slot) => (
            <TraySlot
              key={slot.kind}
              slot={slot}
              value={view[slot.kind] ?? 1}
              works={view.works}
              fontSize={fontSize}
              lineWidth={layout.lineWidth}
              minHit={minHitCssPx * layout.unitsPerPx}
              drag={drag}
              toScene={toScene}
              onStep={step}
            />
          ))}
        </pixiContainer>
      )}
      {carry && <Carried carry={carry} drag={drag} fontSize={fontSize} />}
    </pixiContainer>
  );
}

function Shelf({ layout }: { layout: TrayLayout }) {
  const { box, dividers, lineWidth } = layout;
  const draw = useCallback(
    (g: Graphics) => traySkin.shelf(g, { ...box, dividers, lineWidth }),
    [box, dividers, lineWidth],
  );
  return <pixiGraphics draw={draw} />;
}

interface SlotProps {
  slot: TraySlotLayout;
  value: number;
  works: boolean;
  fontSize: number;
  lineWidth: number;
  minHit: number;
  drag: PieceDrag;
  toScene(point: PointData): Point;
  onStep(kind: TrayKind, by: 1 | -1): () => boolean;
}

/** One of the tray's pieces, which he drags out (a new one stays behind), and its stepper. */
function TraySlot({
  slot,
  value,
  works,
  fontSize,
  lineWidth,
  minHit,
  drag,
  toScene,
  onStep,
}: SlotProps) {
  const piece = useMemo(() => trayPiece(slot.kind, value), [slot.kind, value]);
  const box = useMemo(() => boxFor(piece, fontSize), [piece, fontSize]);
  const { x, y } = slot.piece;
  const place = useCallback((node: Container | null) => node?.position.set(x, y), [x, y]);
  const grabArea = useMemo(
    () => new Rectangle(slot.grab.x, slot.grab.y, slot.grab.width, slot.grab.height),
    [slot.grab],
  );
  const grab = (event: FederatedPointerEvent) => {
    if (event.button !== 0) return;
    drag.start(
      event.pointerId,
      { from: 'tray', kind: slot.kind },
      piece,
      slot.piece,
      toScene(event.global),
    );
  };
  return (
    <pixiContainer>
      <Piece piece={piece} box={box} fontSize={fontSize} nodeRef={place} minHit={minHit} />
      <pixiContainer
        eventMode={works ? 'static' : 'none'}
        hitArea={grabArea}
        onPointerDown={grab}
      />
      <StepButton
        box={slot.up}
        by={1}
        enabled={works && canStep(value, 1)}
        lineWidth={lineWidth}
        onStep={onStep(slot.kind, 1)}
      />
      <StepButton
        box={slot.down}
        by={-1}
        enabled={works && canStep(value, -1)}
        lineWidth={lineWidth}
        onStep={onStep(slot.kind, -1)}
      />
    </pixiContainer>
  );
}

interface CarriedProps {
  carry: Carry;
  drag: PieceDrag;
  fontSize: number;
}

/** Where the copies of a dropped piece go: onto each pan as it hangs level (story 1.15). */
const copyTargets: readonly Point[] = (() => {
  const level = beamPose(0);
  return [level.left, level.right];
})();

/**
 * The piece he carries, under his finger. Let go over the scale, a piece from the tray
 * splits into two copies that fly to the two pans as the pans' pieces change (story 1.15:
 * one copy to each side); a piece taken off a pan fades where it is. Refused, it slides
 * back to where he picked it up. Either way the carry then settles.
 */
function Carried({ carry, drag, fontSize }: CarriedProps) {
  const ref = useRef<Container>(null);
  const copies = useRef<(Container | null)[]>([]);
  const box = useMemo(() => boxFor(carry.piece, fontSize), [carry.piece, fontSize]);
  const sendsCopies = carry.phase === 'landing' && carry.source.from === 'tray';

  useLayoutEffect(() => {
    const place = (at: Point) => ref.current?.position.set(at.x, at.y);
    const now = drag.position();
    if (now) place(now);
    drag.setMoveListener(place);
    return () => drag.setMoveListener(null);
  }, [drag]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (carry.phase === 'held') {
      node.alpha = 1;
      node.scale.set(1);
      return;
    }
    const from = drag.position() ?? carry.home;
    const to = carry.home;
    const flyCopies = (t: number) => {
      node.alpha = Math.max(0, 1 - 3 * t);
      copies.current.forEach((copy, i) => {
        const target = copyTargets[i];
        if (!copy || copy.destroyed || !target) return;
        copy.position.set(from.x + (target.x - from.x) * t, from.y + (target.y - from.y) * t);
        copy.alpha = t < 0.7 ? 1 : (1 - t) / 0.3;
      });
    };
    const controls = sendsCopies
      ? animate(0, 1, {
          duration: copyMs / 1000,
          ease: 'easeOut',
          onUpdate: flyCopies,
          onComplete: () => drag.settle(),
        })
      : carry.phase === 'landing'
        ? animate(0, 1, {
            duration: landMs / 1000,
            ease: 'easeOut',
            onUpdate: (t) => {
              node.alpha = 1 - t;
              node.scale.set(1 - 0.3 * t);
            },
            onComplete: () => drag.settle(),
          })
        : animate(0, 1, {
            duration: returnMs / 1000,
            ease: 'easeOut',
            onUpdate: (t) =>
              node.position.set(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t),
            onComplete: () => drag.settle(),
          });
    return () => {
      controls.stop();
      // Unmounted mid-animation, the carry still ends (a new drag has already replaced it otherwise).
      drag.settle();
    };
  }, [carry, drag, sendsCopies]);

  return (
    <>
      <pixiContainer ref={ref} eventMode="none">
        <Piece piece={carry.piece} box={box} fontSize={fontSize} nodeRef={noPlace} />
      </pixiContainer>
      {sendsCopies &&
        copyTargets.map((target, i) => (
          <pixiContainer
            // biome-ignore lint/suspicious/noArrayIndexKey: a copy is the side it goes to
            key={`copy-${i}`}
            ref={(node: Container | null) => {
              copies.current[i] = node;
            }}
            eventMode="none"
            x={target.x}
            y={target.y}
          >
            <Piece piece={carry.piece} box={box} fontSize={fontSize} nodeRef={noPlace} />
          </pixiContainer>
        ))}
    </>
  );
}
