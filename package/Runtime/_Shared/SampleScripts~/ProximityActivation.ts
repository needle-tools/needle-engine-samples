import { ActionBuilder, AnimationExtension, Animator, AudioSource, BehaviorExtension, BehaviorModel, Behaviour, GameObject, PlayAnimationOnClick, TriggerBuilder, USDObject, USDZExporterContext, UsdzBehaviour, getTempVector, serializable } from "@needle-tools/engine";
import { Vector3, Matrix4 } from "three";

// Documentation → https://docs.needle.tools/scripting

export class ProximityActivation extends Behaviour implements UsdzBehaviour {

    @serializable()
    distance: number = 1;

    @serializable()
    deactivationDistance: number = 1.5;

    @serializable(GameObject)
    targets?: Array<GameObject>;

    private isActive?: boolean = undefined;

    update() {
        if (!this.context.mainCameraComponent || !this.targets || this.targets.length < 1) return;

        const distance = this.gameObject.worldPosition.distanceTo(this.context.mainCameraComponent.gameObject.worldPosition);
        if (distance < this.distance && (this.isActive === false || this.isActive === undefined)) {
            for (const t of this.targets) {
                if (!t) continue;
                const animator = t.getComponent(Animator);
                const audio = t.getComponent(AudioSource);
                let haveExtraActions = false;
                if (animator && animator.enabled) {
                    animator.reset();
                    animator.play("enter");
                    haveExtraActions = true;
                }
                if (audio && audio.enabled) {
                    audio.stop();
                    audio.play();
                    haveExtraActions = true;
                }
                if (!haveExtraActions) {
                    GameObject.setActive(t, true);
                }
            }
            this.isActive = true;
        } else if (distance > this.distance + 0.03 && (this.isActive === true || this.isActive === undefined)) { // add a small hysteresis to avoid flickering in VR/AR
            for (const t of this.targets) {
                if (!t) continue;
                const animator = t.getComponent(Animator);
                const audio = t.getComponent(AudioSource);
                let haveExtraActions = false;
                if (animator && animator.enabled) {
                    animator.play("exit");
                    haveExtraActions = true;
                }
                if (audio && audio.enabled) {
                    // audio.s();
                    haveExtraActions = true;
                }
                if (!haveExtraActions) {
                    GameObject.setActive(t, false);
                }
            }
            this.isActive = false;
        }
    }


    private animationExt?: AnimationExtension;
    createAnimation(ext: AnimationExtension, model: USDObject, _context: USDZExporterContext): void {
        if (model.uuid !== this.gameObject.uuid) return;
        this.animationExt = ext;
    }

    createBehaviours(ext: BehaviorExtension, model: USDObject, _context: USDZExporterContext): void {
        if (model.uuid !== this.gameObject.uuid) return;
        if (!this.targets || this.targets.length < 1) return;

        const ws = this.gameObject.getWorldScale(getTempVector()).x;

        // construct a look at and an empty GameObject that will be used as exit trigger
        const empty2 = USDObject.createEmpty();
        empty2.name = "LookAt";
        // we need to invert the parent world scale here
        empty2.matrix = new Matrix4().makeScale(1 / ws, 1 / ws, 1 / ws);
        model.add(empty2);
        
        const empty = USDObject.createEmpty();
        empty.name = "ExitTrigger";
        empty2.add(empty);
        empty.matrix = new Matrix4().makeTranslation(0, 0, 2 * this.distance).scale(new Vector3(ws, ws, ws));

        // for testing, so that we can see something
        // empty.geometry = model.geometry;
        // empty.material = model.material;

        // We're trying something new here: for each target, we try to identify what should happen.
        // Animator: play the "enter" and "exit" animations
        // Audio: play sound
        // GameObject: fade in/out

        const proximityTrigger = TriggerBuilder.proximityToCameraTrigger(this.gameObject, this.distance);
        const actions = ActionBuilder.parallel();
        for (const t of this.targets) {
            if (!t) continue;
            const animator = t.getComponent(Animator);
            const audio = t.getComponent(AudioSource);
            let haveExtraActions = false;
            if (animator && this.animationExt && false) {
                const result = PlayAnimationOnClick.getAndRegisterAnimationSequences(this.animationExt, t, "enter");
                console.log("RESULT", result)
                if (result) {
                    // TODO this doesn't work yet for some reason...
                    const action = PlayAnimationOnClick.getActionForSequences(model, result.animationSequence, result.animationLoopAfterSequence);
                    actions.addAction(action);
                    haveExtraActions = true;

                    // This works fine with the same action... strange
                    const playAnimOnClick = new BehaviorModel("PlayAnimationOnClick",
                        TriggerBuilder.tapTrigger(model),
                        action,
                    );
                    ext.addBehavior(playAnimOnClick);
                }
            }
            if (audio && typeof audio.clip === "string") {
                actions.addAction(ActionBuilder.playAudioAction(t, ext.addAudioClip(audio.clip), "play"));
                haveExtraActions = true;
            }
            if (!haveExtraActions) {
                actions.addAction(ActionBuilder.fadeAction(t, 1, true));
            }
        }
        const enable = new BehaviorModel("EnableOnProximity", 
            proximityTrigger,
            actions,
            // ActionBuilder.fadeAction(this.targets, 1, true),
            // all ENTER actions can be attached here
        );
        // Helpers to allow for an exit behaviour – QuickLook can only handle proximity enter, so
        // we construct another object that is behind the user and use that as an exit trigger
        const lookAt = new BehaviorModel("LookAt",
            proximityTrigger,
            // always lookat for testing. otherwise, we can start doing that once the trigger has been entered for the first time
            // TriggerBuilder.sceneStartTrigger(),
            ActionBuilder.lookAtCameraAction(empty2, undefined, undefined, { x: 0, y: 0, z: 0 }),
        );

        // collect only the targets that don't do anything special
        const targetsToDisable: GameObject[] = [];
        for (const t of this.targets) {
            if (!t) continue;
            const animator = t.getComponent(Animator);
            const audio = t.getComponent(AudioSource);
            let haveExtraActions = false;
            if (animator && animator.enabled)
                haveExtraActions = true;
            if (audio && audio.enabled)
                haveExtraActions = true;
            if (!haveExtraActions)
                targetsToDisable.push(t);
        }
        const disableAtStart = new BehaviorModel("DisableAtStart",
            TriggerBuilder.sceneStartTrigger(),
            ActionBuilder.sequence(
                ActionBuilder.fadeAction(targetsToDisable, 0, false),
            ),
        );

        ext.addBehavior(enable);
        ext.addBehavior(lookAt);

        if (this.deactivationDistance > 0 && this.deactivationDistance >= this.distance) {
            const disable = new BehaviorModel("DisableOnProximity",
                TriggerBuilder.proximityToCameraTrigger(empty, this.distance),
                ActionBuilder.sequence(
                    ActionBuilder.fadeAction(targetsToDisable, 1, false),
                ),
                // all EXIT actions can be attached here
            );
            ext.addBehavior(disable);
        }

        ext.addBehavior(disableAtStart);
    }
}