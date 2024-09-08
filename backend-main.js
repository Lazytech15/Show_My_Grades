import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import { getAuth, signOut, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC8tDVbDIrKuylsyF3rbDSSPlzsEHXqZIs",
    authDomain: "online-attendance-21f95.firebaseapp.com",
    projectId: "online-attendance-21f95",
    storageBucket: "online-attendance-21f95.appspot.com",
    messagingSenderId: "756223518392",
    appId: "1:756223518392:web:5e8d28c78f7eefb8be764d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

import { getStudentEmail } from './dataModule.js';

const studentEmail = getStudentEmail();
const adminEmail = "admin-account"; 

// Reference to the collection using the value of studentEmail
const colRef = collection(db, adminEmail);

// Array to hold the document data
let documentsArray = [];

// Function to goBack to the login page
function goBack() {
    window.location.href = "index.html";
}

// Get all documents id to the collection
async function fetchDocuments() {
    const maxRetries = 3;
    const retryDelay = 2000;
    let retries = 0;

    try {
        document.getElementById('pageloader-container').style.display = 'flex';

        while (retries < maxRetries) {
            try {
                const snapshot = await getDocs(colRef);
                let adminEmailExists = false;

                snapshot.docs.forEach((doc) => {
                    documentsArray.push({ id: doc.id, ...doc.data() });
                    if (doc.id === studentEmail) {
                        adminEmailExists = true;
                    }
                });

                if (!adminEmailExists) {
                    swal("SYSTEM NOTICE!", "Oops, you are not a teacher nor admin! redirecting to login page", "error")
                        .then(() => {
                            goBack();
                        });
                }

                break; 
            } catch (error) {
                retries++;
                if (retries === maxRetries) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    } catch (e) {
        swal("ERROR!", "Failed to fetch documents. Please try again.", "error");
    } finally {
        document.getElementById('pageloader-container').style.display = 'none';
    }
}

// Call fetchDocuments when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', fetchDocuments);


const addDataToFirestore = async () => {
  const maxRetries = 3;
  const retryDelay = 2000;

  const uploadData = async (data, retries = 0) => {
    try {
        const studentEmail = data.EMAIL;
        const courseCode = data.COURSE_CODE;
        const auth = getAuth(app);
        console.log(studentEmail);
        // Check if the email already exists in Firebase Authentication
        const existingUser = await fetchSignInMethodsForEmail(auth, studentEmail);
        let password ='password';

        if (existingUser) {
          // Email already exists, retrieve existing password from Firestore
          const userDoc = await getDoc(doc(db, studentEmail, courseCode));
          if (userDoc.exists()) {
              password = userDoc.data().PASSWORD;
              console.log(`Email ${studentEmail} already exists, using existing password: ${password}`);
          } else {
              // Reference to the collection using the value of studentEmail
              const colRef = collection(db, studentEmail);
              const querySnapshot = await getDocs(colRef);
              if (querySnapshot.docs.length > 0) {
                  // If the courseCode does not match, treat it as a new document
                  password = generateRandomPassword();
                  console.log(`Generated new password for ${studentEmail}: ${password}`);
      
                  try {
                      // Create a new password document in Firestore
                      await setDoc(doc(db, studentEmail, courseCode), { PASSWORD: password });
                      console.log("Password document created successfully in Firestore: ", studentEmail, courseCode);
                  } catch (error) {
                      console.error("Error creating password document in Firestore: ", error);
                      throw error; // Stop execution if document creation fails
                  }
              } else {
                  // Generate a new password
                  password = generateRandomPassword();
                  console.log(`Generated new password for ${studentEmail}: ${password}`);
      
                  try {
                      // Create a new user in Firebase Authentication
                      await createUserWithEmailAndPassword(auth, studentEmail, password);
                      console.log("User created successfully in Firebase Authentication: ", studentEmail);
                  } catch (error) {
                      console.error("Error creating user in Firebase Authentication: ", error);
                      throw error; // Stop execution if user creation fails
                  }
      
                  try {
                      // Create a new password document in Firestore
                      await setDoc(doc(db, studentEmail, courseCode), { PASSWORD: password });
                      console.log("Password document created successfully in Firestore: ", studentEmail, courseCode);
                  } catch (error) {
                      console.error("Error creating password document in Firestore: ", error);
                      throw error; // Stop execution if document creation fails
                  }
              }
          }
      }
       

        // Add the password to the data object
        data.PASSWORD = password;

        // Add data to Firestore
        await setDoc(doc(db, studentEmail, courseCode), data);
        console.log(`Data added successfully for ${studentEmail}`);
    } catch (e) {
        console.error(`Error on attempt ${retries + 1}: `, e);
        if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            await uploadData(data, retries + 1);
        } else {
            console.error("Error adding document after max retries: ", e);
            throw e;
        }
    }
};



  try {
      document.getElementById('loading-indicator').style.display = 'flex';
      for (const data of filteredDataArray) {
          await uploadData(data);
      }
      swal("SAVE!", "The data is saved successfully!", "success");
      resetPage();
  } catch (e) {
      swal("ERROR!", "Failed to save data. Please try again.", "error");
  } finally {
      document.getElementById('loading-indicator').style.display = 'none';
  }
};

const generateRandomPassword = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const passwordLength = 12;
  let password = '';
  for (let i = 0; i < passwordLength; i++) {
      password += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return password;
};

document.getElementById('upload-button').addEventListener('click', () => {
  addDataToFirestore();
});




document.getElementById('index-logout').addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log('User signed out successfully');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out: ', error);
    }
});

function resetPage() {
    window.filteredDataArray = [];
    document.getElementById('file-input').value = '';
    document.getElementById('csv-table-container').innerHTML = '';
    document.getElementById('save-button').style.display = "none";
    document.getElementById('edit-button').style.display = "none";
    document.getElementById('upload-button').style.display = "none";
    document.getElementById('search-bar').style.display = "none";
    document.getElementById('drop-zone').style.display = "flex";
}