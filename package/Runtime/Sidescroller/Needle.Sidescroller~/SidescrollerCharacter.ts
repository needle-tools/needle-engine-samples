import { Animator, Behaviour, serializable } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

export class SidescrollerCharacter extends Behaviour {

    @serializable()
    speed: number = 1;

    @serializable()
    leftKey: string = "ArrowLeft";
    @serializable()
    rightKey: string = "ArrowRight";
    @serializable()
    upKey: string = "ArrowUp";
    @serializable()
    downKey: string = "ArrowDown";

    private dir: number = 1;
    private animator: Animator | null = null;
    onEnable() {
        this.animator = this.gameObject.getComponent(Animator);
    }

    lateUpdate() {
        const moveAmount = this.speed * this.context.time.deltaTime;
        const pos = this.gameObject.transform.position;
        const rot = this.gameObject.transform.rotation; 
        
        let haveMovement = false;  
        
        if (this.context.input.isKeyPressed(this.leftKey)) {  
            pos.x -= moveAmount;
            this.dir = -1;
            haveMovement = true;
        }
        if (this.context.input.isKeyPressed(this.rightKey)) {
            pos.x += moveAmount;
            this.dir = 1;
            haveMovement = true;
        }
        if (this.context.input.isKeyPressed(this.upKey)) {
            pos.z -= moveAmount;
            haveMovement = true;
        }
        if (this.context.input.isKeyPressed(this.downKey)) {
            pos.z += moveAmount;
            haveMovement = true;
        }

        this.animator?.setBool("Moving", haveMovement);
        rot.y = this.dir < 0 ? 0 : Math.PI;
    }
}