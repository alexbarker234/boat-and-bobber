import { BoxGeometry, DoubleSide, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, Vector2, WebGLRenderer } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import PixelatePass from "./Passes/pixelatePass";

const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const geometry = new BoxGeometry(1, 1, 1);
const materials = [
    new MeshBasicMaterial({ color: 0xff0000, side: DoubleSide }), // right - red
    new MeshBasicMaterial({ color: 0x00ff00, side: DoubleSide }), // left - green
    new MeshBasicMaterial({ color: 0x0000ff, side: DoubleSide }), // top - blue
    new MeshBasicMaterial({ color: 0xffff00, side: DoubleSide }), // bottom - yellow
    new MeshBasicMaterial({ color: 0xff00ff, side: DoubleSide }), // front - magenta
    new MeshBasicMaterial({ color: 0x00ffff, side: DoubleSide }), // back - cyan
];
const cube = new Mesh(geometry, materials);
scene.add(cube);

camera.position.z = 5;

const renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Setup post-processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const pixelatePass = new PixelatePass(new Vector2(256, 256));
composer.addPass(pixelatePass);

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate the cube
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    composer.render();
}

animate();
