document.addEventListener("DOMContentLoaded", () => {
    const table = document.getElementById("dataTable");
    if (!table) return;

    const tbody = document.getElementById("tableBody");
    const searchInput = document.getElementById("tableSearch");
    const clearSearchBtn = document.getElementById("clearSearchBtn");
    const noResultsMessage = document.getElementById("noResults");
    const resultsCounter = document.getElementById("tableResultsCounter");

    const selectAllRowsCheckbox = document.getElementById("selectAllRowsCheckbox");
    const showCheckedOnlyToggle = document.getElementById("showCheckedOnlyToggle");

    window.globalTableRows = [];

    // Header Sort Interface Setup (Builds icons without text mutations) [PDF: 0.1.30]
    const sortableHeaders = table.querySelectorAll("th.sortable");
    sortableHeaders.forEach((header) => {
        const titleText = header.textContent.trim();
        header.innerHTML = `<div class="header-inner-flex">
                                <div class="header-label-sort-combo">
                                    <span class="header-title-text">${titleText}</span>
                                    <span class="sort-icon-trigger"></span>
                                </div>
                            </div>`;
    });

    // 1. ASYNCHRONOUS JSON DATA PIPELINE INITIALIZER [PDF: 0.1.30]
    fetch(window.APP_CONFIG.DATA_SOURCE_URL)
        .then(res => { 
            if (!res.ok) throw new Error("Data stream failed"); 
            return res.json(); 
        })
        .then(jsonData => {
            tbody.innerHTML = ""; 
            jsonData.forEach(item => {
                const tr = document.createElement("tr");
                tr.setAttribute("data-tag-1", item.tag1 || "");
                tr.setAttribute("data-tag-2", item.tag2 || "");
                tr.setAttribute("data-tag-3", item.tag3 || "");
                tr.setAttribute("data-tag-4", item.tag4 || "");
                tr.setAttribute("data-tag-5", item.tag5 || "");
                tr.setAttribute("data-tag-6", item.tag6 || "");

                tr.innerHTML = `
                    <td class="checkbox-data-cell">
                        <input type="checkbox" class="row-selector-checkbox" aria-label="Select row">
                    </td>
                    <td>${item.date || ""}</td>
                    <td>${item.lunar || ""}</td>
                    <td>${item.days || ""}</td>
                    <td>${item.agent || ""}</td>
                    <td>${item.country || ""}</td>
                    <td>${item.description || ""}</td>
                `;
                tbody.appendChild(tr);
            });

            window.globalTableRows = Array.from(tbody.querySelectorAll("tr"));
            if (typeof window.initHorizontalFilters === "function") { 
                window.initHorizontalFilters(window.globalTableRows); 
            }
            window.applyCombinedFilter();
        })
        .catch(err => {
            console.error("JSON Pipeline initial load halted:", err);
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#D13438;font-weight:bold;padding:20px;">無法自雲端載入 JSON 數據。</td></tr>`;
        });

    window.getRuntimeRows = function() { 
        return window.globalTableRows.length > 0 ? window.globalTableRows : Array.from(tbody.querySelectorAll("tr")); 
    };

    // Layout Collapse / Expand Handler [PDF: 0.1.31]
    document.getElementById("dashboardToggleBtn")?.addEventListener("click", function() {
        const isCollapsed = document.querySelector(".filter-dashboard-panel").classList.toggle("collapsed-state");
        this.innerHTML = isCollapsed ? "&#8744;" : "&#8743;";
    });

    // Font Sizing Multipliers [PDF: 0.1.31]
    let fontTrackerSize = 14;
    document.getElementById("decreaseFontBtn")?.addEventListener("click", () => { 
        if (fontTrackerSize > 8) {
            document.documentElement.style.setProperty('--base-font', (fontTrackerSize -= 2) + "px"); 
        }
    });
    document.getElementById("increaseFontBtn")?.addEventListener("click", () => { 
        if (fontTrackerSize < 20) {
            document.documentElement.style.setProperty('--base-font', (fontTrackerSize += 2) + "px"); 
        }
    });

    // Master Header Checkbox Action Trigger [PDF: 0.1.31]
    selectAllRowsCheckbox?.addEventListener("change", function() {
        const isChecked = this.checked;
        window.getRuntimeRows().forEach(row => { 
            if (row.style.display !== "none") { 
                const box = row.querySelector(".row-selector-checkbox"); 
                if (box) box.checked = isChecked; 
            } 
        });
    });

    tbody.addEventListener("change", function(e) { 
        if (e.target.classList.contains("row-selector-checkbox")) { 
            if (showCheckedOnlyToggle?.checked) { 
                window.applyCombinedFilter(); 
            } else { 
                window.updateMasterCheckboxState(); 
            } 
        } 
    });
    
    showCheckedOnlyToggle?.addEventListener("change", () => { window.applyCombinedFilter(); });
    // SEARCH HIGHLIGHT REGEX ENGINE TOOLS [PDF: 0.1.32]
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

    // High-Density Combined Slicer Logic Match Pipeline [PDF: 0.1.32, 0.1.33]
    window.applyCombinedFilter = function() {
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

            if (showCheckedOnly && !isChecked) { row.style.display = "none"; return; }
            const matchesSearch = searchText === "" || cells.some((el, idx) => { 
                if (idx === 0) return false; 
                return el.textContent.toLowerCase().includes(searchText); 
            });

            let matchesSlicers = true;
            for (const [dataAttr, filterSet] of Object.entries(window.selectedFilters)) {
                if (filterSet.size === 0) continue;
                if (!Array.from(filterSet).some(t => (row.getAttribute(dataAttr) || "").split(';').map(x => x.trim()).includes(t))) { 
                    matchesSlicers = false; break; 
                }
            }

            if (matchesSearch && matchesSlicers) { 
                row.style.display = ""; 
                visibleCount++; 
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

        if (resultsCounter) resultsCounter.textContent = `${visibleCount}/${activeRows.length}`;
        if (typeof window.updateAllSlicerButtonsUI === "function") window.updateAllSlicerButtonsUI(activeRows);
    };

    searchInput?.addEventListener("input", window.applyCombinedFilter);
    clearSearchBtn?.addEventListener("click", () => { searchInput.value = ""; window.applyCombinedFilter(); searchInput.focus(); });

    // SORT SYSTEM ENGINE LOOPS [PDF: 0.1.33, 0.1.34]
    function executeSort(columnIndex, ascending) {
        const activeRows = window.getRuntimeRows();
        activeRows.sort((rowA, rowB) => {
            const cellA = rowA.getElementsByTagName("td")[columnIndex].textContent.trim();
            const cellB = rowB.getElementsByTagName("td")[columnIndex].textContent.trim();

            if (columnIndex === 1) { // Date Evaluation
                const matchA = cellA.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/); 
                const matchB = cellB.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
                if (matchA && matchB) {
                    return ascending 
                        ? new Date(matchA[1], matchA[2]-1, matchA[3]).getTime() - new Date(matchB[1], matchB[2]-1, matchB[3]).getTime() 
                        : new Date(matchB[1], matchB[2]-1, matchB[3]).getTime() - new Date(matchA[1], matchA[2]-1, matchA[3]).getTime();
                }
            }
            if (/^-?\d+(\.\d+)?$/.test(cellA) && /^-?\d+(\.\d+)?$/.test(cellB)) {
                return ascending ? parseFloat(cellA) - parseFloat(cellB) : parseFloat(cellB) - parseFloat(cellA);
            }
            return ascending 
                ? cellA.localeCompare(cellB, undefined, { numeric: true, sensitivity: 'base' }) 
                : cellB.localeCompare(cellA, undefined, { numeric: true, sensitivity: 'base' });
        });

        const fragment = document.createDocumentFragment(); 
        activeRows.forEach(row => fragment.appendChild(row)); 
        tbody.appendChild(fragment);
        window.recalculateZebraStriping();
    }

    window.recalculateZebraStriping = function() {
        const activeRows = window.getRuntimeRows(); 
        let visibleIndex = 0;
        activeRows.forEach(row => { 
            if (row.style.display !== "none") row.classList.toggle("visible-even-row", (visibleIndex++) % 2 === 1); 
            else row.classList.remove("visible-even-row"); 
        });
    };

    window.updateMasterCheckboxState = function() {
        if (!selectAllRowsCheckbox) return; 
        const visibleRows = window.getRuntimeRows().filter(r => r.style.display !== "none");
        if (visibleRows.length === 0) { selectAllRowsCheckbox.checked = false; return; }
        selectAllRowsCheckbox.checked = visibleRows.every(r => r.querySelector(".row-selector-checkbox")?.checked);
    };

    table.querySelectorAll(".sort-icon-trigger").forEach(sortIcon => {
        sortIcon.addEventListener("click", (e) => {
            e.stopPropagation(); 
            const parentTh = sortIcon.closest("th"); 
            const index = Array.from(parentTh.parentNode.children).indexOf(parentTh);
            let currentSortAscending = !sortIcon.classList.contains("asc");
            
            table.querySelectorAll(".sort-icon-trigger").forEach(icon => icon.classList.remove("asc", "desc"));
            sortIcon.classList.add(currentSortAscending ? "asc" : "desc"); 
            executeSort(index, currentSortAscending);
        });
    });

    document.getElementById("clearAllFiltersBtn")?.addEventListener("click", () => {
        if (searchInput) searchInput.value = ""; 
        if (showCheckedOnlyToggle) showCheckedOnlyToggle.checked = false; 
        if (selectAllRowsCheckbox) selectAllRowsCheckbox.checked = false;
        
        window.getRuntimeRows().forEach(row => { 
            const box = row.querySelector(".row-selector-checkbox"); 
            if (box) box.checked = false; 
        });
        for (const dataAttr in window.selectedFilters) { 
            window.selectedFilters[dataAttr].clear(); 
            window.multiSelectModes[dataAttr] = false; 
        }
        document.querySelectorAll('.multiple-toggle-btn').forEach(btn => btn.classList.remove('active')); 
        window.applyCombinedFilter();
    });
});
