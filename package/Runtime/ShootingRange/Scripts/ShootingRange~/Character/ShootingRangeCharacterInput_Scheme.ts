import { CommonCharacterInput_Scheme } from "@needle-tools/engine";

export interface ShootingRangeCharacterInput_Scheme extends CommonCharacterInput_Scheme {
    fire_primary?: boolean;
    fire_hover_primary?: boolean;

    fire_leftVR?: boolean;
    fire_rightVR?: boolean;
}
