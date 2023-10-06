import {
  getCustomProperty,
  incrementCustomProperty,
  setCustomProperty,
} from "./updateCustomProperty.js";

import { detectedJump, detectedCrouch } from "../sketch.js";

console.log(detectedCrouch, detectedJump);
const dinoElem = document.querySelector("[data-dino]");
const JUMP_SPEED = 0.45;
const GRAVITY = 0.0015;
const DINO_FRAME_COUNT = 2;
const FRAME_TIME = 100;

let duckFrame = 0;
let lastDuckFrameTime = 0;
const DUCK_FRAME_TIME = 100;

let isJumping;
let dinoFrame;
let currentFrameTime;
let yVelocity;
let isDucking;

export function setupDino() {
  isJumping = false;
  isDucking = false;
  dinoFrame = 0;
  currentFrameTime = 0;
  yVelocity = 0;
  setCustomProperty(dinoElem, "--bottom", 0);
  document.removeEventListener("keydown", onJump);
  document.addEventListener("keydown", onJump);
  document.removeEventListener("keydown", onDuck);
  document.addEventListener("keydown", onDuck);
  document.removeEventListener("keyup", onReleaseDuck);
  document.addEventListener("keyup", onReleaseDuck);
}

export function updateDino(delta, speedScale) {
  handleRun(delta, speedScale);
  handleDuck(delta);
  handleJump(delta);
}

export function getDinoRect() {
  return dinoElem.getBoundingClientRect();
}

export function setDinoLose() {
  dinoElem.src = "imgs/dino-lose.PNG";
}

function handleDuck() {
  if (isDucking && !isJumping) {
    dinoElem.src = "imgs/duck-animation.PNG";
    setCustomProperty(dinoElem, "--bottom", "-10");
  }
}

function handleRun(delta, speedScale) {
  if (isJumping) {
    dinoElem.src = isDucking
      ? "imgs/dino-duck-0.PNG"
      : "imgs/dino-stationary.PNG";
    return;
  }

  if (currentFrameTime >= FRAME_TIME) {
    dinoFrame = (dinoFrame + 1) % DINO_FRAME_COUNT;
    dinoElem.src = `imgs/dino-run-${dinoFrame}.PNG`;
    currentFrameTime -= FRAME_TIME;
  }

  currentFrameTime += delta * speedScale;
}

function handleJump(delta) {
  if (!isJumping) return;

  incrementCustomProperty(dinoElem, "--bottom", yVelocity * delta);

  if (getCustomProperty(dinoElem, "--bottom") <= 0) {
    setCustomProperty(dinoElem, "--bottom", 0);
    isJumping = false;
  }

  yVelocity -= GRAVITY * delta;
}

function onJump(e) {
  if (e.code !== "Space" || isJumping || detectedJump) return;

  yVelocity = JUMP_SPEED;
  isJumping = true;
}

function onReleaseDuck(e) {
  if (e.code !== "ArrowDown" || detectedCrouch) return;

  if (!isJumping) {
    isDucking = false;
    dinoElem.src = `imgs/dino-run-${dinoFrame}.PNG`;
    setCustomProperty(dinoElem, "--bottom", "0");
  }
}

function onDuck(e) {
  if (e.code !== "ArrowDown" || detectedCrouch) return;

  if (!isJumping) {
    isDucking = true;
    dinoElem.src = "imgs/duck-animation.PNG";
    setCustomProperty(dinoElem, "--bottom", "-10");
  }
}
