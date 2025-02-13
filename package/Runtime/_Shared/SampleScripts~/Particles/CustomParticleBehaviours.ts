import { Behaviour, CircularBuffer, getTempVector, Mathf, ParticleSystem, ParticleSystemBaseBehaviour, PointerEventData, QParticle, serializable } from "@needle-tools/engine";
import { Vector2, Vector3, Vector4 } from "three";

export class CustomParticleBehaviour_Reveal extends Behaviour {

    @serializable(ParticleSystem)
    particleSystem?: ParticleSystem;

    private _behaviour?: ParticleSystemBaseBehaviour;

    onEnable(): void {
        if (this.particleSystem) {
            this._behaviour ??= new RevealBehaviour();
            this.particleSystem?.addBehaviour(this._behaviour);
        }
    }
    onDisable(): void {
        if (this._behaviour) this.particleSystem?.removeBehaviour(this._behaviour)
    }
}

const vec2buf = new CircularBuffer(() => new Vector2(), 10);
const $velocity = Symbol("velocity");
const $color = Symbol("color");
const $colorReveal = Symbol("colorReveal");
let lastTouchTime = 0;

class RevealBehaviour extends ParticleSystemBaseBehaviour {

    override initialize(_particle: QParticle): void {
        // position the particle randomly in screenspace to fill up the screen
        // for this we want to have prewarm enabled in the particlesystem to work best
        const randomScreenPos = new Vector3(Mathf.random(-1.1, 1.1), Mathf.random(-1.1, 1.1), .99 + Math.random() * .001);
        const wp = randomScreenPos.unproject(this.context.mainCamera);
        _particle.position.set(wp.x, wp.y, wp.z);
        _particle.size.multiplyScalar(Mathf.random(0.8, 1.2));
        _particle[$velocity] ??= new Vector2();
        _particle[$velocity].set(0, 0);

        _particle[$colorReveal] ??= new Vector3();

        _particle[$color] ??= new Vector3();
        const v = Mathf.random(0, .1);
        _particle[$color].set(v, v, v);

        const r = Mathf.random(.9, 1);
        _particle[$colorReveal].set(r, Mathf.random(.5, .9), r);
    }

    override update(_particle: QParticle, _delta: number): void {

        // we only need to do anything if the user is touching the screen
        if (this.context.input.getPointerPressedCount() > 0) {

            lastTouchTime = this.context.time.time;

            // get current pointer in screenspace
            const cursorScreen = vec2buf.get().copy(this.context.input.getPointerPositionRC(0)!);
            const cursorDelta = this.context.input.getPointerPositionDelta(0)!;
            // get particle position in screenspace
            const screenPosition = vec2buf.get().copy(getTempVector(_particle.position).project(this.context.mainCamera));

            // calc screenspace distance between cursor and particle
            const toParticleVector = cursorScreen.sub(screenPosition);
            const distance = toParticleVector.length();

            // if the particle is close enough
            if (distance < .4) {
                // if yes then move the particle away from the cursor
                // we do this by saving the velocity in the particle and apply if every frame
                const tx01 = cursorDelta.x / this.context.domWidth;
                const ty01 = cursorDelta.y / this.context.domHeight;

                _particle[$velocity].x += 1 / toParticleVector.x;
                _particle[$velocity].y += 1 / -toParticleVector.y;

                _particle[$velocity].x += -tx01 * 10;
                _particle[$velocity].y += ty01 * 10;

                (_particle[$color] as Vector3).lerp(_particle[$colorReveal], 0.1);
            }
        }

        // we also increase the particles lifetime to make it stay on screen for longer
        // this is so we have a sort of reveal effect (since max particles will prevent more particles from spawning)
        if (_particle.life < 30 && this.context.time.time - lastTouchTime < 1) {
            _particle.life += 5;
        }

        _particle.color.x = _particle[$color].x;
        _particle.color.y = _particle[$color].y;
        _particle.color.z = _particle[$color].z;

        // apply the previously accumulated velocity
        _particle.velocity.x += _particle[$velocity].x * this.context.time.deltaTime;
        _particle.velocity.y += _particle[$velocity].y * this.context.time.deltaTime;

        // reduce the velocity over time
        const vel = _particle[$velocity];
        vel.multiplyScalar(1 - this.context.time.deltaTime * .2);
    }
}