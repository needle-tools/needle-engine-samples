import { DesktopCharacterInput, StandardCharacter, getComponent, serializable } from "@needle-tools/engine";

export class DoubleJumpCharacter extends StandardCharacter {
    @serializable()
    maxJumps: number = 2;

    private _jumpCount: number = 0;
    initialize(findModules?: boolean | undefined): void {
        super.initialize(findModules);

        const desktopInput = this.gameObject.getComponent(DesktopCharacterInput);
        if(desktopInput)
            desktopInput.jumpAllowHold = false;

        this.adjustState("jump", jumpState => {
            jumpState.enterCondition = [ () => (this.standardInput.jump ?? false) && (this.physics.isGrounded || this._jumpCount < this.maxJumps) ];
            jumpState.enter = () => { 
                this._jumpCount++;
            };
            jumpState.priority = 10; // higher priority than falling because then the state won't return to jump even if condition is true
        });

        this.adjustState("land", landState => {
            landState.enter = () => {
                this._jumpCount = 0;
            };
        });

        //TODO: add doublejump state, in order to drive animation, sfx and particles (?)
    }
}