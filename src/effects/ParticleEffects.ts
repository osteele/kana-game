import type { ISourceOptions } from "tsparticles-engine";

export type ParticleEffectType = 'success' | 'failure' | 'roundComplete';
export const PARTICLE_CONFIGS: Record<ParticleEffectType, ISourceOptions> = {
  success: {
    preset: "confetti",
    fullScreen: { enable: true },
    particles: {
      number: { value: 50 },
      life: { duration: { value: 2 } }
    }
  } as ISourceOptions,
  failure: {
    preset: "confetti",
    fullScreen: { enable: true },
    particles: {
      color: { value: "#ff0000" },
      number: { value: 30 },
      life: { duration: { value: 1.5 } }
    }
  } as ISourceOptions,
  roundComplete: {
    preset: "fireworks",
    fullScreen: { enable: true },
    particles: {
      number: { value: 10 },
      life: { duration: { value: 3 } }
    }
  } as ISourceOptions
};
