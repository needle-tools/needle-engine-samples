# Environment Parameters in Custom Three.js Shaders

This guide explains how to assign and update environment parameters in your custom terrain shader material.

## 1. Basic Environment Setup

### Initial Setup
```typescript
import { createTerrainShaderMaterial, setupEnvironmentMap } from './CreateTerrainMaterial';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// Load HDR environment map
const hdrLoader = new RGBELoader();
const hdrTexture = await hdrLoader.loadAsync('/path/to/environment.hdr');
const envMap = setupEnvironmentMap(renderer, scene, hdrTexture);

// Create material with environment parameters
const material = await createTerrainShaderMaterial({
  // ... terrain options
  envMap: envMap,
  envMapIntensity: 1.0,
  envMapRotation: new THREE.Euler(0, Math.PI * 0.25, 0),
  roughness: 0.7,
  metalness: 0.1,
  emissive: [0.01, 0.01, 0.02]
});
```

## 2. Runtime Updates

### Manual Updates
```typescript
import { updateMaterialEnvironment } from './CreateTerrainMaterial';

// Update environment map
updateMaterialEnvironment(material, newEnvMap, 1.5);

// Update only intensity
updateMaterialEnvironment(material, undefined, 2.0);

// Update only rotation
updateMaterialEnvironment(material, undefined, undefined, new THREE.Euler(0, Math.PI, 0));
```

### Using the Built-in Method
```typescript
// Using the material's built-in method
material.updateEnvironment(newEnvMap, 1.5, new THREE.Euler(0, Math.PI * 0.5, 0));
```

## 3. Animation System

### Basic Animation
```typescript
import { EnvironmentAnimator } from './CreateTerrainMaterial';

const animator = new EnvironmentAnimator(material);

// In your render loop
function animate() {
  const deltaTime = clock.getDelta();
  animator.update(deltaTime); // Applies default oscillating effects
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

### Custom Animation
```typescript
const animator = new EnvironmentAnimator(material);

animator.setCustomAnimation((time, materials) => {
  materials.forEach(mat => {
    // Custom day/night cycle
    const dayProgress = (Math.sin(time * 0.1) + 1) * 0.5;
    const intensity = 0.2 + dayProgress * 1.8;
    
    // Rotate based on time of day
    const rotation = new THREE.Euler(0, dayProgress * Math.PI * 2, 0);
    
    updateMaterialEnvironment(mat, undefined, intensity, rotation);
  });
});

// In render loop
animator.updateWithCustom(deltaTime);
```

## 4. Environment Map Types

### HDR Equirectangular
```typescript
const hdrLoader = new RGBELoader();
const hdrTexture = await hdrLoader.loadAsync('/path/to/environment.hdr');
const envMap = setupEnvironmentMap(renderer, scene, hdrTexture);
```

### Cube Maps
```typescript
const cubeLoader = new THREE.CubeTextureLoader();
const cubeTexture = cubeLoader.load([
  'px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg'
]);
const envMap = setupEnvironmentMap(renderer, scene, cubeTexture);
```

### Dynamic Cube Maps
```typescript
// Create a cube camera for dynamic reflections
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
const cubeCamera = new THREE.CubeCamera(1, 1000, cubeRenderTarget);

// Update in render loop
cubeCamera.position.copy(mesh.position);
cubeCamera.update(renderer, scene);
updateMaterialEnvironment(material, cubeRenderTarget.texture);
```

## 5. Shader Uniform Access

### Direct Uniform Updates
```typescript
// Access uniforms directly for maximum control
if (material.uniforms) {
  material.uniforms.envMapIntensity.value = 2.0;
  material.uniforms.roughness.value = 0.5;
  material.uniforms.metalness.value = 0.8;
  material.uniforms.emissive.value = new THREE.Color(0.1, 0.05, 0.0);
}
```

### Batch Updates
```typescript
// Update multiple uniforms at once
Object.assign(material.uniforms, {
  envMapIntensity: { value: 1.5 },
  roughness: { value: 0.6 },
  metalness: { value: 0.2 }
});
material.needsUpdate = true;
```

## 6. Performance Considerations

### Environment Map Resolution
- Use appropriate resolution for your needs (512x512 to 2048x2048)
- Consider using multiple LOD levels for distance-based quality

### Update Frequency
- Avoid updating uniforms every frame unless necessary
- Use animation systems for smooth transitions
- Consider using Three.js's built-in uniform animation

### Memory Management
```typescript
// Dispose of old environment maps when switching
if (oldEnvMap) {
  oldEnvMap.dispose();
}
```

## 7. Integration with Needle Engine

Since you're using Needle Engine, you can expose these parameters in Unity:

```typescript
// In your component class
export class TerrainEnvironment extends Behaviour {
  @serializable()
  public envMapIntensity: number = 1.0;
  
  @serializable()
  public roughness: number = 0.8;
  
  @serializable()
  public metalness: number = 0.0;
  
  private material?: CustomShaderMaterial;
  
  start() {
    // Get material from mesh
    const meshRenderer = this.gameObject.getComponent(MeshRenderer);
    if (meshRenderer) {
      this.material = meshRenderer.material as CustomShaderMaterial;
    }
  }
  
  update() {
    if (this.material) {
      updateMaterialEnvironment(
        this.material, 
        undefined, 
        this.envMapIntensity
      );
      
      // Update other parameters
      if (this.material.uniforms) {
        this.material.uniforms.roughness.value = this.roughness;
        this.material.uniforms.metalness.value = this.metalness;
      }
    }
  }
}
```

This comprehensive approach gives you full control over environment parameters in your custom Three.js shader while maintaining good performance and ease of use.