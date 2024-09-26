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
      await AutoLogin(result.label);
    }

    isProcessing = false;
  }
  requestAnimationFrame(processFrame);
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
