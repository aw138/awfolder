import { TRAVEL_PROJECT_CONFIG } from './config.js';
import { SlicerUIEngine } from './ui.js';

document.addEventListener("DOMContentLoaded", async () => {
    let globalDataset = []; 
    let uiController = null;

    // Master operational filter evaluator
    const applyCombinedFilterPipeline = () => {
        // 1. Reduce down rows to match every active criteria set intersection
        const filteredData = globalDataset.filter(record => {
            return Object.entries(uiController.selectedFilters).every(([filterKey, activeSet]) => {
                if (activeSet.size === 0) return true; // No filter active on this row, skip
                
                const cellData = String(record[filterKey] || "");
                const recordTags = cellData.split(';').map(t => t.trim());
                
                // Row matches if it shares any tag with the active filter set
                return Array.from(activeSet).some(selectedTag => recordTags.includes(selectedTag));
            });
        });

        // 2. Update visible table entries
        uiController.renderTableBody(filteredData);
        
        // 3. RE-RENDER SLICER BUTTONS TO DYNAMICALLY ADJUST SORT AND GREY OUT STATES
        uiController.renderFilters(globalDataset);
    };

    try {
        const response = await fetch(TRAVEL_PROJECT_CONFIG.DATA_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        globalDataset = await response.json();

        uiController = new SlicerUIEngine(TRAVEL_PROJECT_CONFIG, applyCombinedFilterPipeline);

        // Initial application setup paint execution
        uiController.renderTableHeader();
        uiController.renderTableBody(globalDataset);
        uiController.renderFilters(globalDataset);

        document.getElementById("reset-filters-btn").addEventListener("click", () => {
            uiController.resetUIFilters();
            applyCombinedFilterPipeline();
        });

    } catch (error) {
        console.error("Failed loading remote travel dataset:", error);
        document.getElementById("table-body").innerHTML = `
            <tr>
                <td colspan="${TRAVEL_PROJECT_CONFIG.columns.length}" style="text-align:center; color:#dc3545; font-weight:bold;">
                    ⚠️ Error loading live records from JSON source.
                </td>
            </tr>`;
    }
});
