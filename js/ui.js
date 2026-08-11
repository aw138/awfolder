export class SlicerUIEngine {
    constructor(config, onFilterChange) {
        this.config = config;
        this.onFilterChange = onFilterChange;
        this.selectedFilters = {};  
        this.multiSelectModes = {}; 

        this.config.filters.forEach(f => {
            this.selectedFilters[f.key] = new Set();
            this.multiSelectModes[f.key] = false;
        });
    }

    renderTableHeader() {
        const headerRow = document.getElementById("table-header-row");
        headerRow.innerHTML = this.config.columns
            .map(col => `<th class="${col.align || ''}">${col.label}</th>`)
            .join("");
    }

    renderTableBody(records) {
        const tbody = document.getElementById("table-body");
        document.getElementById("record-count").textContent = `${records.length} Record(s) Found`;

        if (records.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${this.config.columns.length}" style="text-align:center; color:#8c8c8c;">No records match your filters.</td></tr>`;
            return;
        }

        tbody.innerHTML = records.map(row => {
            return `<tr>${this.config.columns.map(col => `<td class="${col.align || ''}">${row[col.key] ?? "-"}</td>`).join("")}</tr>`;
        }).join("");
    }

    getTagAvailabilityList(currentKey, uniqueTags, allRecords) {
        return Array.from(uniqueTags).map(tagValue => {
            let isAvailable = this.selectedFilters[currentKey].has(tagValue);
            
            if (!isAvailable) {
                isAvailable = allRecords.some(record => {
                    const cellData = String(record[currentKey] || "");
                    const hasTag = cellData.split(';').map(t => t.trim()).includes(tagValue);
                    if (!hasTag) return false;

                    for (const [otherKey, otherFilterSet] of Object.entries(this.selectedFilters)) {
                        if (otherKey === currentKey || otherFilterSet.size === 0) continue;
                        
                        const otherCellData = String(record[otherKey] || "");
                        const recordTags = otherCellData.split(';').map(x => x.trim());
                        
                        const matchesAnySelected = Array.from(otherFilterSet).some(t => recordTags.includes(t));
                        if (!matchesAnySelected) return false;
                    }
                    return true;
                });
            }
            return { value: tagValue, available: isAvailable };
        });
    }
    renderFilters(allRecords) {
        const container = document.getElementById("filters-sidebar");
        container.innerHTML = ""; 

        this.config.filters.forEach(filterSchema => {
            const currentKey = filterSchema.key;
            const activeSet = this.selectedFilters[currentKey];

            const uniqueTags = new Set();
            allRecords.forEach(record => {
                String(record[currentKey] || "").split(';').forEach(tag => {
                    if (tag.trim()) uniqueTags.add(tag.trim());
                });
            });

            const groupDiv = document.createElement("div");
            groupDiv.className = "filter-group";

            const labelSpan = document.createElement("span");
            labelSpan.className = "filter-label";
            labelSpan.textContent = filterSchema.label;
            groupDiv.appendChild(labelSpan);

            const optionsDiv = document.createElement("div");
            optionsDiv.className = "filter-options";

            const allBtn = document.createElement('button');
            allBtn.className = 'filter-btn master-all-btn' + (activeSet.size === 0 ? ' active' : '');
            allBtn.textContent = 'All';
            allBtn.onclick = () => {
                this.selectedFilters[currentKey].clear();
                this.onFilterChange();
            };
            optionsDiv.appendChild(allBtn);

            const tagsWithAvailability = this.getTagAvailabilityList(currentKey, uniqueTags, allRecords);

            // ?? FIXED SHORT LINE COMPATIBILITY BUTTON SORTING ENGINE
            tagsWithAvailability.sort((a, b) => {
                if (a.available !== b.available) {
                    return a.available ? -1 : 1;
                }

                // Split strings cleanly into shorter variable sets to fit screens
                const strA = String(a.value).trim();
                const strB = String(b.value).trim();
                
                const checkA = strA.replace(/¡]/g, '(').replace(/¡^/g, ')');
                const checkB = strB.replace(/¡]/g, '(').replace(/¡^/g, ')');

                const isNoneA = (checkA === "(None)" || checkA === "N/A");
                const isNoneB = (checkB === "(None)" || checkB === "N/A");

                if (isNoneA || isNoneB) {
                    return isNoneA ? 1 : -1;
                }

                let pA = undefined; 
                let pB = undefined;
                const pMap = this.config.customSortPriority || {};

                for (const key in pMap) {
                    if (checkA.startsWith(key)) pA = pMap[key];
                    if (checkB.startsWith(key)) pB = pMap[key];
                }

                if (pA !== undefined && pB !== undefined) {
                    return pA - pB;
                }
                if (pA !== undefined) return -1; 
                if (pB !== undefined) return 1;

                return checkA.localeCompare(checkB, undefined, { 
                    numeric: true, 
                    sensitivity: 'base' 
                });
            });

            tagsWithAvailability.forEach(tagObj => {
                const btn = document.createElement('button');
                const hasActive = activeSet.has(tagObj.value);
                const isUnavail = !tagObj.available;
                
                btn.className = 'filter-btn' + 
                    (hasActive ? ' active' : (isUnavail ? ' disabled-tag' : ''));
                btn.textContent = tagObj.value;
                
                btn.onclick = () => {
                    if (btn.classList.contains('disabled-tag') && !btn.classList.contains('active')) return;

                    if (this.multiSelectModes[currentKey]) {
                        if (activeSet.has(tagObj.value)) activeSet.delete(tagObj.value);
                        else activeSet.add(tagObj.value);
                    } else {
                        const isAlreadyActive = activeSet.has(tagObj.value);
                        activeSet.clear();
                        if (!isAlreadyActive) activeSet.add(tagObj.value);
                    }
                    this.onFilterChange();
                };
                optionsDiv.appendChild(btn);
            });

            const multiBtn = document.createElement('button');
            const isMultiActive = this.multiSelectModes[currentKey];
            multiBtn.className = 'btn-secondary multi-toggle-btn' + (isMultiActive ? ' active' : '');
            multiBtn.textContent = 'Multi';
            multiBtn.onclick = () => {
                this.multiSelectModes[currentKey] = !this.multiSelectModes[currentKey];
                multiBtn.classList.toggle('active', this.multiSelectModes[currentKey]);
                if (!this.multiSelectModes[currentKey]) {
                    this.selectedFilters[currentKey].clear();
                }
                this.onFilterChange();
            };

            groupDiv.appendChild(optionsDiv);
            groupDiv.appendChild(multiBtn);
            container.appendChild(groupDiv);
        });
    }

    resetUIFilters() {
        Object.keys(this.selectedFilters).forEach(key => {
            this.selectedFilters[key].clear();
        });
    }
}
