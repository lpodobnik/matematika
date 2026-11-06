import { type RefObject, useEffect, useState } from 'react';
import type { Size } from '@/ui/common/scene-spots';

/**
 * The size of the scene area, in CSS px, as the canvas fills it (Pixi's `resizeTo` reads
 * the same client size); null until it is measured. It follows the area's resizes. A
 * passive effect, because the area is a parent: its ref is attached only after its
 * children's layout effects have run.
 */
export function useAreaSize(ref: RefObject<HTMLElement | null>): Size | null {
  const [size, setSize] = useState<Size | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const { clientWidth: width, clientHeight: height } = element;
      setSize((was) => (was?.width === width && was.height === height ? was : { width, height }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}
