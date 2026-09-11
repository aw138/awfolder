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
    const searchText = searchInput.value.toLowerCase().trim(); 
    const showCheckedOnly = showCheckedOnlyToggle?.checked || false; 
    let visibleCount = 0; 
    
    if (clearSearchBtn) clearSearchBtn.style.display = searchText.length > 0 ? "block" : "none";
    
    activeRows.forEach(row => {
        const isChecked = row.querySelector(".row-selector-checkbox")?.checked || false; 
        const cells = Array.from(row.querySelectorAll("td")); 
        cells.forEach((cell, idx) => { 
            if (idx === 0) return; 
            cell.querySelectorAll("mark.search-hit-highlight").forEach(m => { 
                m.parentNode.replaceChild(document.createTextNode(m.textContent), m); 
            }); 
            cell.normalize(); 
        });

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

        if (matchesSearch && matchesSlicers) { 
            row.style.display = ""; visibleCount++; 
            if (searchText.length >= 1) { 
                cells.forEach((cell, idx) => { if (idx !== 0) injectTextHighlights(cell, searchInput.value.trim()); }); 
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

    if (typeof window.updateAllSlicerButtonsUI === "function") window.updateAllSlicerButtonsUI(activeRows);
};
// PART C: EVENT LISTENERS & INVERT MACRO CAPTURE HOOKS (Paste directly below Part B)

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("tableSearch");
    const clearSearchBtn = document.getElementById("clearSearchBtn");
    const showCheckedOnlyToggle = document.getElementById("showCheckedOnlyToggle");
    const selectAllRowsCheckbox = document.getElementById("selectAllRowsCheckbox");
    const tbody = document.getElementById("tableBody");

    searchInput?.addEventListener("input", function() {
        if (clearSearchBtn) {
            if (this.value.trim().length > 0) {
                clearSearchBtn.style.display = "block";
                clearSearchBtn.innerHTML = "&#10140;"; // Swaps 'X' to arrow
                clearSearchBtn.setAttribute("aria-label", "Execute search");
                clearSearchBtn.dataset.stateMode = "search-trigger";
            } else {
                clearSearchBtn.style.display = "none";
            }
        }
    });

    searchInput?.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault(); window.applyCombinedFilter();
            if (clearSearchBtn && this.value.trim().length > 0) {
                clearSearchBtn.innerHTML = "&times;"; // Back to 'X'
                clearSearchBtn.setAttribute("aria-label", "Clear search");
                clearSearchBtn.dataset.stateMode = "clear-trigger";
            }
        }
    });

    clearSearchBtn?.addEventListener("click", function() {
        if (!searchInput) return;
        if (this.dataset.stateMode === "search-trigger") {
            window.applyCombinedFilter();
            this.innerHTML = "&times;"; this.setAttribute("aria-label", "Clear search");
            this.dataset.stateMode = "clear-trigger"; searchInput.focus();
        } else {
            searchInput.value = ""; window.applyCombinedFilter();
            this.style.display = "none"; searchInput.focus();
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
});
