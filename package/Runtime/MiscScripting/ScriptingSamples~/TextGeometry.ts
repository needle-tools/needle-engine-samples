import { Color, Group, Object3D, BufferGeometry, DoubleSide, Material, Mesh, MeshStandardMaterial, ShapeGeometry, Vector3 } from "three";
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry as ThreeTextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { Behaviour } from '@needle-tools/engine/src/engine-components/Component';
import { serializeable } from "@needle-tools/engine";
import { FrameEvent } from "@needle-tools/engine";


// @dont-generate-component
export class TextMesh extends Behaviour {

    @serializeable()
    text?: string;

    // http://gero3.github.io/facetype.js/
    @serializeable()
    font?: string;

    @serializeable()
    characterSize: number = 1;

    @serializeable()
    fontSize: number = 10;

    @serializeable()
    lineSpacing: number = 1;

    @serializeable(Color)
    color: Color;

    private _loadedFont?: Font | null;

    async getFont(characterSpacing: number = 1): Font {
        if (this._loadedFont !== undefined)
            return this._loadedFont;

        if (this.font?.startsWith("fonts/")) {
            this.font = this.font.substring(6);
        }

        const loader = new FontLoader();
        const path = "assets/font/helvetiker_bold.typeface.json";// './include/three-mesh-ui-assets/' + this.font?.toLowerCase() + '-msdf.json';
        console.log(path);
        return new Promise((res, _rej) => {
            loader.load(path, response => {
                this._loadedFont = response;
                const bb = this._loadedFont.data.boundingBox;
                if (bb) {
                    bb.yMax *= this.lineSpacing;
                    bb.yMin *= this.lineSpacing;
                }

                // update glyph ha for character spacing
                const glyphData = this._loadedFont.data.glyphs;
                if (glyphData) {
                    for (const glyph in glyphData)
                        glyphData[glyph].ha = glyphData[glyph].ha * characterSpacing;
                }

                res(this._loadedFont);
            });
        });
    }
}

export class TextGeometry extends Behaviour {

    // not passed over for now, needs additional assets
    // fontName = 'droid_sans'; // helvetiker, optimer, gentilis, droid sans, droid serif
    // fontWeight = 'regular'; // regular bold

    // passed over from editor

    get text(): string {
        return this.textMesh?.text ?? "";
    }
    set text(str: string) {
        if (this.textMesh && str !== this.textMesh.text) {
            this.textMesh.text = str;
            this.refreshText();
        }
    }

    get size(): number {
        return this.textMesh?.characterSize ?? 1;
    }

    get lineSpacing(): number {
        return this.textMesh?.lineSpacing ?? 1;
    }

    @serializeable()
    characterSpacing: number = 1.0;
    @serializeable()
    curveSegments: number = 4;

    @serializeable()
    extrudeEnabled: boolean = true;
    @serializeable()
    extrudeHeight: number = 0.01;

    @serializeable()
    bevelEnabled: boolean = true;
    @serializeable()
    bevelThickness: number = 0.005;
    @serializeable()
    bevelSize: number = 0.004;

    // js properties

    private group!: Group;
    private font: Font | null = null;
    private textMeshObj!: Object3D;
    private textGeo!: BufferGeometry;
    private materials!: Material | Material[];
    private textMesh?: TextMesh;

    awake() {
        this.group = new Group();
        this.gameObject.add(this.group);
        this.loadFont();
    }

    onEnable() {
        this.refreshText();
    }

    onDisable() {
        this._isDirty = false;
    }

    async loadFont() {
        this.textMesh = this.gameObject.getComponent(TextMesh) ?? undefined;
        if (this.textMesh) {
            this.font = await this.textMesh.getFont(this.characterSpacing);
        }
        if (this.font) {
            console.log(this.font);

            const color = this.textMesh?.color;
            this.materials =
                false ?
                    [
                        new MeshStandardMaterial({ color: color, flatShading: false }), // front
                        new MeshStandardMaterial({ color: color, flatShading: false }) // side
                    ] :
                    new MeshStandardMaterial({ color: color, flatShading: false, side: DoubleSide }) // side
                ;

            console.log("font loaded");
            this.refreshText();
        }
    }


    refreshText() {
        this.markDirty();
    }


    private _isDirty: boolean = false;

    private markDirty() {
        if (this._isDirty) return;
        this._isDirty = true;
        this.startCoroutine(this.waitForEndOfFrame(), FrameEvent.OnBeforeRender);
    }

    private *waitForEndOfFrame() {
        yield;
        this.createGeometryText();
    }

    private createGeometryText() {
        this._isDirty = false;
        if (!this.font) return;

        if (this.group && this.textMeshObj)
            this.group.remove(this.textMeshObj);

        // geometric, extruded text with optional bevel

        this.textGeo?.dispose();

        let size = this.size;
        if (this.textMesh) {
            size *= this.textMesh?.fontSize / 15;
        }

        if (this.extrudeEnabled) {
            this.textGeo = new ThreeTextGeometry(this.text, {
                font: this.font,
                size: size,
                height: this.extrudeHeight,
                curveSegments: this.curveSegments,
                bevelThickness: this.bevelThickness,
                bevelSize: this.bevelSize,
                bevelEnabled: this.bevelEnabled

            });
        }
        else {
            const shapes = this.font.generateShapes(this.text, size);
            this.textGeo = new ShapeGeometry(shapes, this.curveSegments);
        }

        // merge vertices?
        // this.textGeo.computeVertexNormals();
        this.textGeo.computeBoundingBox();

        const centerOffsetX = 0.5 * (this.textGeo.boundingBox!.max.x - this.textGeo.boundingBox!.min.x);
        const center = new Vector3();
        this.textGeo.boundingBox!.getCenter(center);
        const centerOffsetY = this.textGeo.boundingBox!.max.y - this.textGeo.boundingBox!.min.y - size;
        // const centerOffsetZ = 0.5 * (this.textGeo.boundingBox!.max.z - this.textGeo.boundingBox!.min.z);

        this.textMeshObj = new Mesh(this.textGeo, this.materials);
        this.textMeshObj.castShadow = true;

        this.textMeshObj.position.x = centerOffsetX;
        this.textMeshObj.position.y = centerOffsetY;
        this.textMeshObj.position.z = this.extrudeEnabled ? this.extrudeHeight * 0.5 : 0.0;
        this.textMeshObj.rotation.x = 0;
        this.textMeshObj.rotation.y = Math.PI * 1;

        this.group.add(this.textMeshObj);
        this.group.traverse(x => x.frustumCulled = false);
    }
}
