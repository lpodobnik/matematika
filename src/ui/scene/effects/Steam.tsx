import { extend, useApplication } from '@pixi/react';
import {
  Container,
  Graphics,
  Particle,
  ParticleContainer,
  type Renderer,
  type Texture,
  type Ticker,
} from 'pixi.js';
import { useLayoutEffect, useRef } from 'react';
import { steamSkin } from '@/art/skins/steam';
import { createPuffs, type Puff, type SteamSpec, stepPuffs } from '@/ui/scene/effects/steam-sim';

extend({ Container });

/**
 * One puff texture per renderer and radius, drawn the first time it is needed and kept for
 * the renderer's life: the steam comes and goes with the quality setting, and destroying a
 * texture the particle shader still holds only draws Pixi's warnings. A renderer remounted
 * after a lost context draws its own.
 */
const puffTextures = new WeakMap<Renderer, Map<number, Texture>>();

function puffTexture(renderer: Renderer, radius: number): Texture {
  let byRadius = puffTextures.get(renderer);
  if (!byRadius) {
    byRadius = new Map();
    puffTextures.set(renderer, byRadius);
  }
  const cached = byRadius.get(radius);
  if (cached) return cached;
  const art = new Graphics();
  steamSkin.puff(art, radius);
  const texture = renderer.generateTexture({
    target: art,
    antialias: true,
    resolution: renderer.resolution,
  });
  art.destroy();
  byRadius.set(radius, texture);
  return texture;
}

/** Puffs move, grow and fade every frame; their texture and rotation never change. */
const dynamicProperties = {
  position: true,
  vertex: true,
  color: true,
  rotation: false,
  uvs: false,
};

function copyPuff(particle: Particle, puff: Puff): void {
  particle.x = puff.x;
  particle.y = puff.y;
  particle.scaleX = puff.scale;
  particle.scaleY = puff.scale;
  particle.alpha = puff.alpha;
}

interface Props {
  spec: SteamSpec;
}

/**
 * The placeholder steam effect: particles in one `ParticleContainer`, sharing one puff
 * texture drawn in code. Every frame the puffs step on the app's ticker and are copied
 * onto the particles, with no React render (rule 6). Mounted only while the quality setting
 * keeps particles (`art/quality.ts`); unmounted, it costs nothing.
 *
 * Layout effects, so the ticker callback is removed while the app still exists: when the
 * scene remounts after a lost context, the old app is destroyed right after its tree unmounts.
 */
export function Steam({ spec }: Props) {
  const { app, isInitialised } = useApplication();
  const holderRef = useRef<Container>(null);

  useLayoutEffect(() => {
    const holder = holderRef.current;
    if (!isInitialised || !holder) return;
    const { renderer, ticker } = app;
    const texture = puffTexture(renderer, spec.radius);
    const puffs = createPuffs(spec, Math.random);
    const particles = puffs.map((puff) => {
      const particle = new Particle({ texture, anchorX: 0.5, anchorY: 0.5 });
      copyPuff(particle, puff);
      return particle;
    });
    // Added after construction, not through the `particles` option: only addParticle marks
    // the static properties (the texture's uvs) for upload, and without them nothing draws.
    const plume = new ParticleContainer({ texture, dynamicProperties });
    plume.addParticle(...particles);
    plume.eventMode = 'none';
    holder.addChild(plume);

    const onFrame = (frame: Ticker) => {
      stepPuffs(puffs, frame.deltaMS, spec, Math.random);
      puffs.forEach((puff, i) => {
        const particle = particles[i];
        if (particle) copyPuff(particle, puff);
      });
    };
    ticker.add(onFrame);
    return () => {
      ticker.remove(onFrame);
      holder.removeChild(plume);
      plume.destroy();
    };
  }, [app, isInitialised, spec]);

  return <pixiContainer ref={holderRef} eventMode="none" />;
}
