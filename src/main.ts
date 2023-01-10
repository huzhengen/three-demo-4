import * as THREE from 'three';
import { AnimationMixer, AnimationAction } from 'three';
import './style.css'
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

// 创建场景、相机和渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 50);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.set(0, 3, 25);

// 添加背景色及灯光
scene.background = new THREE.Color(0.2, 0.2, 0.2);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

const directionLight = new THREE.DirectionalLight(0xffffff, 0.2);
scene.add(directionLight);

directionLight.lookAt(new THREE.Vector3(0, 0, 0));

// 设置阴影
directionLight.castShadow = true;

directionLight.shadow.mapSize.width = 2048;
directionLight.shadow.mapSize.height = 2048;

const shadowDistance = 20;
directionLight.shadow.camera.near = 0.1;
directionLight.shadow.camera.far = 40;
directionLight.shadow.camera.left = -shadowDistance;
directionLight.shadow.camera.right = shadowDistance;
directionLight.shadow.camera.top = shadowDistance;
directionLight.shadow.camera.bottom = -shadowDistance;
directionLight.shadow.bias = -0.001;

// 添加展馆
let mixer: AnimationMixer;
new GLTFLoader().load('../resources/models/zhanguan.glb', (gltf) => {

  scene.add(gltf.scene);

  gltf.scene.traverse((child) => {

    child.castShadow = true;
    child.receiveShadow = true;

    if (child.name === '2023') {
      const video = document.createElement('video');
      video.src = "./resources/yanhua.mp4";
      video.muted = true;
      video.autoplay = true;
      video.loop = true;
      video.play();
      const videoTexture = new THREE.VideoTexture(video);
      const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });
      (child as THREE.Mesh).material = videoMaterial;
    }

    if (child.name === '大屏幕01' || child.name === '大屏幕02' || child.name === '操作台屏幕' || child.name === '环形屏幕2') {
      const video = document.createElement('video');
      video.src = "./resources/video01.mp4";
      video.muted = true;
      video.autoplay = true;
      video.loop = true;
      video.play();
      const videoTexture = new THREE.VideoTexture(video);
      const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });
      (child as THREE.Mesh).material = videoMaterial;
    }

    if (child.name === '环形屏幕') {
      const video = document.createElement('video');
      video.src = "./resources/video02.mp4";
      video.muted = true;
      video.autoplay = true;
      video.loop = true;
      video.play();
      const videoTexture = new THREE.VideoTexture(video);
      const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });
      (child as THREE.Mesh).material = videoMaterial;
    }

    if (child.name === '柱子屏幕') {
      const video = document.createElement('video');
      video.src = "./resources/yanhua.mp4";
      video.muted = true;
      video.autoplay = true;
      video.loop = true;
      video.play();
      const videoTexture = new THREE.VideoTexture(video);
      const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });
      (child as THREE.Mesh).material = videoMaterial;
    }
  })

  mixer = new THREE.AnimationMixer(gltf.scene);
})

// 添加人物
let playerMixer: AnimationMixer;
let playerMesh: THREE.Group
let actionWalk: AnimationAction
let actionIdle: AnimationAction
const lookTarget = new THREE.Vector3(0, 2, 0);
new GLTFLoader().load('../resources/models/player.glb', (gltf) => {
  playerMesh = gltf.scene;
  scene.add(gltf.scene);

  playerMesh.traverse((child) => {
    child.receiveShadow = true;
    child.castShadow = true;
  })

  playerMesh.position.set(0, 0, 11.5);
  playerMesh.rotateY(Math.PI);

  playerMesh.add(camera);
  camera.position.set(0, 2, -5);
  camera.lookAt(lookTarget);

  const pointLight = new THREE.PointLight(0xffffff, 1.5);
  playerMesh.add(pointLight);
  pointLight.position.set(0, 1.8, -1);

  playerMixer = new THREE.AnimationMixer(gltf.scene);

  // 人物行走时候的状态
  const clipWalk = THREE.AnimationUtils.subclip(gltf.animations[0], 'walk', 0, 30);
  actionWalk = playerMixer.clipAction(clipWalk);

  // 人物停止时候的状态
  const clipIdle = THREE.AnimationUtils.subclip(gltf.animations[0], 'idle', 31, 281);
  actionIdle = playerMixer.clipAction(clipIdle);
  actionIdle.play();
});

let isWalk = false;
const playerHalfHeight = new THREE.Vector3(0, 0.8, 0);
window.addEventListener('keydown', (e) => {
  if (e.key === 'w') {
    const curPos = playerMesh.position.clone();
    playerMesh.translateZ(1);
    const frontPos = playerMesh.position.clone();
    playerMesh.translateZ(-1);

    const frontVector3 = frontPos.sub(curPos).normalize()

    const raycasterFront = new THREE.Raycaster(playerMesh.position.clone().add(playerHalfHeight), frontVector3);
    const collisionResultsFrontObjs = raycasterFront.intersectObjects(scene.children);

    if (collisionResultsFrontObjs && collisionResultsFrontObjs[0] && collisionResultsFrontObjs[0].distance > 1) {
      playerMesh.translateZ(0.1);
    }

    if (!isWalk) {
      crossPlay(actionIdle, actionWalk);
      isWalk = true;
    }
  }
})

window.addEventListener('keyup', (e) => {
  if (e.key === 'w') {
    crossPlay(actionWalk, actionIdle);
    isWalk = false;
  }
});

let preClientX: number;
window.addEventListener('mousemove', (e) => {
  if (preClientX && playerMesh) {
    playerMesh.rotateY(-(e.clientX - preClientX) * 0.01);
  }
  preClientX = e.clientX;
});

function crossPlay(curAction: AnimationAction, newAction: AnimationAction) {
  curAction.fadeOut(0.3);
  newAction.reset();
  newAction.setEffectiveWeight(1);
  newAction.play();
  newAction.fadeIn(0.3);
}

// 渲染场景
function animate() {
  requestAnimationFrame(animate);

  renderer.render(scene, camera);

  if (mixer) {
    mixer.update(0.02);
  }

  if (playerMixer) {
    playerMixer.update(0.015);
  }
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})