import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
        import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
    
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