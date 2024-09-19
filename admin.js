import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import { signOut,getAuth,EmailAuthProvider, reauthenticateWithCredential, deleteUser  } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, writeBatch,doc, getDoc, deleteDoc, serverTimestamp,setDoc} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

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
    firebase.initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    async function fetchDocuments() {
      const maxRetries = 3;
      const retryDelay = 2000;
      let retries = 0;
      try {
        
          while (retries < maxRetries) {
            document.getElementById('loader-container').style.display="flex";
              try { 
                
                async function getMonthlyDocumentCounts() {
                  const counts = { dataAdded: {}, logins: {}, studentAccounts: {}, totalAccounts: {} };
                  const snapshots = await getDocs(collection(db, 'student-account'));
                  const studentAccounts = snapshots.docs.map(doc => doc.id).sort();
                
                  for (let month = 0; month < 12; month++) {
                    const start = new Date(new Date().getFullYear(), month, 1);
                    const end = new Date(new Date().getFullYear(), month + 1, 1);
                    let monthlyCount = 0;
                    let loginCount = 0;
                    let studentCount = 0;
                
                    for (const accountId of studentAccounts) {
                      const colRef = collection(db, accountId);
                      const q = query(colRef, where("CREATEAT", ">=", start), where("CREATEAT", "<", end));
                      const snapshot = await getDocs(q);
                      monthlyCount += snapshot.size;
                    }
                
                    const loginRef = collection(db, 'data-retrieval-logs');
                    const loginQuery = query(loginRef, where("CREATEAT", ">=", start), where("CREATEAT", "<", end));
                    const loginSnapshot = await getDocs(loginQuery);
                    loginCount = loginSnapshot.size;
                
                    const studentRef = collection(db, 'student-account');
                    const studentQuery = query(studentRef, where("CREATEAT", ">=", start), where("CREATEAT", "<", end));
                    const studentSnapshot = await getDocs(studentQuery);
                    studentCount = studentSnapshot.size;
                
                    counts.dataAdded[month] = monthlyCount;
                    counts.logins[month] = loginCount;
                    counts.studentAccounts[month] = studentCount;
                  }
                
                  // Get total accounts data
                  const adminSnapshot = await getDocs(collection(db, 'admin-account'));
                  const studentSnapshot = await getDocs(collection(db, 'student-account'));
                  const teacherSnapshot = await getDocs(collection(db, 'teacher-account'));
                  const deleteSnapshot = await getDocs(collection(db, 'delete-account'));
                  const loginSnapshot = await getDocs(collection(db, 'data-retrieval-logs'));
                
                  counts.totalAccounts = {
                    admin: adminSnapshot.size,
                    student: studentSnapshot.size,
                    teacher: teacherSnapshot.size,
                    deleted: deleteSnapshot.size,
                    logins: loginSnapshot.size
                  };
                
                  return counts;
                }
                
                getMonthlyDocumentCounts().then(counts => {
                  // Calculate the total data added
                  const totalDataAdded = Object.values(counts.dataAdded).reduce((sum, value) => sum + value, 0);
                
                  // Display the total data added
                  document.getElementById('TdataAdded').textContent = totalDataAdded;
                
                  // Display the total accounts data
                  document.getElementById('deleteAccount').textContent = counts.totalAccounts.deleted;
                  document.getElementById('studentCount').textContent = counts.totalAccounts.student;
                  document.getElementById('teacherCount').textContent = counts.totalAccounts.teacher;
                  document.getElementById('adminCount').textContent = counts.totalAccounts.admin;
                  document.getElementById('loginCount').textContent = counts.totalAccounts.logins;
                
                  // Create the bar chart
                  createBarChart(counts);
                
                }).catch(error => {
                  console.error("Error fetching document counts: ", error);
                });
                getMonthlyDocumentCounts().then(counts => {
                
                  // Calculate the total data added
                  const totalDataAdded = Object.values(counts.dataAdded).reduce((sum, value) => sum + value, 0);
                
                  // Display the total data added
                  document.getElementById('TdataAdded').textContent = totalDataAdded;
                
                  // Display the total accounts data
                  document.getElementById('deleteAccount').textContent = counts.totalAccounts.deleted;
                  document.getElementById('studentCount').textContent = counts.totalAccounts.student;
                  document.getElementById('teacherCount').textContent = counts.totalAccounts.teacher;
                  document.getElementById('adminCount').textContent = counts.totalAccounts.admin;
                  document.getElementById('loginCount').textContent = counts.totalAccounts.logins;
                
                  // Create the bar chart
                  createBarChart(counts);
                });
                
                function createBarChart(data) {
                  const labels = ['Admin Accounts', 'Student Accounts', 'Teacher Accounts', 'Deleted Accounts', 'Student Data Added', 'Student Log-in'];
                  const totalAccountsValues = [
                    data.totalAccounts.admin,
                    data.totalAccounts.student,
                    data.totalAccounts.teacher,
                    data.totalAccounts.deleted,
                    Object.values(data.dataAdded).reduce((sum, value) => sum + value, 0),
                    data.totalAccounts.logins
                    
                  ];
                
                  const canvas = document.getElementById('line-graph');
                  canvas.width = 400;
                  canvas.height = 200;
                  const ctx = canvas.getContext('2d');
                
                  new Chart(ctx, {
                    type: 'bar',
                    data: {
                      labels: labels,
                      datasets: [
                        {
                          label: 'Total Counts',
                          data: totalAccountsValues,
                          backgroundColor: [
                            'rgba(92, 40, 255, 1)',
                            'rgba(255, 120, 0, 1)',
                            'rgba(255, 0, 255, 1)',
                            'rgba(255, 0, 0, 1)',
                            'rgba(100, 255, 0, 1)',
                            'rgba(0, 255, 255, 1)'
                          ],
                          borderColor: [
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)',
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)'
                          ],
                          borderWidth: 1
                        }
                      ]
                    },
                    options: {
                      responsive: false, 
                      title: {
                        display: true,
                        text: 'Total Accounts and Data Added'
                      },
                      scales: {
                        x: {
                          display: true,
                          title: {
                            display: true,
                            text: 'Data Gathered'
                          }
                        },
                        y: {
                          display: true,
                          title: {
                            display: true,
                            text: 'Count'
                          },
                          beginAtZero: true
                        }
                      }
                    }
                  });
                }
    
    getMonthlyDocumentCounts();
    

    //create dynamic table
    window.filteredDataArray = []; 

    async function getStudentAccounts() {
      const snapshot = await getDocs(collection(db, 'student-account'));
      const studentAccounts = snapshot.docs.map(doc => doc.id).sort();
      return studentAccounts;
    }
    
    async function getStudentData(accountId) {
      const colRef = collection(db, accountId);
      const snapshot = await getDocs(colRef);
      const documentsArray = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return documentsArray;
    }
    
    window.filteredDataArray = [];
    
    async function displayStudentAccounts() {
      try {
        const studentAccounts = await getStudentAccounts();
        let allData = [];
    
        // Fetch student data in parallel
        const promises = studentAccounts.map(account => getStudentData(account));
        const results = await Promise.all(promises);
    
        results.forEach(studentData => {
          allData = allData.concat(studentData);
        });
        window.filteredDataArray = allData;
        createTable(allData);
      } catch (error) {
        console.error("Error fetching student accounts:", error);
      } finally {
      }
    }
    
    function createTable(data) {
      const desiredOrder = [
        'STUDENT_NUM', 'STUDENT_NAME', 'ACADEMIC_YEAR', 'PROGRAM', 'TRIMESTER', 'SECTION', 'DAY', 'TIME',
        'COURSE_CODE', 'COURSE_DESCRIPTION', 'EMAIL', 'PRELIM_GRADE', 'MIDTERM_GRADE', 'FINAL_GRADE',
        'REMARK', 'CREDIT_UNITS', 'FACULTY_NAME', 'ECR_NAME'
      ];
    
      // Sort data alphabetically by the first letter of the second column
      data.sort((a, b) => {
        const secondColumnA = Object.values(a)[1]?.toString().charAt(0).toLowerCase() || '';
        const secondColumnB = Object.values(b)[1]?.toString().charAt(0).toLowerCase() || '';
        return secondColumnA.localeCompare(secondColumnB);
      });
    
      let tableHtml = '<table id="dynamic-table">';
      if (data.length > 0) {
        // Create table headers according to desired order
        tableHtml += '<thead><tr>';
        desiredOrder.forEach(key => {
          tableHtml += `<th>${key}</th>`;
        });
        tableHtml += '</tr></thead>';
    
        // Create table rows according to desired order
        tableHtml += '<tbody>';
        data.forEach((row, index) => {
          tableHtml += `<tr data-index="${index}">`;
          desiredOrder.forEach(key => {
            const cell = row[key] || ' ';
            tableHtml += `<td data-column-name="${key}" data-label="${key}" contenteditable="false">${cell}</td>`;
          });
          tableHtml += '</tr>';
        });
        tableHtml += '</tbody>';
      } else {
        tableHtml += '<tbody><tr><td colspan="100%">No data available</td></tr></tbody>';
      }
      tableHtml += '</table>';
      document.getElementById('csv-table-container').innerHTML = tableHtml;
    
      // Add event listeners for edit and save buttons
      document.getElementById('edit-button').addEventListener('click', handleEdit);
      document.getElementById('save-button').addEventListener('click', handleSave);
      document.dispatchEvent(new CustomEvent('dataReady', { detail: window.filteredDataArray }));
    
      // Add event listener to each td for red corner effect
      document.querySelectorAll('td').forEach(td => {
        td.addEventListener('click', () => {
          td.classList.toggle('red-corner');
        });
      });
    }
    
    // Add event listener to your add row button
    document.getElementById('add-row-button').addEventListener('click', handleAddRow);
    
    
    // Call displayStudentAccounts when the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', displayStudentAccounts);

displayStudentAccounts();

//Handle Delete Section
let deletedRows = [];

function handleEdit() {
    // Check if the SELECT OR MARK column header already exists
    if (!document.querySelector('th[data-action="true"]')) {
        const actionTh = document.createElement('th');
        actionTh.textContent = 'MARK';
        actionTh.setAttribute('data-action', 'true');
        document.querySelector('thead tr').insertBefore(actionTh, document.querySelector('thead tr').firstChild);
    }

    document.querySelectorAll('td[contenteditable="false"]').forEach(td => {
        const columnName = td.getAttribute('data-column-name');
        td.setAttribute('contenteditable', 'true');
        
        if (['PRELIM_GRADE', 'MIDTERM_GRADE', 'FINAL_GRADE'].includes(columnName)) {
            // Add input validation event listeners
            td.addEventListener('blur', function() {
                const allowedValues = ["INC", "N/A", "OD", "UW", "NA", "UD"];
                const inputValue = this.textContent.trim();

                if (!allowedValues.includes(inputValue) && isNaN(inputValue)) {
                    alert("Random characters or text are not allowed. Please check the input guide below by scrolling down.");
                    this.textContent = '';
                    const symbolTextElement = document.getElementById('symbol-text');
                    if (symbolTextElement) {
                        symbolTextElement.scrollIntoView();
                    }
                } else if (!isNaN(inputValue)) {
                    let numericValue = parseFloat(inputValue);
                    if (numericValue >= 100 && numericValue <= 500) {
                        this.textContent = (numericValue / 100).toFixed(2);
                    } else if (numericValue > 5.00) {
                        alert("Please make sure that the data you entered is based on the grades that the teacher gave.");
                        this.textContent = '';
                    } else {
                        this.textContent = numericValue.toFixed(2);
                    }
                }
            });
        }
    });


    // Add checkbox to each row if not already added
    document.querySelectorAll('tbody tr').forEach(tr => {
        if (!tr.querySelector('td[data-action="true"]')) {
            const actionTd = document.createElement('td');
            actionTd.setAttribute('data-action', 'true');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            actionTd.appendChild(checkbox);
            tr.insertBefore(actionTd, tr.firstChild);
        }
    });
    document.getElementById('undo-button').style.display = 'inline';
    document.getElementById('update-button').style.display = 'inline';
    document.getElementById('save-button').style.display = 'inline';
    document.getElementById('delete-button').style.display = 'inline';
    document.getElementById('closebtn').style.display = 'inline';
}

// Function to delete selected rows
function deleteSelectedRows() {
  const rows = document.querySelectorAll('tbody tr');
  rows.forEach(tr => {
      const checkbox = tr.querySelector('td[data-action="true"] input[type="checkbox"]');
      if (checkbox && checkbox.checked) {
          const index = tr.getAttribute('data-index');
          const email = tr.querySelector('td[data-column-name="EMAIL"]').textContent;
          const courseCode = tr.querySelector('td[data-column-name="COURSE_CODE"]').textContent;
          deletedRows.push({ row: tr.cloneNode(true), index: index, email: email, courseCode: courseCode });
          tr.remove();
      }
  });
  if (deletedRows.length > 0) {
      document.getElementById('undo-button').style.display = 'inline';
  }
}

function undoDelete() {
  if (deletedRows.length > 0) {
      const lastDeleted = deletedRows.pop();
      document.querySelector('tbody').appendChild(lastDeleted.row);
      if (deletedRows.length === 0) {
          document.getElementById('undo-button').style.display = 'none';
      }
  }
}

//end-here
 
//Handle add row
function handleAddRow() {
  const table = document.getElementById('dynamic-table'); // Reference the dynamically created table

  if (!table || table.tagName !== 'TABLE') {
    console.error('The specified element is not a table.');
    return;
  }

  const newRow = table.insertRow();

  // Define the columns that can be empty
  const emptyColumns = ['PRELIM_GRADE', 'MIDTERM_GRADE', 'FINAL_GRADE'];

  // Add cells to the new row
  const columns = ['STUDENT_NUM', 'STUDENT_NAME', 'ACADEMIC_YEAR', 'PROGRAM', 'TRIMESTER', 'SECTION', 'DAY', 'TIME',
    'COURSE_CODE', 'COURSE_DESCRIPTION', 'EMAIL', 'PRELIM_GRADE', 'MIDTERM_GRADE', 'FINAL_GRADE',
    'REMARK', 'CREDIT_UNITS', 'FACULTY_NAME', 'ECR_NAME']; // Add other columns as needed
  columns.forEach(column => {
    const newCell = newRow.insertCell();
    const input = document.createElement('input');
    input.type = 'text';
    input.name = column;
    input.placeholder = column;
    input.style.fontFamily = '"Open Sans", sans-serif';
    input.style.textAlign = "center";
    input.style.fontWeight = '700';
    input.style.borderRadius = '2px';
    input.style.borderStyle = 'none';
    input.style.margin = '5px';
    input.style.padding = '5px';
    input.style.outline = 'none';
    newCell.appendChild(input);

    // Add input validation for specific columns
    if (['PRELIM_GRADE', 'MIDTERM_GRADE', 'FINAL_GRADE'].includes(column)) {
      input.addEventListener('blur', function() {
        const allowedValues = ["INC", "N/A", "OD", "UW", "NA", "UD"];
        const inputValue = this.value.trim();

        if (!allowedValues.includes(inputValue) && isNaN(inputValue)) {
          alert("Random characters or text are not allowed. Please check the input guide below by scrolling down.");
          this.value = '';
          const symbolTextElement = document.getElementById('symbol-text');
          if (symbolTextElement) {
            symbolTextElement.scrollIntoView();
          }
        } else if (!isNaN(inputValue)) {
          let numericValue = parseFloat(inputValue);
          if (numericValue >= 100 && numericValue <= 500) {
            this.value = (numericValue / 100).toFixed(2);
          } else if (numericValue > 5.00) {
            alert("Please make sure that the data you entered is based on the grades that the teacher gave.");
            this.value = '';
          } else {
            this.value = numericValue.toFixed(2);
          }
        }
      });
    }
  });

  // Show the save button and hide the add button
  document.getElementById('add-row-button').style.display = 'none';
  document.getElementById('row-save-button').style.display = 'inline';

  // Add event listener to the save button
  document.getElementById('row-save-button').onclick = () => {
    const inputs = newRow.querySelectorAll('input');
    let allFilled = true;

    inputs.forEach(input => {
      if (!emptyColumns.includes(input.name) && input.value.trim() === '') {
        allFilled = false;
      }
    });

    if (allFilled) {
      // Save the data
      const updatedRow = {};
      inputs.forEach(input => {
        const cell = input.parentElement;
        const key = input.name;
        updatedRow[key] = input.value;
        cell.textContent = input.value;
      });

      // Add the new row to the filteredDataArray
      window.filteredDataArray.push(updatedRow);

      alert('Row saved successfully!');

      // Hide the save button and show the add button
      document.getElementById('add-row-button').style.display = 'inline';
      document.getElementById('row-save-button').style.display = 'none';

      // Update the array and recreate the table
      handleSave();
      handleUpdate();
    } else {
      alert('Please fill in all required fields.');
    }
  };
}

//Handle Save

function handleSave() {
  document.querySelectorAll('tr[data-index]').forEach(row => {
    const index = row.getAttribute('data-index');
    const updatedRow = {};
    row.querySelectorAll('td').forEach(td => {
      const key = td.getAttribute('data-column-name');
      updatedRow[key] = td.textContent;
      td.setAttribute('contenteditable', 'false');
    });
    window.filteredDataArray[index] = updatedRow;
  });

  // Remove deleted rows from window.filteredDataArray
  deletedRows.forEach(deleted => {
    delete window.filteredDataArray[deleted.index];
  });

  // Filter out duplicates
  window.filteredDataArray = filterDuplicates(window.filteredDataArray);

  // Recreate the table with the filtered data
  createTable(window.filteredDataArray);
  document.dispatchEvent(new CustomEvent('dataReady', { detail: window.filteredDataArray }));
  console.log(window.filteredDataArray);
}

// Add event listener to your add row button
document.getElementById('add-row-button').addEventListener('click', handleAddRow);


//Handle Update Section
async function handleUpdate() {
  const maxRetries = 3;
  let retries = 0;
  
  try {
    
  
    while (retries < maxRetries) {
      
      try {
        const batch = writeBatch(db); // Create a batch for atomic writes
  
        for (const row of document.querySelectorAll('tr[data-index]')) {
          const index = row.getAttribute('data-index');
          const updatedRow = window.filteredDataArray[index];
          const email = updatedRow['EMAIL'];
          const courseCode = updatedRow['COURSE_CODE'];
  
          // Construct the document path using EMAIL and COURSE_CODE
          const collectionName = `${email}`;
          const documentID = `${courseCode}`;
          const docRef = doc(db, collectionName, documentID);
  
          // Add the CREATEAT field to the updatedRow
          updatedRow.CREATEAT = serverTimestamp();
  
          // Update the document in Firestore
          batch.set(docRef, updatedRow, { merge: true });
        }
  
        // Commit the batch
        await batch.commit();
        swal("SAVE!", "The data is saved successfully!", "success").then(() => {
        });
  
        // Handle deletions
        if (deletedRows.length > 0) {
          if (confirm('Are you sure you want to delete the selected rows? This action cannot be undone.')) {
            for (const deleted of deletedRows) {
              const docRef = doc(db, deleted.email, deleted.courseCode);
              await deleteDoc(docRef);

              // Additional deleteDoc for student-account collection
              // const studentAccountDocRef = doc(db, 'student-account', deleted.email);
              // await deleteDoc(studentAccountDocRef);
            }
            deletedRows = [];
            document.getElementById('undo-button').style.display = 'none';
          }
        }
        displayStudentAccounts();
        break;
      } catch (error) {
        retries++;
        if (retries === maxRetries) {
          throw error; // Rethrow the error if max retries reached
        }
      }
    }
  } catch (error) {
    console.error("Error updating documents: ", error);
    swal("ERROR!", "There was an error saving the data.", "error");
    // Hide loading indicator
  }
  
  document.getElementById('undo-button').style.display = 'none';
  document.getElementById('update-button').style.display = 'none';
  document.getElementById('save-button').style.display = 'none';
  document.getElementById('delete-button').style.display = 'none';
  document.getElementById('closebtn').style.display = 'none';

}

//end-here

function filterDuplicates(data) {
  const uniqueRows = new Map();
  data.forEach(row => {
    const key = Object.values(row).join('-');
    if (!uniqueRows.has(key)) {
      uniqueRows.set(key, row);
    }
  });
  return Array.from(uniqueRows.values());
}


// Event listeners for delete and undo buttons
document.getElementById('delete-button').addEventListener('click', deleteSelectedRows);
document.getElementById('undo-button').addEventListener('click', undoDelete);
document.getElementById('update-button').addEventListener('click', handleUpdate);      
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
        document.getElementById('chart-container').style.display = 'flex';
        document.getElementById('table-section').style.display = 'block';
        document.getElementById('loader-container').style.display="none";
      }
  }

  // Call fetchDocuments when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', fetchDocuments);

function closeBtn(){
  document.getElementById('undo-button').style.display = 'none';
  document.getElementById('update-button').style.display = 'none';
  document.getElementById('save-button').style.display = 'none';
  document.getElementById('delete-button').style.display = 'none';
  document.getElementById('closebtn').style.display = 'none';
  
}
document.getElementById('closebtn').addEventListener('click', closeBtn);

function filterTable() {
  const searchValue = document.getElementById('search-bar').value.toLowerCase();
  const rows = document.querySelectorAll('tbody tr');
  let found = false;
  rows.forEach(row => {
      const studentNum = row.querySelector('td[data-label="STUDENT_NUM"]').textContent.toLowerCase();
      if (studentNum.includes(searchValue)) {
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

document.getElementById('search-bar').addEventListener('input', filterTable);

document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
      await signOut(auth);
      console.log('User signed out successfully');
      window.location.href = 'index.html';
  } catch (error) {
      console.error('Error signing out: ', error);
  }
});


// Define header mapping globally
const headerMapping = {
  'TeacherName': 'TEACHER NAME',
  'Email': 'EMAIL',
  'Campus': 'CAMPUS',
  'teacherpass': 'TEACHER PASSWORD'
};

// Function to get all teacher accounts
async function getTeacherAccounts() {
  const snapshot = await getDocs(collection(db, 'teacher-account'));
  const teacherAccounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log('Teacher Accounts:', teacherAccounts); // Log the fetched data
  return teacherAccounts;
}

// Function to display teacher accounts
async function displayTeacherAccounts() {
  try {
    const teacherAccounts = await getTeacherAccounts();
    createTeacherTable(teacherAccounts);
  } catch (error) {
    console.error("Error fetching teacher accounts:", error);
  } finally {
  }
}

// Function to create the teacher table
function createTeacherTable(data) {
  const tableContainer = document.getElementById('teacher-table-container');
  const desiredOrder = ['TeacherName', 'Email', 'Campus', 'teacherpass'];
  const headerMapping = {
    TeacherName: 'Teacher Name',
    Email: 'Email',
    Campus: 'Campus',
    teacherpass: 'Password'
  };

  // Check if data is empty
  if (data.length === 0) {
    tableContainer.style.display = 'none';
    return;
  } else {
    tableContainer.style.display = 'block';
  }

  // Sort data alphabetically by the first letter of the second column
  data.sort((a, b) => {
    const secondColumnA = Object.values(a)[1]?.toString().charAt(0).toLowerCase() || '';
    const secondColumnB = Object.values(b)[1]?.toString().charAt(0).toLowerCase() || '';
    return secondColumnA.localeCompare(secondColumnB);
  });

  let tableHtml = '<table id="dynamic-teacher-table">'; // Assign an ID to the table
  if (data.length > 0) {
    // Create table headers according to desired order
    tableHtml += '<thead><tr>';
    desiredOrder.forEach(key => {
      tableHtml += `<th style="text-wrap: nowrap; font-family:Open Sans, sans-serif;">${headerMapping[key]}</th>`;
    });
    tableHtml += '<th style="text-wrap: nowrap; font-family:Open Sans, sans-serif;">ACTIONS</th>'; // Add Actions header
    tableHtml += '</tr></thead>';

    // Create table rows according to desired order
    tableHtml += '<tbody>';
    data.forEach((row, index) => {
      tableHtml += `<tr data-index="${index}">`;
      desiredOrder.forEach(key => {
        const cell = row[key] || ' ';
        if (key === 'teacherpass') {
          tableHtml += `<td style="padding: 5px; font-family:Roboto Slab, sans-serif;" data-column-name="${key}" data-label="${headerMapping[key]}" contenteditable="false">
                          <span class="password-hidden">••••••••</span>
                          <span class="password-visible" style="display:none;">${cell}</span>
                        </td>`;
        } else {
          tableHtml += `<td style="padding: 5px; font-family:Roboto Slab, sans-serif;" data-column-name="${key}" data-label="${headerMapping[key]}" contenteditable="false">${cell}</td>`;
        }
      });
      tableHtml += `<td style="padding: 5px; font-family:Roboto Slab, sans-serif;">
                      <button class="edit-btn">Edit</button>
                      <button class="delete-btn" id="delete-btn">Delete</button>
                    </td>`;
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody>';
  } else {
    tableHtml += '<tbody><tr><td colspan="100%">No data available</td></tr></tbody>';
  }
  tableHtml += '</table>';
  document.getElementById('teacher-table-container').innerHTML = tableHtml;

  // Function to add mouseenter and mouseleave listeners
  function addHoverListeners() {
    document.querySelectorAll('td[data-column-name="teacherpass"]').forEach(td => {
      td.addEventListener('mouseenter', showPassword);
      td.addEventListener('mouseleave', hidePassword);
    });
  }

  // Function to remove mouseenter and mouseleave listeners
  function removeHoverListeners() {
    document.querySelectorAll('td[data-column-name="teacherpass"]').forEach(td => {
      td.removeEventListener('mouseenter', showPassword);
      td.removeEventListener('mouseleave', hidePassword);
    });
  }

  // Show password function
  function showPassword() {
    const passwordHidden = this.querySelector('.password-hidden');
    const passwordVisible = this.querySelector('.password-visible');
    passwordVisible.style.display = 'inline';
    passwordHidden.style.display = 'none';
  }

  // Hide password function
  function hidePassword() {
    const passwordHidden = this.querySelector('.password-hidden');
    const passwordVisible = this.querySelector('.password-visible');
    passwordVisible.style.display = 'none';
    passwordHidden.style.display = 'inline';
  }

  // Add initial hover listeners
  addHoverListeners();

  // Add event listeners to "Edit" buttons
  document.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', function() {
      const row = this.closest('tr');
      row.querySelectorAll('td[data-column-name]').forEach(cell => {
        cell.setAttribute('contenteditable', 'true');
      });

      // Make the password visible and remove hover listeners
      const passwordCell = row.querySelector('td[data-column-name="teacherpass"]');
      if (passwordCell) {
        const passwordHidden = passwordCell.querySelector('.password-hidden');
        const passwordVisible = passwordCell.querySelector('.password-visible');
        if (passwordHidden && passwordVisible) {
          passwordHidden.remove();
          passwordVisible.style.display = 'inline';
        }
        removeHoverListeners();
      }

      this.textContent = 'Save';
      this.classList.remove('edit-btn');
      this.classList.add('save-btn');
      addSaveListener(this);
    });
  });


// Function to add save listener to save button
function addSaveListener(button) {
  button.addEventListener('click', async function() {
    try {
      const row = this.closest('tr');
      const updatedData = {};
      row.querySelectorAll('td[data-column-name]').forEach(cell => {
        const columnName = cell.getAttribute('data-column-name');
        if (columnName === 'teacherpass') {
          const passwordVisible = cell.querySelector('.password-visible');
          updatedData[columnName] = passwordVisible.textContent;
        } else {
          updatedData[columnName] = cell.textContent;
        }
        cell.setAttribute('contenteditable', 'false');
      });

      // Check if the email already exists in the table
      const existingRow = Array.from(document.querySelectorAll('td[data-column-name="Email"]'))
        .find(td => td.textContent.trim() === updatedData.Email);
      if (existingRow) {
        // Update the existing row
        const existingRowParent = existingRow.closest('tr');
        existingRowParent.querySelectorAll('td[data-column-name]').forEach(cell => {
          const columnName = cell.getAttribute('data-column-name');
          if (columnName === 'teacherpass') {
            const passwordVisible = cell.querySelector('.password-visible');
            passwordVisible.textContent = updatedData[columnName];
          } else {
            cell.textContent = updatedData[columnName];
          }
        });
      } else {
        // Append the new data to the table
        appendTeacherToTable(updatedData);
      }

      // Get the email and password from the row
      const email = row.querySelectorAll('td')[1].textContent.trim();
      let password = row.querySelectorAll('td')[3].textContent.trim();
      password = password.trim();
      console.log(password);

      // Prompt the user for the current password
      const currentPassword = prompt("Please enter the current password:");
      if (!currentPassword) {
        throw new Error("Current password is required to update the account.");
      }

      // Sign in the user with the email and current password
      const auth = firebase.auth();
      await auth.signInWithEmailAndPassword(email, currentPassword);

      // Update Firestore and Firebase Authentication
      updatedData.teacherpass = password;
      await updateTeacherAccount(updatedData, currentPassword);

      // Restore hover listeners and add password-hidden span back
      const passwordCell = row.querySelector('td[data-column-name="teacherpass"]');
      if (passwordCell) {
        const passwordVisible = passwordCell.querySelector('.password-visible');
        if (passwordVisible) {
          const passwordHidden = document.createElement('span');
          passwordHidden.className = 'password-hidden';
          passwordHidden.textContent = '••••••••';
          passwordCell.insertBefore(passwordHidden, passwordVisible);
          passwordVisible.style.display = 'none';
          addHoverListeners();
        }
      }

      // Update the button text and class
      this.textContent = 'Edit';
      this.classList.remove('save-btn');
      this.classList.add('edit-btn');
    } catch (error) {
      console.error("Error updating teacher data:", error);
      swal("Error!", "Failed to update teacher data. Please try again.", "error");
    }
  });
}
async function updateTeacherAccount(updatedData, oldpassword) {
  try {
    const email = updatedData.Email;
    const password = updatedData.teacherpass;


    console.log(email);

    // Check if the email is not null or undefined
    if (!email) {
      throw new Error("Email is required to update the account.");
    }

    // Check if the password is not null or undefined
    if (!password) {
      throw new Error("Password is required to update the account.");
    }
    console.log(oldpassword);

    const auth = firebase.auth();
    await auth.signInWithEmailAndPassword(email, oldpassword);

    const user = auth.currentUser;

    // Update Firestore
    await setDoc(doc(db, "teacher-account", email), { ...updatedData, teacherpass: password }, { merge: true });

    // Update email if it has changed
    if (user.email !== email) {
      await user.updateEmail(email);
    }

    // Update password if it has changed
    if (password) {
      await user.updatePassword(password);
    }

    swal("SAVE!", "Teacher data updated successfully!", "success");
  } catch (error) {
    console.error("Error updating document in Firestore: ", error);
    swal("Error!", "Failed to update teacher data. Please try again.", "error");
  }
}




  // Function to add delete listener to delete button
  function addDeleteListener(button) {
    button.addEventListener('click', function() {
      const row = this.closest('tr');
      const email = row.querySelectorAll('td')[1].textContent;
      const password = row.querySelector('.password-visible').textContent;

      if (confirm('Are you sure you want to delete this account?')) {
        // Remove the row from the table
        row.remove();

        // Delete the account from Firebase Authentication
        deleteAccountFromFirebase(email, password);

        // Delete the document from Firestore
        deleteDocumentFromFirestore(email);
      }
    });
  }

  // Function to delete account from Firebase Authentication
  function deleteAccountFromFirebase(email, password) {
    const auth = firebase.auth();
    auth.signInWithEmailAndPassword(email, password)
      .then(userCredential => {
        const user = userCredential.user;
        user.delete()
          .then(() => {
            swal("DELETED!", "Teacher account deleted successfully!", "success");
            displayTeacherAccounts();
          })
          .catch(error => {
            console.error('Error deleting account:', error);
          });
      })
      .catch(error => {
        console.error('Error signing in:', error);
      });
  }

  // Function to delete document from Firestore
  function deleteDocumentFromFirestore(email) {
    const db = firebase.firestore();
    const docRef = db.collection('teacher-account').doc(email);
    docRef.delete()
      .then(() => {
        console.log('Document successfully deleted!');
        
      })
      .catch(error => {
        console.error('Error removing document: ', error);
      });
  }

  // Add event listeners to "Delete" buttons
  document.querySelectorAll('.delete-btn').forEach(button => {
    addDeleteListener(button);
  });

  
  function appendTeacherToTable(teacherData) {
    
  
      const newRow = tbody.insertRow();
  
      const desiredOrder = ['TeacherName', 'Email', 'Campus', 'teacherpass'];
      desiredOrder.forEach((key) => {
        const newCell = newRow.insertCell();
        if (key === 'teacherpass') {
          newCell.innerHTML = `<span class="password-hidden">••••••••</span>
                               <span class="password-visible" style="display:none;">${teacherData[key]}</span>`;
          newCell.addEventListener('mouseenter', function() {
            this.querySelector('.password-hidden').style.display = 'none';
            this.querySelector('.password-visible').style.display = 'inline';
          });
          newCell.addEventListener('mouseleave', function() {
            this.querySelector('.password-hidden').style.display = 'inline';
            this.querySelector('.password-visible').style.display = 'none';
          });
        } else {
          newCell.textContent = teacherData[key] || ' ';
        }
        newCell.setAttribute('data-column-name', key);
        newCell.setAttribute('data-label', headerMapping[key]);
        newCell.setAttribute('contenteditable', 'false');
      });
  
      const actionCell = newRow.insertCell();
      actionCell.innerHTML = `<button class="edit-btn">Edit</button>
                              <button class="delete-btn">Delete</button>`;
  
      // Add event listener to the new "Delete" button
      newRow.querySelector('.delete-btn').addEventListener('click', function() {
        const row = this.closest('tr');
        const email = row.querySelector('td[data-column-name="Email"]').textContent;
        const password = row.querySelector('.password-visible').textContent;
  
        if (confirm('Are you sure you want to delete this account?')) {
          // Remove the row from the table
          row.remove();
  
          // Delete the account from Firebase Authentication
          deleteAccountFromFirebase(email, password);
  
          // Delete the document from Firestore
          deleteDocumentFromFirestore(email);
        }
      });
  
      // Add event listener to the new "Edit" button
      newRow.querySelector('.edit-btn').addEventListener('click', function() {
        const row = this.closest('tr');
        row.querySelectorAll('td[data-column-name]').forEach(cell => {
          cell.setAttribute('contenteditable', 'true');
        });
  
        // Make the password visible and remove hover listeners
        const passwordCell = row.querySelector('td[data-column-name="teacherpass"]');
        if (passwordCell) {
          const passwordHidden = passwordCell.querySelector('.password-hidden');
          const passwordVisible = passwordCell.querySelector('.password-visible');
          if (passwordHidden && passwordVisible) {
            passwordHidden.remove();
            passwordVisible.style.display = 'inline';
          }
        }
  
        this.textContent = 'Save';
        this.classList.remove('edit-btn');
        this.classList.add('save-btn');
        addSaveListener(this);
      });
    
  }
  
}


// Function to create a new teacher account
async function CreateTeacherAccount() {
  try {
    // Ensure variables are defined
    const teacherNameElement = document.getElementById('teachername');
    const emailElement = document.getElementById('email');
    const campusElement = document.getElementById('campus');
    const teacherpassElement = document.getElementById('password');

    const teacherName = teacherNameElement.value;
    const email = emailElement.value;
    const campus = campusElement.value;
    const teacherpass = teacherpassElement.value;

    console.log("Creating user with email:", email);
    // Store additional user information in Firestore
    await setDoc(doc(db, "teacher-account", email), {
      CREATEAT: serverTimestamp(),
      TeacherName: teacherName,
      Email: email,
      Campus: campus,
      teacherpass: teacherpass
    });
    swal("SAVE!", "Teacher Registration Success!", "success");

    // Create user with Firebase Authentication
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, teacherpass);
    const user = userCredential.user;

    // Clear the input fields
    teacherNameElement.value = "";
    emailElement.value = "";
    campusElement.value = "";
    teacherpassElement.value = "";

    // Update the table with the new teacher data
    const newTeacherData = {
      TeacherName: teacherName,
      Email: email,
      Campus: campus,
      teacherpass: teacherpass
    };
    appendTeacherToTable(newTeacherData);

  } catch (error) {
    console.error("Error creating document in Firestore: ", error);
    swal("Error!", "Failed to register teacher. Please try again.", "error");
  }
}


document.getElementById('teacher-save').addEventListener('click', CreateTeacherAccount);

// Call the function to display teacher accounts
displayTeacherAccounts();


// Function to append a new teacher to the table
function appendTeacherToTable(teacherData) {
  try {
    displayTeacherAccounts();
    const table = document.getElementById('dynamic-teacher-table');

    if (!table) {
      console.warn('Table element not found.');
      return;
    }
    
  const newRow = table.insertRow();

  const desiredOrder = ['TeacherName', 'Email', 'Campus', 'teacherpass'];
  desiredOrder.forEach((key) => {
    const newCell = newRow.insertCell();
    if (key === 'teacherpass') {
      newCell.innerHTML = `<span class="password-hidden">••••••••</span>
                           <span class="password-visible" style="display:none;">${teacherData[key]}</span>`;
      newCell.addEventListener('mouseenter', function() {
        this.querySelector('.password-hidden').style.display = 'none';
        this.querySelector('.password-visible').style.display = 'inline';
      });
      newCell.addEventListener('mouseleave', function() {
        this.querySelector('.password-hidden').style.display = 'inline';
        this.querySelector('.password-visible').style.display = 'none';
      });
    } else {
      newCell.textContent = teacherData[key] || ' ';
    }
    newCell.setAttribute('data-column-name', key);
    newCell.setAttribute('data-label', headerMapping[key]);
    newCell.setAttribute('contenteditable', 'false');
  });

  const actionCell = newRow.insertCell();
  actionCell.innerHTML = `<button class="edit-btn">Edit</button>
                          <button class="delete-btn">Delete</button>`;

  // Add event listener to the new "Delete" button
  newRow.querySelector('.delete-btn').addEventListener('click', function() {
    const row = this.closest('tr');
    const email = row.querySelector('td[data-column-name="Email"]').textContent;
    const password = row.querySelector('.password-visible').textContent;

    if (confirm('Are you sure you want to delete this account?')) {
      // Remove the row from the table
      row.remove();

      // Delete the account from Firebase Authentication
      deleteAccountFromFirebase(email, password);

      // Delete the document from Firestore
      deleteDocumentFromFirestore(email);
    }
  });

  // Add event listener to the new "Edit" button
  newRow.querySelector('.edit-btn').addEventListener('click', function() {
    const row = this.closest('tr');
    row.querySelectorAll('td[data-column-name]').forEach(cell => {
      cell.setAttribute('contenteditable', 'true');
    });

    // Make the password visible and remove hover listeners
    const passwordCell = row.querySelector('td[data-column-name="teacherpass"]');
    if (passwordCell) {
      const passwordHidden = passwordCell.querySelector('.password-hidden');
      const passwordVisible = passwordCell.querySelector('.password-visible');
      if (passwordHidden && passwordVisible) {
        passwordHidden.remove();
        passwordVisible.style.display = 'inline';
      }
    }

    this.textContent = 'Save';
    this.classList.remove('edit-btn');
    this.classList.add('save-btn');
    addSaveListener(this);
  });
  } catch (error) {
    console.error('Error creating document in Firestore:', error);
    displayTeacherAccounts();
  }
}