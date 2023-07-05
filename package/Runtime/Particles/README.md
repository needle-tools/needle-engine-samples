# Particles

## About

**Particle system** is a system that animates small pieces of geometry by a predefined set of rules such as color over time which can animate the color of the particle. The particles are rendered as 3D **quads** or can be set to render more complex meshes. 

## Performance

Particle System is, in both Unity and Needle, CPU bound. Be careful with the number of particles you have. We generally recommend keeping the number of particles below 1000 on the high-end system. On mobile devices and mobile VR you should keep it under 100. Always test for performance.

Another important aspect to keep in mind is the overdraw of transparent objects. Transparency is very expensive mainly if you stack multiple objects on each other. You can reduce this cost by using fewer particles. Or if applicable, set your material to opaque and enable alpha clipping. 

---

## Scenes

### **Overview**
Scene name: `Particles`

Showcase of individual modifiers of the particle system.

### **Impact**
Scene name: `ParticlesOnCollision`

Example of how to control the particle system from code in reaction to a collision.


### **On click**
Scene name: `Particles Burst on click`

Example of how to control the particle system from code in reaction to click.

---

## Particle System

Unity's Particle System (called Shuriken) is quite complex and is full of features. Please bare in mind that Needle doesn't support all of them, although the majority of the common ones are supported or their support is planned.

We recommended watching this [beginner friendly introduction](https://learn.unity.com/tutorial/introduction-to-particle-systems#6025fdd9edbc2a112d4f0133).


Please let us know when a feature you need isn't supported.

## Creating your own particle system from scratch

1. Create a new game object and add the ParticleSystem component.
2. Create a material by right-clicking in the Project window and selecting `Create/Material`. 
3. Choose a supported shader. (Recommended is `UnityGLTF/UnlitGraph`)
4. Enable transparency and set the color of your material to white with full opacity. Choose a texture for your particles. If you don't have one, you can use the `default-particle` texture. 
5. Assign the material to the particle system in the **Renderer** tab to the Material property.
6. _Double-check that everything works by hitting play._