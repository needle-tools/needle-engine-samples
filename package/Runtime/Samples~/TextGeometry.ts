import { Color, Group, Object3D, BufferGeometry, DoubleSide, Material, Mesh, MeshStandardMaterial, ShapeGeometry, Vector3 } from "three";
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry as ThreeTextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { Behaviour } from 'needle.tiny.engine/engine-components/Component';
import { serializeable } from "needle.tiny.engine/engine/engine_serialization_decorator";

// @dont-generate-component
export class TextGeometry extends Behaviour {

    // not passed over for now, needs additional assets

    fontName = 'droid_sans'; // helvetiker, optimer, gentilis, droid sans, droid serif
    fontWeight = 'regular'; // regular bold

    // passed over from editor

    text = 'three.js';

    lineSpacing = 1.0;
    characterSpacing = 1.0;
    size = 0.1;
    @serializeable(Color)
    fontColor: Color = null!;
    curveSegments = 4;

    extrudeEnabled = true;
    extrudeHeight = 0.01;

    bevelEnabled = true;
    bevelThickness = 0.005;
    bevelSize = 0.004;

    // js properties

    private group!: Group;
    private textMesh1!: Object3D;
    private textGeo!: BufferGeometry;
    private materials!: Material | Material[];
    private font: Font | null = null;

    setColor(col: Color) {
        this.fontColor = col;
        if (this.materials) {
            if (Array.isArray(this.materials)) {
                for (const mat of this.materials) mat["color"] = col;
            }
            else this.materials["color"] = col;
        }
    }

    awake() {

        this.materials =
            false ?
                [
                    new MeshStandardMaterial({ color: this.fontColor, flatShading: false }), // front
                    new MeshStandardMaterial({ color: this.fontColor, flatShading: false }) // side
                ] :
                new MeshStandardMaterial({ color: this.fontColor, flatShading: false, side: DoubleSide }) // side
            ;

        this.group = new Group();
        this.gameObject.add(this.group);

        this.loadFont();
    }

    loadFont() {

        const me = this;
        const loader = new FontLoader();
        loader.load('./include/three-json-fonts/' + this.fontName + '_' + this.fontWeight + '.typeface.json', function (response) {
            me.font = response;

            // relevant lines in FontLoader source
            // const line_height = ( data.boundingBox.yMax - data.boundingBox.yMin + data.underlineThickness ) * scale; // line height, https://github.com/mrdoob/three.js/blob/1a241ef10048770d56e06d6cd6a64c76cc720f95/examples/jsm/loaders/FontLoader.js#L87
            // return { offsetX: glyph.ha * scale, path: path }; // character distance, https://github.com/mrdoob/three.js/blob/1a241ef10048770d56e06d6cd6a64c76cc720f95/examples/jsm/loaders/FontLoader.js#L190

            // update font bounding box for line spacing
            let bb = me.font.data["boundingBox"];
            bb.yMax *= me.lineSpacing;
            bb.yMin *= me.lineSpacing;

            // update glyph ha for character spacing
            let glyphData = me.font.data["glyphs"];
            for (let glyph in glyphData)
                glyphData[glyph].ha = glyphData[glyph].ha * me.characterSpacing;

            me.refreshText();

        });

    }

    createGeometryText() {
        if (!this.font) return;
        // geometric, extruded text with optional bevel

        if (this.extrudeEnabled) {
            this.textGeo = new ThreeTextGeometry(this.text, {

                font: this.font!,

                size: this.size * 10,
                height: this.extrudeHeight,
                curveSegments: this.curveSegments,

                bevelThickness: this.bevelThickness,
                bevelSize: this.bevelSize,
                bevelEnabled: this.bevelEnabled

            });
        }
        else {
            const shapes = this.font!.generateShapes(this.text, this.size * 10);
            this.textGeo = new ShapeGeometry(shapes, this.curveSegments);
        }

        // merge vertices?
        // this.textGeo.computeVertexNormals();
        this.textGeo.computeBoundingBox();

        const centerOffsetX = 0.5 * (this.textGeo.boundingBox!.max.x - this.textGeo.boundingBox!.min.x);
        let center = new Vector3();
        this.textGeo.boundingBox!.getCenter(center);
        const centerOffsetY = this.textGeo.boundingBox!.max.y - this.textGeo.boundingBox!.min.y - this.size * 10;
        const centerOffsetZ = 0.5 * (this.textGeo.boundingBox!.max.z - this.textGeo.boundingBox!.min.z);

        this.textMesh1 = new Mesh(this.textGeo, this.materials);
        this.textMesh1.castShadow = true;

        this.textMesh1.position.x = centerOffsetX;
        this.textMesh1.position.y = centerOffsetY;
        this.textMesh1.position.z = this.extrudeEnabled ? this.extrudeHeight * 0.5 : 0.0;
        this.textMesh1.rotation.x = 0;
        this.textMesh1.rotation.y = Math.PI * 1;

        this.group.add(this.textMesh1);
        this.group.traverse(x => x.frustumCulled = false);

        // console.log(this);
    }

    private isDirty: boolean = false;

    refreshText() {
        if (this.group)
            this.group.remove(this.textMesh1);
        if (!this.text) return;
        if (!this.font) {
            this.isDirty = true;
            this.startCoroutine(this.internalWait());
        }
        else
            this.createGeometryText();
    }

    *internalWait() {
        while (this.isDirty) {
            yield;
        }
        this.createGeometryText();
    }
}
