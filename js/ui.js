import { APP_CONFIG } from './config.js';

export class SlicerUIEngine {
    constructor(onFilterChange) {
        this.onFilterChange = onFilterChange;
        this.selectedFilters = {};
        this.multiSelectModes = {};

        // Track active elements via their structural data-attribute names [INDEX]
        APP_CONFIG.filters.forEach(config => {
            this.selectedFilters[config.attr] = new Set();
            this.multiSelectModes[config.attr] = false;
        });
    }

    renderTableHeader() {
        const headerRow = document.getElementById("table-header-row");
        headerRow.innerHTML = APP_CONFIG.columns.map(col => {
            if (col.isCheckbox) {
                return `<th class="checkbox-header-cell"><input type="checkbox" id="selectAllRowsCheckbox" aria-label="Select all rows"></th>`;
            }
            if (col.showCounter) {
                return `<th class="${col.isSortable ? 'sortable' : ''}"><div class="header-inner-flex"><span class="header-title-text">${col.label}</span><span id="tableResultsCounter" class="results-counter-badge"></span></div></th>`;
            }
            return `<th class="${col.isSortable ? 'sortable' : ''}">${col.label}</th>`;
        }).join("");
    }

    renderTableBody(jsonData) {
        const tbody = document.getElementById("tableBody");
        tbody.innerHTML = "";

        jsonData.forEach(item => {
            const tr = document.createElement("tr");
            
            // ?? FIXED DATA MATCH: Mounts data-tag-X row attribute using the clean jsonKey text [INDEX]
            APP_CONFIG.filters.forEach(f => {
                tr.setAttribute(f.attr, item[f.jsonKey] || "");
            });

            tr.innerHTML = `
                <td class="checkbox-data-cell"><input type="checkbox" class="row-selector-checkbox" aria-label="Select row"></td>
                <td>${item.date || ""}</td>
                <td>${item.lunar || ""}</td>
                <td>${item.days || ""}</td>
                <td>${item.agent || ""}</td>
                <td>${item.country || ""}</td>
                <td>${item.description || ""}</td>
            `;
            tbody.appendChild(tr);
        });

        return Array.from(tbody.querySelectorAll("tr"));
    }

    getTagAvailabilityList(currentAttr, uniqueTags, rows, searchCtx) {
        const showCheckedOnly = document.getElementById("showCheckedOnlyToggle")?.checked || false;

        return Array.from(uniqueTags).map(tagValue => {
            let isAvailable = this.selectedFilters[currentAttr].has(tagValue);
            if (!isAvailable) {
                isAvailable = rows.some(row => {
                    if (showCheckedOnly && !row.querySelector(".row-selector-checkbox")?.checked) return false;
                    if (searchCtx !== "" && !Array.from(row.children).some(c => c.textContent.toLowerCase().includes(searchCtx))) return false;
                    if (!(row.getAttribute(currentAttr) || "").split(';').map(t => t.trim()).includes(tagValue)) return false;

                    for (const [otherAttr, otherFilterSet] of Object.entries(this.selectedFilters)) {
                        if (otherAttr === currentAttr || otherFilterSet.size === 0) continue;
                        if (!Array.from(otherFilterSet).some(t => (row.getAttribute(otherAttr) || "").split(';').map(x => x.trim()).includes(t))) return false;
                    }
                    return true;
                });
            }
            return { value: tagValue, available: isAvailable };
        });
    }

    updateAllSlicerButtonsUI(rows) {
        const container = document.getElementById("horizontalFiltersContainer");
        const searchCtx = document.getElementById("tableSearch").value.toLowerCase().trim();
        container.innerHTML = "";

        APP_CONFIG.filters.forEach(config => {
            const currentAttr = config.attr;
            const activeSet = this.selectedFilters[currentAttr];

            const uniqueTags = new Set();
            rows.forEach(row => {
                (row.getAttribute(currentAttr) || "").split(';').forEach(tag => { if (tag.trim()) uniqueTags.add(tag.trim()); });
            });

            const rowDiv = document.createElement('div');
            rowDiv.className = 'filter-row';
            rowDiv.dataset.attr = currentAttr; // Triggers your CSS order [INDEX]

            const labelDiv = document.createElement('div');
            labelDiv.className = 'filter-label';
            labelDiv.textContent = config.label;
            rowDiv.appendChild(labelDiv);

            const optionsWrapper = document.createElement('div');
            optionsWrapper.className = 'filter-options-wrapper';
            rowDiv.appendChild(optionsWrapper);

            const allBtn = document.createElement('button');
            allBtn.className = 'filter-item-btn master-all-btn' + (activeSet.size === 0 ? ' active' : '');
            allBtn.textContent = 'All';
            allBtn.onclick = () => { this.selectedFilters[currentAttr].clear(); window.applyCombinedFilter(); };
            optionsWrapper.appendChild(allBtn);

            const tagsWithAvailability = this.getTagAvailabilityList(currentAttr, uniqueTags, rows, searchCtx);
            
            tagsWithAvailability.sort((a, b) => {
                if (a.available !== b.available) return a.available ? -1 : 1;
                const checkA = a.value.trim().replace(/¡]/g, '(').replace(/¡^/g, ')');
                const checkB = b.value.trim().replace(/¡]/g, '(').replace(/¡^/g, ')');
                if (checkA === "(None)" || checkB === "(None)") return checkA === "(None)" ? 1 : -1;

                let priorityA = undefined; let priorityB = undefined;
                for (const key in APP_CONFIG.customSortPriority) {
                    if (checkA.startsWith(key)) priorityA = APP_CONFIG.customSortPriority[key];
                    if (checkB.startsWith(key)) priorityB = APP_CONFIG.customSortPriority[key];
                }
                if (priorityA !== undefined && priorityB !== undefined) return priorityA - priorityB;
                if (priorityA !== undefined) return -1; 
                if (priorityB !== undefined) return 1;

                return checkA.localeCompare(checkB, undefined, { numeric: true, sensitivity: 'base' });
            });

            tagsWithAvailability.forEach(tagObj => {
                const btn = document.createElement('button');
                btn.className = 'filter-item-btn regular-tag-btn' + (activeSet.has(tagObj.value) ? ' active' : (!tagObj.available ? ' disabled-tag' : ''));
                btn.textContent = tagObj.value;
                btn.onclick = () => {
                    if (btn.classList.contains('disabled-tag') && !btn.classList.contains('active')) return;
                    if (this.multiSelectModes[currentAttr]) {
                        if (activeSet.has(tagObj.value)) activeSet.delete(tagObj.value);
                        else activeSet.add(tagObj.value);
                    } else {
                        const dynamicState = activeSet.has(tagObj.value);
                        activeSet.clear(); if (!dynamicState) activeSet.add(tagObj.value);
                    }
                    window.applyCombinedFilter();
                };
                optionsWrapper.appendChild(btn);
            });

            const actionArea = document.createElement('div');
            actionArea.className = 'filter-action-toggle-area';
            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'multiple-toggle-btn' + (this.multiSelectModes[currentAttr] ? ' active' : '');
            toggleBtn.textContent = 'Multi';
            toggleBtn.onclick = () => {
                this.multiSelectModes[currentAttr] = !this.multiSelectModes[currentAttr];
                toggleBtn.classList.toggle('active', this.multiSelectModes[currentAttr]);
                if (!this.multiSelectModes[currentAttr]) {
                    this.selectedFilters[currentAttr].clear();
                    window.applyCombinedFilter();
                }
            };
            actionArea.appendChild(toggleBtn);
            rowDiv.appendChild(actionArea);
            container.appendChild(rowDiv);
        });
    }

    resetUIFilters() {
        Object.keys(this.selectedFilters).forEach(key => {
            this.selectedFilters[key].clear();
        });
    }
}
