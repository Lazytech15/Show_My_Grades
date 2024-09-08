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
        // Sort data alphabetically by the first letter of the second column
        data.sort((a, b) => {
            const secondColumnA = Object.values(a)[1].toString().charAt(0).toLowerCase();
            const secondColumnB = Object.values(b)[1].toString().charAt(0).toLowerCase();
            return secondColumnA.localeCompare(secondColumnB);
        });
    
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
                    tableHtml += `<td data-column-name="${key}" data-label="${key}" contenteditable="false">${cell || ' '}</td>`;
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

    document.getElementById('edit-button').style.display = 'none';
    document.getElementById('save-button').style.display = 'inline';
    document.getElementById('delete-button').style.display = 'inline';
    document.getElementById('undo-button').style.display = 'inline';

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
}

// Function to delete selected rows
function deleteSelectedRows() {
    const rows = document.querySelectorAll('tbody tr');
    rows.forEach(tr => {
        const checkbox = tr.querySelector('td[data-action="true"] input[type="checkbox"]');
        if (checkbox && checkbox.checked) {
            deletedRows.push(tr.cloneNode(true));
            tr.remove();
        }
    });
    if (deletedRows.length > 0) {
        document.getElementById('undo-button').style.display = 'inline';
    }
}

// Function to undo the last deletion
function undoDelete() {
    if (deletedRows.length > 0) {
        const lastDeletedRow = deletedRows.pop();
        document.querySelector('tbody').appendChild(lastDeletedRow);
        if (deletedRows.length === 0) {
            document.getElementById('undo-button').style.display = 'none';
        }
    }
}

// Event listeners for delete and undo buttons
document.getElementById('delete-button').addEventListener('click', deleteSelectedRows);
document.getElementById('undo-button').addEventListener('click', undoDelete);


      
    
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

    // Filter out duplicates
    window.filteredDataArray = filterDuplicates(window.filteredDataArray);

    // Recreate the table with the filtered data
    createTable(window.filteredDataArray);

    document.getElementById('undo-button').style.display = 'none';
    document.getElementById('edit-button').style.display = 'inline';
    document.getElementById('save-button').style.display = 'none';
    document.getElementById('delete-button').style.display = 'none';
    document.querySelector('table').classList.remove('glow-red'); // Remove red glow
    document.dispatchEvent(new CustomEvent('dataReady', { detail: window.filteredDataArray }));
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
  
});











