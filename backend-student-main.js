import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// main.js
import { getStudentEmail } from './dataModule.js';

const studentEmail = getStudentEmail();


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

// Reference to the collection using the value of studentEmail
const colRef = collection(db, studentEmail);

// Array to hold the document data
let documentsArray = [];

// Get all documents in the collection
getDocs(colRef)
    .then((snapshot) => {
        snapshot.docs.forEach((doc) => {
            documentsArray.push({ id: doc.id, ...doc.data() });
        });
        // Call the createTable function with the documentsArray
        createTable(documentsArray);
    })
    .catch((error) => {
        console.error("Error getting documents: ", error);
    });

    document.getElementById('search-bar').addEventListener('input', filterTable);

// Function to create the table
function createTable(data) {

    // Define the desired order of keys
    const desiredOrder = [
        'STUDENT_NUM', 'STUDENT_NAME', 'SECTION', 'EMAIL', 'TRIMESTER','DAY', 'TIME', 'COURSE_CODE', 'COURSE_DESCRIPTION', 
        'PRELIM', 'MIDTERM', 'FINALS', 'CREDIT_UNITS', 'FACULTY_NAME'
    ];

    // Rearrange and filter the data
    const rearrangedData = data.map(row => {
        let newRow = {};
        desiredOrder.forEach(key => {
            newRow[key] = row[key] || ' ';
        });
        return newRow;
    });

    // Generate the table HTML
    let tableHtml = '<table>';
    if (rearrangedData.length > 0) {
        
        // Create table headers
        tableHtml += '<thead><tr>';
        desiredOrder.forEach(key => {
            tableHtml += `<th>${key}</th>`;
        });
        tableHtml += '</tr></thead>';
        
        // Create table rows
        tableHtml += '<tbody>';
        rearrangedData.forEach((row, index) => {
            tableHtml += `<tr data-index="${index}">`;
            Object.entries(row).forEach(([key, cell]) => {
                // Insert non-breaking space if cell is empty
                tableHtml += `<td data-label="${key}" contenteditable="false">${cell}</td>`;
            });
            tableHtml += '</tr>';
        });
        tableHtml += '</tbody>';
    }
    tableHtml += '</table>';
    document.getElementById('csv-table-container').innerHTML = tableHtml;
}

function filterTable() {
    const searchValue = document.getElementById('search-bar').value.toLowerCase();
    const rows = document.querySelectorAll('tbody tr');
    let found = false;
    rows.forEach(row => {
        const courseCode = row.querySelector('td[data-label="COURSE_CODE"]').textContent.toLowerCase();
        if (courseCode.includes(searchValue)) {
            row.style.display = '';
            found = true;
        } else {
            row.style.display = 'none';
        }
    });

    // Display "data not found" message if no rows are visible
    const noDataMessage = document.getElementById('no-data-message');
    if (!found) {
        swal("NOTICE!", "NO DATA FOUND!", "error");
    }
}

document.getElementById('index-logout').addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log('User signed out successfully');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out: ', error);
    }
});


