import { StandardCharacter, serializable } from '@needle-tools/engine';
import { Gun } from '../Gun.js';
import { ShootingRangeCharacterInput_Scheme } from './ShootingRangeCharacterInput_Scheme.js';
import { DesktopShootingRangeControls } from './DesktopShootingRangeControls.js';
import { MobileShootingRangeControls } from './MobileShootingRangeControls.js';

export class ShootingRangeCharacter extends StandardCharacter {
    @serializable(Gun)
    pcGun?: Gun;

    @serializable(Gun)
    leftVR?: Gun;

    @serializable(Gun)
    rightVR?: Gun;

    protected get fpsInput (): ShootingRangeCharacterInput_Scheme {
        return this.frameData as ShootingRangeCharacterInput_Scheme;
    }

    initialize(findModules?: boolean | undefined): void {
        this.ensureModule(DesktopShootingRangeControls);
        this.ensureModule(MobileShootingRangeControls);

        super.initialize(findModules);
    }

    update(): void {
        super.update();
        
        if (!this.context.isInXR) {
            if (this.fpsInput.fire_hover_primary && this.eligibleToFire(this.pcGun)) {
                this.pcGun?.fireIgnoreMiss();
            }

            if (this.fpsInput.fire_primary && this.eligibleToFire(this.pcGun)) {
                this.pcGun?.fire();
            }
        }
        else {
            if (this.fpsInput.fire_leftVR && this.eligibleToFire(this.leftVR)) {
                this.leftVR?.fire();
            }

            if (this.fpsInput.fire_rightVR && this.eligibleToFire(this.rightVR)) {
                this.rightVR?.fire();
            }
        }        
    }
    protected eligibleToFire(gun: Gun | undefined): boolean {
        return gun !== undefined && gun.gameObject.visible;
    }
}