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

const video = document.getElementById("video");
let faceMatcher;
let isProcessing = false;
let lastProcessingTime = 0;
const processingInterval = 100;

// Anti-spoofing variables
let lastEyeState = null;
let blinkDetected = false;
let antiSpoofingPassed = false;

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

// Create feedback message element
const feedbackMessage = document.createElement('div');
feedbackMessage.id = 'feedback-message';
feedbackMessage.style.cssText = `
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-size: 16px;
  text-align: center;
`;
document.getElementById('faceRecognition-container').appendChild(feedbackMessage);

// Simplified toggle function
const toggleLoadingIndicator = show => loadingIndicator.style.display = show ? 'block' : 'none';

// Update feedback message
function updateFeedbackMessage(message) {
  feedbackMessage.textContent = message;
}

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
    faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptions, 0.6);
    console.log("Face data fetched and processed");
  } catch (error) {
    console.error("Error initializing resources:", error);
  } finally {
    toggleLoadingIndicator(false);
  }
}

// Start face recognition
async function startFaceRecognition() {
  try {
    await initializeResources();
    startWebcam();
    document.getElementById('faceRecognition-container').style.display = "flex";
    updateFeedbackMessage("Please blink to verify you're a real person.");
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
  navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
    .then(stream => {
      video.srcObject = stream;
      video.onloadedmetadata = () => requestAnimationFrame(antiSpoofingCheck);
    })
    .catch(console.error);
}

function stopWebcam() {
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;
    document.getElementById('faceRecognition-container').style.display = "none";
    console.log("Webcam stopped");
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
  
  return Promise.all(teacherAccounts.map(async (accountId) => {
    const descriptions = [];
    for (let i = 1; i <= 2; i++) {
      const img = await fetchImage(await getImageUrl(accountId, i));
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 160 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (detection) descriptions.push(detection.descriptor);
    }
    return new faceapi.LabeledFaceDescriptors(accountId, descriptions);
  }));
}

// Anti-spoofing check
async function antiSpoofingCheck(timestamp) {
  if (!isProcessing && timestamp - lastProcessingTime > processingInterval) {
    isProcessing = true;
    lastProcessingTime = timestamp;

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 160 }))
      .withFaceLandmarks();

    if (detections.length > 0) {
      const landmarks = detections[0].landmarks;
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();

      // Check for blinking
      const eyeAspectRatio = calculateEyeAspectRatio(leftEye, rightEye);
      const currentEyeState = eyeAspectRatio < 0.2;

      if (lastEyeState !== null && lastEyeState !== currentEyeState) {
        blinkDetected = true;
        console.log("Blink detected");
        updateFeedbackMessage("Blink detected! Proceeding with face recognition...");
        
        antiSpoofingPassed = true;
        console.log("Anti-spoofing check passed");
        setTimeout(() => {
          updateFeedbackMessage("Verifying your identity...");
          requestAnimationFrame(processFrame);
        }, 1500); // Wait for 1.5 seconds before proceeding to face recognition
      } else {
        lastEyeState = currentEyeState;
        requestAnimationFrame(antiSpoofingCheck);
      }
    } else {
      updateFeedbackMessage("No face detected. Please position your face in front of the camera.");
      requestAnimationFrame(antiSpoofingCheck);
    }

    isProcessing = false;
  } else {
    requestAnimationFrame(antiSpoofingCheck);
  }
}

// Helper function to calculate eye aspect ratio
function calculateEyeAspectRatio(leftEye, rightEye) {
  const leftEAR = (
    (faceapi.euclideanDistance(leftEye[1], leftEye[5]) + faceapi.euclideanDistance(leftEye[2], leftEye[4])) /
    (2 * faceapi.euclideanDistance(leftEye[0], leftEye[3]))
  );
  const rightEAR = (
    (faceapi.euclideanDistance(rightEye[1], rightEye[5]) + faceapi.euclideanDistance(rightEye[2], rightEye[4])) /
    (2 * faceapi.euclideanDistance(rightEye[0], rightEye[3]))
  );
  return (leftEAR + rightEAR) / 2;
}

// Optimized frame processing
async function processFrame(timestamp) {
  if (!isProcessing && timestamp - lastProcessingTime > processingInterval) {
    isProcessing = true;
    lastProcessingTime = timestamp;

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 160 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    for (const detection of detections) {
      const result = faceMatcher.findBestMatch(detection.descriptor);
      console.log(`Face match found: ${result.label}`);
      updateFeedbackMessage(`Identity verified: ${result.label}`);
      await AutoLogin(result.label);
      return; // Exit after successful login
    }

    updateFeedbackMessage("Face not recognized. Please try again or use manual login.");
    isProcessing = false;
    requestAnimationFrame(processFrame);
  } else {
    requestAnimationFrame(processFrame);
  }
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
      updateFeedbackMessage("Login successful! Redirecting...");
      setTimeout(() => {
        stopWebcam();
        // Add code here to submit the login form or redirect to the dashboard
      }, 2000);
    } else {
      updateFeedbackMessage("Login failed. Please try again or use manual login.");
    }
  } catch (error) {
    console.log(error);
    updateFeedbackMessage("An error occurred. Please try again or use manual login.");
  }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, waiting for user to start face recognition");
});
