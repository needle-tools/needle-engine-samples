import { Behaviour } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

export class SidescrollerInfo extends Behaviour {

    private template = `
    <div style="position: absolute; left: 20px; top: 20px; z-index: 1000; color: white; font-size: 0.8em; opacity: 0.8; background-color: #00000099; border-radius: 30px; padding: 15px; user-select: text; margin-right: 20px;">
        <button class="close" style="background: white; border: none; border-radius: 30px; width: 30px; height: 30px;"><span style="font-size: 2em; line-height:0; vertical-align: sub; text-align: center;">×</span></button>
        <button class="fullscreen" style="background: white; border: none; border-radius: 30px; width: 30px; height: 30px;"><span style="font-size: 1.2em; line-height:0; vertical-align: middle; text-align: center;">↗</span></button>
        <div class="content">
            <h1>Sidescroller Sample</h1>
            <p><strong>Desktop:</strong> Use the arrow keys to move the player. Mouse wheel changes the view.</p>
            <p><strong>Mobile:</strong> Touch the screen edges to move the player. Pinch changes the view.</p>
            <p><strong>Gamepad:</strong> Use the left stick to move the player. Right stick changes the view.</p>
            <a href="https://needle.tools" target="_blank" style="color: white; text-decoration: underline;">Made with Needle Engine</a>
        </div>
        <style>
            html, body {
                touch-action: none;
                -webkit-touch-callout: none;
                -webkit-user-select: none;
                -khtml-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
                outline: none;
            }
        </style>
    </div>
    `;

    private content: HTMLElement | null = null;
    onEnable() {
        const template = document.createElement("template");
        template.innerHTML = this.template;
        this.content = template.content.firstElementChild?.cloneNode(true) as HTMLElement;
        document.body.appendChild(this.content);
        const haveFullscreenSupport = "fullscreen" in document || "webkitFullscreenElement" in document;

        const content = this.content;
        function removeInfo() {
            content?.querySelector(".content")?.remove();
            content?.querySelector(".close")?.remove();
            if (!haveFullscreenSupport)
                content?.remove();
        }

        this.content.querySelector(".close")?.addEventListener("click", () => { removeInfo(); });

       
        if (!haveFullscreenSupport) {
            this.content.querySelector(".fullscreen")?.remove();
        }

        this.content.querySelector(".fullscreen")?.addEventListener("click", () => {
            if ("fullscreen" in document) {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    document.body.requestFullscreen();
                    removeInfo();
                }
            }
            else if ("webkitFullscreenElement" in document) {
                if (document.webkitFullscreenElement) {
                    document.webkitExitFullscreen();
                } else {
                    document.body.webkitRequestFullscreen();
                    removeInfo();
                }
            }
        });
    }

    onDisable() {
        if (this.content) {
            this.content.remove();
        }
    }
}   