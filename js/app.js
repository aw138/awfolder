import { APP_CONFIG } from './config.js';
import { SlicerUIEngine } from './ui.js';

document.addEventListener("DOMContentLoaded", () => {
    const ui = new SlicerUIEngine(window.applyCombinedFilter);
    ui.renderTableHeader();

    const tbody = document.getElementById("tableBody");
    const searchInput = document.getElementById("tableSearch");
    const clearSearchBtn = document.getElementById("clearSearchBtn");
    const noResultsMessage = document.getElementById("noResults");
    const resultsCounter = document.getElementById("tableResultsCounter");
    const selectAllRowsCheckbox = document.getElementById("selectAllRowsCheckbox");
    const showCheckedOnlyToggle = document.getElementById("showCheckedOnlyToggle");
    
    window.globalTableRows = [];
    let currentSortAscending = true;

    // Header Sort Interface Setup
    document.querySelectorAll("th.sortable").forEach((header) => {
        const titleText = header.textContent.trim();
        header.innerHTML = `<div class="header-inner-flex">
                                <div class="header-label-sort-combo">
                                    <span class="header-title-text">${titleText}</span>
                                    <span class="sort-icon-trigger"></span>
                                </div>
                            </div>`;
    });

    // Asynchronous JSON Fetch Data Pipeline
    fetch(APP_CONFIG.DATA_SOURCE_URL)
        .then(res => { if (!res.ok) throw new Error("Cloud data link down"); return res.json(); })
        .then(jsonData => {
            window.globalTableRows = ui.renderTableBody(jsonData);
            ui.updateAllSlicerButtonsUI(window.globalTableRows);
            window.applyCombinedFilter();
            window.bindSortingTriggers();
        })
        .catch(err => {
            console.error(err);
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#D13438;font-weight:bold;padding:20px;">Error loading data file.</td></tr>`;
        });

    window.getRuntimeRows = () => window.globalTableRows.length > 0 ? window.globalTableRows : Array.from(tbody.querySelectorAll("tr"));

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
                cell.querySelectorAll("mark.search-hit-highlight").forEach(m => { m.parentNode.replaceChild(document.createTextNode(m.textContent), m); });
                cell.normalize();
            });

            if (showCheckedOnly && !isChecked) { row.style.display = "none"; return; }

            const matchesSearch = searchText === "" || cells.some((el, idx) => idx !== 0 && el.textContent.toLowerCase().includes(searchText));
            
            let matchesSlicers = true;
            for (const [attr, filterSet] of Object.entries(ui.selectedFilters)) {
                if (filterSet.size === 0) continue;
                if (!Array.from(filterSet).some(t => (row.getAttribute(attr) || "").split(';').map(x => x.trim()).includes(t))) { matchesSlicers = false; break; }
            }

            if (matchesSearch && matchesSlicers) {
                row.style.display = ""; visibleCount++;
                if (searchText.length >= 1) { cells.forEach((cell, idx) => { if (idx !== 0) injectTextHighlights(cell, searchInput.value.trim()); }); }
            } else { row.style.display = "none"; }
        });

        if (noResultsMessage) noResultsMessage.style.display = visibleCount === 0 ? "block" : "none";
        window.recalculateZebraStriping();
        window.updateMasterCheckboxState();

        if (resultsCounter) resultsCounter.textContent = `${visibleCount}/${activeRows.length}`;
        ui.updateAllSlicerButtonsUI(activeRows);
    };
    window.recalculateZebraStriping = () => {
        let idx = 0;
        window.getRuntimeRows().forEach(row => {
            if (row.style.display !== "none") row.classList.toggle("visible-even-row", (idx++) % 2 === 1);
            else row.classList.remove("visible-even-row");
        });
    };

    window.updateMasterCheckboxState = () => {
        if (!selectAllRowsCheckbox) return;
        const visible = window.getRuntimeRows().filter(r => r.style.display !== "none");
        if (visible.length === 0) { selectAllRowsCheckbox.checked = false; return; }
        selectAllRowsCheckbox.checked = visible.every(r => r.querySelector(".row-selector-checkbox")?.checked);
    };

    function injectTextHighlights(element, phrase) {
        const regex = new RegExp(`(${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        Array.from(element.childNodes).forEach(node => {
            if (node.nodeType === 3 && regex.test(node.nodeValue)) {
                const span = document.createElement('span');
                span.innerHTML = node.nodeValue.replace(regex, '<mark class="search-hit-highlight">$1</mark>');
                element.replaceChild(span, node);
            } else if (node.nodeType === 1 && !['MARK', 'SCRIPT', 'INPUT'].includes(node.nodeName)) {
                injectTextHighlights(node, phrase);
            }
        });
    }

    window.bindSortingTriggers = function() {
        document.querySelectorAll(".sort-icon-trigger").forEach(icon => {
            const oldTh = icon.closest("th");
            const th = oldTh.cloneNode(true);
            oldTh.parentNode.replaceChild(th, oldTh);
            
            const dynamicIcon = th.querySelector(".sort-icon-trigger");
            
            th.addEventListener("click", () => {
                const idx = Array.from(th.parentNode.children).indexOf(th);
                currentSortAscending = !currentSortAscending;
                
                document.querySelectorAll(".sort-icon-trigger").forEach(i => i.classList.remove("asc", "desc"));
                dynamicIcon.classList.add(currentSortAscending ? "asc" : "desc");

                const activeRows = window.getRuntimeRows();
                activeRows.sort((rowA, rowB) => {
                    const cellA = rowA.getElementsByTagName("td")[idx].textContent.trim();
                    const cellB = rowB.getElementsByTagName("td")[idx].textContent.trim();

                    if (idx === 1) { // Date Evaluation
                        const mA = cellA.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/); 
                        const mB = cellB.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
                        if (mA && mB) {
                            const tA = new Date(mA[1], mA[2] - 1, mA[3]).getTime(); 
                            const tB = new Date(mB[1], mB[2] - 1, mB[3]).getTime();
                            return currentSortAscending ? tA - tB : tB - tA;
                        }
                    }
                    if (/^-?\d+(\.\d+)?$/.test(cellA) && /^-?\d+(\.\d+)?$/.test(cellB)) {
                        return currentSortAscending ? parseFloat(cellA) - parseFloat(cellB) : parseFloat(cellB) - parseFloat(cellA);
                    }
                    return currentSortAscending ? cellA.localeCompare(cellB, undefined, { numeric: true }) : cellB.localeCompare(cellA, undefined, { numeric: true });
                });

                const frag = document.createDocumentFragment(); 
                activeRows.forEach(r => frag.appendChild(r)); 
                tbody.appendChild(frag);
                window.recalculateZebraStriping();
            });
        });
    };

    // Font Sizing Multipliers
    let fSize = 14;
    document.getElementById("decreaseFontBtn")?.addEventListener("click", () => { if (fSize > 8) document.documentElement.style.setProperty('--base-font', (fSize -= 2) + "px"); });
    document.getElementById("increaseFontBtn")?.addEventListener("click", () => { if (fSize < 20) document.documentElement.style.setProperty('--base-font', (fSize += 2) + "px"); });

    // Collapsible Layout Panels
    document.getElementById("dashboardToggleBtn")?.addEventListener("click", function() {
        const isCollapsed = document.querySelector(".filter-dashboard-panel").classList.toggle("collapsed-state");
        this.innerHTML = isCollapsed ? "&#8744;" : "&#8743;";
    });

    // Checkbox State Observers
    document.body.addEventListener("change", (e) => {
        if (e.target && e.target.id === "selectAllRowsCheckbox") {
            const isChecked = e.target.checked;
            window.getRuntimeRows().forEach(row => { if (row.style.display !== "none") { const box = row.querySelector(".row-selector-checkbox"); if (box) box.checked = isChecked; } });
            if (showCheckedOnlyToggle?.checked) window.applyCombinedFilter();
        }
    });

    tbody.addEventListener("change", (e) => { if (e.target.classList.contains("row-selector-checkbox")) { if (showCheckedOnlyToggle?.checked) window.applyCombinedFilter(); else window.updateMasterCheckboxState(); } });
    showCheckedOnlyToggle?.addEventListener("change", window.applyCombinedFilter);
    searchInput?.addEventListener("input", window.applyCombinedFilter);
    clearSearchBtn?.addEventListener("click", () => { searchInput.value = ""; window.applyCombinedFilter(); searchInput.focus(); });

    // Reset All Dashboard Operations
    document.getElementById("clearAllFiltersBtn")?.addEventListener("click", () => {
        if (searchInput) searchInput.value = ""; if (showCheckedOnlyToggle) showCheckedOnlyToggle.checked = false; if (selectAllRowsCheckbox) selectAllRowsCheckbox.checked = false;
        window.getRuntimeRows().forEach(row => { const b = row.querySelector(".row-selector-checkbox"); if (b) b.checked = false; });
        for (const k in ui.selectedFilters) { ui.selectedFilters[k].clear(); ui.multiSelectModes[k] = false; }
        document.querySelectorAll('.multiple-toggle-btn').forEach(btn => btn.classList.remove('active'));
        window.applyCombinedFilter();
    });
});
