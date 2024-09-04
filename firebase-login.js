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

document.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;
  
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        window.location.href = 'main.html'; // Redirect to main.html
      })
      .catch((error) => {
        document.getElementById('username').value='';
        document.getElementById('password').value='';
        swal("LOGIN FAILD!", "USER DATA NOT FOUND!.", "error");
      });
});

document.getElementById('show-password').addEventListener('change', (e) => {
    const passwordField = document.getElementById('password');
    passwordField.type = e.target.checked ? 'text' : 'password';
});

onAuthStateChanged(auth, (user) => {
    const currentPath = window.location.pathname;
    if (!user && currentPath !== 'https://github.com/Lazytech15/Show_My_Grades/') {
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
