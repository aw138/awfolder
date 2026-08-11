import { TRAVEL_PROJECT_CONFIG } from './config.js';
import { SlicerUIEngine } from './ui.js';

document.addEventListener("DOMContentLoaded", async () => {
    // Line 5: Declare variable at the top level of this scope so lines below can read it
    let globalDataset = []; 
    let uiController = null;

    // Processor logic mapping filter criteria against live online objects
    const filterDatasetProcessor = (activeFilters) => {
        const filteredData = globalDataset.filter(record => {
            return Object.keys(activeFilters).every(filterKey => {
                const targetedValue = activeFilters[filterKey];
                if (targetedValue === "All") return true; 
                return String(record[filterKey]) === String(targetedValue);
            });
        });
        uiController.renderTableBody(filteredData);
    };

    try {
        // Line 21: Fetch data from the URL configured in config.js
        const response = await fetch(TRAVEL_PROJECT_CONFIG.DATA_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Line 27: Save the real JSON results into our variable
        globalDataset = await response.json();

        // Line 30: Instantiate the UI Controller layout engine
        uiController = new SlicerUIEngine(TRAVEL_PROJECT_CONFIG, filterDatasetProcessor);

        // Lines 33-35: Run rendering routines using our freshly loaded data
        uiController.renderTableHeader();
        uiController.renderFilters(globalDataset);  
        uiController.renderTableBody(globalDataset); 

        // Set up action bindings for the reset button
        document.getElementById("reset-filters-btn").addEventListener("click", () => {
            uiController.resetUIFilters();
            uiController.renderTableBody(globalDataset);
        });

    } catch (error) {
        console.error("Failed loading remote travel dataset:", error);
        document.getElementById("table-body").innerHTML = `
            <tr>
                <td colspan="${TRAVEL_PROJECT_CONFIG.columns.length}" style="text-align:center; color:#dc3545; font-weight:bold;">
                    ⚠️ Error loading live records from JSON source. Please inspect network consoles.
                </td>
            </tr>`;
    }
});
