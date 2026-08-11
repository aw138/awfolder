export class SlicerUIEngine {
    constructor(config, onFilterChange) {
        this.config = config;
        this.onFilterChange = onFilterChange;
        
        // Replicate your original state tracking structures
        this.selectedFilters = {};  // Maps key -> Set of active buttons
        this.multiSelectModes = {}; // Maps key -> true/false

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

    // ?? YOUR WORKING ENGINE'S CROSS-AVAILABILITY CALCULATOR (PORTED TO JSON)
    getTagAvailabilityList(currentKey, uniqueTags, allRecords) {
        return Array.from(uniqueTags).map(tagValue => {
            // If it is already selected, it is inherently considered active
            let isAvailable = this.selectedFilters[currentKey].has(tagValue);
            
            if (!isAvailable) {
                // Check if any record in the dataset matches this tag AND satisfies all OTHER row filters
                isAvailable = allRecords.some(record => {
                    // 1. Check if the record contains this specific tag value
                    const cellData = String(record[currentKey] || "");
                    const hasTag = cellData.split(';').map(t => t.trim()).includes(tagValue);
                    if (!hasTag) return false;

                    // 2. Cross-check against all OTHER row selections (Intersection loop)
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

    // ?? DYNAMICALLY RE-RENDER AND RE-SORT BUTTONS ON EVERY CLICK
    renderFilters(allRecords) {
        const container = document.getElementById("filters-sidebar");
        container.innerHTML = ""; 

        this.config.filters.forEach(filterSchema => {
            const currentKey = filterSchema.key;
            const activeSet = this.selectedFilters[currentKey];

            // Extract all unique values present for this tag column
            const uniqueTags = new Set();
            allRecords.forEach(record => {
                String(record[currentKey] || "").split(';').forEach(tag => {
                    if (tag.trim()) uniqueTags.add(tag.trim());
                });
            });

            // Create row container
            const groupDiv = document.createElement("div");
            groupDiv.className = "filter-group";

            const labelSpan = document.createElement("span");
            labelSpan.className = "filter-label";
            labelSpan.textContent = filterSchema.label;
            groupDiv.appendChild(labelSpan);

            const optionsDiv = document.createElement("div");
            optionsDiv.className = "filter-options";

            // Add the master 'All' button
            const allBtn = document.createElement('button');
            allBtn.className = 'filter-btn master-all-btn' + (activeSet.size === 0 ? ' active' : '');
            allBtn.textContent = 'All';
            allBtn.onclick = () => {
                this.selectedFilters[currentKey].clear();
                this.onFilterChange();
            };
            optionsDiv.appendChild(allBtn);

            // Calculate live availability based on your original rules
            const tagsWithAvailability = this.getTagAvailabilityList(currentKey, uniqueTags, allRecords);

            // ?? COPIED DIRECTLY FROM YOUR WORKING ENGINE SORTING CONTRACT
            tagsWithAvailability.sort((a, b) => {
                // First sort by availability status
                if (a.available !== b.available) return a.available ? -1 : 1;

                const checkA = String(a.value).trim().replace(/¡]/g, '(').replace(/¡^/g, ')');
                const checkB = String(b.value).trim().replace(/¡]/g, '(').replace(/¡^/g, ')');

                if (checkA === "(None)" || checkB === "(None)" || checkA === "N/A" || checkB === "N/A") {
                    return (checkA === "(None)" || checkA === "N/A") ? 1 : -1;
                }

                let priorityA = undefined; 
                let priorityB = undefined;
                const priorityMap = this.config.customSortPriority || {};

                // Your fuzzy string prefix matching loop (.startsWith)
                for (const key in priorityMap) {
                    if (checkA.startsWith(key)) priorityA = priorityMap[key];
                    if (checkB.startsWith(key)) priorityB = priorityMap[key];
                }

                if (priorityA !== undefined && priorityB !== undefined) return priorityA - priorityB;
                if (priorityA !== undefined) return -1; 
                if (priorityB !== undefined) return 1;

                return checkA.localeCompare(checkB, undefined, { numeric: true, sensitivity: 'base' });
            });

            // Generate the buttons inside the slicer row layout
            tagsWithAvailability.forEach(tagObj => {
                const btn = document.createElement('button');
                // Handle styling states based on activity or availability constraints
                btn.className = 'filter-btn' + 
                    (activeSet.has(tagObj.value) ? ' active' : (!tagObj.available ? ' disabled-tag' : ''));
                
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

            // Append a multi-select toggle button exactly like your system framework
            const multiBtn = document.createElement('button');
            multiBtn.className = 'btn-secondary multi-toggle-btn' + (this.multiSelectModes[currentKey] ? ' active' : '');
            multiBtn.textContent = 'Multi';
            multiBtn.onclick = () => {
                this.multiSelectModes[currentKey] = !this.multiSelectModes[currentKey];
                multiBtn.classList.toggle('active', this.multiSelectModes[currentKey]);
                if (!this.multiSelectModes[currentKey]) {
                    this.selectedFilters[currentKey].clear();
                    this.onFilterChange();
                }
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
