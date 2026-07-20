# Svelte Integration

Add an interactive 3D scene to a Svelte app with Needle Engine. The sample wraps `<needle-engine>` as a Svelte component, so you can pass props into the engine, wire events in both directions, and reference the scene context anywhere in your app.

Two patterns show how the 2D and 3D sides talk to each other: **writable stores** shared between Svelte and Needle behaviours (subscribe and unsubscribe from either side), and an **event dispatcher** for sending events from Needle to Svelte — see `StateManager.ts` for a click-to-dispatch example. The project is set up for Svelte with Vite and TypeScript.

**Learn more**
- [Using Needle Engine with Svelte and SvelteKit](https://engine.needle.tools/docs/how-to-guides/web-integration/sveltekit) — how-to guide
- [Svelte documentation](https://svelte.dev/docs/introduction)
