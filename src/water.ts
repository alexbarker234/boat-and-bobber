import * as THREE from "three";
import fragmentShader from "./shaders/water/waterFragmentShader.glsl?raw";
import vertexShader from "./shaders/water/waterVertexShader.glsl?raw";

// Adapted from https://godotshaders.com/shader/wind-waker-water-no-textures-needed/

export class Water extends THREE.Mesh {
  private uniforms: { [key: string]: THREE.IUniform };
  public material: THREE.ShaderMaterial;

  constructor() {
    const planeSize = 100;
    const geometry = new THREE.PlaneGeometry(planeSize, planeSize, 64, 64);

    const uniforms = {
      time: { value: 0.0 },
      WATER_COL: { value: new THREE.Vector4(0.04, 0.38, 0.88, 1.0) },
      WATER2_COL: { value: new THREE.Vector4(0.04, 0.35, 0.78, 1.0) },
      FOAM_COL: { value: new THREE.Vector4(0.8125, 0.9609, 0.9648, 1.0) },
      distortion_speed: { value: 2.0 },
      tile: { value: new THREE.Vector2(50.0, 50.0) },
      height: { value: 2.0 },
      wave_size: { value: new THREE.Vector2(2.0, 2.0) },
      wave_speed: { value: 1.5 },
      fogColor: { value: new THREE.Color(0xb0eaf2) },
      fogNear: { value: 1.0 },
      fogFar: { value: 30.0 }
    };

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.DoubleSide,
      fog: true
    });

    super(geometry, material);

    this.uniforms = uniforms;
    this.material = material;
    this.rotation.x = -Math.PI / 2; // Make it horizontal

    this.startAnimation();
  }

  private startAnimation() {
    const animate = () => {
      // Convert to seconds
      this.uniforms.time.value = performance.now() * 0.001;
      requestAnimationFrame(animate);
    };
    animate();
  }
}
