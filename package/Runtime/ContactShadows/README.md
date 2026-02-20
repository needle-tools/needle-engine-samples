# Contact Shadows

Add soft, realistic contact shadows that ground floating objects in your scene - perfect for product showcases, character presentations, or any scenario where you need beautiful shadows without heavy performance costs.

## Use Cases

Create professional product visualizations with soft shadows, ground levitating objects in AR experiences, add visual polish to character presentations, or enhance the realism of any scene with performant shadow effects.

## What This Sample Shows

The built-in **ContactShadows** component creates soft shadows on a flat surface by detecting objects above it. The shadows automatically:
- Adjust intensity based on object distance from the surface
- Blend smoothly for a natural look
- Update in real-time as objects move
- Perform efficiently without heavy raytracing

Simply add the component to a plane or floor object, and it will create soft shadows for everything above it.

## Technical Note

Contact shadows are rendered using a lightweight technique that's much faster than traditional shadow mapping, making them ideal for web and mobile experiences.