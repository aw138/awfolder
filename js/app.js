import { APP_CONFIG } from './config.js';
import { SlicerUIEngine } from './ui.js';

document.addEventListener("DOMContentLoaded", () => {
    // ?? INITIALIZE ENGINE INSTANCE
    const ui = new SlicerUIEngine();

    const tbody = document.getElementById("tableBody");
    const searchInput = document.getElementById("tableSearch");
    const clearSearchBtn = document.getElementById("clearSearchBtn");
    const noResultsMessage = document.getElementById("noResults");
    const resultsCounter = document.getElementById("tableResultsCounter");
    
    const selectAllRowsCheckbox = document.getElementById("selectAllRowsCheckbox");
    const showCheckedOnlyToggle = document.getElementById("showCheckedOnlyToggle");
    
    window.globalTableRows = [];

    // ?? DATA INGESTION OPERATIONS LOOP [PDF: 0.1.13]
    fetch(APP_CONFIG.DATA_SOURCE_URL)
        .then(res => { if (!res.ok) throw new Error("Load failed"); return res.json(); })
        .then(jsonData => {
            // Render table head cells first to prevent layout drops [PDF: 0.1.13]
            ui.renderTableHeader();
            
            // Build the row items directly out of your json objects
            window.globalTableRows = ui.renderTableBody(jsonData);
            
            // Set up horizontal filtering rows and active buttons panel
            ui.initHorizontalFilters(window.globalTableRows);
            
            // Execute text filtering pipelines
            window.applyCombinedFilter();
            
            // Bind cell sorting commands
            window.bindSortingTriggers();
        })
        .catch(err => {
            console.error(err);
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#D13438;font-weight:bold;padding:20px;">無法自雲端載入 JSON 數據。</td></tr>`;
        });

    window.getRuntimeRows = () => window.globalTableRows.length > 0 ? window.globalTableRows : Array.from(tbody.querySelectorAll("tr"));

    // Copied from your original working filter algorithm [PDF: 0.1.15, 0.1.16]
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
            for (const [dataAttr, filterSet] of Object.entries(window.selectedFilters)) {
                if (filterSet.size === 0) continue;
                if (!Array.from(filterSet).some(t => (row.getAttribute(dataAttr) || "").split(';').map(x => x.trim()).includes(t))) { matchesSlicers = false; break; }
            }

            if (matchesSearch && matchesSlicers) {
                row.style.display = ""; visibleCount++;
                if (searchText.length >= 1) { cells.forEach((cell, idx) => { if (idx !== 0) injectTextHighlights(cell, searchInput.value.trim()); }); }
            } else { row.style.display = "none"; }
        });

        if (noResultsMessage) noResultsMessage.style.display = visibleCount === 0 ? "block" : "none";
        window.recalculateZebraStriping();
        window.updateMasterCheckboxState();

        const counterElement = document.getElementById("tableResultsCounter");
        if (counterElement) counterElement.textContent = `${visibleCount}/${activeRows.length}`;
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
        const masterBox = document.getElementById("selectAllRowsCheckbox");
        if (!masterBox) return;
        const visible = window.getRuntimeRows().filter(r => r.style.display !== "none");
        if (visible.length === 0) { masterBox.checked = false; return; }
        masterBox.checked = visible.every(r => r.querySelector(".row-selector-checkbox")?.checked);
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

    // Copied from your original sorting algorithms [PDF: 0.1.16, 0.1.17]
    window.bindSortingTriggers = function() {
        let currentSortAscending = true;
        document.querySelectorAll("th.sortable").forEach(th => {
            // Clear old event listeners via node clones
            const cleanTh = th.cloneNode(true);
            th.parentNode.replaceChild(cleanTh, th);
            
            cleanTh.addEventListener("click", () => {
                const idx = Array.from(cleanTh.parentNode.children).indexOf(cleanTh);
                currentSortAscending = !currentSortAscending;
                
                document.querySelectorAll(".sort-icon-trigger").forEach(i => i.classList.remove("asc", "desc"));
                const dynamicIcon = cleanTh.querySelector(".sort-icon-trigger");
                if (dynamicIcon) dynamicIcon.classList.add(currentSortAscending ? "asc" : "desc");

                const activeRows = window.getRuntimeRows();
                activeRows.sort((rowA, rowB) => {
                    const cellA = rowA.getElementsByTagName("td")[idx].textContent.trim();
                    const cellB = rowB.getElementsByTagName("td")[idx].textContent.trim();

                    if (idx === 1) { // Chronological Date Sorting [PDF: 0.1.17]
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

    // Font Sizing Multiplying Triggers
    let fSize = 14;
    document.getElementById("decreaseFontBtn")?.addEventListener("click", () => { if (fSize > 8) document.documentElement.style.setProperty('--base-font', (fSize -= 2) + "px"); });
    document.getElementById("increaseFontBtn")?.addEventListener("click", () => { if (fSize < 20) document.documentElement.style.setProperty('--base-font', (fSize += 2) + "px"); });

    // Collapsible Layout Panels
    document.getElementById("dashboardToggleBtn")?.addEventListener("click", function() {
        const isCollapsed = document.querySelector(".filter-dashboard-panel").classList.toggle("collapsed-state");
        this.innerHTML = isCollapsed ? "&#8744;" : "&#8743;";
    });

    // Checkbox Actions
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

    // Reset All Fields Handle [PDF: 0.1.16]
    document.getElementById("clearAllFiltersBtn")?.addEventListener("click", () => {
        if (searchInput) searchInput.value = ""; if (showCheckedOnlyToggle) showCheckedOnlyToggle.checked = false;
        const masterBox = document.getElementById("selectAllRowsCheckbox");
        if (masterBox) masterBox.checked = false;
        window.getRuntimeRows().forEach(row => { const b = row.querySelector(".row-selector-checkbox"); if (b) b.checked = false; });
        for (const k in window.selectedFilters) { window.selectedFilters[k].clear(); window.multiSelectModes[k] = false; }
        document.querySelectorAll('.multiple-toggle-btn').forEach(btn => btn.classList.remove('active'));
        window.applyCombinedFilter();
    });
});
