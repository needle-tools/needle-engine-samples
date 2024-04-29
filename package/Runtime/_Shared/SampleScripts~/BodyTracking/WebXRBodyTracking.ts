import { Behaviour, Gizmos, NeedleXREventArgs, getTempVector } from '@needle-tools/engine';
import { Vector3 } from 'three';

// from https://cabanier.github.io/webxr-body-tracking/#associated-bone
enum XRBodyJoint {
    "root",
    "hips",
    "spine-lower",
    "spine-middle",
    "spine-upper",
    "chest",
    "neck",
    "head",
    "left-shoulder",
    "left-scapula",
    "left-arm-upper",
    "left-arm-lower",
    "left-hand-wrist-twist",
    "right-shoulder",
    "right-scapula",
    "right-arm-upper",
    "right-arm-lower",
    "right-hand-wrist-twist",
    "left-hand-palm",
    "left-hand-wrist",
    "left-hand-thumb-metacarpal",
    "left-hand-thumb-phalanx-proximal",
    "left-hand-thumb-phalanx-distal",
    "left-hand-thumb-tip",
    "left-hand-index-metacarpal",
    "left-hand-index-phalanx-proximal",
    "left-hand-index-phalanx-intermediate",
    "left-hand-index-phalanx-distal",
    "left-hand-index-tip",
    "left-hand-middle-phalanx-metacarpal",
    "left-hand-middle-phalanx-proximal",
    "left-hand-middle-phalanx-intermediate",
    "left-hand-middle-phalanx-distal",
    "left-hand-middle-tip",
    "left-hand-ring-metacarpal",
    "left-hand-ring-phalanx-proximal",
    "left-hand-ring-phalanx-intermediate",
    "left-hand-ring-phalanx-distal",
    "left-hand-ring-tip",
    "left-hand-little-metacarpal",
    "left-hand-little-phalanx-proximal",
    "left-hand-little-phalanx-intermediate",
    "left-hand-little-phalanx-distal",
    "left-hand-little-tip",
    "right-hand-palm",
    "right-hand-wrist",
    "right-hand-thumb-metacarpal",
    "right-hand-thumb-phalanx-proximal",
    "right-hand-thumb-phalanx-distal",
    "right-hand-thumb-tip",
    "right-hand-index-metacarpal",
    "right-hand-index-phalanx-proximal",
    "right-hand-index-phalanx-intermediate",
    "right-hand-index-phalanx-distal",
    "right-hand-index-tip",
    "right-hand-middle-metacarpal",
    "right-hand-middle-phalanx-proximal",
    "right-hand-middle-phalanx-intermediate",
    "right-hand-middle-phalanx-distal",
    "right-hand-middle-tip",
    "right-hand-ring-metacarpal",
    "right-hand-ring-phalanx-proximal",
    "right-hand-ring-phalanx-intermediate",
    "right-hand-ring-phalanx-distal",
    "right-hand-ring-tip",
    "right-hand-little-metacarpal",
    "right-hand-little-phalanx-proximal",
    "right-hand-little-phalanx-intermediate",
    "right-hand-little-phalanx-distal",
    "right-hand-little-tip",
    "left-upper-leg",
    "left-lower-leg",
    "left-foot-ankle-twist",
    "left-foot-ankle",
    "left-foot-subtalar",
    "left-foot-transverse",
    "left-foot-ball",
    "right-upper-leg",
    "right-lower-leg",
    "right-foot-ankle-twist",
    "right-foot-ankle",
    "right-foot-subtalar",
    "right-foot-transverse",
    "right-foot-ball"
};

const jointKeys = Object.values(XRBodyJoint);

const lines = [
    { from: 'hips', to: 'spine-lower' },
    { from: 'spine-lower', to: 'spine-middle' },
    { from: 'spine-middle', to: 'spine-upper' },
    { from: 'spine-upper', to: 'chest' },
    { from: 'chest', to: 'neck' },
    { from: 'neck', to: 'head' },

    { from: 'chest', to: 'left-shoulder' },
    { from: 'left-shoulder', to: 'left-scapula' },
    { from: 'left-scapula', to: 'left-arm-upper' },
    { from: 'left-arm-upper', to: 'left-arm-lower' },
    { from: 'left-arm-lower', to: 'left-hand-wrist-twist' },
    { from: 'left-hand-wrist-twist', to: 'left-hand-wrist' },
    { from: 'left-hand-wrist', to: 'left-hand-palm' },

    { from: 'left-hand-wrist', to: 'left-hand-thumb-metacarpal' },
    { from: 'left-hand-thumb-metacarpal', to: 'left-hand-thumb-phalanx-proximal' },
    { from: 'left-hand-thumb-phalanx-proximal', to: 'left-hand-thumb-phalanx-distal' },
    { from: 'left-hand-thumb-phalanx-distal', to: 'left-hand-thumb-tip' },

    { from: 'left-hand-wrist', to: 'left-hand-index-metacarpal' },
    { from: 'left-hand-index-metacarpal', to: 'left-hand-index-phalanx-proximal' },
    { from: 'left-hand-index-phalanx-proximal', to: 'left-hand-index-phalanx-intermediate' },
    { from: 'left-hand-index-phalanx-intermediate', to: 'left-hand-index-phalanx-distal' },
    { from: 'left-hand-index-phalanx-distal', to: 'left-hand-index-tip' },

    { from: 'left-hand-wrist', to: 'left-hand-middle-phalanx-metacarpal' },
    { from: 'left-hand-middle-phalanx-metacarpal', to: 'left-hand-middle-phalanx-proximal' },
    { from: 'left-hand-middle-phalanx-proximal', to: 'left-hand-middle-phalanx-intermediate' },
    { from: 'left-hand-middle-phalanx-intermediate', to: 'left-hand-middle-phalanx-distal' },
    { from: 'left-hand-middle-phalanx-distal', to: 'left-hand-middle-tip' },

    { from: 'left-hand-wrist', to: 'left-hand-ring-metacarpal' },
    { from: 'left-hand-ring-metacarpal', to: 'left-hand-ring-phalanx-proximal' },
    { from: 'left-hand-ring-phalanx-proximal', to: 'left-hand-ring-phalanx-intermediate' },
    { from: 'left-hand-ring-phalanx-intermediate', to: 'left-hand-ring-phalanx-distal' },
    { from: 'left-hand-ring-phalanx-distal', to: 'left-hand-ring-tip' },

    { from: 'left-hand-wrist', to: 'left-hand-little-metacarpal' },
    { from: 'left-hand-little-metacarpal', to: 'left-hand-little-phalanx-proximal' },
    { from: 'left-hand-little-phalanx-proximal', to: 'left-hand-little-phalanx-intermediate' },
    { from: 'left-hand-little-phalanx-intermediate', to: 'left-hand-little-phalanx-distal' },
    { from: 'left-hand-little-phalanx-distal', to: 'left-hand-little-tip' },

    { from: 'chest', to: 'right-shoulder' },
    { from: 'right-shoulder', to: 'right-scapula' },
    { from: 'right-scapula', to: 'right-arm-upper' },
    { from: 'right-arm-upper', to: 'right-arm-lower' },
    { from : 'right-arm-lower', to: 'right-hand-wrist-twist' },
    { from: 'right-hand-wrist-twist', to: 'right-hand-wrist' },
    { from: 'right-hand-wrist', to: 'right-hand-palm' },

    { from: 'right-hand-wrist', to: 'right-hand-thumb-metacarpal' },
    { from: 'right-hand-thumb-metacarpal', to: 'right-hand-thumb-phalanx-proximal' },
    { from: 'right-hand-thumb-phalanx-proximal', to: 'right-hand-thumb-phalanx-distal' },
    { from: 'right-hand-thumb-phalanx-distal', to: 'right-hand-thumb-tip' },

    { from: 'right-hand-wrist', to: 'right-hand-index-metacarpal' },
    { from: 'right-hand-index-metacarpal', to: 'right-hand-index-phalanx-proximal' },
    { from: 'right-hand-index-phalanx-proximal', to: 'right-hand-index-phalanx-intermediate' },
    { from: 'right-hand-index-phalanx-intermediate', to: 'right-hand-index-phalanx-distal' },
    { from: 'right-hand-index-phalanx-distal', to: 'right-hand-index-tip' },

    { from: 'right-hand-wrist', to: 'right-hand-middle-metacarpal' },
    { from: 'right-hand-middle-metacarpal', to: 'right-hand-middle-phalanx-proximal' },
    { from: 'right-hand-middle-phalanx-proximal', to: 'right-hand-middle-phalanx-intermediate' },
    { from: 'right-hand-middle-phalanx-intermediate', to: 'right-hand-middle-phalanx-distal' },
    { from: 'right-hand-middle-phalanx-distal', to: 'right-hand-middle-tip' },

    { from: 'right-hand-wrist', to: 'right-hand-ring-metacarpal' },
    { from: 'right-hand-ring-metacarpal', to: 'right-hand-ring-phalanx-proximal' },
    { from: 'right-hand-ring-phalanx-proximal', to: 'right-hand-ring-phalanx-intermediate' },
    { from: 'right-hand-ring-phalanx-intermediate', to: 'right-hand-ring-phalanx-distal' },
    { from: 'right-hand-ring-phalanx-distal', to: 'right-hand-ring-tip' },

    { from: 'right-hand-wrist', to: 'right-hand-little-metacarpal' },
    { from: 'right-hand-little-metacarpal', to: 'right-hand-little-phalanx-proximal' },
    { from: 'right-hand-little-phalanx-proximal', to: 'right-hand-little-phalanx-intermediate' },
    { from: 'right-hand-little-phalanx-intermediate', to: 'right-hand-little-phalanx-distal' },
    { from: 'right-hand-little-phalanx-distal', to: 'right-hand-little-tip' },

    { from: 'hips', to: 'left-upper-leg' },
    { from: 'left-upper-leg', to: 'left-lower-leg' },
    { from: 'left-lower-leg', to: 'left-foot-ankle-twist' },
    { from: 'left-foot-ankle-twist', to: 'left-foot-ankle' },
    { from: 'left-foot-ankle', to: 'left-foot-subtalar' },
    { from: 'left-foot-subtalar', to: 'left-foot-transverse' },
    { from: 'left-foot-transverse', to: 'left-foot-ball' },

    { from: 'hips', to: 'right-upper-leg' },
    { from: 'right-upper-leg', to: 'right-lower-leg' },
    { from: 'right-lower-leg', to: 'right-foot-ankle-twist' },
    { from: 'right-foot-ankle-twist', to: 'right-foot-ankle' },
    { from: 'right-foot-ankle', to: 'right-foot-subtalar' },
    { from: 'right-foot-subtalar', to: 'right-foot-transverse' },
    { from: 'right-foot-transverse', to: 'right-foot-ball' },
];

declare type XRBodySpace = XRSpace & {
    jointName: XRBodyJoint;
};

export class WebXRBodyTracking extends Behaviour {

    onEnable(): void {
        console.log(jointKeys.join("\n"));
    }

    onBeforeXR(_mode: XRSessionMode, args: XRSessionInit & { trackedImages: Array<any> }): void {
        args.optionalFeatures = args.optionalFeatures || [];
        if (!args.optionalFeatures.includes("body-tracking"))
            args.optionalFeatures.push("body-tracking");
    }

    private jointPositions: Map<XRBodyJoint, Vector3> = new Map();
    private size: Vector3 = new Vector3(0.01, 0.01, 0.01);

    onUpdateXR(args: NeedleXREventArgs): void {
        const frame = args.xr.frame;
        if (!frame) return;

        const rig = args.xr.rig!.gameObject;
        const space = this.context.renderer.xr.getReferenceSpace();
        if (frame.session && "body" in frame && space) {
            const body = frame.body as [XRBodyJoint: XRBodySpace];
            if (!body) return;

            body.forEach(part => {
                const pose = frame.getPose(part, space);
                if (!pose) return;

                const position = pose.transform.position;

                const p = getTempVector();
                p.copy(position);
                p.x *= -1;
                p.z *= -1;
                rig.localToWorld(p);
                const key = part.jointName;
                if (!this.jointPositions.has(key)) this.jointPositions.set(key, new Vector3());
                this.jointPositions.get(key)!.copy(p);

                Gizmos.DrawWireBox(p, this.size, 0xff0000, undefined, false);

                // draw flipped as well
                const p2 = getTempVector();
                p2.copy(position);
                rig.localToWorld(p2);
                const key2 = part.jointName + "-flipped";
                if (!this.jointPositions.has(key2)) this.jointPositions.set(key2, new Vector3());
                this.jointPositions.get(key2)!.copy(p2);

                Gizmos.DrawWireBox(p2, this.size, 0x00ff00, undefined, false);

                const index = jointKeys.indexOf(key);
                Gizmos.DrawLabel(p2, index.toString(), 0.015, undefined, 0xffffff, 0x00000055);
                if (index < 0) {
                    console.log("Wrong name: " + key + " -> " + index);
                }

            });

            for (const line of lines) {
                const from = this.jointPositions.get(line.from);
                const to = this.jointPositions.get(line.to);
                if (from && to) {
                    Gizmos.DrawLine(from, to, 0xffff00, undefined, false);

                    const from2 = this.jointPositions.get(line.from + "-flipped");
                    const to2 = this.jointPositions.get(line.to + "-flipped");
                    if (from2 && to2)
                        Gizmos.DrawLine(from2, to2, 0x00ffff, undefined, false);
                }
            }
        }
    }
}
