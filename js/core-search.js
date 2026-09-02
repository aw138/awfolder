// 🎯 LOGICAL SPLIT 1: TEXT QUERY SEARCH & CROSS-FILTER MATCHING ENGINE
window.getRuntimeRows = function() { 
    const tbody = document.getElementById("tableBody");
    return window.globalTableRows && window.globalTableRows.length > 0 ? window.globalTableRows : (tbody ? Array.from(tbody.querySelectorAll("tr")) : []); 
};

window.updateMasterCheckboxState = function() {
    const selectAllRowsCheckbox = document.getElementById("selectAllRowsCheckbox");
    if (!selectAllRowsCheckbox) return;
    
    // 1. Get all table data rows that are currently visible on screen
    const visibleRows = window.getRuntimeRows().filter(r => r.style.display !== "none");
    
    // 2. If no rows are visible, uncheck and clear everything safely
    if (visibleRows.length === 0) { 
        selectAllRowsCheckbox.checked = false; 
        selectAllRowsCheckbox.indeterminate = false; // Clear intermediate state
        return; 
    }
    
    // 3. Count how many of these visible rows are checked
    let checkedCount = 0;
    visibleRows.forEach(r => {
        if (r.querySelector(".row-selector-checkbox")?.checked) {
            checkedCount++;
        }
    });

    // 🎯 THE LOOK AND FEEL FIX: Assign three distinct state rules cleanly
    if (checkedCount === 0) {
        // State A: No rows selected -> Empty box
        selectAllRowsCheckbox.checked = false;
        selectAllRowsCheckbox.indeterminate = false;
    } else if (checkedCount === visibleRows.length) {
        // State B: Every single row selected -> Checked tick box
        selectAllRowsCheckbox.checked = true;
        selectAllRowsCheckbox.indeterminate = false;
    } else {
        // State C: Some rows selected -> Sleek intermediate dash box!
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

window.applyCombinedFilter = function() {
    const searchInput = document.getElementById("tableSearch");
    const clearSearchBtn = document.getElementById("clearSearchBtn");
    const showCheckedOnlyToggle = document.getElementById("showCheckedOnlyToggle");
    const noResultsMessage = document.getElementById("noResults");
    
    if (!searchInput) return;
    const activeRows = window.getRuntimeRows(); 
    const searchText = searchInput.value.toLowerCase().trim(); 
    const showCheckedOnly = showCheckedOnlyToggle?.checked || false; 
    let visibleCount = 0; 
    
    if (clearSearchBtn) clearSearchBtn.style.display = searchText.length > 0 ? "block" : "none";
    
    activeRows.forEach(row => {
        const isChecked = row.querySelector(".row-selector-checkbox")?.checked || false; 
        const cells = Array.from(row.querySelectorAll("td")); 
        cells.forEach((cell, idx) => { 
            if (idx === 0) return; 
            cell.querySelectorAll("mark.search-hit-highlight").forEach(m => { m.parentNode.replaceChild(document.createTextNode(m.textContent), m); }); 
            cell.normalize(); 
        });
        
        // ============================================================================
        // SAFETY VISIBILITY BLOCK: Prevent unchecked rows from vanishing on accidental misclicks
        // ============================================================================
        // If "Show checked only" is active, we check if the row was ALREADY hidden previously.
        // If it was already visible on your screen, we DO NOT hide it mid-session just because it was unchecked!
        const wasRowAlreadyHidden = row.style.display === "none";
        
        // ============================================================================
        // 🎯 FIXED DEFERRED VISIBILITY MATRIX
        // ============================================================================
        if (showCheckedOnly) {
            if (!isChecked) {
                // If it's already hidden, keep it hidden safely
                if (row.style.display === "none") {
                    return;
                }
                // If you uncheck it mid-session, flag it but KEEP it visible for safety
                if (row.classList.contains("is-unchecked-pending")) {
                    // Do nothing, let it remain visible on screen
                } else {
                    // Hide it only if it was a completely fresh unfiltered item row
                    row.style.display = "none";
                    return;
                }
            } else {
                // If the user re-checks the item row, strip away the pending delete flags instantly
                row.classList.remove("is-unchecked-pending");
            }
        }
        // ============================================================================
        const matchesSearch = searchText === "" || cells.some((el, idx) => { if (idx === 0) return false; return el.textContent.toLowerCase().includes(searchText); });

        // ============================================================================
        // FIXED DYNAMIC BOOLEAN INTER-SLICER LOGIC RUNTIME ENGINE 🎯
        // ============================================================================
        let matchesSlicers = true; 
        for (const [dataAttr, filterSet] of Object.entries(window.selectedFilters)) { 
            if (filterSet.size === 0) continue; 
            
            // THE DIRECT FIX: Standardize the mapping key signature to match ui-slicer-view variables
            const cleanKey = String(dataAttr).replace('data-', '').replace('-', '').trim();
            
            const rowTagsStr = row.getAttribute(cleanKey) || row.getAttribute(`data-${cleanKey}`) || row.getAttribute(dataAttr) || ""; 
            const rowParsedTags = rowTagsStr.split(';').map(x => x.trim());

            // Correctly match the tracking array signature key property [INDEX: 0.1.13]
            const useAndLogicOperator = window.booleanLogicalModes[cleanKey] !== false;
            const activeFilterItems = Array.from(filterSet);

            if (useAndLogicOperator) {
                // Boolean AND Strategy: Must contain EVERY active choice selected inside this slice row
                const satisfiesAllChips = activeFilterItems.every(t => rowParsedTags.includes(t));
                if (!satisfiesAllChips) { matchesSlicers = false; break; }
            } else {
                // Boolean OR Strategy: Visible if it hits AT LEAST one active chip match inside this category row
                const satisfiesAnyChip = activeFilterItems.some(t => rowParsedTags.includes(t));
                if (!satisfiesAnyChip) { matchesSlicers = false; break; }
            }
        }
        // ============================================================================
        
        if (matchesSearch && matchesSlicers) { 
            row.style.display = ""; visibleCount++; 
            if (searchText.length >= 1) { cells.forEach((cell, idx) => { if (idx !== 0) injectTextHighlights(cell, searchInput.value.trim()); }); } 
        } else { 
            row.style.display = "none"; 
        }
    });
    
    // 🎯 PLACE THIS INSIDE window.applyCombinedFilter (Near the end of the function)
    if (noResultsMessage) {
        noResultsMessage.style.display = visibleCount === 0 ? "block" : "none";
    }

    if (typeof window.recalculateZebraStriping === "function") {
        window.recalculateZebraStriping();
    }

    window.updateMasterCheckboxState();

    const freshCounterBadge = document.getElementById("tableResultsCounter");
    if (freshCounterBadge) {
        freshCounterBadge.textContent = `${visibleCount}/${activeRows.length}`;
    }

    // ============================================================================
    // 📊 REPAIRED: VISIBLE CHECKBOX COUNTER ENGINE (Slicer Event Synchronized!)
    // ============================================================================
    const counterTextTarget = document.getElementById("checkedFilterCounterText");
    
    if (counterTextTarget) {
        let checkedVisibleCount = 0;
        
        activeRows.forEach(row => {
            // 🎯 THE DIRECT FIX: Count ONLY items that are visible on screen AND checked!
            // When a slicer hides a row (row.style.display === "none"), it drops out of this count immediately!
            if (row.style.display !== "none" && row.querySelector(".row-selector-checkbox")?.checked) {
                checkedVisibleCount++;
            }
        });
        
        // counterTextTarget.textContent = `Selected (${checkedVisibleCount})`;
        counterTextTarget.textContent = `${checkedVisibleCount} selected`;
    }
    // ============================================================================

    if (typeof window.updateAllSlicerButtonsUI === "function") {
        window.updateAllSlicerButtonsUI(activeRows);
    }
};

// Runtime search layout event bindings listeners
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("tableSearch");
    const clearSearchBtn = document.getElementById("clearSearchBtn");
    const selectAllRowsCheckbox = document.getElementById("selectAllRowsCheckbox");
    const showCheckedOnlyToggle = document.getElementById("showCheckedOnlyToggle");
    const tbody = document.getElementById("tableBody");

    searchInput?.addEventListener("input", window.applyCombinedFilter); 
    clearSearchBtn?.addEventListener("click", () => { if (searchInput) searchInput.value = ""; window.applyCombinedFilter(); searchInput?.focus(); });
    // 🎯 CLEANUP ENGINE: Wipe away tracking classes whenever the filter button is clicked [INDEX: 0.1.153]
    showCheckedOnlyToggle?.addEventListener("change", () => {
        window.getRuntimeRows().forEach(row => {
            row.style.display = "";
            row.classList.remove("is-unchecked-pending"); // Flush all tracking variables
        });
        window.applyCombinedFilter();
    });

    // ============================================================================
    // 🚀 FIXED SHIFT + CLICK MULTI-SELECTION ENGINE (With 0ms Async State Delay) 🎯
    // ============================================================================
    window.lastCheckedRowElement = null;

    tbody?.addEventListener("click", function(e) {
        if (e.target.classList.contains("row-selector-checkbox")) {
            const targetedRow = e.target.closest("tr");
            const activeRowsArray = window.getRuntimeRows(); 
            const isFilterActive = showCheckedOnlyToggle?.checked || false;
            
            // 🎯 THE DIRECT FIX: Wait for the browser to finish drawing the checkbox toggle checkmark state!
            setTimeout(() => {
                const currentClickCheckedState = e.target.checked;

                // 1. SHIFT+CLICK RANGE SCANNER ENGINE
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
                            
                            // Synchronize your deferred safety classes flawlessly!
                            if (currentClickCheckedState) {
                                rangeRow.classList.remove("is-unchecked-pending");
                            } else if (isFilterActive) {
                                rangeRow.classList.add("is-unchecked-pending");
                            }
                        }
                    }
                } else {
                    // 🎯 MANUAL ELEMENT CONTROL PATH: If clicking a single row normally, update its classes
                    if (currentClickCheckedState) {
                        targetedRow.classList.remove("is-unchecked-pending");
                    } else if (isFilterActive) {
                        targetedRow.classList.add("is-unchecked-pending");
                    }
                }

                // 2. BACK-END LOCALSTORAGE DATA CACHE PROCESSING PIPELINE
                let savedCheckedKeysDatabase = JSON.parse(localStorage.getItem("dashboardSelectedCheckedKeys") || "[]");

                activeRowsArray.forEach(row => {
                    const box = row.querySelector(".row-selector-checkbox");
                    const rowLookupKeySignature = row.getAttribute("data-row-key") || "";
                    
                    if (box && rowLookupKeySignature !== "") {
                        if (box.checked) {
                            if (!savedCheckedKeysDatabase.includes(rowLookupKeySignature)) {
                                savedCheckedKeysDatabase.push(rowLookupKeySignature);
                            }
                        } else {
                            savedCheckedKeysDatabase = savedCheckedKeysDatabase.filter(key => key !== rowLookupKeySignature);
                        }
                    }
                });

                localStorage.setItem("dashboardSelectedCheckedKeys", JSON.stringify(savedCheckedKeysDatabase));

                // Save the anchor point trace for the next shift selection click
                window.lastCheckedRowElement = targetedRow;

                // 3. RE-REFRESH DASHBOARD LAYOUT & TEXT METRICS COUNTERS
                window.applyCombinedFilter();
            }, 0); // 👈 0ms delay triggers right after the current click render line clears out!
        }
    });
    // ============================================================================

    // 🔄 FIXED BATCH MASTER TOGGLE ENGINE WITH SAFETY DELAY PENDING STATE
    selectAllRowsCheckbox?.addEventListener("change", function() {
        const isChecked = this.checked;
        const visibleRows = window.getRuntimeRows().filter(row => row.style.display !== "none");
        const isFilterActive = showCheckedOnlyToggle?.checked || false;
        
        let savedCheckedKeysDatabase = JSON.parse(localStorage.getItem("dashboardSelectedCheckedKeys") || "[]");

        visibleRows.forEach(row => {
            const box = row.querySelector(".row-selector-checkbox");
            if (!box) return;
            
            // Toggle screen elements visually
            box.checked = isChecked;

            const rowStorageKeySignature = row.getAttribute("data-row-key") || "";
            if (!rowStorageKeySignature) return;

            if (isChecked) {
                // State A: Checking items -> Save state and remove delete-flags instantly
                if (!savedCheckedKeysDatabase.includes(rowStorageKeySignature)) {
                    savedCheckedKeysDatabase.push(rowStorageKeySignature);
                }
                row.classList.remove("is-unchecked-pending");
            } else {
                // State B: Unchecking items -> Filter out from database strings
                savedCheckedKeysDatabase = savedCheckedKeysDatabase.filter(key => key !== rowStorageKeySignature);
                
                // 🎯 THE DIRECT FIX: If "Show checked only" is active, tag the rows as pending instead of deleting them!
                if (isFilterActive) {
                    row.classList.add("is-unchecked-pending");
                }
            }
        });

        // Write changes safely back to localStorage cache memory
        localStorage.setItem("dashboardSelectedCheckedKeys", JSON.stringify(savedCheckedKeysDatabase));

        // Re-evaluate filters and live text counters cleanly
        window.applyCombinedFilter();
    });
});
