# Realtime Clock

Build a live 3D clock that shows the current time in the browser, and learn how custom TypeScript scripting works in Needle Engine along the way. This realtime clock is a compact, practical starting point for any time-based visualization, dashboard, or scheduling interface.

The Needle clock rotates its hour, minute, and second hands every frame from the real system time. It works by reading `context.time` inside a component's `update()` lifecycle method and mapping the current hours, minutes, and seconds onto each hand's rotation.

**Learn more**
- [Create Components](https://engine.needle.tools/docs/how-to-guides/scripting/create-components)
- [OrbitControls](https://engine.needle.tools/docs/api/OrbitControls)
