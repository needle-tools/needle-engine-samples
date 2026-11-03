# Builds tree_small_02_web.glb, a web-weight copy of the Poly Haven tree_small_02.
# blender -b --factory-startup -P decimate_tree.py -- ../tree_small_02.gltf ../tree_small_02_web.glb [leaf ratio]
#
# The original has 1.9M leaf triangles. Pointer raycasts wait for a BVH of the shown geometry, and
# building one for that many triangles takes seconds - presses on the tree fall through to the
# camera until it is done.

import bpy, math, sys

args = sys.argv[sys.argv.index("--") + 1:]
src, out = args[0], args[1]
LEAF_RATIO = float(args[2]) if len(args) > 2 else 0.15

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
ob = [o for o in bpy.context.scene.objects if o.type == "MESH"][0]
bpy.context.view_layer.objects.active = ob
ob.select_set(True)


def tris():
    return sum(len(p.vertices) - 2 for p in ob.data.polygons)


def decimate(part, setup):
    """Decimates the faces of one material only, through a vertex group."""
    index = next(i for i, m in enumerate(ob.data.materials) if part in m.name)
    vg = ob.vertex_groups.new(name=part)
    vg.add(list({v for p in ob.data.polygons if p.material_index == index for v in p.vertices}), 1.0, "REPLACE")
    mod = ob.modifiers.new(part, "DECIMATE")
    mod.vertex_group = vg.name
    setup(mod)
    bpy.ops.object.modifier_apply(modifier=mod.name)
    # applying can rebuild the group list, so look it up again
    if ob.vertex_groups.get(part): ob.vertex_groups.remove(ob.vertex_groups[part])
    print(part, "->", tris(), "tris")


print("before", tris(), "tris")


def leaves(mod):
    # below about 0.1 collapse starts deleting whole leaves rather than simplifying them;
    # planar dissolve keeps every leaf but only halves the count, the leaves are curved
    mod.decimate_type = "COLLAPSE"
    mod.ratio = LEAF_RATIO


def branches(mod):
    mod.decimate_type = "COLLAPSE"
    mod.ratio = 0.5


decimate("leaves", leaves)
decimate("branches", branches)

bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.delete_loose()
bpy.ops.mesh.quads_convert_to_tris()
bpy.ops.object.mode_set(mode="OBJECT")
print("after", len(ob.data.vertices), "verts", tris(), "tris")
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", use_selection=True, export_apply=True, export_yup=True, export_image_format="NONE")
print("wrote", out)
