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

let isSigningIn = false;

document.querySelector('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
      document.getElementById('loading-indicator').style.display = 'flex';
      isSigningIn = true;
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Sign-in successful
      window.location.href = 'main.html';
  } catch (error) {
      document.getElementById('username').value = '';
      document.getElementById('password').value = '';
      swal("LOGIN FAILED!", "USER DATA NOT FOUND!", "error");
  } finally {
      document.getElementById('loading-indicator').style.display = 'none';
      isSigningIn = false;
  }
});

document.getElementById('show-password').addEventListener('change', (e) => {
    const passwordField = document.getElementById('password');
    passwordField.type = e.target.checked ? 'text' : 'password';
});

let unsubscribeAuthStateChanged = null;

unsubscribeAuthStateChanged = onAuthStateChanged(auth, (user) => {
  const currentPath = window.location.pathname;
  console.log('Current Path:', currentPath);
  console.log('User:', user);
  if (!user && currentPath !== '/index.html' && !isSigningIn) {
    unsubscribeAuthStateChanged(); // Remove the listener
    window.location.href = 'index.html'; // Redirect to login if not authenticated
  }
});



// // Sign-out logic
// document.getElementById('index-logout').addEventListener('click', async () => {
//     try {
//         await signOut(auth);
//         console.log('User signed out successfully');
//         window.location.href = 'login.html';
//     } catch (error) {
//         console.error('Error signing out: ', error);
//     }
// });
