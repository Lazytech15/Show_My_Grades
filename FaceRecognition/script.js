// Import only the necessary functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { getFirestore, getDocs, collection } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

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
const auth = getAuth(app);

const DEBUG = true;

const video = document.getElementById("video");
let faceMatcher;
let isProcessing = false;
let lastProcessingTime = 0;
const processingInterval = 100;
let facePositions = [];
const requiredPositions = ['left', 'center', 'right'];
let currentPositionIndex = 0;
let livenessDetected = false;
let blinkDetected = false;
let smileDetected = false;

// Create a feedback element
const feedbackElement = document.createElement('div');
feedbackElement.id = 'liveness-feedback';
feedbackElement.style.position = 'absolute';
feedbackElement.style.top = '10px';
feedbackElement.style.left = '50%';
feedbackElement.style.transform = 'translateX(-50%)';
feedbackElement.style.padding = '10px';
feedbackElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
feedbackElement.style.color = 'white';
feedbackElement.style.borderRadius = '5px';
feedbackElement.style.display = 'none';
document.body.appendChild(feedbackElement);

// Function to update feedback
function updateFeedback(message) {
  feedbackElement.textContent = message;
  feedbackElement.style.display = 'block';
}


// Create the loading indicator with spinner
const loadingIndicator = document.createElement('div');
loadingIndicator.id = 'loading-indicate';
loadingIndicator.innerHTML = `
  <div class="content">
    <div class="spinner">
      <div></div>   
      <div></div>    
      <div></div>    
      <div></div>    
      <div></div>    
      <div></div>    
      <div></div>    
      <div></div>    
      <div></div>    
      <div></div>    
    </div>
    <div class="loading-text">Fetching Data, Please wait...</div>
  </div>
`;
document.body.appendChild(loadingIndicator);

// Simplified toggle function
const toggleLoadingIndicator = show => loadingIndicator.style.display = show ? 'block' : 'none';

// Load face-api.js models
async function loadFaceApiModels() {
  const MODEL_URL = 'FaceRecognition/models';
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
  ]);
  console.log("Face-api models loaded");
}

// Initialize resources more efficiently
async function initializeResources() {
  toggleLoadingIndicator(true);
  try {
    await loadFaceApiModels();
    console.log("Models loaded");

    const labeledFaceDescriptions = await getLabeledFaceDescriptions();
    if (DEBUG) console.log(`Creating FaceMatcher with ${labeledFaceDescriptions.length} LabeledFaceDescriptors`);
    faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptions, 0.6);
    console.log("Face data fetched and processed");
    if (DEBUG) console.log("FaceMatcher created:", faceMatcher);
  } catch (error) {
    console.error("Error initializing resources:", error);
  } finally {
    toggleLoadingIndicator(false);
  }
}

// Start face recognition
async function startFaceRecognition() {
  try {
    console.log("Starting face recognition...");
    await initializeResources();
    startWebcam();
    document.getElementById('faceRecognition-container').style.display = "flex";
    updateFeedback("Please move your face from left to right slowly");
    console.log("Face recognition started. Waiting for liveness check.");
  } catch (error) {
    console.error("Failed to start face recognition:", error);
    alert("Failed to start face recognition. Please try again.");
  }
}

// Event listeners
document.getElementById("faceRecognition-signin-button").addEventListener("click", startFaceRecognition);
document.getElementById('cancel-facerecognition').addEventListener('click', stopWebcam);

// Webcam functions
function startWebcam() {
  navigator.mediaDevices.getUserMedia({ 
    video: { 
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: "user"
    } 
  })
    .then(stream => {
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        console.log(`Video dimensions: ${video.videoWidth}x${video.videoHeight}`);
        requestAnimationFrame(processFrame);
      };
    })
    .catch(error => {
      console.error("Error accessing the webcam:", error);
      updateFeedback("Failed to access the webcam. Please check your camera permissions.");
    });
}

function stopWebcam() {
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;
    document.getElementById('faceRecognition-container').style.display = "none";
    feedbackElement.style.display = 'none';
    console.log("Webcam stopped");
    
    // Reset liveness detection variables
    facePositions = [];
    currentPositionIndex = 0;
    livenessDetected = false;
  }
}

// Efficient image fetching
const getImageUrl = (label, i) => getDownloadURL(ref(storage, `/teacherIMG/${label}/${i}.png`));
const fetchImage = async url => faceapi.bufferToImage(await (await fetch(url)).blob());

// Fetch teacher accounts
async function getTeacherAccounts() {
  const snapshot = await getDocs(collection(db, 'teacher-account'));
  return snapshot.docs.map(doc => doc.id).sort();
}

// Get labeled face descriptions more efficiently
async function getLabeledFaceDescriptions() {
  const teacherAccounts = await getTeacherAccounts();
  if (DEBUG) console.log(`Retrieved ${teacherAccounts.length} teacher accounts`);
  
  const labeledFaceDescriptors = await Promise.all(teacherAccounts.map(async (accountId) => {
    const descriptions = [];
    for (let i = 1; i <= 2; i++) {
      if (DEBUG) console.log(`Fetching image for ${accountId}, image ${i}`);
      const img = await fetchImage(await getImageUrl(accountId, i));
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 160 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (detection) {
        descriptions.push(detection.descriptor);
        if (DEBUG) console.log(`Successfully added descriptor for ${accountId}, image ${i}`);
      } else {
        if (DEBUG) console.log(`Failed to detect face for ${accountId}, image ${i}`);
      }
    }
    if (DEBUG) console.log(`Created LabeledFaceDescriptors for ${accountId} with ${descriptions.length} descriptors`);
    return new faceapi.LabeledFaceDescriptors(accountId, descriptions);
  }));

  if (DEBUG) console.log(`Total LabeledFaceDescriptors created: ${labeledFaceDescriptors.length}`);
  return labeledFaceDescriptors;
}

// Optimized frame processing
async function processFrame(timestamp) {
  if (!isProcessing && timestamp - lastProcessingTime > processingInterval) {
    isProcessing = true;
    lastProcessingTime = timestamp;

    try {
      if (DEBUG) console.log("Processing frame...");
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 160 }))
        .withFaceLandmarks()
        .withFaceExpressions()
        .withFaceDescriptors();

      if (DEBUG) console.log(`Detections: ${detections.length}`);

      if (detections.length > 0) {
        const detection = detections[0]; // Assume only one face
        if (DEBUG) console.log(`Face detected at: x=${detection.detection.box.x}, y=${detection.detection.box.y}`);
        
        if (!livenessDetected) {
          updateLivenessDetection(detection);
        } else {
          if (DEBUG) console.log("Attempting to match face...");
          const result = faceMatcher.findBestMatch(detection.descriptor);
          if (DEBUG) console.log(`Match result:`, result);
          if (result.label !== 'unknown') {
            console.log(`Live face match found: ${result.label}`);
            await AutoLogin(result.label);
          } else {
            console.log("Face detected but not recognized");
            updateFeedback("Face not recognized. Please try again.");
          }
        }
      } else {
        updateFeedback("No face detected. Please face the camera.");
        if (DEBUG) console.log("No face detected in this frame.");
      }
    } catch (error) {
      console.error("Error in face detection:", error);
      updateFeedback("An error occurred. Please try again.");
    }

    isProcessing = false;
  }
  requestAnimationFrame(processFrame);
}

function getFacePosition(detection) {
  const faceCenter = detection.detection.box.x + (detection.detection.box.width / 2);
  const videoCenter = video.width / 2;
  const threshold = video.width / 5;

  if (faceCenter < videoCenter - threshold) return 'left';
  if (faceCenter > videoCenter + threshold) return 'right';
  return 'center';
}

// Function to update liveness detection
function updateLivenessDetection(detection) {
  const position = getFacePosition(detection);
  const blinking = isBlinking(detection);
  const smiling = isSmiling(detection);

  if (position === requiredPositions[currentPositionIndex] && 
      (facePositions.length === 0 || position !== facePositions[facePositions.length - 1])) {
    facePositions.push(position);
    currentPositionIndex++;
    
    updateFeedback(`Great! Now ${currentPositionIndex === requiredPositions.length ? 'blink' : `move your face to the ${requiredPositions[currentPositionIndex]}`}`);
  }

  if (blinking && !blinkDetected) {
    blinkDetected = true;
    updateFeedback("Blink detected! Now, please smile.");
  }

  if (smiling && blinkDetected && !smileDetected) {
    smileDetected = true;
    livenessDetected = true;
    updateFeedback("Liveness confirmed. Proceeding with face recognition.");
    console.log("Liveness detected! Face recognition enabled.");
  }
}


// Helper function to detect blinking
function isBlinking(detection) {
  const landmarks = detection.landmarks;
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  
  const leftEyeAspectRatio = getEyeAspectRatio(leftEye);
  const rightEyeAspectRatio = getEyeAspectRatio(rightEye);
  
  const eyeAspectRatio = (leftEyeAspectRatio + rightEyeAspectRatio) / 2;
  
  return eyeAspectRatio < 0.2; // Adjust this threshold as needed
}

function getEyeAspectRatio(eye) {
  const height1 = distance(eye[1], eye[5]);
  const height2 = distance(eye[2], eye[4]);
  const width = distance(eye[0], eye[3]);
  return (height1 + height2) / (2 * width);
}

function distance(a, b) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

// Helper function to detect smiling
function isSmiling(detection) {
  return detection.expressions.happy > 0.7; // Adjust this threshold as needed
}

// Simplified AutoLogin function
async function AutoLogin(userEmail) {
  try {
    const doc = await getDocs(collection(db, "teacher-account")).then(
      snapshot => snapshot.docs.find(doc => doc.id === userEmail)
    );

    if (doc) {
      document.getElementById('username').value = doc.data().Email;
      document.getElementById('password').value = doc.data().teacherpass;
      stopWebcam();
    }
  } catch (error) {
    console.log(error);
  }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, waiting for user to start face recognition");
});