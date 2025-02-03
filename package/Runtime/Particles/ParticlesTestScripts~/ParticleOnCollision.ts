import { Behaviour, Collision, Gizmos, ParticleSystem, RGBAColor, serializable, showBalloonMessage } from "@needle-tools/engine";
import { setWorldPosition } from "@needle-tools/engine";
import { getParam } from "@needle-tools/engine";
import { Vector3, Color } from "three";

const debug = getParam("debugparticles");

export class ParticleOnCollision extends Behaviour {
    @serializable(ParticleSystem)
    particles?: ParticleSystem;

    @serializable(Color)
    color1: Color = new Color();

    @serializable(Color)
    color2: Color = new Color();

    @serializable()
    slowmoOnCollision: boolean = false;

    private rgbColor1: RGBAColor = new RGBAColor(0, 0, 0, 0);
    private rgbColor2: RGBAColor = new RGBAColor(0, 0, 0, 0);

    onCollisionEnter(col: Collision) {
        if (this.particles) {
            const normal = col.contacts[0].normal.multiplyScalar(-1);
            // Gizmos.DrawDirection(col.contacts[0].point, normal, 0xff0000, 2, false);
            this.particles.gameObject.worldPosition = col.contacts[0].point.add(normal.clone().multiplyScalar(0.05));
            this.particles.gameObject.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), normal);
            this.particles.main.startColor.colorMin = this.updateRGBAColorFromColor(this.rgbColor1, this.color1);
            this.particles.main.startColor.colorMax = this.updateRGBAColorFromColor(this.rgbColor2, this.color2);
            this.particles.emit(200);
            // setTimeout(() => this.context.isPaused = true, 10)
            if (debug || this.slowmoOnCollision) {
                Gizmos.DrawDirection(col.contacts[0].point, normal, this.color1, 2, false);
                this.context.time.timeScale = 0.05;
                setTimeout(() => this.context.time.timeScale = 1, 1000)
            }
        }
    }

    private updateRGBAColorFromColor(rgbColor: RGBAColor, color: Color, alpha: number = 1) : RGBAColor {
        rgbColor.r = color.r;
        rgbColor.g = color.g;
        rgbColor.b = color.b;
        rgbColor.a = alpha;

        return rgbColor;
    }
}
