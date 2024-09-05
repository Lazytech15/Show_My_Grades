import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.4/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.4/firebase-auth.js";

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
const auth = getAuth(app);

document.querySelector('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
      document.getElementById('loading-indicator').style.display = 'flex';
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Sign-in successful
  } catch (error) {
      document.getElementById('username').value = '';
      document.getElementById('password').value = '';
      swal("LOGIN FAILED!", "USER DATA NOT FOUND!", "error");
  } finally {
      document.getElementById('loading-indicator').style.display = 'none';
      window.location.href = 'main.html'; // Redirect to main.html
  }
});
document.getElementById('show-password').addEventListener('change', (e) => {
    const passwordField = document.getElementById('password');
    passwordField.type = e.target.checked ? 'text' : 'password';
});

let authStateChangedHandler = null;
let isRedirecting = false;

authStateChangedHandler = auth.onAuthStateChanged((user) => {
  const currentPath = window.location.pathname;
  console.log('Current Path:', currentPath);
  console.log('User:', user);
  if (!user && currentPath !== '/index.html' && !isRedirecting) {
    isRedirecting = true;
    window.location.href = 'index.html'; // Redirect to login if not authenticated
  }
});
