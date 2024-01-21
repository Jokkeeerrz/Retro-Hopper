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
const footstep = "../audio/footstep3.mp3";
const jump = "../audio/jump-sfx.mp3";

const audioJump = new Audio(jump);
const audioRun = new Audio(footstep);

let isCalibrated = false;
let isJumping = false;
let dinoFrame;
let currentFrameTime;
let yVelocity;
let isDucking = false;

let calibratedYLine;

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
}

export function updateDino(delta, speedScale) {
  handleRun(delta, speedScale);
  handleJump(delta);
  handleDuck();
}

export function getDinoRect() {
  return dinoElem.getBoundingClientRect();
}

export function setDinoLose() {
  dinoElem.src = "../imgs/dino-lose.PNG";
  setCustomProperty(dinoElem, "--bottom", "0");
}

function handleDuck() {
  if (isDucking && !isJumping) {
    dinoElem.src = "../imgs/duck-animation-cropped.PNG";
    setCustomProperty(dinoElem, "--bottom", "-8");
  }
}

function handleRun(delta, speedScale) {
  if (isJumping) {
    dinoElem.src = `../imgs/dino-stationary.PNG`;
    return;
  }

  if (isDucking) {
    dinoElem.src = `../imgs/duck-animation-cropped.PNG`;
    return;
  }

  // swaps between 2 pictures
  if (currentFrameTime >= FRAME_TIME) {
    dinoFrame = (dinoFrame + 1) % DINO_FRAME_COUNT; // ranges between 0 and 1
    dinoElem.src = `../imgs/dino-run-${dinoFrame}.PNG`;
    currentFrameTime -= FRAME_TIME;

    audioRun.play();
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

function onJump() {
  if (isJumping) return;

  yVelocity = JUMP_SPEED;
  isJumping = true;

  audioJump.play();
}

// function onReleaseDuck() {
//   if (isDucking) return;

//   if (!isJumping) {
//     isDucking = false;
//     dinoElem.src = `imgs/dino-run-${dinoFrame}.PNG`;
//     setCustomProperty(dinoElem, "--bottom", "0");
//   }
// }

function onDuck() {
  if (isDucking) return;

  if (!isJumping) {
    isDucking = true;
    dinoElem.src = "../imgs/duck-animation-cropped.PNG";
    setCustomProperty(dinoElem, "--bottom", "0");
  }
}

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

const skeleton = [
  { from: "left_hip", to: "left_shoulder" },
  { from: "left_elbow", to: "left_shoulder" },
  { from: "left_elbow", to: "left_wrist" },
  { from: "left_hip", to: "left_knee" },
  { from: "left_knee", to: "left_ankle" },
  { from: "right_hip", to: "right_shoulder" },
  { from: "right_elbow", to: "right_shoulder" },
  { from: "right_elbow", to: "right_wrist" },
  { from: "right_hip", to: "right_knee" },
  { from: "right_knee", to: "right_ankle" },
  { from: "left_shoulder", to: "right_shoulder" },
  { from: "left_hip", to: "right_hip" },
];

async function runInference() {
  await setupCamera();

  const movenet = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER }
  );

  async function detectPose() {
    const poses = await movenet.estimatePoses(video, {
      flipHorizontal: false,
      maxPoses: 1,
    });

    // console.log(poses[0].keypoints);
    if (poses) {
      gotPoses(poses);
      drawKeypoints(poses);
      handleCalibration(poses);
    }

    requestAnimationFrame(detectPose);
  }

  function drawKeypoints(poses) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const pose of poses) {
      // Draw keypoints
      for (const keypoint of pose.keypoints) {
        if (keypoint.score > 0.3) {
          ctx.fillStyle = "yellow";
          ctx.beginPath();
          ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      // Draw skeleton lines
      skeleton.forEach((bone) => {
        const startPoint = pose.keypoints.find(
          (point) => point.name === bone.from
        );
        const endPoint = pose.keypoints.find((point) => point.name === bone.to);
        if (startPoint.score > 0.3 && endPoint.score > 0.3) {
          ctx.fillStyle = "blue";
          ctx.beginPath();
          ctx.moveTo(startPoint.x, startPoint.y);
          ctx.lineTo(endPoint.x, endPoint.y);
          ctx.stroke();
        }
      });
    }
  }
  detectPose();
}

runInference();

export function gotPoses(poses) {
  if (
    poses.length > 0 &&
    poses[0].keypoints &&
    poses[0].keypoints[5] &&
    poses[0].keypoints[6]
  ) {
    let leftShouldLocation = poses[0].keypoints[5].y;
    let rightShouldLocation = poses[0].keypoints[6].y;

    let currShoulderYLine = (leftShouldLocation + rightShouldLocation) / 2;
    // console.log(`calibrated Y axis: ${calibratedYLine}`);
    // console.log(`current shoulder y axis: ${currShoulderYLine}`);

    // Detect a jump if the person's height is greater than 1.5 times their normal height
    const jumpDetected = currShoulderYLine < calibratedYLine - 50;

    // Detect a crouch if the person's height is less than 0.5 times their normal height
    const crouchDetected = currShoulderYLine > calibratedYLine + 50;

    if (jumpDetected) {
      onJump();
      console.log("jump");
    } else if (crouchDetected) {
      onDuck();
      console.log("crouch");
    } else {
      isDucking = false;
      if (!isJumping) {
        setCustomProperty(dinoElem, "--bottom", "0");
      }
    }

    ctx.strokeStyle = "yellow"; // You can use any valid CSS color here
    ctx.beginPath();
    ctx.moveTo(0, calibratedYLine);
    ctx.lineTo(640, calibratedYLine);
    ctx.stroke();
  } else {
    console.log("Missing Pose Location");
  }
}

export async function handleCalibration(poses) {
  try {
    if (!isCalibrated) {
      setTimeout(getPositionY(poses), 1000);
      isCalibrated = true;
    }
  } catch (error) {
    console.log(error);
  }
}

export function getPositionY(poses) {
  if (
    poses &&
    poses.length > 0 &&
    poses[0].keypoints &&
    poses[0].keypoints[5] &&
    poses[0].keypoints[6]
  ) {
    console.log("Calibrated now");
    let leftShoulderKeypoint = poses[0].keypoints[5].y;
    let rightShoulderKeypoint = poses[0].keypoints[6].y;
    console.log(leftShoulderKeypoint, rightShoulderKeypoint);

    calibratedYLine = (leftShoulderKeypoint + rightShoulderKeypoint) / 2;
  }

  console.log(`Calibrated Y ${calibratedYLine}`);
}
