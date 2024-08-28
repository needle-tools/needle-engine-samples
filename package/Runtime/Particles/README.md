# Particles

Using **Particle Systems** you can create powerful and beautiful visual effects.    
You can use particles to create a virtual firework, smoke, fire, atmospheric dust, car trails and much more.  
Particles are batched together which allows for fast and performant rendering - even on low-end devices!  

Explore the scenes listed below to see various usecases:

### **Particle Overview** - [Live Sample](https://engine.needle.tools/samples/particles)

Showcase of individual modifiers of the particle system.

### **Particle on Collision** - [Live Sample](https://engine.needle.tools/samples/particles-on-collision/)

Example of how to emit particles from code and use Needle Engine collision events.


### **Particles on Click** - [Live Sample](https://engine.needle.tools/samples/particle-bursts/)

Click in the scene to trigger a particle explosion!

---

## Creating a new particle system in Unity

1. Create a new game object and add the ParticleSystem component.
2. Create a material by right-clicking in the Project window and selecting `Create/Material`. 
3. Choose a supported shader. (We recommend `UnityGLTF/UnlitGraph`)
4. Enable transparency and set the color of your material to white with full opacity. Choose a texture for your particles. If you don't have one, you can use the `default-particle` texture. 
5. Assign the material to the particle system in the **Renderer** tab to the Material property.
6. Save the scene to see your new particle system in action.
