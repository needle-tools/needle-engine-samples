# Builds one gallery room GLB per entry in rooms.json.
# blender -b -P build_rooms.py -- <rooms.json> <output dir>
#
# Blender axes: open front towards -Y, back wall at +Y (UnityGLTF maps Blender -Y to Unity +Z).
# Room origin is the floor centre; the floor top sits 4mm above the origin.

import bpy, bmesh, json, math, os, re, sys

args = sys.argv[sys.argv.index("--") + 1:]
layout_path, out_dir = args[0], args[1]
rooms = json.load(open(layout_path, encoding="utf-8"))["rooms"]

WALL = 0.12           # wall thickness
FLOOR_TOP = 0.004
FLOOR_BOTTOM = -0.2
FRONT_HEIGHT = 1.7    # side wall height at the open front, high enough to hide the neighbours from the POI cameras
FRONT_RADIUS = 0.3    # rounded top-front corner of the side walls
BEVEL = 0.02
TEXT_DEPTH = 0.006
GRADIENT_ASPECT = 512 / 128  # Room_WallGradient.png height / width, see make_gradient.py

ACCENTS = [  # preview colors only, Unity remaps materials by name
    (1.00, 0.42, 0.36), (1.00, 0.71, 0.28), (0.24, 0.84, 0.64),
    (0.23, 0.72, 0.94), (0.42, 0.49, 1.00), (0.78, 0.49, 1.00),
]


def srgb_to_linear(c):
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def material(name, color, roughness=0.8, emission=None):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*srgb_to_linear(color), 1)
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*srgb_to_linear(emission), 1)
        bsdf.inputs["Emission Strength"].default_value = 1
    return m


def mesh_object(name, bm, mats):
    me = bpy.data.meshes.new(name)
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    for m in mats: me.materials.append(m)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def add_box(bm, x0, x1, y0, y1, z0, z1):
    v = [bm.verts.new((x, y, z)) for x in (x0, x1) for y in (y0, y1) for z in (z0, z1)]
    for f in ((0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)):
        bm.faces.new([v[i] for i in f])


def add_extruded_profile(bm, profile, x0, x1):
    """Extrudes a closed (y, z) profile along X."""
    a = [bm.verts.new((x0, y, z)) for y, z in profile]
    b = [bm.verts.new((x1, y, z)) for y, z in profile]
    bm.faces.new(a)
    bm.faces.new(list(reversed(b)))
    n = len(profile)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((a[i], a[j], b[j], b[i]))


def side_wall_profile(back, front, height):
    """Full height at the back, an eased swoop down to FRONT_HEIGHT, then a rounded front corner."""
    depth = back + front
    swoop_start = back - depth * 0.45
    swoop_end = swoop_start - depth * 0.25
    pts = [(back, 0.0), (back, height)]
    steps = 16
    for i in range(steps + 1):
        t = i / steps
        y = swoop_start + (swoop_end - swoop_start) * t
        z = FRONT_HEIGHT + (height - FRONT_HEIGHT) * (0.5 + 0.5 * math.cos(math.pi * t))
        pts.append((y, z))
    cy, cz = -front + FRONT_RADIUS, FRONT_HEIGHT - FRONT_RADIUS
    for i in range(1, 9):
        a = math.pi / 2 * i / 8
        pts.append((cy - math.sin(a) * FRONT_RADIUS, cz + math.cos(a) * FRONT_RADIUS))
    pts.append((-front, 0.0))
    return pts


def apply_modifiers(ob):
    bpy.context.view_layer.objects.active = ob
    for o in bpy.context.selected_objects: o.select_set(False)
    ob.select_set(True)
    for mod in list(ob.modifiers):
        bpy.ops.object.modifier_apply(modifier=mod.name)


def bevel(ob, width=BEVEL, segments=3):
    mod = ob.modifiers.new("Bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    mod.angle_limit = math.radians(40)
    apply_modifiers(ob)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
    # large faces keep their own normal, otherwise the bevel bends the shading across whole walls
    mod = ob.modifiers.new("WeightedNormal", "WEIGHTED_NORMAL")
    mod.mode = "FACE_AREA"
    mod.weight = 100
    mod.keep_sharp = True
    apply_modifiers(ob)


def text_object(name, body, font, size, mat, offset=0.0):
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = body
    if font: cu.font = font
    cu.size = size
    cu.extrude = TEXT_DEPTH / 2
    cu.offset = offset
    cu.resolution_u = 4
    ob = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(ob)
    ob.data.materials.append(mat)
    bpy.context.view_layer.objects.active = ob
    for o in bpy.context.selected_objects: o.select_set(False)
    ob.select_set(True)
    bpy.ops.object.convert(target="MESH")
    return bpy.context.view_layer.objects.active


def slug(title):
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")


def build(room, fonts, mats):
    w, back, front, height = room["width"], room["back"], room["front"], room["height"]
    accent = mats["accents"][room["accent"]]
    hw = w / 2

    bm = bmesh.new()
    add_box(bm, -hw, hw, -front, back, FLOOR_BOTTOM, FLOOR_TOP)
    floor = mesh_object("Floor", bm, [mats["floor"]])
    bevel(floor, 0.01, 2)

    bm = bmesh.new()
    add_box(bm, -hw, hw, back - WALL, back, FLOOR_TOP, height)
    profile = side_wall_profile(back, front, height)
    add_extruded_profile(bm, profile, -hw, -hw + WALL)
    add_extruded_profile(bm, profile, hw - WALL, hw)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    walls = mesh_object("Walls", bm, [mats["wall"], accent])
    bevel(walls)
    # accent caps: the front-facing end faces of the side walls
    for p in walls.data.polygons:
        if p.normal.y < -0.95 and p.center.y < -front + 0.05: p.material_index = 1
    # Room_Wall gradient: V = height above the floor (0 floor, 1 top of the back wall),
    # U runs along the wall and tiles, scaled so the dithered 128x512 texels stay square
    uv = walls.data.uv_layers.new(name="UVMap")
    u_scale = GRADIENT_ASPECT / height
    for p in walls.data.polygons:
        along = 1 if abs(p.normal.x) > abs(p.normal.y) else 0
        for li in p.loop_indices:
            co = walls.data.vertices[walls.data.loops[li].vertex_index].co
            uv.data[li].uv = (co[along] * u_scale, min(max(co.z / height, 0.0), 1.0))

    bm = bmesh.new()
    add_box(bm, -hw + WALL + 0.08, hw - WALL - 0.08, -front + 0.08, -front + 0.12, FLOOR_TOP - 0.002, FLOOR_TOP + 0.006)
    accents = mesh_object("Accent", bm, [accent])

    # label: large room number in the accent color, title below
    # optional labelInset / labelWidth in rooms.json keep the label clear of tall exhibits
    text_x = -hw + WALL + room.get("labelInset", 0.38)
    wall_face = back - WALL - TEXT_DEPTH / 2 - 0.001
    # no outline offset: it punches holes into glyph counters (0, 6, B) in every font tried
    number = text_object("Number", "%02d" % (room["index"] + 1), fonts["number"], 0.5, accent)
    title = text_object("Title", room["title"].upper(), fonts["title"], 0.22, mats["label"])
    max_title = room.get("labelWidth", w - (text_x + hw) - 0.4)
    if title.dimensions.x > max_title:
        s = max_title / title.dimensions.x
        title.scale = (s, s, s)
    for ob, z in ((number, height - 0.72), (title, height - 1.02)):
        ob.rotation_euler = (math.radians(90), 0, 0)
        ob.location = (text_x, wall_face, z)
    for o in bpy.context.selected_objects: o.select_set(False)
    number.select_set(True); title.select_set(True)
    bpy.context.view_layer.objects.active = title
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bpy.ops.object.join()
    label = bpy.context.view_layer.objects.active
    label.name = "Label"
    bpy.ops.object.shade_flat()
    # the text conversion adds a UV map; only the walls need texcoords
    while label.data.uv_layers: label.data.uv_layers.remove(label.data.uv_layers[0])

    path = os.path.join(out_dir, "Room_%02d_%s.glb" % (room["index"] + 1, slug(room["title"])))
    for o in bpy.context.selected_objects: o.select_set(False)
    for o in (floor, walls, accents, label): o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_apply=True,
                              export_yup=True, export_texcoords=True, export_materials="EXPORT")
    return path


def main():
    os.makedirs(out_dir, exist_ok=True)
    fonts_dir = os.path.join(os.path.dirname(bpy.app.binary_path), "%d.%d" % bpy.app.version[:2], "datafiles", "fonts")
    for room in rooms:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        # titles use the built-in font; the bundled Inter is a variable font whose overlapping contours fill with holes
        fonts = {"title": None, "number": bpy.data.fonts.load(os.path.join(fonts_dir, "DejaVuSansMono.woff2"))}
        mats = {
            "floor": material("Room_Floor", (0.80, 0.80, 0.79), 0.6),
            "wall": material("Room_Wall", (0.95, 0.94, 0.92), 0.85),
            "label": material("Room_Label", (0.16, 0.17, 0.19), 0.6),
            "accents": [material("Room_Accent_%d" % i, c, 0.5, c) for i, c in enumerate(ACCENTS)],
        }
        print("built", build(room, fonts, mats))


main()
