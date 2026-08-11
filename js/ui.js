import { APP_CONFIG } from './config.js';

export class SlicerUIEngine {
    constructor() {
        // Copy state initializers from lines 686-687 [PDF: 0.1.11]
        window.selectedFilters = {};
        window.multiSelectModes = {};
        
        APP_CONFIG.tagColumnsConfig.forEach(config => {
            window.selectedFilters[config.dataAttr] = new Set();
            window.multiSelectModes[config.dataAttr] = false;
        });
    }

    // Dynamic row generation copied from lines 851-875 [PDF: 0.1.13, 0.1.14]
    renderTableBody(jsonData) {
        const tbody = document.getElementById("tableBody");
        tbody.innerHTML = ""; 

        jsonData.forEach(item => {
            const tr = document.createElement("tr");
            
            // Re-bind tag datasets mapping attributes cleanly back onto rows [PDF: 0.1.13]
            APP_CONFIG.tagColumnsConfig.forEach(f => {
                const cleanKey = f.dataAttr.replace('data-', '').replace('-', '');
                tr.setAttribute(f.dataAttr, item[cleanKey] || "");
            });

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

        return Array.from(tbody.querySelectorAll("tr"));
    }

    // Copied exactly from your working lines 735-755 [PDF: 0.1.11, 0.1.12]
    getTagAvailabilityList(currentAttr, uniqueTags, rows, searchCtx) {
        const showCheckedOnly = document.getElementById("showCheckedOnlyToggle")?.checked || false;

        return Array.from(uniqueTags).map(tagValue => {
            let isAvailable = window.selectedFilters[currentAttr].has(tagValue);
            if (!isAvailable) {
                isAvailable = rows.some(row => {
                    if (showCheckedOnly && !row.querySelector(".row-selector-checkbox")?.checked) return false;
                    if (searchCtx !== "" && !Array.from(row.children).some(c => c.textContent.toLowerCase().includes(searchCtx))) return false;
                    if (!(row.getAttribute(currentAttr) || "").split(';').map(t => t.trim()).includes(tagValue)) return false;

                    for (const [otherAttr, otherFilterSet] of Object.entries(window.selectedFilters)) {
                        if (otherAttr === currentAttr || otherFilterSet.size === 0) continue;
                        if (!Array.from(otherFilterSet).some(t => (row.getAttribute(otherAttr) || "").split(';').map(x => x.trim()).includes(t))) return false;
                    }
                    return true;
                });
            }
            return { value: tagValue, available: isAvailable };
        });
    }

    // Setup initial horizontal panels from lines 690-731 [PDF: 0.1.11]
    initHorizontalFilters(rows) {
        const container = document.getElementById("horizontalFiltersContainer");
        container.innerHTML = "";
        
        APP_CONFIG.tagColumnsConfig.forEach(config => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'filter-row';
            rowDiv.dataset.attr = config.dataAttr;
            
            const labelDiv = document.createElement('div');
            labelDiv.className = 'filter-label';
            labelDiv.textContent = config.title;
            rowDiv.appendChild(labelDiv);
            
            const optionsWrapper = document.createElement('div');
            optionsWrapper.className = 'filter-options-wrapper';
            rowDiv.appendChild(optionsWrapper);
            
            const actionArea = document.createElement('div');
            actionArea.className = 'filter-action-toggle-area';
            
            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'multiple-toggle-btn';
            toggleBtn.textContent = 'Multi';
            
            toggleBtn.onclick = () => {
                window.multiSelectModes[config.dataAttr] = !window.multiSelectModes[config.dataAttr];
                toggleBtn.classList.toggle('active', window.multiSelectModes[config.dataAttr]);
                if (!window.multiSelectModes[config.dataAttr]) {
                    window.selectedFilters[config.dataAttr].clear();
                    window.applyCombinedFilter();
                }
            };
            
            actionArea.appendChild(toggleBtn);
            rowDiv.appendChild(actionArea);
            container.appendChild(rowDiv);
        });
        this.updateAllSlicerButtonsUI(rows);
    }

    // Copied exactly from your working lines 757-812 [PDF: 0.1.12, 0.1.13]
    updateAllSlicerButtonsUI(rows) {
        const container = document.getElementById("horizontalFiltersContainer");
        const searchCtx = document.getElementById("tableSearch").value.toLowerCase().trim();
        const filterRowsElements = container.querySelectorAll('.filter-row');
        
        filterRowsElements.forEach(rowEl => {
            const currentAttr = rowEl.dataset.attr;
            const optionsWrapper = rowEl.querySelector('.filter-options-wrapper');
            const activeSet = window.selectedFilters[currentAttr];
            
            const uniqueTags = new Set();
            rows.forEach(row => {
                (row.getAttribute(currentAttr) || "").split(';').forEach(tag => { 
                    if (tag.trim()) uniqueTags.add(tag.trim()); 
                });
            });
            
            optionsWrapper.innerHTML = "";
            const allBtn = document.createElement('button');
            allBtn.className = 'filter-item-btn master-all-btn' + (activeSet.size === 0 ? ' active' : '');
            allBtn.textContent = 'All';
            allBtn.onclick = () => { 
                window.selectedFilters[currentAttr].clear();
                window.applyCombinedFilter(); 
            };
            optionsWrapper.appendChild(allBtn);
            
            const tagsWithAvailability = this.getTagAvailabilityList(currentAttr, uniqueTags, rows, searchCtx);
            
            // ?? COPIED FROM YOUR ORIGINAL EXACT WORKING CODE LINES [PDF: 0.1.12]
            tagsWithAvailability.sort((a, b) => {
                if (a.available !== b.available) return a.available ? -1 : 1;
                const checkA = a.value.trim().replace(/¡]/g, '(').replace(/¡^/g, ')');
                const checkB = b.value.trim().replace(/¡]/g, '(').replace(/¡^/g, ')');
                if (checkA === "(None)" || checkB === "(None)") {
                    return checkA === "(None)" ? 1 : -1;
                }
                
                let priorityA = undefined; 
                let priorityB = undefined;
                for (const key in APP_CONFIG.customSortPriority) {
                    if (checkA.startsWith(key)) priorityA = APP_CONFIG.customSortPriority[key];
                    if (checkB.startsWith(key)) priorityB = APP_CONFIG.customSortPriority[key];
                }
                if (priorityA !== undefined && priorityB !== undefined) {
                    return priorityA - priorityB;
                }
                if (priorityA !== undefined) return -1; 
                if (priorityB !== undefined) return 1;
                
                return checkA.localeCompare(checkB, undefined, { 
                    numeric: true, 
                    sensitivity: 'base' 
                });
            });
            
            tagsWithAvailability.forEach(tagObj => {
                const btn = document.createElement('button');
                btn.className = 'filter-item-btn regular-tag-btn' + (activeSet.has(tagObj.value) ? ' active' : (!tagObj.available ? ' disabled-tag' : ''));
                btn.textContent = tagObj.value;
                btn.onclick = () => {
                    if (btn.classList.contains('disabled-tag') && !btn.classList.contains('active')) return;
                    if (window.multiSelectModes[currentAttr]) {
                        if (activeSet.has(tagObj.value)) activeSet.delete(tagObj.value);
                        else activeSet.add(tagObj.value);
                    } else {
                        const dynamicState = activeSet.has(tagObj.value);
                        activeSet.clear(); 
                        if (!dynamicState) activeSet.add(tagObj.value);
                    }
                    window.applyCombinedFilter();
                };
                optionsWrapper.appendChild(btn);
            });
        });
    }
}
