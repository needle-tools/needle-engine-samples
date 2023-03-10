import { TypeStore } from "@needle-tools/engine"

// Import types
import { Particle_MoveAround } from "../Movement";
import { Particle_Rotate } from "../Movement";
import { ParticleOnCollision } from "../ParticleOnCollision";

// Register types
TypeStore.add("Particle_MoveAround", Particle_MoveAround);
TypeStore.add("Particle_Rotate", Particle_Rotate);
TypeStore.add("ParticleOnCollision", ParticleOnCollision);
