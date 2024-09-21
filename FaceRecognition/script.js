import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC8tDVbDIrKuylsyF3rbDSSPlzsEHXqZIs",
  authDomain: "online-attendance-21f95.firebaseapp.com",
  projectId: "online-attendance-21f95",
  storageBucket: "online-attendance-21f95.appspot.com",
  messagingSenderId: "756223518392",
  appId: "1:756223518392:web:5e8d28c78f7eefb8be764d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

const video = document.getElementById("video");
let faceMatcher;
let canvas;
let isProcessing = false;

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("FaceRecognition/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("FaceRecognition/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("FaceRecognition/models"),
]);

document.getElementById("faceRecognition-signin-button").addEventListener("click", startFaceRecognition);

function startFaceRecognition() {
  startWebcam();
  document.getElementById('faceRecognition-container').style.display="flex";
}

let webcamStream;

function startWebcam() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            webcamStream = stream;
            document.querySelector('video').srcObject = stream;
            console.log("Webcam started");
        })
        .catch(error => {
            console.error("Error accessing webcam: ", error);
        });
}

function stopWebcam() {
    if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        webcamStream = null;
        document.getElementById('faceRecognition-container').style.display = "none";
        console.log("Webcam stopped");
    } else {
        console.log("No webcam stream to stop");
    }
}

function cancelFaceRecognition() {
    stopWebcam();
    // Add any additional cleanup or state reset logic here
    console.log("Face recognition cancelled");
}

// Example usage
document.getElementById('faceRecognition-signin-button').addEventListener('click', startWebcam);
document.getElementById('cancel-facerecognition').addEventListener('click', cancelFaceRecognition);



async function getImageUrl(label, i) {
  const storageRef = ref(storage, `/label/${label}/${i}.png`);
  return await getDownloadURL(storageRef);
}

async function fetchImage(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return await faceapi.bufferToImage(blob);
}

async function getLabeledFaceDescriptions() {
  const labels = ["Emmanuel"];
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let i = 1; i <= 2; i++) {
        const url = await getImageUrl(label, i);
        const img = await fetchImage(url);
        const detections = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();
        descriptions.push(detections.descriptor);
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}

async function initializeFaceRecognition() {
  const labeledFaceDescriptors = await getLabeledFaceDescriptions();
  faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

  canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  requestAnimationFrame(processFrame);
}

async function processFrame() {
  if (!isProcessing) {
    isProcessing = true;
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    const displaySize = { width: video.width, height: video.height };
    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    const results = resizedDetections.map((d) => faceMatcher.findBestMatch(d.descriptor));
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
      drawBox.draw(canvas);
    });

    isProcessing = false;
  }
  requestAnimationFrame(processFrame);
}
