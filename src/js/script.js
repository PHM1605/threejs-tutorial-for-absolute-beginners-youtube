import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";
// Parcel resolves these to the bundled asset URLs. A plain
// `import stars from "../img/stars.jpg"` currently returns an empty module
// with this Parcel version, so use new URL(..., import.meta.url) instead.
const nebula = new URL("../img/nebula.jpg", import.meta.url).href;
const stars = new URL("../img/stars.jpg", import.meta.url).href;

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
const monkeyUrl = new URL("../assets/monkey.glb", import.meta.url);


const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

// append something into <body>
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45, // FOV; usually from 40-80
  window.innerWidth / window.innerHeight, // Aspect Ration; width/height
  0.1, 1000, // near and far Clipping Planes
);

const orbit = new OrbitControls(camera, renderer.domElement);

const axesHelper = new THREE.AxesHelper(3);
scene.add(axesHelper);

camera.position.set(-10, 30, 30)
orbit.update();

const boxGeometry = new THREE.BoxGeometry();
const boxMatertial = new THREE.MeshBasicMaterial({color: 0x00FF00})
const box = new THREE.Mesh(boxGeometry, boxMatertial)
scene.add(box);

const planeGeometry = new THREE.PlaneGeometry(30, 30);
const planeMaterial = new THREE.MeshStandardMaterial({
  color: 0xFFFFFF,
  side: THREE.DoubleSide,
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(plane)
plane.rotation.x = -0.5*Math.PI;
plane.receiveShadow = true;

const gridHelper = new THREE.GridHelper(30);
scene.add(gridHelper)

const sphereGeometry = new THREE.SphereGeometry(
  4, // radius
  50, 50, // number of width & height segments
);
// MeshBasicMaterial: do not need Light to show up
// MeshStandardMaterial: need Light 
const sphereMaterial = new THREE.MeshStandardMaterial({
  color: 0x0000FF,
  wireframe: false}
);
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere)
sphere.position.set(-10, 10, 0)
sphere.castShadow = true;

const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

// const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.5)
// scene.add(directionalLight)
// directionalLight.position.set(-30, 50, 0)
// directionalLight.castShadow = true;
// directionalLight.shadow.camera.bottom = -12

// const dLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
// scene.add(dLightHelper)
// const dLightShadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
// scene.add(dLightShadowHelper)

const spotLight = new THREE.SpotLight(0xFFFFFF, 10000);
scene.add(spotLight);
spotLight.position.set(-50, 50, 0);
spotLight.castShadow = true;
spotLight.angle = 0.3

const sLightHelper = new THREE.SpotLightHelper(spotLight);
scene.add(sLightHelper)

// scene.fog = new THREE.Fog(0xFFFFFF, 0, 200);
scene.fog = new THREE.FogExp2(0xFFFFFF, 0.01)

// renderer.setClearColor(0xFFEA00)
const textureLoader = new THREE.TextureLoader();
// scene.background = textureLoader.load(stars);
const cubeTextureLoader = new THREE.CubeTextureLoader();
scene.background = cubeTextureLoader.load([
  nebula,
  nebula,
  stars,
  stars,
  stars,
  stars,
])

const box2Geometry = new THREE.BoxGeometry(4, 4, 4);
// const box2Material = new THREE.MeshBasicMaterial({
//   // color: 0x00FF00
//   // map: textureLoader.load(nebula)
// });
const box2MultiMaterial = [
  new THREE.MeshBasicMaterial({map: textureLoader.load(stars)}),
  new THREE.MeshBasicMaterial({map: textureLoader.load(stars)}),
  new THREE.MeshBasicMaterial({map: textureLoader.load(nebula)}),
  new THREE.MeshBasicMaterial({map: textureLoader.load(stars)}),
  new THREE.MeshBasicMaterial({map: textureLoader.load(nebula)}),
  new THREE.MeshBasicMaterial({map: textureLoader.load(stars)})
]
const box2 = new THREE.Mesh(box2Geometry, box2MultiMaterial);
scene.add(box2);
box2.position.set(0, 15, 10)
// box2.material.map = textureLoader.load(nebula);

const plane2Geometry = new THREE.PlaneGeometry(10, 10, 10, 10);
const plane2Material = new THREE.MeshBasicMaterial({
  color: 0xFFFFFF,
  wireframe: true,
})

const plane2 = new THREE.Mesh(plane2Geometry, plane2Material);
scene.add(plane2);
plane2.position.set(10, 10, 15);

const gui = new dat.GUI();
const options = {
  sphereColor: "#ffea00",
  wireframe: false,
  speed: 0.01,
  angle: 0.2,
  penumbra: 0,
  intensity: 10000,
}; 
gui.addColor(options, "sphereColor").onChange(function(e) {
  sphere.material.color.set(e);
})
gui.add(options, "wireframe").onChange(function(e) {
  sphere.material.wireframe = e; 
})
gui.add(options, "speed", 0, 0.1); 
gui.add(options, "angle", 0, 1);
gui.add(options, "penumbra", 0, 1);
gui.add(options, "intensity", 0, 30000);

let step = 0

// catch position of the Cursor (normalized [-1..1])
const mousePosition = new THREE.Vector2();
window.addEventListener("mousemove", function(e) {
  // e.clientX or e.clientY are range [0..1920] and [0..952]
  // screen Y grows downward, but NDC Y grows upward, so flip the sign
  mousePosition.x = (e.clientX / window.innerWidth)*2-1;
  mousePosition.y = -(e.clientY / window.innerHeight)*2+1;
})

const rayCaster = new THREE.Raycaster();
const sphereId = sphere.id; // to do something when we hover on the Sphere
box2.name = 'theBox';

// This sphere will use Vertex Shader and Fragment Shader
const sphere2Geometry = new THREE.SphereGeometry(4);

// We can type explicitly
const vShader = `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fShader = `
  void main() {
    gl_FragColor = vec4(1, 0.1, 0.3, 1.0);
  }
`
const sphere2Material = new THREE.ShaderMaterial({
  vertexShader: vShader,
  fragmentShader: fShader,
});
const sphere2 = new THREE.Mesh(sphere2Geometry, sphere2Material);
scene.add(sphere2);
sphere2.position.set(-5, 10, 10);

// Monkey head
const assetLoader = new GLTFLoader();
assetLoader.load(monkeyUrl.href, function(gltf) {
    const model = gltf.scene;
    scene.add(model);
    model.position.set(-12, 4, 10);
  }, undefined, function(error) {
    console.error(error);
  }
)

function animate(time) {
  box.rotation.x = time / 1000;
  box.rotation.y = time/1000;
  
  step += options.speed;
  sphere.position.y = 10*Math.abs(Math.sin(step));
  
  spotLight.angle = options.angle;
  spotLight.penumbra = options.penumbra;
  spotLight.intensity = options.intensity;
  sLightHelper.update();
  
  // set 2 ends of the Ray
  // - 1 end is camera
  // - 1 end is Mouse Cursor
  rayCaster.setFromCamera(mousePosition, camera);
  // which Objects intersect with the Ray
  const intersects = rayCaster.intersectObjects(scene.children);
  // console.log(intersects)
  // if we hover on the Sphere
  for (let i=0; i<intersects.length; i++) {
    if (intersects[i].object.id == sphereId) {
      intersects[i].object.material.color.set(0xFF0000);
    }
    // if we hover the Box
    if (intersects[i].object.name === "theBox") {
      intersects[i].object.rotation.x = time/1000;
      intersects[i].object.rotation.y = time/1000;
    }
  }
  
  // plane2.geometry.attributes.position.array: [x,y,z,x,y,z,...,x,y,z] with each [x,y,z] is of a Vertex
  // we change here the 1st Vertex (Vectex 0)
  plane2.geometry.attributes.position.array[0] = 10 * Math.random();
  plane2.geometry.attributes.position.array[1] = 10 * Math.random();
  plane2.geometry.attributes.position.array[2] = 10 * Math.random();
  // we change here the Last Vertex (Z value changing only)
  const lastPointZ = plane2.geometry.attributes.position.array.length - 1;
  plane2.geometry.attributes.position.array[lastPointZ] = 10 * Math.random();
  // NOTE: don't forget this for animation to work
  plane2.geometry.attributes.position.needsUpdate = true;
  
  
  
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate)

// fix bug when open Developer tools windows
window.addEventListener("resize", function() {
  // update Camera
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  // update Renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
})