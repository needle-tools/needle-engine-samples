import { Behaviour, isQuest, serializable, WebXRButtonFactory } from "@needle-tools/engine";
import { LookingGlassWebXRPolyfill, LookingGlassConfig } from "@lookingglass/webxr";

// Documentation → https://docs.needle.tools/scripting

export class LookingGlass extends Behaviour {

    @serializable()
    public targetY : number = 0;
    @serializable()
    public trackballX : number = 0;
    @serializable()
    public trackballY : number = 0;
    @serializable()
    public targetDiam : number = 3;

    awake() {
        const config = LookingGlassConfig as any;

        // initial settings
        config.targetY = this.targetY;
        config.targetZ = 0;
        config.trackballX = this.trackballX / 180.0 * Math.PI;
        config.trackballY = this.trackballY / 180.0 * Math.PI;
        config.targetDiam = this.targetDiam;
        config.fovy = (40 * Math.PI) / 180;
        config.depthiness = 1.0;

        // initiate WebXR polyfill
        const _polyfill = new LookingGlassWebXRPolyfill(config);

        // add customized VR button with Looking Glass logo
        const btn = WebXRButtonFactory.getOrCreate().createVRButton();
        btn.innerText = "";
        if (!isQuest())
        {
            btn.append(this.lookingGlassLogo());
            this.context.menu.appendChild(btn);
            this.context.menu.appendChild(this.makeButton("Learn More", "https://look.glass"));
            this.context.menu.appendChild(this.makeButton("Get One ($40 off!)", "https://lookingglass.refr.cc/needle"));
        }
    }

    private makeButton(text, url) {
        const learnMoreButton = document.createElement('button');
        const learnMoreLink = document.createElement('a');
        learnMoreLink.text = text;
        learnMoreLink.href = url;
        learnMoreLink.target = "_blank";
        learnMoreButton.appendChild(learnMoreLink);
        return learnMoreButton;
    }

    private lookingGlassLogo() : HTMLElement {
        const logo = `
<svg viewBox="242.672 125.027 51.751 34.978" width="51.751" height="34.978" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="paint0_linear_414_27" x1="54.8636" y1="22.3685" x2="34.4207" y2="22.2482" gradientUnits="userSpaceOnUse" gradientTransform="matrix(1, 0, 0, 1, 223.735428, 120.515686)">
      <stop stop-color="#0069B4"/>
      <stop offset="1" stop-color="#00B7CE"/>
    </linearGradient>
    <radialGradient id="paint1_radial_414_27" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(-20.5632, 0, 0, -85.044098, 278.599129, 143.102285)">
      <stop stop-color="#A055FA"/>
      <stop offset="1" stop-color="#5800FA"/>
    </radialGradient>
  </defs>
  <path d="M 255.026 142.761 L 256.98 141.94 L 268.54 146.815 L 280.105 141.94 L 282.048 142.761 L 268.54 148.459 L 255.026 142.761 Z" fill="url(#paint0_linear_414_27)"/>
  <path d="M 268.54 138.227 L 256.981 143.101 L 255.025 142.283 L 268.54 136.582 L 282.048 142.281 L 280.105 143.102 L 268.54 138.227 Z" fill="url(#paint1_radial_414_27)"/>
  <path d="M 242.672 148.483 L 242.672 136.548 L 268.547 125.027 L 294.423 136.548 L 294.423 148.483 L 268.547 160.005 L 242.672 148.483 Z M 268.548 158.347 L 291.753 148.014 L 278.728 142.521 L 291.764 137.021 L 268.548 126.683 L 245.278 137.046 L 258.361 142.519 L 245.333 148.011 L 268.547 158.347 L 268.548 158.347 Z M 292.908 146.858 L 292.908 138.183 L 282.62 142.521 L 292.908 146.858 Z M 244.189 146.851 L 254.458 142.521 L 244.189 138.192 L 244.189 146.851 Z" fill="#FAFAFA"/>
</svg>`;

        const blob = new Blob([logo], {type: 'image/svg+xml'});
        const url = URL.createObjectURL(blob);

        const div = document.createElement('div');
        div.id = "looking-glass-logo";
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.gap = "3px";

        const image = document.createElement('img');
        image.src = url;
        image.style.filter = "filter: invert(1) hue-rotate(180deg)";
        image.style.webkitFilter = "invert(1) hue-rotate(180deg)";
        image.style.scale = "0.7";
        image.addEventListener('load', () => URL.revokeObjectURL(url), {once: true});
        div.appendChild(image);

        const text = document.createElement('a');
        text.innerText = "Looking Glass";
        text.style.height = "100%";
        div.appendChild(text);

        return div;
    }
}