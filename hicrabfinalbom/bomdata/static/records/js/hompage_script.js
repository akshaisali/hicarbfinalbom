document.addEventListener('DOMContentLoaded', function () {
    const bomSelect = document.getElementById('bom-select');
    const itemDetailsDiv = document.getElementById('item-details');
    const purposeButtonsContainer = document.getElementById('purpose-buttons-container');
    const componentButtonsContainer = document.getElementById('component-buttons-container');

    const makeChoices = [
        "------", "Pusher", "Cumi", "Cumi (Premier)", "Dimond", "Fenner", "Emarco", "Nu Tech", "Lovejoy",
        "Audco", "NTN", "Raicer", "Legris", "Delta", "Vanaz", "Avcon", "IEPL", "Champion Coolers",
        "Jhonson", "Auro", "Bharat Bijlee", "Rossi", "SMC", "EP", "HICARB", "NILL", "Indian", "JAISAON", "PMA",
        "Intact","Drivetech","Delton","BALAJI","ELECTROPNEUMATICS","SK BROTHER","CONFIDENT","FABRIKEN AGENCIES",
        "EUROTECH","BHANDARI","TRIVENI",
    ];

    let selectedPurposes = new Set();

    bomSelect.addEventListener('change', function () {
        const bomId = this.value;
        resetState();
        if (!bomId) return;
        fetchBOMDetails(bomId);
    });

    function resetState() {
        itemDetailsDiv.innerHTML = "";
        purposeButtonsContainer.innerHTML = "";
        componentButtonsContainer.innerHTML = "";
        selectedPurposes.clear();
    }

    async function fetchBOMDetails(bomId) {
        try {
            const response = await fetch(`/api/get_bom_details/${bomId}/`);
            const data = await handleFetchResponse(response);
            if (data.success) {
                const { bom, components } = data;
                populatePurposeButtons(components);
                displayBOMHeader(bom.name, bom.work_order_number || "N/A");
                itemDetailsDiv.innerHTML = '';
            } else {
                showError("Failed to fetch BOM details.");
            }
        } catch (error) {
            console.error("Error fetching BOM details:", error);
            showError("Error loading details. Please try again later.");
        }
    }

    function handleFetchResponse(response) {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.json();
    }

    function populatePurposeButtons(components) {
        purposeButtonsContainer.innerHTML = '';
        const checkboxGridContainer = createCheckboxGrid();
        const uniquePurposes = getUniquePurposes(components);

        uniquePurposes.forEach(purpose => {
            const checkboxWrapper = createCheckbox(purpose);
            checkboxWrapper.querySelector('input').addEventListener('change', function () {
                updateSelectedPurposes(this.checked, purpose);
                displayPurposeData(components);
                populateComponentButtons(components);
            });
            checkboxGridContainer.appendChild(checkboxWrapper);
        });

        purposeButtonsContainer.appendChild(checkboxGridContainer);
    }

    function createCheckboxGrid() {
        const checkboxGridContainer = document.createElement('div');
        checkboxGridContainer.classList.add('checkbox-grid-container');
        return checkboxGridContainer;
    }

    function getUniquePurposes(components) {
        const uniquePurposes = new Set();
        components.forEach(component => {
            component.specifications.forEach(spec => {
                if (spec.purpose) uniquePurposes.add(spec.purpose);
            });
        });
        return Array.from(uniquePurposes);
    }

    function createCheckbox(purpose) {
        const checkboxWrapper = document.createElement('div');
        const purposeCheckbox = document.createElement('input');
        purposeCheckbox.type = 'checkbox';
        purposeCheckbox.classList.add('form-check-input');
        purposeCheckbox.id = purpose;
        purposeCheckbox.value = purpose;

        const label = document.createElement('label');
        label.htmlFor = purpose;
        label.classList.add('checkbox-label');
        label.textContent = purpose;

        checkboxWrapper.appendChild(purposeCheckbox);
        checkboxWrapper.appendChild(label);

        return checkboxWrapper;
    }

    function updateSelectedPurposes(checked, purpose) {
        if (checked) {
            selectedPurposes.add(purpose);
        } else {
            selectedPurposes.delete(purpose);
        }
    }

    function displayPurposeData(components) {
        const filteredSpecifications = [];
        let grandTotal = 0;

        selectedPurposes.forEach(selectedPurpose => {
            components.forEach(component => {
                component.specifications.forEach(spec => {
                    if (spec.purpose === selectedPurpose) {
                        filteredSpecifications.push({
                            ...spec,
                            componentName: component.name,
                            objective: spec.objective || 'N/A'
                        });
                        grandTotal += parseFloat(spec.total) || 0;
                    }
                });
            });
        });

        if (filteredSpecifications.length === 0) {
            itemDetailsDiv.innerHTML = "<div class='alert alert-warning'>No data found for the selected purposes.</div>";
            return;
        }

        displaySpecifications(filteredSpecifications, grandTotal);
    }

    function populateComponentButtons(components) {
        componentButtonsContainer.innerHTML = '';

        components.forEach(component => {
            const hasSelectedPurpose = component.specifications.some(spec => selectedPurposes.has(spec.purpose));
            if (hasSelectedPurpose) {
                const button = createComponentButton(component);
                componentButtonsContainer.appendChild(button);
            }
        });
    }

    function createComponentButton(component) {
        const button = document.createElement('button');
        button.classList.add('btn', 'btn-primary', 'm-1');
        button.textContent = component.name;
        button.onclick = () => displayComponentData(component);
        return button;
    }

    function displayComponentData(component) {
        const filteredSpecifications = component.specifications.filter(spec => selectedPurposes.has(spec.purpose));

        if (filteredSpecifications.length === 0) {
            itemDetailsDiv.innerHTML = "<div class='alert alert-warning'>No data found for the selected component.</div>";
            return;
        }

        const componentData = filteredSpecifications.map((spec, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${component.name}</td>
                <td>${spec.specification || 'N/A'}</td>
                <td>${spec.make || 'N/A'}</td>
                <td>${spec.purpose || 'N/A'}</td>
                <td>${spec.objective || 'N/A'}</td>
                <td>${spec.quality || 'N/A'}</td>
                <td>${spec.rate || 'N/A'}</td>
                <td>${spec.price || 'N/A'}</td>
                <td>${spec.total || 'N/A'}</td>
                <td class="no-print">
                    <button class="btn btn-warning btn-sm" onclick="editSpecification(${spec.id})">To Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteSpecification(${spec.id}, ${index + 1})">Delete</button>
                </td>
            </tr>
        `).join('');

        const tableHTML = `
            <div class="card mt-4">
                <div class="card-header">
                    <h5>Component Specifications: ${component.name}</h5>
                </div>
                <div class="card-body">
                    <table class="table table-bordered">
                        <thead class="thead-dark">
                            <tr>
                                <th>S NO</th>
                                <th>Component</th>
                                <th>Specification</th>
                                <th>Make</th>
                                <th>Purpose</th>
                                <th>Objective</th>
                                <th>Quality</th>
                                <th>Rate</th>
                                <th>Price</th>
                                <th>Total</th> 
                                <th class="no-print" >Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${componentData}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        itemDetailsDiv.innerHTML = tableHTML;
    }

    function displaySpecifications(filteredSpecifications, grandTotal) {
        const componentTotals = {};
        const specificationRows = filteredSpecifications.map((spec, index) => {
            const componentName = spec.componentName;
            componentTotals[componentName] = (componentTotals[componentName] || 0) + parseFloat(spec.total) || 0;

            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${spec.componentName}</td>
                    <td>${spec.specification || 'N/A'}</td>
                    <td>${getMakeDropdown(spec.make)}</td>
                    <td>${spec.purpose || 'N/A'}</td>
                    <td>${spec.objective || 'N/A'}</td>
                    <td>${spec.quality || 'N/A'}</td>
                    <td>${spec.rate || 'N/A'}</td>
                    <td>${spec.price || 'N/A'}</td>
                    <td>${spec.total || 'N/A'}</td>
                    <td class="no-print">
                        <a href="/edit-specification/${spec.id}/" class="btn btn-warning btn-sm">To Edit</a>
                        <a href="/delete-specification/${spec.id}/" class="btn btn-danger btn-sm" onclick="return confirmDelete(${spec.id}, '${index + 1}')">Delete</a>
                    </td>
                </tr>
            `;
        }).join('');

        const componentTotalRows = Object.entries(componentTotals).map(([componentName, total]) => `
            <tr>
                <td colspan="9" class="text-right"><strong>${componentName} Total</strong></td>
                <td><strong>${total.toFixed(2)}</strong></td>
                <td></td>
            </tr>
        `).join('');

        itemDetailsDiv.innerHTML = `
            <div class="card mt-4">
                <div class="card-header">
                    <h5>Filtered Specifications</h5>
                </div>
                <div class="card-body">
                    <table class="table table-bordered">
                        <thead class="thead-dark">
                            <tr>
                                <th>S NO</th>
                                <th>Component</th>
                                <th>Specification</th>
                                <th>Make</th>
                                <th>Purpose</th>
                                <th>Objective</th>
                                <th>Quality</th>
                                <th>Rate</th>
                                <th>Price</th>
                                <th>Total</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${specificationRows}
                            ${componentTotalRows}
                            <tr>
                                <td colspan="9" class="text-right"><strong>Grand Total</strong></td>
                                <td><strong>${grandTotal.toFixed(2)}</strong></td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function displayBOMHeader(bomName, workOrderNumber) {
        const headerHTML = `
            <h4>${bomName}</h4>
            <p>Work Order Number: ${workOrderNumber}</p>
        `;
        itemDetailsDiv.insertAdjacentHTML('afterbegin', headerHTML);
    }

    function getMakeDropdown(selectedMake = "------") {
        let options = makeChoices.map(make => {
            const selected = make === selectedMake ? 'selected' : '';
            return `<option value="${make}" ${selected}>${make}</option>`;
        }).join('');
    
        return `
            <select class="form-control">
                ${options}
            </select>
        `;
    }
        window.printComponentContent = function () {
        const printContents = itemDetailsDiv.innerHTML;
        const newWindow = window.open('', '', 'width=800,height=600');
        newWindow.document.write(`
            <html>
            <head>
                <title>Print</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        margin: 20px;
                        color: #333;
                    }
                    h4 {
                        text-align: center;
                        font-size: 24px;
                        margin-bottom: 10px;
                    }
                    .table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    .table th, .table td {
                        border: 1px solid #ccc;
                        padding: 10px;
                        text-align: left;
                    }
                    .table th {
                        background-color: #f2f2f2;
                    }
                    .text-right {
                        text-align: right;
                    }
                    .no-print{
                     display: none;
                    }
                </style>
            </head>
            <body>
                <h4>Specification Details</h4>
                <table class="table">
                    <tbody>
                        ${printContents} <!-- Ensure this is properly formatted as table rows -->
                    </tbody>
                </table>
            </body>
            </html>
        `);
        newWindow.document.close();
        newWindow.print();
    };
    
    
});
