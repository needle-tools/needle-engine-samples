import { TypeStore } from "@needle-tools/engine"

// Import types
import { Particle_MoveAround } from "../Movement.js";
import { Particle_Rotate } from "../Movement.js";
import { ParticleOnCollision } from "../ParticleOnCollision.js";

// Register types
TypeStore.add("Particle_MoveAround", Particle_MoveAround);
TypeStore.add("Particle_Rotate", Particle_Rotate);
TypeStore.add("ParticleOnCollision", ParticleOnCollision);
