import { extend } from '@pixi/react';
import { Container, type FederatedPointerEvent, Graphics, Rectangle } from 'pixi.js';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { traySkin } from '@/art/skins/tray';
import { tuning } from '@/config/tuning';
import { watchDragCancel } from '@/ui/scene/scale/dial-drag';
import type { Box } from '@/ui/scene/scale/dial-layout';
import { createRepeat } from '@/ui/scene/scale/stepper-repeat';

extend({ Container, Graphics });

interface Props {
  box: Box;
  by: 1 | -1;
  enabled: boolean;
  lineWidth: number;
  /** One step; false when it did nothing, which stops the repeat. */
  onStep(): boolean;
}

/**
 * A − or + that steps once when pressed, then repeats while held (stepper-repeat.ts): the
 * tray's numbers and the splitter's parts. A held button lets go on up, up outside and
 * cancel, and on blur or a hidden page.
 */
export function StepButton({ box, by, enabled, lineWidth, onStep }: Props) {
  const stepRef = useRef(onStep);
  useLayoutEffect(() => {
    stepRef.current = onStep;
  });
  const repeat = useMemo(
    () =>
      createRepeat({
        delayMs: tuning.trayRepeatDelayMs,
        intervalMs: tuning.trayRepeatMs,
        onStep: () => stepRef.current(),
      }),
    [],
  );
  useEffect(() => {
    const stopWatching = watchDragCancel(window, document, {
      end: (pointerId) => repeat.release(pointerId),
      cancel: () => repeat.cancel(),
    });
    return () => {
      stopWatching();
      repeat.cancel();
    };
  }, [repeat]);
  useEffect(() => {
    if (!enabled) repeat.cancel();
  }, [enabled, repeat]);

  const { width, height } = box;
  const draw = useCallback(
    (g: Graphics) => traySkin.button(g, width, by, enabled, lineWidth),
    [width, by, enabled, lineWidth],
  );
  const hitArea = useMemo(() => new Rectangle(0, 0, width, height), [width, height]);
  const release = (event: FederatedPointerEvent) => repeat.release(event.pointerId);
  return (
    <pixiContainer
      x={box.x}
      y={box.y}
      eventMode={enabled ? 'static' : 'none'}
      interactiveChildren={false}
      hitArea={hitArea}
      onPointerDown={(event: FederatedPointerEvent) => {
        if (event.button === 0) repeat.press(event.pointerId);
      }}
      onPointerUp={release}
      onPointerUpOutside={release}
      onPointerCancel={release}
    >
      <pixiGraphics draw={draw} />
    </pixiContainer>
  );
}
