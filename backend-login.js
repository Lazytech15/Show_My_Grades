import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

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
const db = getFirestore(app);
const auth = getAuth(app);
let isSigningIn = false;

// login.js
import { setStudentEmail } from './dataModule.js';

document.querySelector('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    document.getElementById('loading-indicator').style.display = 'flex';
    isSigningIn = true;

    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Reference to the collection using the value of studentEmail
    const colRef = collection(db, email);
    const querySnapshot = await getDocs(colRef);

    if (querySnapshot.docs.length > 0) {

      // Collection exists and has at least one document
      setStudentEmail(email);
      window.location.href = 'studentform.html';
    } else {
      
      // Collection does not exist or is empty
      setStudentEmail(email);
      window.location.href = 'main.html';
    }
  } catch (error) {
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('loading-indicator').style.display = 'none';
    swal("LOGIN FAILED!", "USER DATA NOT FOUND!", "error");
  } finally {
    isSigningIn = false;
  }
});


document.getElementById('show-password').addEventListener('change', (e) => {
    const passwordField = document.getElementById('password');
    passwordField.type = e.target.checked ? 'text' : 'password';
});

let authStateChangedHandler = null;

authStateChangedHandler = onAuthStateChanged(auth, (user) => {
  const currentPath = window.location.pathname;
  // console.log('Current Path:', currentPath);
  // console.log('User:', user);
  if (!user && currentPath !== '/index.html' && !isSigningIn) {
    offAuthStateChanged(auth, authStateChangedHandler);
    window.location.href = 'index.html';
  }
});