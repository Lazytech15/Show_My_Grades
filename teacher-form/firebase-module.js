import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

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

document.addEventListener('dataReady', (event) => {
    const filteredDataArray = event.detail;
    console.log(filteredDataArray);

    const addDataToFirestore = async () => {
        const maxRetries = 3;
        const retryDelay = 2000;

        const uploadData = async (data, retries = 0) => {
            try {
                const studentNum = data.STUDENT_NUM;
                const courseCode = data.COURSE_CODE;
                await setDoc(doc(collection(db, studentNum), courseCode), data);
            } catch (e) {
                if (retries < maxRetries) {
                    console.warn(`Retrying... (${retries + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    await uploadData(data, retries + 1);
                } else {
                    console.error("Error adding document: ", e);
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
        } catch (e) {
            swal("ERROR!", "Failed to save data. Please try again.", "error");
        } finally {
            document.getElementById('loading-indicator').style.display = 'none';
        }
    };

    const tbutton = document.getElementById('upload-button');
    tbutton.addEventListener('click', async () => {
        await addDataToFirestore();
        resetPage();
    });
});

document.getElementById('index-logout').addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log('User signed out successfully');
        window.location.href = 'login.html';
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
