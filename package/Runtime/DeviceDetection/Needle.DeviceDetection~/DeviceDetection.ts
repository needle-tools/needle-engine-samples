import { Behaviour } from "@needle-tools/engine";
import { isMobileDevice, isiOS, isMozillaXR, isSafari, isQuest } from "@needle-tools/engine/engine/engine_utils";
import { showBalloonMessage } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

export class DeviceDetection extends Behaviour {
    
    start() {
        console.log("UserAgent", window.navigator.userAgent);

        console.log("isMobileDevice", isMobileDevice());
        console.log("isiOSDevice", isiOS());
        console.log("isMozillaXR", isMozillaXR());
        console.log("isSafari", isSafari());
        console.log("isQuest", isQuest());

        // Device detection
        if (isMobileDevice()) {
            if (isiOS())
                showBalloonMessage("iOS 🍎");
            else if (window.navigator.userAgent.indexOf("Android") > -1)
                showBalloonMessage("Android 🤖");
            else
                showBalloonMessage("Other Mobile 📱");
        }
        else {
            showBalloonMessage("Desktop 🖥️");
        }

        // Browser detection
        if (isMobileDevice() && isiOS() && isSafari())
            showBalloonMessage("Safari 🌏");
        else if (isMozillaXR())
            showBalloonMessage("Mozilla XR 🦊");
        else if (isQuest())
            showBalloonMessage("Quest 🎮");
        else if (window.navigator.userAgent.indexOf("Chrome") > -1)
            showBalloonMessage("Chrome 🌏");
        else
            showBalloonMessage("Other 🌏");

        showBalloonMessage("UserAgent: " + window.navigator.userAgent);
    }
}