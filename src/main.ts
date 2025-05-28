import { AmbientLight, BoxGeometry, Color, DirectionalLight, DoubleSide, Fog, Mesh, MeshStandardMaterial, PerspectiveCamera, Scene, TextureLoader, Vector2, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import PixelatePass from "./Passes/pixelatePass";
import RenderPixelatedPass from "./Passes/renderPixelatePass";
import { Water } from "./water";

let screenResolution = new Vector2(window.innerWidth, window.innerHeight);
let renderResolution = screenResolution.clone().divideScalar(6);

async function init() {
    const scene = new Scene();
    scene.background = new Color(0xb0eaf2);
    scene.fog = new Fog(0xb0eaf2, 1, 30);
    const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Create the cube
    const geometry = new BoxGeometry(0.5, 0.5, 0.5);
    const materials = [
        new MeshStandardMaterial({ color: 0xff0000, side: DoubleSide }), // right - red
        new MeshStandardMaterial({ color: 0x00ff00, side: DoubleSide }), // left - green
        new MeshStandardMaterial({ color: 0x0000ff, side: DoubleSide }), // top - blue
        new MeshStandardMaterial({ color: 0xffff00, side: DoubleSide }), // bottom - yellow
        new MeshStandardMaterial({ color: 0xff00ff, side: DoubleSide }), // front - magenta
        new MeshStandardMaterial({ color: 0x00ffff, side: DoubleSide }), // back - cyan
    ];
    const cube = new Mesh(geometry, materials);
    cube.position.set(0, 2, 0); // Position the cube above the water
    scene.add(cube);

    // Lights
    scene.add(new AmbientLight(0xffffff, 2));
    {
        const directionalLight = new DirectionalLight(0xfffc9c, 0.5);
        directionalLight.position.set(100, 100, 100);
        directionalLight.castShadow = true;
        // directionalLight.shadow.radius = 0
        directionalLight.shadow.mapSize.set(2048, 2048);
        scene.add(directionalLight);
    }
    {
        const directionalLight = new DirectionalLight(0x00fffc, 0.9);
        directionalLight.position.set(1, 0.25, 0);
        scene.add(directionalLight);
    }

    // Create the water plane
    // const planeGeometry = new PlaneGeometry(10, 10);
    // const planeMaterial = new MeshStandardMaterial({ color: new Color(0x87ceeb), side: DoubleSide });
    // const waterPlane = new Mesh(planeGeometry, planeMaterial);
    // waterPlane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    // scene.add(waterPlane);
    const textureLoader = new TextureLoader();
    const heightMap = textureLoader.loadAsync("./assets/heightMap.png");
    const water = new Water(await heightMap);
    scene.add(water);

    // Load and add Benchy
    const loader = new STLLoader();
    loader.load("./assets/Benchy.stl", (geometry) => {
        const material = new MeshStandardMaterial({ color: 0x6e361a });
        const benchy = new Mesh(geometry, material);
        benchy.scale.set(0.02, 0.02, 0.02);
        benchy.position.set(0, 0.5, 0);
        benchy.rotation.x = Math.PI * -0.5;
        scene.add(benchy);
    });

    camera.position.set(0, 3, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Setup post-processing
    const composer = new EffectComposer(renderer);
    // composer.addPass( new RenderPass( scene, camera ) )
    composer.addPass(new RenderPixelatedPass(renderResolution, scene, camera));
    // let bloomPass = new UnrealBloomPass(screenResolution, 0.4, 0.1, 0.9);
    // composer.addPass(bloomPass);
    composer.addPass(new PixelatePass(new Vector2(512, 512)));

    // const pixelatePass = new PixelatePass(new Vector2(256, 256));
    // composer.addPass(pixelatePass);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.update();

    // Handle window resize
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);

        // Update screen resolution
        screenResolution.set(window.innerWidth, window.innerHeight);
        renderResolution = screenResolution.clone().divideScalar(6);
    }

    window.addEventListener("resize", onWindowResize);

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);

        // Rotate the cube
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;

        composer.render();
    }

    animate();
}

init();
