import { Behaviour, DeviceUtilities, NeedleXRSession } from "@needle-tools/engine";
import { showBalloonMessage } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

export class DeviceDetection extends Behaviour {
    
    private interval: number = -1;
    private supportsAR = false;
    private supportsVR = false;

    async onEnable() {
        this.log(true);
        this.interval = setInterval(() => this.log(), 500);
        this.supportsAR = await NeedleXRSession.isARSupported();
        this.supportsVR = await NeedleXRSession.isVRSupported();
    }

    onDisable() {
        clearInterval(this.interval);
    }

    private async log(logToConsole = false) {
        if (logToConsole) {
            console.log("UserAgent", window.navigator.userAgent);
            console.log("isMobileDevice", DeviceUtilities.isMobileDevice());
            console.log("isiOSDevice", DeviceUtilities.isiOS());
            console.log("isMozillaXR", DeviceUtilities.isMozillaXR());
            console.log("isSafari", DeviceUtilities.isSafari());
            console.log("isQuest", DeviceUtilities.isQuest());
            console.log("isMacOS", DeviceUtilities.isMacOS());
            console.log("isVisionOS", DeviceUtilities.isVisionOS());
        }

        // XR features
        showBalloonMessage("AR: " + showBool(this.supportsAR) + ", VR: " + showBool(this.supportsVR) + ", QuickLook: " + showBool(DeviceUtilities.supportsQuickLookAR()));
        
        // Device detection
        if (DeviceUtilities.isMobileDevice()) {
            if (DeviceUtilities.isiOS())
                showBalloonMessage("iOS 🍎");
            else if (window.navigator.userAgent.indexOf("Android") > -1)
                showBalloonMessage("Android 🤖");
            else
                showBalloonMessage("Other Mobile 📱");
        }
        else if (DeviceUtilities.isDesktop()) {
            showBalloonMessage("Desktop 🖥️");
        }
        else {
            showBalloonMessage("Other Device 🌏");
        }

        // Browser detection
        if (DeviceUtilities.isMobileDevice() && DeviceUtilities.isiOS() && DeviceUtilities.isSafari())
            showBalloonMessage("Safari 🌏");
        else if (DeviceUtilities.isMozillaXR())
            showBalloonMessage("Mozilla XR 🦊");
        else if (DeviceUtilities.isQuest())
            showBalloonMessage("Quest 🎮");
        else if (window.navigator.userAgent.indexOf("Chrome") > -1)
            showBalloonMessage("Chrome 🌏");
        else
            showBalloonMessage("Other Browser 🌏");

        showBalloonMessage("UserAgent: " + window.navigator.userAgent);

        function showBool(value: boolean) {
            return value ? "✅" : "❌";
        }
    }
}