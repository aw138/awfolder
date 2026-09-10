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

    // Cache active filter entries outside the main loop to save millions of CPU cycles
    const activeFiltersEntries = Object.entries(window.selectedFilters);
    const hasActiveSlicers = activeFiltersEntries.some(([_, filterSet]) => filterSet.size > 0);

    activeRows.forEach(row => {
        const isChecked = row.querySelector(".row-selector-checkbox")?.checked || false; 
        const cells = Array.from(row.querySelectorAll("td")); 

        // Optimization 1: Skip text-normalization text-parsing entirely if there's no active search text
        if (searchText.length >= 1) {
            cells.forEach((cell, idx) => { 
                if (idx === 0) return; 
                cell.querySelectorAll("mark.search-hit-highlight").forEach(m => { 
                    m.parentNode.replaceChild(document.createTextNode(m.textContent), m); 
                }); 
                cell.normalize(); 
            });
        }

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

        const matchesSearch = searchText === "" || cells.some((el, idx) => { 
            if (idx === 0) return false; 
            return el.textContent.toLowerCase().includes(searchText); 
        });

        let matchesSlicers = true; 
        if (hasActiveSlicers) {
            for (const [dataAttr, filterSet] of activeFiltersEntries) { 
                if (filterSet.size === 0) continue; 

                const cleanKey = String(dataAttr).replace('data-', '').replace('-', '').trim();
                
                // Optimization 2: Read DOM attributes once per row block to prevent Forced Layout sync drops
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
        }

        // Optimization 3: Only write display styling mutations if the state actually CHANGED.
        // This completely eliminates the 2-second layout thrashing freeze.
        if (matchesSearch && matchesSlicers) { 
            if (row.style.display !== "") row.style.display = ""; 
            visibleCount++; 
            if (searchText.length >= 1) { 
                cells.forEach((cell, idx) => { if (idx !== 0) injectTextHighlights(cell, searchInput.value.trim()); }); 
            } 
        } else { 
            if (row.style.display !== "none") row.style.display = "none"; 
        }
    });

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

    const counterTextTarget = document.getElementById("checkedFilterCounterText");
    if (counterTextTarget) {
        let checkedVisibleCount = 0;
        activeRows.forEach(row => {
            if (row.style.display !== "none" && row.querySelector(".row-selector-checkbox")?.checked) {
                checkedVisibleCount++;
            }
        });
        counterTextTarget.textContent = `${checkedVisibleCount} selected`;
    }

    if (typeof window.updateAllSlicerButtonsUI === "function") {
        window.updateAllSlicerButtonsUI(activeRows);
    }
};

// Runtime search layout event bindings listeners [INDEX: 0.1.192]
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("tableSearch");
    const clearSearchBtn = document.getElementById("clearSearchBtn");
    const showCheckedOnlyToggle = document.getElementById("showCheckedOnlyToggle");
    const selectAllRowsCheckbox = document.getElementById("selectAllRowsCheckbox");
    const tbody = document.getElementById("tableBody");

    // 1. INPUT SEARCH PRE-TRIGGER PATHWAY (Maintained for lightweight typing)
    searchInput?.addEventListener("input", function() {
        if (clearSearchBtn) {
            if (this.value.trim().length > 0) {
                clearSearchBtn.style.display = "block";
                clearSearchBtn.innerHTML = "&#10140;"; // Swaps 'X' to right arrow mark
                clearSearchBtn.setAttribute("aria-label", "Execute search");
                clearSearchBtn.dataset.stateMode = "search-trigger";
            } else {
                clearSearchBtn.style.display = "none";
            }
        }
    });

    // 2. INPUT ENTER KEY DOWN HANDLER
    searchInput?.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            window.applyCombinedFilter();
            if (clearSearchBtn && this.value.trim().length > 0) {
                clearSearchBtn.innerHTML = "&times;"; // Resume back to 'X' layout mark
                clearSearchBtn.setAttribute("aria-label", "Clear search");
                clearSearchBtn.dataset.stateMode = "clear-trigger";
            }
        }
    });

    // 3. HYBRID SELECTION RIGHT BUTTON CONTROL
    clearSearchBtn?.addEventListener("click", function() {
        if (!searchInput) return;
        if (this.dataset.stateMode === "search-trigger") {
            window.applyCombinedFilter();
            this.innerHTML = "&times;"; // Resume back to 'X' layout mark
            this.setAttribute("aria-label", "Clear search");
            this.dataset.stateMode = "clear-trigger";
            searchInput.focus();
        } else {
            searchInput.value = "";
            window.applyCombinedFilter();
            this.style.display = "none";
            searchInput.focus();
        }
    });

    // 🎯 4. OPTIMIZED "SHOW CHECKED ONLY" TOGGLE LAYER: 
    // 🎯 THE DIRECT FIX: Clear background tracking flags without flashing row styles
    showCheckedOnlyToggle?.addEventListener("change", () => {
        window.getRuntimeRows().forEach(row => {
            // Wipes away memory tracking states safely without touching 'row.style.display'
            row.classList.remove("is-unchecked-pending"); 
        });
        
        // Execute the combined filter smoothly on the next execution frame tick
        setTimeout(() => {
            window.applyCombinedFilter();
        }, 0);
    });

    // ============================================================================
    // FIXED SHIFT + CLICK MULTI-SELECTION ENGINE (Verbatim & 100% Working) [INDEX: 0.1.192]
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

                            if (currentClickCheckedState) {
                                rangeRow.classList.remove("is-unchecked-pending");
                            } else if (isFilterActive) {
                                rangeRow.classList.add("is-unchecked-pending");
                            }
                        }
                    }
                } else {
                    if (currentClickCheckedState) {
                        targetedRow.classList.remove("is-unchecked-pending");
                    } else if (isFilterActive) {
                        targetedRow.classList.add("is-unchecked-pending");
                    }
                }

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
                window.lastCheckedRowElement = targetedRow;
                window.applyCombinedFilter();
            }, 0);
        }
    });

    // ============================================================================
    // 🎯 5. OPTIMIZED BATCH MASTER TOGGLE ENGINE WITH SAFETY DELAY PENDING STATE [INDEX: 0.1.194]
    // Defer the heavy filter loop call so checkbox state updates instantly!
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
                if (!savedCheckedKeysDatabase.includes(rowStorageKeySignature)) {
                    savedCheckedKeysDatabase.push(rowStorageKeySignature);
                }
                row.classList.remove("is-unchecked-pending");
            } else {
                savedCheckedKeysDatabase = savedCheckedKeysDatabase.filter(key => key !== rowStorageKeySignature);
                if (isFilterActive) {
                    row.classList.add("is-unchecked-pending");
                }
            }
        });

        localStorage.setItem("dashboardSelectedCheckedKeys", JSON.stringify(savedCheckedKeysDatabase));

        // 🔥 ASYNC EVENT BLOCK DEFERRAL: Forces the master checkbox tick/dash icon state to 
        // render on-screen immediately, pushing the heavy loop to the next thread tick.
        setTimeout(() => {
            window.applyCombinedFilter();
        }, 0);
    });
    // ============================================================================
    // 🎯 FEATURE ENHANCEMENT: VISIBLE ROWS INVERT SELECTION ENGINE
    // ============================================================================
    document.getElementById("invertVisibleRowsBtn")?.addEventListener("click", function(e) {
        e.stopPropagation();

        // 1. Gather all data rows and detect if "Show checked only" is active
        const activeRowsArray = window.getRuntimeRows();
        const isFilterActive = showCheckedOnlyToggle?.checked || false;
        let savedCheckedKeysDatabase = JSON.parse(localStorage.getItem("dashboardSelectedCheckedKeys") || "[]");

        // 2. Loop through every single row item in the data registry [INDEX: 0.1.191]
        activeRowsArray.forEach(row => {
            // ❌ STRICT RULE: Skip rows that are currently hidden on your screen by searches/slicers!
            if (row.style.display === "none") return;

            const box = row.querySelector(".row-selector-checkbox");
            if (!box) return;

            // 🔀 INVERT THE STATE NATIVELY: Flip true to false, and false to true
            const prospectiveCheckedState = !box.checked;
            box.checked = prospectiveCheckedState;

            // 3. Process backend state synchronization mappings
            const rowStorageKeySignature = row.getAttribute("data-row-key") || "";
            if (rowStorageKeySignature === "") return;

            if (prospectiveCheckedState) {
                // If it became checked, save to local data arrays and clean up safety delete markers
                if (!savedCheckedKeysDatabase.includes(rowStorageKeySignature)) {
                    savedCheckedKeysDatabase.push(rowStorageKeySignature);
                }
                row.classList.remove("is-unchecked-pending");
            } else {
                // If it became unchecked, remove from storage registry data tags
                savedCheckedKeysDatabase = savedCheckedKeysDatabase.filter(key => key !== rowStorageKeySignature);
                
                // If "Show Checked Only" is active, tag the item as pending [INDEX: 0.1.194]
                if (isFilterActive) {
                    row.classList.add("is-unchecked-pending");
                }
            }
        });

        // 4. Save state back to browser cache memory structures safely [INDEX: 0.1.195]
        localStorage.setItem("dashboardSelectedCheckedKeys", JSON.stringify(savedCheckedKeysDatabase));

        // 5. Instantly force data metrics and visual checkboxes back to a matching state
        window.applyCombinedFilter();
    });
});
