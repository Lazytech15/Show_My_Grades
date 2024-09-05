let darkmodebtn = document.getElementById('toggle_darkmode');

// toggle dark-mode
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const buttons = document.querySelectorAll('button');
    buttons.forEach(function(button) {
        button.classList.toggle('dark-mode');
    });
    darkmodebtn.style.opacity = '0';
    darkmodebtn.style.transition = 'all 0.5s';
    setTimeout(function() {
        if (darkmodebtn.src === "https://cdn-icons-png.flaticon.com/128/7645/7645197.png") {
            darkmodebtn.src = "https://cdn-icons-png.flaticon.com/128/11175/11175476.png";
        } else {
            darkmodebtn.src = "https://cdn-icons-png.flaticon.com/128/7645/7645197.png";
        }
        darkmodebtn.style.opacity = '1';
        darkmodebtn.style.transition = 'all 0.5s';
    }, 500);
  }
  //end here

//   drag and drop

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadButton = document.getElementById('upload-button');
    const saveButton = document.getElementById('save-button');
    const editButton = document.getElementById('edit-button');
    const searchBar = document.getElementById('search-bar');
    const tableContainer = document.getElementById('csv-table-container');
    window.filteredDataArray = []; // Assign to global variable

    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        fileInput.files = files;
        handleFiles(files);
    });

    fileInput.addEventListener('change', () => {
        const files = fileInput.files;
        handleFiles(files);
    });

    function handleFiles(files) {
        if (files.length > 0 && files[0].type === 'text/csv') {
            console.log('CSV file received:', files[0].name);
            dropZone.style.display = 'none';
            uploadButton.style.display = "inline";
            editButton.style.display = "inline";
            searchBar.style.display = "inline";
            Papa.parse(files[0], {
                header: true,
                complete: function(results) {
                    const cleanedData = removeEmptyRows(results.data);
                    window.filteredDataArray = filterDuplicates(cleanedData);
                    createTable(window.filteredDataArray);
                }
            });
        } else {
            console.log('Non-CSV file received:', files[0].name);
        }
    }
    
    function removeEmptyRows(data) {
        return data.filter(row => Object.values(row).some(value => value.trim() !== ""));
    }
    
    function filterDuplicates(data) {
        const uniqueRows = new Map();
        data.forEach(row => {
            const key = `${row[Object.keys(row)[0]]}-${row[Object.keys(row)[Object.keys(row).length - 1]]}`;
            if (!uniqueRows.has(key)) {
                uniqueRows.set(key, row);
            }
        });
        return Array.from(uniqueRows.values());
    }
    

    document.getElementById('search-bar').addEventListener('input', filterTable);

    function createTable(data) {
        let tableHtml = '<table>';
        if (data.length > 0) {
            // Create table headers
            tableHtml += '<thead><tr>';
            Object.keys(data[0]).forEach(key => {
                tableHtml += `<th>${key}</th>`;
            });
            tableHtml += '</tr></thead>';
            
            // Create table rows
            tableHtml += '<tbody>';
            data.forEach((row, index) => {
                tableHtml += `<tr data-index="${index}">`;
                Object.entries(row).forEach(([key, cell]) => {
                    // Insert non-breaking space if cell is empty
                    tableHtml += `<td data-label="${key}" contenteditable="false">${cell || ' '}</td>`;
                });
                tableHtml += '</tr>';
            });
            tableHtml += '</tbody>';
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
    
    function handleEdit() {
        document.querySelectorAll('td[contenteditable="false"]').forEach(td => {
            td.setAttribute('contenteditable', 'true');
        });
        document.getElementById('edit-button').style.display = 'none';
        document.getElementById('save-button').style.display = 'inline';
    }
    
    function handleSave() {
        document.querySelectorAll('tr[data-index]').forEach(row => {
            const index = row.getAttribute('data-index');
            const updatedRow = {};
            row.querySelectorAll('td[contenteditable="true"]').forEach((td, i) => {
                const key = Object.keys(window.filteredDataArray[0])[i];
                updatedRow[key] = td.textContent;
                td.setAttribute('contenteditable', 'false');
            });
            window.filteredDataArray[index] = updatedRow;
        });
        document.getElementById('edit-button').style.display = 'inline';
        document.getElementById('save-button').style.display = 'none';
        document.querySelector('table').classList.remove('glow-red'); // Remove red glow
        document.dispatchEvent(new CustomEvent('dataReady', { detail: window.filteredDataArray }));
    }
  
});











