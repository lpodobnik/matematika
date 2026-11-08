import { extend } from '@pixi/react';
import { Assets, ColorMatrixFilter, Sprite, type Texture } from 'pixi.js';
import { useEffect, useMemo, useState } from 'react';
import { areaOf, streetRestored } from '@/content/town';
import { useGame } from '@/store/store';
import { sceneSize } from '@/ui/scene/fit-scene';
import { areaArt } from '@/ui/town/art';

extend({ Sprite });

/**
 * The room's place behind its machine (story 6.3): the picture of the street it stands in,
 * soft and pale under the scale so the machine reads first. Grey until the room's restart
 * begins, then in colour, as the town shows it.
 */
export function RoomBackdrop() {
  const id = useGame((s) => s.room?.spec.id ?? null);
  const done = useGame((s) => s.save.progress.roomsDone);
  const area = areaOf(id);
  const src = area ? areaArt(area, done) : null;
  const [texture, setTexture] = useState<Texture | null>(null);
  const grey = useMemo(() => {
    const filter = new ColorMatrixFilter();
    filter.desaturate();
    return filter;
  }, []);

  useEffect(() => {
    let live = true;
    if (!src) {
      setTexture(null);
      return;
    }
    Assets.load<Texture>(src)
      .then((loaded) => {
        if (live) setTexture(loaded);
      })
      .catch(() => {
        // No picture: the paper alone, as before.
      });
    return () => {
      live = false;
    };
  }, [src]);

  if (!texture || !id) return null;
  // As the town shows it: in colour once every machine in the street runs.
  const restored = area !== null && streetRestored(area, done);
  return (
    <pixiSprite
      texture={texture}
      width={sceneSize.width}
      height={sceneSize.height}
      alpha={restored ? 0.5 : 0.32}
      filters={restored ? [] : [grey]}
    />
  );
}
