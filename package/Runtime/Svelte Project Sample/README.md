# Svelte Integration

This sample demonstrates how to integrate the Svelte HTML framework and a Needle scene.

## Package setup

The package.json file contains the additional needed dependencies to use Svelte together with vite and Typescript.

## Interaction between Svelte and Needle

### Needle Engine as Svelte component

The sample contains a simple wrapper for `<needle-engine>` so that it can be used as Svelte component. This allows passing properties into Needle Engine, setting up events in both directions, and generally referencing Needle Engine and the scene context throughout your web app. 

### Writable Stores

Writable stores can be passed between svelte and Needle Engine behaviours. This way, events can be easily subscribed/unsubscribed in both directions. 

### Event Dispatcher

The event dispatcher is a simple class that can be used to send events from Needle to Svelte. `StateManager.ts` demonstrates how to dispatch an event on click and receive it in Svelte.

## Learn more

For more information, see the [Svelte docs](https://svelte.dev/docs/introduction).