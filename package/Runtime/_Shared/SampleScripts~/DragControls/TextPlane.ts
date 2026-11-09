import { Behaviour, serializable } from "@needle-tools/engine";
import { CanvasTexture, Color, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace } from "three";

// Documentation → https://docs.needle.tools/scripting

/** Where the text sits relative to this object's origin, left to right. */
export enum TextPlaneAlign {
    Left = 0,
    Center = 1,
    Right = 2,
}

/** Canvas pixels per line of text. High enough to stay crisp on a wall seen up close. */
const PIXELS_PER_LINE = 96;

/**
 * Draws a few lines of text onto a flat card facing this object's forward axis. Change the text
 * at runtime and the card redraws and resizes to fit.
 *
 * The card ignores pointer rays, so a label lying on a draggable object never takes the grab.
 */
export class TextPlane extends Behaviour {

    /** The text to show. Line breaks start a new line. */
    @serializable()
    text: string = "Your text";

    /** Height of one line in world units. */
    @serializable()
    lineHeight: number = 0.1;

    /** CSS font family, for example sans-serif or monospace. */
    @serializable()
    fontFamily: string = "system-ui, sans-serif";

    /** CSS font weight: 400 is regular, 700 is bold. */
    @serializable()
    fontWeight: number = 600;

    @serializable(Color)
    color: Color = new Color(0.02, 0.022, 0.026);

    /** Card colour behind the text. Only drawn when the background opacity is above 0. */
    @serializable(Color)
    backgroundColor: Color = new Color(1, 1, 1);

    /** 0 draws the text alone, 1 on a solid card. */
    @serializable()
    backgroundOpacity: number = 0;

    /** Space around the text, in lines. */
    @serializable()
    padding: number = 0.35;

    @serializable()
    align: TextPlaneAlign = TextPlaneAlign.Left;

    /** Ignore scene lighting, so the text reads the same in shade and light. Applies on enable. */
    @serializable()
    unlit: boolean = false;

    private _mesh?: Mesh<PlaneGeometry, MeshStandardMaterial | MeshBasicMaterial>;
    private _canvas?: HTMLCanvasElement;
    private _drawnText?: string;

    onEnable(): void {
        if (!this._mesh) this.createMesh();
        this._mesh!.visible = true;
        this.redraw();
    }

    onDisable(): void {
        if (this._mesh) this._mesh.visible = false;
    }

    onDestroy(): void {
        this._mesh?.geometry.dispose();
        this._mesh?.material.map?.dispose();
        this._mesh?.material.dispose();
    }

    update(): void {
        if (this.text !== this._drawnText) this.redraw();
    }

    /** Sets the text and redraws right away instead of on the next update. */
    setText(text: string): void {
        this.text = text;
        if (text !== this._drawnText) this.redraw();
    }

    private createMesh(): void {
        this._canvas = document.createElement("canvas");
        const material = this.unlit
            ? new MeshBasicMaterial({ transparent: true, depthWrite: false })
            : new MeshStandardMaterial({ transparent: true, roughness: 1, depthWrite: false });
        // Lies a hair above whatever it is placed on, so it wins the depth test without z-fighting.
        material.polygonOffset = true;
        material.polygonOffsetFactor = -1;
        material.polygonOffsetUnits = -4;
        this._mesh = new Mesh(new PlaneGeometry(1, 1), material);
        this._mesh.name = "TextPlane";
        // Pointer rays pass through to whatever is underneath.
        this._mesh.raycast = () => { };
        this._mesh.castShadow = false;
        this.gameObject.add(this._mesh);
    }

    private redraw(): void {
        const mesh = this._mesh, canvas = this._canvas;
        if (!mesh || !canvas) return;
        this._drawnText = this.text;

        const lines = (this.text ?? "").split("\n");
        const font = `${this.fontWeight} ${Math.round(PIXELS_PER_LINE * 0.72)}px ${this.fontFamily}`;
        const ctx = canvas.getContext("2d")!;
        ctx.font = font;
        let textWidth = 1;
        for (const line of lines) textWidth = Math.max(textWidth, ctx.measureText(line).width);

        const pad = Math.round(PIXELS_PER_LINE * this.padding);
        canvas.width = Math.ceil(textWidth + pad * 2);
        canvas.height = Math.ceil(lines.length * PIXELS_PER_LINE + pad * 2);

        // Resizing the canvas resets its state, so the font is set again below.
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (this.backgroundOpacity > 0) {
            ctx.globalAlpha = Math.min(1, this.backgroundOpacity);
            ctx.fillStyle = this.backgroundColor.getStyle();
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(0, 0, canvas.width, canvas.height, pad);
            else ctx.rect(0, 0, canvas.width, canvas.height);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        ctx.font = font;
        ctx.fillStyle = this.color.getStyle();
        ctx.textBaseline = "middle";
        ctx.textAlign = this.align === TextPlaneAlign.Center ? "center" : this.align === TextPlaneAlign.Right ? "right" : "left";
        const x = this.align === TextPlaneAlign.Center ? canvas.width / 2 : this.align === TextPlaneAlign.Right ? canvas.width - pad : pad;
        lines.forEach((line, i) => ctx.fillText(line, x, pad + PIXELS_PER_LINE * (i + 0.5)));

        // A texture keeps the size it was first uploaded with, so a resized canvas needs a new one.
        mesh.material.map?.dispose();
        const texture = new CanvasTexture(canvas);
        texture.colorSpace = SRGBColorSpace;
        texture.anisotropy = 8;
        mesh.material.map = texture;
        mesh.material.needsUpdate = true;

        const height = this.lineHeight * canvas.height / PIXELS_PER_LINE;
        const width = height * canvas.width / canvas.height;
        mesh.scale.set(width, height, 1);
        mesh.position.x = this.align === TextPlaneAlign.Left ? width / 2 : this.align === TextPlaneAlign.Right ? -width / 2 : 0;
    }
}
