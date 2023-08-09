This is a SvelteKit project adding the needle-engine web component.

# Needle Engine

- [`needle.config.json`](./needle.config.json)  
  Added the `baseUrl` config to `assets` to change codegen (`src/generated/gen`) to point to the next.js local server relative url
- [`svelte.config.js`](./svelte.config.js)  
  Defines `paths.base` for deployment.  
  Uses `adapter-static` currently to produce static pages that can be uploaded anywhere. Adjust it for your needs.