// The central lifecycle coordinator orchestration file.

import { TRAVEL_PROJECT_CONFIG } from './config.js';

import { SlicerUIEngine } from './ui.js';

document.addEventListener("DOMContentLoaded", () => {
    
    // Core logical matching process array reducer engine
    const filterDatasetProcessor = (activeFilters) => {
        const filteredData = TRAVEL_DATASET.filter(record => {
            // Verify if record passes every single criterion group check row boundary match
            return Object.keys(activeFilters).every(filterKey => {
                const targetedValue = activeFilters[filterKey];
                if (targetedValue === "All") return true; // Bypass validation check
                return String(record[filterKey]) === String(targetedValue);
            });
        });

        // Repopulate active table row layout updates
        uiController.renderTableBody(filteredData);
    };

    // Instantiate UI engine passing Travel specific layouts
    const uiController = new SlicerUIEngine(TRAVEL_PROJECT_CONFIG, filterDatasetProcessor);

    //  CORRECT LINES (Passes your live downloaded GitHub data instead)
    uiController.renderTableHeader();
    uiController.renderFilters(globalDataset); // <-- Change this to globalDataset
    uiController.renderTableBody(globalDataset); // <-- Change this to globalDataset


    // Reset buttons bindings
    document.getElementById("reset-filters-btn").addEventListener("click", () => {
        uiController.resetUIFilters();
        uiController.renderTableBody(TRAVEL_DATASET);
    });
});
