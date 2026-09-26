/**
 * UI SLICER STATE ENGINE
 * Calculates filter tag availability states based on dashboard choices.
 */

window.getTagAvailabilityList = function(currentAttr, uniqueTags, rows, searchCtx) {
    const showCheckedOnly = document.getElementById("showCheckedOnlyToggle")?.checked || false;
    const currentFilters = window.selectedFilters || {};

    return Array.from(uniqueTags).map(tagValue => {
        let isAvailable = currentFilters[currentAttr] && currentFilters[currentAttr].has(tagValue);
        
        if (!isAvailable) {
            isAvailable = rows.some(row => {
                // ==========================================================
                // HYBRID RUNTIME STATE EVALUATION MATRIX ??
                // Explicitly isolates text search and cross-category constraints
                // without collapsing state maps on first or last filter rows.
                // ==========================================================
                
                // 1. Core Text Search Validation Boundary
                if (searchCtx !== "") {
                    const rowCells = Array.from(row.querySelectorAll("td"));
                    const matchesText = rowCells.some((el, idx) => idx !== 0 && el.textContent.toLowerCase().includes(searchCtx));
                    if (!matchesText) return false;
                }

                // 2. Dashboard Checked Row Visibility Lock Checkbox Constraints
                if (showCheckedOnly) {
                    const isChecked = row.querySelector(".row-selector-checkbox")?.checked || false;
                    const isPending = row.classList.contains("is-unchecked-pending");
                    if (!isChecked && !isPending) return false;
                }

                // 3. Sibling Slicer Conflict Scope Analysis [INDEX: 0.1.14]
                // Loops through ALL alternate categories to verify eligibility records
                for (const [otherAttr, otherFilterSet] of Object.entries(currentFilters)) {
                    if (otherAttr === currentAttr || !otherFilterSet || otherFilterSet.size === 0) continue;
                    
                    const nestedTagsStr = row.getAttribute(otherAttr) || row.getAttribute(`data-${otherAttr}`) || "";
                    const nestedTagsArray = nestedTagsStr.split(';').map(x => x.trim());
                    
                    // Respect alternate row structural logical state constraints
                    const useAndLogicOperator = window.booleanLogicalModes[otherAttr] !== false;
                    const criteriaSetItems = Array.from(otherFilterSet);

                    if (useAndLogicOperator) {
                        const satisfiesSiblingAnd = criteriaSetItems.every(t => nestedTagsArray.includes(t));
                        if (!satisfiesSiblingAnd) return false;
                    } else {
                        const satisfiesSiblingOr = criteriaSetItems.some(t => nestedTagsArray.includes(t));
                        if (!satisfiesSiblingOr) return false;
                    }
                }

                // 4. Verify tag footprint accuracy on the targeted table row object
                const rowTagsStr = row.getAttribute(currentAttr) || row.getAttribute(`data-${currentAttr}`) || "";
                return rowTagsStr.split(';').map(t => t.trim()).includes(tagValue);
            });
        }
        return { value: tagValue, available: isAvailable };
    });
};
