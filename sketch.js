let canvas;

export const detectedJump = false;
export const detectedCrouch = false;

document.addEventListener("DOMContentLoaded", () => {
  // Initialize PoseNet and set up other code related to your application
  console.log("test");
  canvas = document.getElementById("canvas");

  // Grab elements, create settings, etc.
  if (canvas) {
    const ctx = canvas.getContext("2d");
    const video = document.getElementById("video");

    // add here the global variables
    let calibratedYLine;
    let calibrateNoseLineY;
    let hasCalibrated = false; // make sure to reset this later on

    // Ends here

    let poses = [];

    // Create a webcam capture
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(function (stream) {
          video.srcObject = stream;
          video.play();
        });
    }

    // A function to draw the video and poses into the canvas.
    // This function is independent of the result of posenet
    // This way the video will not seem slow if poseNet
    // is not detecting a position
    function drawCameraIntoCanvas() {
      // Draw the video element into the canvas
      ctx.drawImage(video, 0, 0, 640, 480);
      // We can call both functions to draw all keypoints and the skeletons
      // drawKeypoints();
      // drawSkeleton();
      logChanges();
      handleCalibration();
      detectAction();
      window.requestAnimationFrame(drawCameraIntoCanvas);
    }
    // Loop over the drawCameraIntoCanvas function
    drawCameraIntoCanvas();

    // Create a new poseNet method with a single detection
    const poseNet = ml5.poseNet(video, modelReady);
    poseNet.on("pose", gotPoses);

    // A function that gets called every time there's an update from the model
    function gotPoses(results) {
      poses = results;

      // console.log(poses);   // DISABLE to improve performance
    }

    function modelReady() {
      console.log("model ready");
      poseNet.multiPose(video);
    }

    // A function to draw ellipses over the detected keypoints
    // function drawKeypoints() {
    //   // Loop through all the poses detected
    //   for (let i = 0; i < poses.length; i += 1) {
    //     // For each pose detected, loop through all the keypoints
    //     for (let j = 0; j < poses[i].pose.keypoints.length; j += 1) {
    //       let keypoint = poses[i].pose.keypoints[j];
    //       // Only draw an ellipse is the pose probability is bigger than 0.2
    //       if (keypoint.score > 0.3) {
    //         ctx.strokeStyle = "blue"; // You can use any valid CSS color here
    //         ctx.beginPath();
    //         ctx.arc(
    //           keypoint.position.x,
    //           keypoint.position.y,
    //           10,
    //           0,
    //           2 * Math.PI
    //         );
    //         ctx.stroke();
    //       }
    //     }
    //   }
    // }

    // A function to draw ellipses over the detected keypoints
    function logChanges() {
      // Loop through all the poses detected
      for (let i = 0; i < poses.length; i += 1) {
        // console.log(poses[0].pose.keypoints[0]);
        // For each pose detected, loop through all the keypoints
        for (let j = 0; j < poses[i].pose.keypoints.length; j += 1) {
          let keypoint = poses[i].pose.keypoints[j];
          // Only draw an ellipse is the pose probability is bigger than 0.2
          if (keypoint.score > 0.3) {
            ctx.strokeStyle = "yellow"; // You can use any valid CSS color here
            ctx.beginPath();
            ctx.arc(
              keypoint.position.x,
              keypoint.position.y,
              10,
              0,
              2 * Math.PI
            );
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

    // A function to draw the skeletons
    // function drawSkeleton() {
    //   // Loop through all the skeletons detected
    //   for (let i = 0; i < poses.length; i += 1) {
    //     // For every skeleton, loop through all body connections
    //     for (let j = 0; j < poses[i].skeleton.length; j += 1) {
    //       let partA = poses[i].skeleton[j][0];
    //       let partB = poses[i].skeleton[j][1];
    //       ctx.strokeStyle = "yellow"; // You can use any valid CSS color here
    //       ctx.beginPath();
    //       ctx.moveTo(partA.position.x, partA.position.y);
    //       ctx.lineTo(partB.position.x, partB.position.y);
    //       ctx.stroke();
    //     }
    //   }
    // }

    function detectAction() {
      if (poses.length > 0) {
        // let rightShoulderKeypoint = poses[0].pose.keypoints[6];
        // let leftShoulderKeypoint = poses[0].pose.keypoints[5];

        // console.log(
        //   `rY: ${rightShoulderKeypoint.position.y} \n lY: ${leftShoulderKeypoint.position.y} \n`,
        //   `rX: ${rightShoulderKeypoint.position.x} \n lX: ${leftShoulderKeypoint.position.x}`
        // );

        // Get the position of the person's head and feet
        if (
          poses[0].pose.keypoints[0].position.x >= 100 &&
          poses[0].pose.keypoints[0].position.x <= 550
        ) {
          // test start
          let keypoint = poses[0].pose.keypoints[0];
          if (keypoint.score > 0.3) {
            ctx.strokeStyle = "blue"; // You can use any valid CSS color here
            ctx.beginPath();
            ctx.arc(
              keypoint.position.x,
              keypoint.position.y,
              10,
              0,
              2 * Math.PI
            );
            ctx.stroke();
          }
          // test end
          let noseY = poses[0].pose.keypoints[0].position.y;
          console.log(`nose Y axis: ${noseY}`);

          // Detect a jump if the person's height is greater than 1.5 times their normal height
          const jumpDetected = calibrateNoseLineY > noseY + 70;

          // Detect a crouch if the person's height is less than 0.5 times their normal height
          const crouchDetected = calibrateNoseLineY < noseY - 70;

          if (jumpDetected) {
          } else if (crouchDetected) {
            console.log("crouch");
          }

          // console.log(poses[0].pose.keypoints[0].position.x);
          console.log(calibrateNoseLineY);
        }
      }
    }

    // width="640"
    // height="480"

    async function handleCalibration() {
      try {
        if (!hasCalibrated) {
          setTimeout(getPositionY, 7000);
          hasCalibrated = true;
        }
      } catch (error) {
        console.log(error);
      }
    }

    function getPositionY() {
      let yAxisLeftShoulderLine = poses[0].pose.keypoints[5].position.y;
      let yAxisRightShoulderLine = poses[0].pose.keypoints[6].position.y;

      calibrateNoseLineY = poses[0].pose.keypoints[0].position.y;

      calibratedYLine = (yAxisLeftShoulderLine + yAxisRightShoulderLine) / 2;
      console.log(calibrateNoseLineY);
      console.log(`Calibrated Y ${calibratedYLine}`);
    }

    function restartCalibration() {
      hasCalibrated = false;
    }
  } else {
    console.error("Canvas element not found.");
  }
});
