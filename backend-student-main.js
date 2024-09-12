import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
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

// Example usage
fetchAndLogDocuments(studentEmail);

async function fetchAndLogDocuments(studentEmail) {
    // Reference to the collection using the value of studentEmail
    const colRef = collection(db, studentEmail);
  
    // Array to hold the document data
    let documentsArray = [];
  
    try {
      // Get all documents in the collection
      const snapshot = await getDocs(colRef);
      for (const docSnap of snapshot.docs) {
        documentsArray.push({ id: docSnap.id, ...docSnap.data() });
      }
      try {
        // Create a new document in Firestore with only the document ID
        await setDoc(doc(collection(db, "data-retrieval-logs")), { CREATEAT: serverTimestamp() });
        console.log("Document created successfully in Firestore: ", studentEmail);
      } catch (error) {
        console.error("Error creating document in Firestore: ", error);
        throw error; // Stop execution if document creation fails
      }
      // Call the createTable function with the documentsArray
      createTable(documentsArray);
    } catch (error) {
      console.error("Error getting documents: ", error);
    }
  }
  
  

    document.getElementById('search-bar').addEventListener('input', filterTable);

    function createTable(data) {
        // Show loading indicator
        document.getElementById('loader-container').style.display = 'block';
    
        // Define the desired order of keys and their display names
        const desiredOrder = [
            'COURSE_CODE', 'STUDENT_NUM', 'STUDENT_NAME', 'COURSE_DESCRIPTION', 'SECTION', 'EMAIL', 'TRIMESTER', 'DAY', 'TIME',
            'PRELIM_GRADE', 'MIDTERM_GRADE', 'FINAL_GRADE', 'CREDIT_UNITS', 'FACULTY_NAME'
        ];
    
        const displayNames = {
            'COURSE_CODE': 'COURSE CODE',
            'STUDENT_NUM': 'STUDENT NUMBER',
            'STUDENT_NAME': 'STUDENT NAME',
            'COURSE_DESCRIPTION': 'COURSE DESCRIPTION',
            'SECTION': 'SECTION',
            'EMAIL': 'EMAIL',
            'TRIMESTER': 'TRIMESTER',
            'DAY': 'DAY',
            'TIME': 'TIME',
            'PRELIM_GRADE': 'PRELIM GRADE',
            'MIDTERM_GRADE': 'MIDTERM GRADE',
            'FINAL_GRADE': 'FINAL GRADE',
            'CREDIT_UNITS': 'CREDIT UNITS',
            'FACULTY_NAME': 'FACULTY NAME'
        };
    
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
                tableHtml += `<th>${displayNames[key]}</th>`;
            });
            tableHtml += '</tr></thead>';
    
            // Create table rows
            tableHtml += '<tbody>';
            rearrangedData.forEach((row, index) => {
                tableHtml += `<tr data-index="${index}">`;
                Object.entries(row).forEach(([key, cell]) => {
                    // Insert non-breaking space if cell is empty
                    tableHtml += `<td data-label="${displayNames[key]}" contenteditable="false">${cell}</td>`;
                });
                tableHtml += '</tr>';
            });
            tableHtml += '</tbody>';
        }
        tableHtml += '</table>';
        document.getElementById('csv-table-container').innerHTML = tableHtml;
    
        // Hide loading indicator
        document.getElementById('loader-container').style.display = 'none';
        document.getElementById('search-bar').style.display = 'flex';
    }
    

function filterTable() {
    const searchValue = document.getElementById('search-bar').value.toLowerCase();
    const rows = document.querySelectorAll('tbody tr');
    let found = false;
    rows.forEach(row => {
        const courseCode = row.querySelector('td[data-label="COURSE CODE"]').textContent.toLowerCase();
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


// // main.js
// import { getStudentEmail } from './dataModule.js';


// const studentEmail =getStudentEmail();

// async function fetchAndLogDocuments(studentEmail) {
//     // Reference to the collection using the value of studentEmail
//     const colRef = collection(db, studentEmail);
  
//     // Array to hold the document data
//     let documentsArray = [];
  
//     try {
//       // Get all documents in the collection
//       const snapshot = await getDocs(colRef);
//       for (const docSnap of snapshot.docs) {
//         documentsArray.push({ id: docSnap.id, ...docSnap.data() });
//         try {
//           // Create a new document in Firestore with only the document ID
//           await setDoc(doc(db, "data-retrieval-logs", studentEmail), { CREATEAT: serverTimestamp() });
//           console.log("Document created successfully in Firestore: ", studentEmail);
//         } catch (error) {
//           console.error("Error creating document in Firestore: ", error);
//           throw error; // Stop execution if document creation fails
//         }
//       }
//       // Call the createTable function with the documentsArray
//       createTable(documentsArray);
//     } catch (error) {
//       console.error("Error getting documents: ", error);
//     }
//   }
  
//   // Example usage
//   fetchAndLogDocuments(studentEmail);