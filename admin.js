import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import { getFirestore, collection, getDocs,doc,getDoc } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

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

    async function fetchDocuments() {
      const maxRetries = 3;
      const retryDelay = 2000;
      let retries = 0;
  
      try {
        document.getElementById('pageloader-container').style.display = 'flex';
  
          while (retries < maxRetries) {
              try { 

                //create a donut

    async function getTotalAccounts() {
      const adminSnapshot = await getDocs(collection(db, 'admin-account'));
      const studentSnapshot = await getDocs(collection(db, 'student-account'));
      const teacherSnapshot = await getDocs(collection(db, 'teacher-account'));

      return {
        admin: adminSnapshot.size,
        student: studentSnapshot.size,
        teacher: teacherSnapshot.size
      };
    }

    async function renderChart() {
      const totals = await getTotalAccounts();

      document.getElementById('adminCount').textContent = totals.admin;
      document.getElementById('studentCount').textContent = totals.student;
      document.getElementById('teacherCount').textContent = totals.teacher;

      const ctx = document.getElementById('myChart').getContext('2d');
      const myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Admin Accounts', 'Student Accounts', 'Teacher Accounts'],
          datasets: [{
            label: '# of Accounts',
            data: [totals.admin, totals.student, totals.teacher],
            backgroundColor: [
              'rgba(75, 192, 192, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)'
            ],
            borderColor: [
              'rgba(75, 192, 192, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          cutout: '50%', // This creates the donut effect
        }
      });
    }

    renderChart();

    //create a linebar

    async function getAccountDates(collectionName) {
      const accountSnapshot = await getDocs(collection(db, collectionName));
      const accountDates = [];
    
      accountSnapshot.forEach(doc => {
        const data = doc.data();
        // console.log(`Document data from ${collectionName}:`, data); 
        if (data.CREATEAT) {
          accountDates.push(data.CREATEAT.toDate());
        }
      });
    
      // console.log(`Account Dates from ${collectionName}:`, accountDates); 
      return accountDates;
    }
    
    async function renderLineChart() {
      const studentCreateDates = await getAccountDates('student-account');
      const deleteAccountDates = await getAccountDates('delete-account');
    
      // Convert dates to a format suitable for charting (e.g., month and year)
      const formatDates = dates => dates.map(date => `${date.getMonth() + 1}/${date.getFullYear()}`);
      const formattedCreateDates = formatDates(studentCreateDates);
      const formattedDeleteDates = formatDates(deleteAccountDates);
    
      const countDates = dates => dates.reduce((acc, date) => {
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});
    
      const createDateCounts = countDates(formattedCreateDates);
      const deleteDateCounts = countDates(formattedDeleteDates);
    
      const createLabels = Object.keys(createDateCounts);
      const createData = Object.values(createDateCounts);
    
      const deleteLabels = Object.keys(deleteDateCounts);
      const deleteData = Object.values(deleteDateCounts);
    
      const ctx = document.getElementById('lineChart').getContext('2d');
      const lineChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [...new Set([...createLabels, ...deleteLabels])], // Combine labels
          datasets: [
            {
              label: '# of Accounts Created',
              data: createLabels.map(label => createDateCounts[label] || 0),
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
              fill: false,
              tension: 0.1
            },
            {
              label: '# of Accounts Deleted',
              data: deleteLabels.map(label => deleteDateCounts[label] || 0),
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1,
              fill: false,
              tension: 0.1
            }
          ]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  const index = context.dataIndex;
                  const date = context.dataset.label.includes('Created') ? studentCreateDates[index] : deleteAccountDates[index];
                  return `Date: ${date.toLocaleDateString()} - Count: ${context.raw}`;
                }
              }
            }
          }
        }
      });
    }
    
    renderLineChart();

    //create dynamic table

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

    async function displayStudentAccounts() {
      const studentAccounts = await getStudentAccounts();
      let allData = [];

      for (const account of studentAccounts) {
        const studentData = await getStudentData(account);
        allData = allData.concat(studentData);
      }

      createTable(allData);
    }

    function createTable(data) {

      // Define the desired order of keys
      const desiredOrder = [
        'STUDENT_NUM', 'STUDENT_NAME', 'ACADEMIC_YEAR', 'TRIMESTER', 'SECTION', 'DAY', 'TIME', 'COURSE_CODE', 'COURSE_DESCRIPTION', 
        'EMAIL', 'PRELIM_GRADE', 'MIDTERM_GRADE', 'FINAL_GRADE', 'REMARK', 'CREDIT_UNITS', 'FACULTY_NAME','ECR_NAME'
      ];

      // Rearrange the data
      const rearrangedData = data.map(row => {
        let newRow = {};
        desiredOrder.forEach(key => {
          newRow[key] = row[key] || ' ';
        });
        return newRow;
      });

      // Generate the table HTML
      let tableHtml = '<table border="1">';
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
            tableHtml += `<td data-label="${key}" contenteditable="false">${cell}</td>`;
          });
          tableHtml += '</tr>';
        });
        tableHtml += '</tbody>';
      }
      tableHtml += '</table>';
      document.getElementById('csv-table-container').innerHTML = tableHtml;
    }

    displayStudentAccounts();          
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
        document.getElementById('dashboard').style.display = 'flex';
        document.getElementById('chart-container').style.display = 'flex';
        document.getElementById('table-section').style.display = 'block';
        document.getElementById('pageloader-container').style.display = 'none';
      }
  }

  // Call fetchDocuments when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', fetchDocuments);

    