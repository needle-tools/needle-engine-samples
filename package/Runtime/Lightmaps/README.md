# Multiple lightmaps

Bake multiple lightmaps for a single scene in Unity and switch between them at runtime on the web — turn day into night, flip a lamp on and off, or light a room in several moods without recomputing anything in the browser.

Each lightmap variant stores its own baked textures, active objects, and emissive materials. At runtime you cycle through variants or jump to a specific one, so the change is instant and costs nothing to render.

- Bake several lighting setups from one scene, exported ready for the web
- Auto-cycle, ping-pong, or switch to a chosen lightmap on demand
- Drive switching from a UI button, script, or timed loop

**Learn more**
- [Light component](https://engine.needle.tools/docs/api/Light)
- [NeedleMenu component](https://engine.needle.tools/docs/api/NeedleMenu)
- [Creating and using components](https://engine.needle.tools/docs/scripting.html)
