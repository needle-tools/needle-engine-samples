# Shadow catcher

In AR applications it's often desired to ground objects into the real world. Shadows are an effective way of doing so. To cast shadows onto the "real world", Shadow Catchers are used - invisible meshes that can still receive shadows.

Depending on your application, different types of Shadow Catchers are available. "Additive" mode works great with spot lights, while "Masked" mode is suitable for directional lights. You can also layer multiple shadow catchers over each other to achieve different effects.  

## Usage

Add the `ShadowCatcher` component to an empty GameObject to your scene and click the `Assign ShadowCatcher Material` button in the inspector.