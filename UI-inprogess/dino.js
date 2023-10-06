import {
  getCustomProperty,
  incrementCustomProperty,
  setCustomProperty,
} from "./updateCustomProperty.js";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const dinoElem = document.querySelector("[data-dino]");
const JUMP_SPEED = 0.45;
const GRAVITY = 0.0012;
const DINO_FRAME_COUNT = 2;
const FRAME_TIME = 100;

let hasCalibrated;
let isJumping = false;
let isCrouching = false;
let dinoFrame;
let currentFrameTime;
let yVelocity;

let calibratedYLine;

let poses = [];

// Create a webcam capture
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
    video.srcObject = stream;
    video.play();
  });
}

export function drawCameraIntoCanvas() {
  ctx.drawImage(video, 0, 0, 640, 480);
  gotPoses(poses);
  logChanges();
  handleCalibration();
  window.requestAnimationFrame(drawCameraIntoCanvas);
}
// Loop over the drawCameraIntoCanvas function
drawCameraIntoCanvas();

export const poseNet = ml5.poseNet(video, modelReady);
poseNet.on("pose", gotPoses);

export function gotPoses(results) {
  poses = results;
  if (poses.length > 0) {
    if (
      poses[0].pose.keypoints[0].position.x >= 200 &&
      poses[0].pose.keypoints[0].position.x <= 450
    ) {
      // test start
      // let keypoint = poses[0].pose.keypoints[0];
      // if (keypoint.score > 0.3) {
      //   ctx.strokeStyle = "red"; // You can use any valid CSS color here
      //   ctx.beginPath();
      //   ctx.arc(keypoint.position.x, keypoint.position.y, 10, 0, 2 * Math.PI);
      //   ctx.stroke();
      // }
      // test end
      let currleftShoulderKeypoint = poses[0].pose.keypoints[5].position.y;
      let currrightShoulderKeypoint = poses[0].pose.keypoints[6].position.y;

      let currShoulderYLine = (currleftShoulderKeypoint + currrightShoulderKeypoint) / 2;
      console.log(`calibrated Y axis: ${calibratedYLine}`);
      console.log(`current shoulder y axis: ${currShoulderYLine}`);

      // Detect a jump if the person's height is greater than 1.5 times their normal height
      const jumpDetected = currShoulderYLine < calibratedYLine - 50;

      // Detect a crouch if the person's height is less than 0.5 times their normal height
      const crouchDetected = currShoulderYLine > calibratedYLine + 50;

      if (jumpDetected) {
        onJump();
        console.log("jump");
      } else if (crouchDetected) {
        onCrouch();
        console.log("crouch");
      }

      ctx.strokeStyle = "red"; // You can use any valid CSS color here
      ctx.beginPath();
      ctx.moveTo(0, calibratedYLine);
      ctx.lineTo(640, calibratedYLine);
      ctx.stroke();
    }
  }
}

export function modelReady() {
  console.log("model ready");
  poseNet.multiPose(video);
}

export async function handleCalibration() {
  try {
    if (!hasCalibrated) {
      setTimeout(getPositionY, 7000);
      hasCalibrated = true;
    }
  } catch (error) {
    console.log(error);
  }
}

export function getPositionY() {
  let leftShoulderKeypoint = poses[0].pose.keypoints[5].position.y;
  let rightShoulderKeypoint = poses[0].pose.keypoints[6].position.y;

  calibratedYLine = (leftShoulderKeypoint + rightShoulderKeypoint) / 2;

  console.log(`Calibrated Y ${calibratedYLine}`);
}

export function setupDino() {
  isJumping = false;
  isCrouching = false;
  dinoFrame = 0;
  currentFrameTime = 0;
  yVelocity = 0;
  setCustomProperty(dinoElem, "--bottom", 0);
  document.removeEventListener("keydown", onJump);
  document.addEventListener("keydown", onJump);
  document.removeEventListener("keydown", onCrouch);
  document.addEventListener("keydown", onCrouch);
}

export function updateDino(delta, speedScale) {
  handleRun(delta, speedScale);
  handleJump(delta);
  handleCrouch(delta, speedScale);
}

export function getDinoRect() {
  return dinoElem.getBoundingClientRect();
}

export function setDinoLose() {
  dinoElem.src = "imgs/dino-lose.PNG";
}

function handleRun(delta, speedScale) {
  if (isJumping) {
    dinoElem.src = `imgs/dino-stationary.PNG`;
    return;
  }

  if (isCrouching) {
    dinoElem.src = `imgs/dino-crouch.PNG`;
    return;
  }

  // swaps between 2 pictures
  if (currentFrameTime >= FRAME_TIME) {
    dinoFrame = (dinoFrame + 1) % DINO_FRAME_COUNT; // ranges between 0 and 1
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

function handleCrouch() {
  if (!isCrouching) return;

  incrementCustomProperty(dinoElem, "--bottom", yVelocity * delta);

  yVelocity -= GRAVITY * delta;
}

// I want to make the code communicate with the postnet model
function onCrouch() {
  if (isCrouching) return;

  isCrouching = true;
}

function onJump() {
  if (isJumping) return;

  yVelocity = JUMP_SPEED;
  isJumping = true;
}

function logChanges() {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i += 1) {
    // console.log(poses[0].pose.keypoints[0]);
    // For each pose detected, loop through all the keypoints
    for (let j = 0; j < poses[i].pose.keypoints.length; j += 1) {
      let keypoint = poses[i].pose.keypoints[j];
      // Only draw an ellipse if the pose probability is bigger than 0.2
      if (keypoint.score > 0.3) {
        ctx.strokeStyle = "yellow"; // You can use any valid CSS color here
        ctx.beginPath();
        ctx.arc(keypoint.position.x, keypoint.position.y, 10, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
    for (let j = 0; j < poses[i].skeleton.length; j += 1) {
      let partA = poses[i].skeleton[j][0];
      let partB = poses[i].skeleton[j][1];
      ctx.strokeStyle = "red"; // You can use any valid CSS color here
      ctx.beginPath();
      ctx.moveTo(partA.position.x, partA.position.y);
      ctx.lineTo(partB.position.x, partB.position.y);
      ctx.stroke();
    }
  }
}
