// GLOBAL FAVOURITE FILTER SYSTEM STATES 🎯
window.showFavouritesOnlyActive = false; 

/**
 * Global macro execution function to toggle the Favorite cross-filtering layer state
 */
window.toggleFavouritesOnlyFilterMode = function() {
    window.showFavouritesOnlyActive = !window.showFavouritesActiveState();
    
    // Update structural button UI rendering tokens across viewports
    const favHeaderButtons = document.querySelectorAll(".fav-toggle-action-trigger");
    favHeaderButtons.forEach(btn => {
        btn.classList.toggle("fav-filter-active-state", window.showFavouritesOnlyActive);
    });
    
    // Core pipeline execution block triggers runtime viewport filtration
    window.applyCombinedFilter();
};

window.showFavouritesActiveState = function() {
    return !!window.showFavouritesOnlyActive;
};

// LOGICAL SPLIT 1: TEXT QUERY SEARCH 🎯 & CROSS-FILTER MATCHING ENGINE
window.getRuntimeRows = function() { 
    const tbody = document.getElementById("tableBody");
    return window.globalTableRows && window.globalTableRows.length > 0 ? 
    window.globalTableRows : (tbody ? Array.from(tbody.querySelectorAll("tr")) : []); 
};

window.updateMasterCheckboxState = function() {
    const selectAllRowsCheckbox = document.getElementById("selectAllRowsCheckbox");
    if (!selectAllRowsCheckbox) return;
    
    const visibleRows = window.getRuntimeRows().filter(r => r.style.display !== "none");
    if (visibleRows.length === 0) { 
        selectAllRowsCheckbox.checked = false; 
        selectAllRowsCheckbox.indeterminate = false; 
        return; 
    }

    let checkedCount = 0;
    visibleRows.forEach(r => {
        if (r.querySelector(".row-selector-checkbox")?.checked) checkedCount++;
    });

    if (checkedCount === 0) {
        selectAllRowsCheckbox.checked = false;
        selectAllRowsCheckbox.indeterminate = false;
    } else if (checkedCount === visibleRows.length) {
        selectAllRowsCheckbox.checked = true;
        selectAllRowsCheckbox.indeterminate = false;
    } else {
        selectAllRowsCheckbox.checked = false;
        selectAllRowsCheckbox.indeterminate = true;
    }
};

function escapeRegExp(string) { return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function injectTextHighlights(element, searchPhrase) { 
    if (!searchPhrase) return; 
    const regex = new RegExp(`(${escapeRegExp(searchPhrase)})`, 'gi'); 
    Array.from(element.childNodes).forEach(node => { 
        if (node.nodeType === 3) { 
            const text = node.nodeValue; 
            if (regex.test(text)) { 
                const spanWrapper = document.createElement('span'); 
                spanWrapper.innerHTML = text.replace(regex, '<mark class="search-hit-highlight">$1</mark>'); 
                element.replaceChild(spanWrapper, node); 
            } 
        } else if (node.nodeType === 1 && node.nodeName !== 'MARK' && node.nodeName !== 'SCRIPT' && node.nodeName !== 'INPUT') { 
            injectTextHighlights(node, searchPhrase); 
        } 
    }); 
}
// PART B: COMBINED CROSS-CROSS SELECTION RULES MATRIX PIPELINE (Paste directly below Part A)

window.applyCombinedFilter = function() {
    const searchInput = document.getElementById("tableSearch");
    const clearSearchBtn = document.getElementById("clearSearchBtn");
    const showCheckedOnlyToggle = document.getElementById("showCheckedOnlyToggle");
    const noResultsMessage = document.getElementById("noResults");
    
    if (!searchInput) return;
    const activeRows = window.getRuntimeRows(); 
    
    // 🎯 THE DIRECT FIX: Read exclusively from the locked state query, NOT the live value!
    const searchText = (window.lastExecutedSearchQuery !== undefined) ? window.lastExecutedSearchQuery : "";
    
    const showCheckedOnly = showCheckedOnlyToggle?.checked || false; 
    let visibleCount = 0; 
    
    const favColumnIndex = (window.activeColumnsWidthsSchema || []).findIndex(col => col && col.isToggle === true);

    activeRows.forEach(row => {
        const isChecked = row.querySelector(".row-selector-checkbox")?.checked || false; 
        const cells = Array.from(row.querySelectorAll("td")); 
        
        // Clear old highlights safely
        cells.forEach((cell, idx) => { 
            if (idx === 0) return; 
            cell.querySelectorAll("mark.search-hit-highlight").forEach(m => { 
                m.parentNode.replaceChild(document.createTextNode(m.textContent), m); 
            }); 
            cell.normalize(); 
        });

        // 1. Dashboard Checked Row Visibility Lock Checkbox Constraints
        if (showCheckedOnly) {
            if (!isChecked) {
                if (row.style.display === "none") return;
                if (!row.classList.contains("is-unchecked-pending")) {
                    row.style.display = "none";
                    return;
                }
            } else {
                row.classList.remove("is-unchecked-pending");
            }
        }

        // 2. Favorite Only Interfiltration Context Check with Pending Visibility Lock
        if (window.showFavouritesActiveState() && favColumnIndex !== -1) {
            const hiddenDataTracker = cells[favColumnIndex]?.querySelector("span");
            const isRowFav = hiddenDataTracker?.textContent.trim() === "1";
            const isUnfavPending = row.classList.contains("is-unfav-pending");
            
            if (!isRowFav && !isUnfavPending) {
                row.style.display = "none";
                return; 
            }
        } else {
            row.classList.remove("is-unfav-pending");
        }

        // 3. Core Text Search Validation Boundary (Evaluates locked query string cleanly)
        const matchesSearch = searchText === "" || cells.some((el, idx) => { 
            if (idx === 0) return false; 
            return el.textContent.toLowerCase().includes(searchText); 
        });

        // 4. Sibling Slicer Conflict Scope Analysis
        let matchesSlicers = true; 
        for (const [dataAttr, filterSet] of Object.entries(window.selectedFilters)) { 
            if (filterSet.size === 0) continue; 
            const cleanKey = String(dataAttr).replace('data-', '').replace('-', '').trim();
            const rowTagsStr = row.getAttribute(cleanKey) || row.getAttribute(`data-${cleanKey}`) || row.getAttribute(dataAttr) || ""; 
            const rowParsedTags = rowTagsStr.split(';').map(x => x.trim());
            const useAndLogicOperator = window.booleanLogicalModes[cleanKey] !== false;
            const activeFilterItems = Array.from(filterSet);

            if (useAndLogicOperator) {
                if (!activeFilterItems.every(t => rowParsedTags.includes(t))) { matchesSlicers = false; break; }
            } else {
                if (!activeFilterItems.some(t => rowParsedTags.includes(t))) { matchesSlicers = false; break; }
            }
        }

        // Finalize display attributes
        if (matchesSearch && matchesSlicers) { 
            row.style.display = ""; 
            visibleCount++; 
            if (searchText.length >= 1) { 
                // Highlights words only if they match the locked query text
                cells.forEach((cell, idx) => { if (idx !== 0) injectTextHighlights(cell, searchText); }); 
            } 
        } else { 
            row.style.display = "none"; 
        }
    });

    if (noResultsMessage) noResultsMessage.style.display = visibleCount === 0 ? "block" : "none";
    if (typeof window.recalculateZebraStriping === "function") window.recalculateZebraStriping();
    window.updateMasterCheckboxState();

    const freshCounterBadge = document.getElementById("tableResultsCounter");
    if (freshCounterBadge) freshCounterBadge.textContent = `${visibleCount}/${activeRows.length}`;

    const counterTextTarget = document.getElementById("checkedFilterCounterText");
    if (counterTextTarget) {
        let checkedVisibleCount = 0;
        activeRows.forEach(row => {
            if (row.style.display !== "none" && row.querySelector(".row-selector-checkbox")?.checked) checkedVisibleCount++;
        });
        counterTextTarget.textContent = `${checkedVisibleCount} selected`;
    }

    if (typeof window.updateAllSlicerButtonsUI === "function") {
        window.updateAllSlicerButtonsUI(activeRows);
    }

	// 🎯 REPLACE VERBATIM WITH THIS INJECTION:
    window.recalculateRealtimeFavCounters();
    
    // Auto-update analytics calculation values if a stat row panel is currently active on screen
    if (typeof window.executeRealtimeTableStatistics === "function") {
        window.executeRealtimeTableStatistics();
    }
};
// PART C: EVENT LISTENERS & INVERT MACRO CAPTURE HOOKS (Paste directly below Part B)

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("tableSearch");
    const clearSearchBtn = document.getElementById("clearSearchBtn");
    const showCheckedOnlyToggle = document.getElementById("showCheckedOnlyToggle");
    const selectAllRowsCheckbox = document.getElementById("selectAllRowsCheckbox");
    const tbody = document.getElementById("tableBody");

    // 🎯 GLOBAL SEARCH LOCKED STATE STORAGE
    window.lastExecutedSearchQuery = "";

    // 1. Text input watcher: only updates the clear/arrow icon, does NOT filter!
    searchInput?.addEventListener("input", function() {
        if (clearSearchBtn) {
            if (this.value.trim().length > 0) {
                clearSearchBtn.style.display = "block";
                clearSearchBtn.innerHTML = "&#10140;"; // Keep arrow icon '➡' visible while typing
                clearSearchBtn.setAttribute("aria-label", "Execute search");
                clearSearchBtn.dataset.stateMode = "search-trigger";
            } else {
                clearSearchBtn.style.display = "none";
                window.lastExecutedSearchQuery = ""; // Reset query state instantly if emptied manually
                window.applyCombinedFilter();
            }
        }
    });

    // 2. keydown watcher: Locks query state only when Enter is pressed!
    searchInput?.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault(); 
            window.lastExecutedSearchQuery = this.value.toLowerCase().trim(); // Lock state 🔒
            window.applyCombinedFilter();
            
            if (clearSearchBtn && this.value.trim().length > 0) {
                clearSearchBtn.innerHTML = "&times;"; // Turn '➡' into 'X' to signify successful execution
                clearSearchBtn.setAttribute("aria-label", "Clear search");
                clearSearchBtn.dataset.stateMode = "clear-trigger";
            }
        }
    });

    // 3. Icon click delegator: Coordinates execution vs flushing based on '➡' or 'X' state
    clearSearchBtn?.addEventListener("click", function() {
        if (!searchInput) return;
        if (this.dataset.stateMode === "search-trigger") {
            // Clicked '➡' arrow icon: Execute search query state lock
            window.lastExecutedSearchQuery = searchInput.value.toLowerCase().trim();
            window.applyCombinedFilter();
            this.innerHTML = "&times;"; 
            this.setAttribute("aria-label", "Clear search");
            this.dataset.stateMode = "clear-trigger"; 
            searchInput.focus();
        } else {
            // Clicked 'X' clear icon: Flush the search query completely
            searchInput.value = ""; 
            window.lastExecutedSearchQuery = ""; // Clear state 🔓
            window.applyCombinedFilter();
            this.style.display = "none"; 
            searchInput.focus();
        }
    });

    showCheckedOnlyToggle?.addEventListener("change", () => {
        window.getRuntimeRows().forEach(row => {
            row.style.display = ""; row.classList.remove("is-unchecked-pending"); 
        });
        window.applyCombinedFilter();
    });

    // ============================================================================
    // FIXED SHIFT + CLICK MULTI-SELECTION ENGINE 🚀
    // ============================================================================
    window.lastCheckedRowElement = null;

    tbody?.addEventListener("click", function(e) {
        if (e.target.classList.contains("row-selector-checkbox")) {
            const targetedRow = e.target.closest("tr");
            const activeRowsArray = window.getRuntimeRows(); 
            const isFilterActive = showCheckedOnlyToggle?.checked || false;

            setTimeout(() => {
                const currentClickCheckedState = e.target.checked;

                if (e.shiftKey && window.lastCheckedRowElement) {
                    const startIdx = activeRowsArray.indexOf(window.lastCheckedRowElement);
                    const endIdx = activeRowsArray.indexOf(targetedRow);
                    const minRangeIdx = Math.min(startIdx, endIdx);
                    const maxRangeIdx = Math.max(startIdx, endIdx);

                    for (let i = minRangeIdx; i <= maxRangeIdx; i++) {
                        const rangeRow = activeRowsArray[i];
                        if (rangeRow.style.display === "none") continue;
                        const rangeCheckbox = rangeRow.querySelector(".row-selector-checkbox");
                        if (rangeCheckbox) {
                            rangeCheckbox.checked = currentClickCheckedState;
                            if (currentClickCheckedState) rangeRow.classList.remove("is-unchecked-pending");
                            else if (isFilterActive) rangeRow.classList.add("is-unchecked-pending");
                        }
                    }
                } else {
                    if (currentClickCheckedState) targetedRow.classList.remove("is-unchecked-pending");
                    else if (isFilterActive) targetedRow.classList.add("is-unchecked-pending");
                }

                let savedCheckedKeysDatabase = JSON.parse(localStorage.getItem("dashboardSelectedCheckedKeys") || "[]");
                activeRowsArray.forEach(row => {
                    const box = row.querySelector(".row-selector-checkbox");
                    const rowLookupKeySignature = row.getAttribute("data-row-key") || "";
                    if (box && rowLookupKeySignature !== "") {
                        if (box.checked) {
                            if (!savedCheckedKeysDatabase.includes(rowLookupKeySignature)) savedCheckedKeysDatabase.push(rowLookupKeySignature);
                        } else {
                            savedCheckedKeysDatabase = savedCheckedKeysDatabase.filter(key => key !== rowLookupKeySignature);
                        }
                    }
                });

                localStorage.setItem("dashboardSelectedCheckedKeys", JSON.stringify(savedCheckedKeysDatabase));
                window.lastCheckedRowElement = targetedRow;
                window.applyCombinedFilter();
            }, 0);
        }
    });

    // ============================================================================
    // BATCH MASTER TOGGLE ENGINE WITH SAFETY DELAY PENDING STATE 🔄
    // ============================================================================
    selectAllRowsCheckbox?.addEventListener("change", function() {
        const isChecked = this.checked;
        const visibleRows = window.getRuntimeRows().filter(row => row.style.display !== "none");
        const isFilterActive = showCheckedOnlyToggle?.checked || false;
        let savedCheckedKeysDatabase = JSON.parse(localStorage.getItem("dashboardSelectedCheckedKeys") || "[]");

        visibleRows.forEach(row => {
            const box = row.querySelector(".row-selector-checkbox");
            if (!box) return;
            box.checked = isChecked;
            const rowStorageKeySignature = row.getAttribute("data-row-key") || "";
            if (!rowStorageKeySignature) return;

            if (isChecked) {
                if (!savedCheckedKeysDatabase.includes(rowStorageKeySignature)) savedCheckedKeysDatabase.push(rowStorageKeySignature);
                row.classList.remove("is-unchecked-pending");
            } else {
                savedCheckedKeysDatabase = savedCheckedKeysDatabase.filter(key => key !== rowStorageKeySignature);
                if (isFilterActive) row.classList.add("is-unchecked-pending");
            }
        });

        localStorage.setItem("dashboardSelectedCheckedKeys", JSON.stringify(savedCheckedKeysDatabase));
        window.applyCombinedFilter();
    });

    // ============================================================================
    // FEATURE ENHANCEMENT: VISIBLE ROWS INVERT SELECTION ENGINE 🔀
    // ============================================================================
    document.getElementById("invertVisibleRowsBtn")?.addEventListener("click", function(e) {
        e.stopPropagation();
        const activeRowsArray = window.getRuntimeRows();
        const isFilterActive = showCheckedOnlyToggle?.checked || false;
        let savedCheckedKeysDatabase = JSON.parse(localStorage.getItem("dashboardSelectedCheckedKeys") || "[]");

        activeRowsArray.forEach(row => {
            if (row.style.display === "none") return;
            const box = row.querySelector(".row-selector-checkbox");
            if (!box) return;

            const prospectiveCheckedState = !box.checked;
            box.checked = prospectiveCheckedState;
            const rowStorageKeySignature = row.getAttribute("data-row-key") || "";
            if (rowStorageKeySignature === "") return;

            if (prospectiveCheckedState) {
                if (!savedCheckedKeysDatabase.includes(rowStorageKeySignature)) savedCheckedKeysDatabase.push(rowStorageKeySignature);
                row.classList.remove("is-unchecked-pending");
            } else {
                savedCheckedKeysDatabase = savedCheckedKeysDatabase.filter(key => key !== rowStorageKeySignature);
                if (isFilterActive) row.classList.add("is-unchecked-pending");
            }
        });

        localStorage.setItem("dashboardSelectedCheckedKeys", JSON.stringify(savedCheckedKeysDatabase));
        window.applyCombinedFilter();
    });
	// Add this simple structural event hook on page boot:
	document.getElementById("favFilterToggleBtn")?.addEventListener("click", function(e) {
		e.stopPropagation(); // Prevents cell click events from breaking table geometric constraints
		e.preventDefault();
		window.toggleFavouritesOnlyFilterMode();
	});

});
// ============================================================================
// 📊 REAL-TIME MATHEMATICAL COLUMN STATS EVALUATION PIPELINE
// ============================================================================
window.executeRealtimeTableStatistics = function() {
    const activeTargetKey = window.activeStatisticsColumnJsonKey;
    const panel = document.getElementById("tableStatisticsDeckPanel");
    if (!panel) return;

    if (!activeTargetKey) {
        panel.style.setProperty("display", "none", "important");
        return;
    }

    // Locate column structural configuration constraints profile mapping indexes profile
    const widthsSchema = window.activeColumnsWidthsSchema || [];
    const columnIndex = widthsSchema.findIndex(col => col && col.jsonKey === activeTargetKey);
    if (columnIndex === -1) return;

    const visibleRows = window.getRuntimeRows().filter(row => row.style.display !== "none");
    const numericalValuesArray = [];
    let grandSumTotal = 0;

    visibleRows.forEach(row => {
        const targetCell = row.querySelectorAll("td")[columnIndex];
        if (!targetCell) return;
        
        // Strip text down to raw float coordinate parameters (removes currency symbols, whitespace)
        const rawCleanString = String(targetCell.textContent || "").replace(/[^\d.-]/g, "").trim();
        const parsedFloatVal = parseFloat(rawCleanString);
        if (!isNaN(parsedFloatVal)) {
            numericalValuesArray.push(parsedFloatVal);
            grandSumTotal += parsedFloatVal;
        }
    });

    const totalCountItems = numericalValuesArray.length;
    let meanCalculatedValue = 0;
    let calculatedStandardDeviation = 0;

    if (totalCountItems > 0) {
        meanCalculatedValue = grandSumTotal / totalCountItems;
        
        // Standard Deviation: Mean of square variances arithmetic steps
        let sumSquaredDifferences = 0;
        numericalValuesArray.forEach(val => {
            sumSquaredDifferences += Math.pow(val - meanCalculatedValue, 2);
        });
        calculatedStandardDeviation = Math.sqrt(sumSquaredDifferences / totalCountItems);
    }

    // Lookup structural configurations profile mapping straight from column rules and global root variables
    const columnConfigProfile = widthsSchema[columnIndex] || {};
    
    // 🎯 STEP 1: PARSE DICTIONARY DATA CODES TWO LEVELS HIGHER FROM THE ROOT LEVEL SCHEMA
    const columnSlickKey = activeTargetKey;
    const rootStatsProfileRegistry = window.globalStatisticsConfigSchema || {};
    const targetJsonStatsSchema = rootStatsProfileRegistry[columnSlickKey] || {};

    // Generate fallback mapping matrix defaults if elements are not present inside your JSON configurations
    const statsMetricsConfigMatrix = {
        mean: {
            label: targetJsonStatsSchema.mean?.label || "Mean:",
            precision: (targetJsonStatsSchema.mean && targetJsonStatsSchema.mean.precision !== undefined) 
                ? parseInt(targetJsonStatsSchema.mean.precision, 10) 
                : ((columnConfigProfile.precision !== undefined) ? parseInt(columnConfigProfile.precision, 10) : 2),
            isCurrency: (targetJsonStatsSchema.mean && targetJsonStatsSchema.mean.isCurrency !== undefined)
                ? targetJsonStatsSchema.mean.isCurrency === true
                : (columnConfigProfile.isCurrency === true)
        },
        sd: {
            label: targetJsonStatsSchema.sd?.label || "SD:",
            precision: (targetJsonStatsSchema.sd && targetJsonStatsSchema.sd.precision !== undefined) 
                ? parseInt(targetJsonStatsSchema.sd.precision, 10) 
                : 2,
            isCurrency: (targetJsonStatsSchema.sd && targetJsonStatsSchema.sd.isCurrency !== undefined)
                ? targetJsonStatsSchema.sd.isCurrency === true
                : false
        },
        total: {
            label: targetJsonStatsSchema.total?.label || "Total:",
            precision: (targetJsonStatsSchema.total && targetJsonStatsSchema.total.precision !== undefined) 
                ? parseInt(targetJsonStatsSchema.total.precision, 10) 
                : ((columnConfigProfile.precision !== undefined) ? parseInt(columnConfigProfile.precision, 10) : 0),
            isCurrency: (targetJsonStatsSchema.total && targetJsonStatsSchema.total.isCurrency !== undefined)
                ? targetJsonStatsSchema.total.isCurrency === true
                : (columnConfigProfile.isCurrency === true)
        }
    };

    // 🎯 STEP 2: RENDER INTERNALS USING THE INTL FORMATTING ENGINE
    const formatIndividualStatItem = (value, targetConfig) => {
        const formattingOptions = {
            minimumFractionDigits: targetConfig.precision,
            maximumFractionDigits: targetConfig.precision,
            useGrouping: true
        };

        if (targetConfig.isCurrency) {
            formattingOptions.style = "currency";
            formattingOptions.currency = "USD";
        }

        const formatter = new Intl.NumberFormat("en-US", formattingOptions);
        let outputString = formatter.format(value);

        if (targetConfig.isCurrency && !outputString.startsWith("\$")) {
            outputString = "\$" + outputString;
        }

        return outputString;
    };

    // 🎯 STEP 3: OUTPUT DYNAMIC CONFIG LABELS AND VALUES TO CONTAINER CHIPS [INDEX: 0.1.265]
    const activeColumnTitleSlot = document.getElementById("statFieldActiveColumnTitle");
    if (activeColumnTitleSlot) {
        // 🎯 FIX: Check strictly if the parameter is defined in JSON, allowing empty strings "" to pass through natively
        if (targetJsonStatsSchema.panelTitle !== undefined) {
            activeColumnTitleSlot.textContent = targetJsonStatsSchema.panelTitle;
        } else {
            // Default fallback calculation string if the key does not exist at all in JSON
            activeColumnTitleSlot.textContent = `${columnConfigProfile.label || "Column"} Stats |`;
        }
    }
    
    // Inject labels dynamically from your JSON setup matrix profiles (e.g. "μ", "σ", "∑") [INDEX: 0.1.265]
    document.getElementById("statLabelMean").textContent = statsMetricsConfigMatrix.mean.label;
    document.getElementById("statLabelSD").textContent = statsMetricsConfigMatrix.sd.label;
    document.getElementById("statLabelTotal").textContent = statsMetricsConfigMatrix.total.label;

    // Inject calculated mathematical values with independent layout formatting [INDEX: 0.1.265]
    document.getElementById("statFieldMeanValue").textContent = formatIndividualStatItem(meanCalculatedValue, statsMetricsConfigMatrix.mean);
    document.getElementById("statFieldSDValue").textContent = formatIndividualStatItem(calculatedStandardDeviation, statsMetricsConfigMatrix.sd);
    document.getElementById("statFieldTotalValue").textContent = formatIndividualStatItem(grandSumTotal, statsMetricsConfigMatrix.total);
    
    panel.style.setProperty("display", "flex", "important");
};

// Global toggle utility configuration execution macro trigger mapping hook parameters profile pipeline steps
window.toggleColumnStatisticsDisplayView = function(jsonKey, buttonElement) {
    const previousActiveKey = window.activeStatisticsColumnJsonKey;
    
    // Clear styling classes from all alternate dashboard column elements inside the header tree nodes
    document.querySelectorAll(".header-column-stat-trigger-btn").forEach(btn => {
        btn.classList.remove("active-panel-visible");
    });

    if (previousActiveKey === jsonKey) {
        // Condition A: Clicked an already open panel -> Close it
        window.activeStatisticsColumnJsonKey = null;
    } else {
        // Condition B: Clicked a new column metric -> Activate it
        window.activeStatisticsColumnJsonKey = jsonKey;
        if (buttonElement) buttonElement.classList.add("active-panel-visible");
    }

    window.executeRealtimeTableStatistics();
};
