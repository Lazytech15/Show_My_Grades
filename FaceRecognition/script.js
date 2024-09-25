import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
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

// Add loading indicator
const loadingIndicators = document.createElement('div');
loadingIndicators.id = 'loading-indicators';
loadingIndicators.textContent = '.';
loadingIndicators.style.display = 'none';
document.body.appendChild(loadingIndicators);

// Function to show/hide loading indicator
function toggleLoadingIndicator(show) {
  loadingIndicators.style.display = show ? 'block' : 'none';
}

// Load models and fetch data before starting face recognition
async function initializeResources() {
  toggleLoadingIndicator(true);
  alert('Please wait while we getting some goods stuff');
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/FaceRecognition/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/FaceRecognition/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/FaceRecognition/models"),
    ]);
    console.log("Models loaded");

    faceMatcher = new faceapi.FaceMatcher(await getLabeledFaceDescriptions(), 0.6);
    console.log("Face data fetched and processed");
  } catch (error) {
    console.error("Error initializing resources:", error);
  } finally {
    toggleLoadingIndicator(false);
  }
}

// Modified startFaceRecognition function
async function startFaceRecognition() {
  try {
    await initializeResources();
    startWebcam();
    document.getElementById('faceRecognition-container').style.display = "flex";
  } catch (error) {
    console.error("Failed to start face recognition:", error);
    alert("Failed to start face recognition. Please try again.");
  }
}

// Attach event listener to the button
document.getElementById("faceRecognition-signin-button").addEventListener("click", startFaceRecognition);

function startWebcam() {
  navigator.mediaDevices
    .getUserMedia({ video: { width: 640, height: 480 } })
    .then((stream) => {
      video.srcObject = stream;
      video.onloadedmetadata = () => requestAnimationFrame(processFrame);
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

function cancelFaceRecognition() {
  stopWebcam();
  console.log("Face recognition cancelled");
}

document.getElementById('cancel-facerecognition').addEventListener('click', cancelFaceRecognition);

async function getImageUrl(label, i) {
  getTeacherAccounts();
  return await getDownloadURL(ref(storage, `/teacherIMG/${label}/${i}.png`));
}

async function fetchImage(url) {
  const response = await fetch(url);
  return await faceapi.bufferToImage(await response.blob());
}

async function getTeacherAccounts() {
  const snapshot = await getDocs(collection(db, 'teacher-account'));
  const teacherAccounts = snapshot.docs.map(doc => doc.id).sort();
  return teacherAccounts;
}

async function getTeacherData(accountId) {
  const colRef = collection(db, accountId);
  const snapshot = await getDocs(colRef);
  const documentsArray = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return documentsArray;
}

async function getLabeledFaceDescriptions() {
  // Extract email addresses (document IDs) from teacher accounts
  const teacherAccounts = await getTeacherAccounts();
  
  return Promise.all(
    teacherAccounts.map(async (accountId) => {
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
    })
  );
}

let userEmail;
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
      userEmail = result.label;
      AutoLogin();
      console.log(`Path: /teacherIMG/${result.label}`);
    }

    isProcessing = false;
  }
  requestAnimationFrame(processFrame);
}

async function AutoLogin(){
  const email = document.getElementById('username');
  const password = document.getElementById('password');

  email.value = userEmail;
  console.log(userEmail);
  password.value ="1122334455";
  document.getElementById('faceRecognition-container').style.display="none";
  
}

// Remove the initialization on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, waiting for user to start face recognition");
});