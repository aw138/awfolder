export class SlicerUIEngine {
    constructor(config, onFilterChange) {
        this.config = config;
        this.onFilterChange = onFilterChange;
        this.activeFilters = {}; 
        
        this.config.filters.forEach(f => {
            this.activeFilters[f.key] = "All";
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
        const countBadge = document.getElementById("record-count");
        
        countBadge.textContent = `${records.length} Record(s) Found`;

        if (records.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${this.config.columns.length}" style="text-align:center; color:#8c8c8c;">No records match your filters.</td></tr>`;
            return;
        }

        tbody.innerHTML = records.map(row => {
            const columnsHtml = this.config.columns.map(col => {
                const cellValue = row[col.key] ?? "-";
                const visualValue = col.key === 'duration_days' ? `${cellValue} Days` : cellValue;
                return `<td class="${col.align || ''}">${visualValue}</td>`;
            }).join("");
            
            return `<tr>${columnsHtml}</tr>`;
        }).join("");
    }

    // ?? NEW UPGRADED DYNAMIC SLICER RENDERING
    renderFilters(fullDataset) {
        const container = document.getElementById("filters-sidebar");
        container.innerHTML = ""; 

        this.config.filters.forEach(filterSchema => {
            let uniqueValues = new Set();

            // ?? PARSE SEMI-COLON DATA STRINGS INTO SEPARATE TAGS
            fullDataset.forEach(item => {
                const rawValue = item[filterSchema.key];
                if (rawValue !== undefined && rawValue !== null) {
                    const stringVal = String(rawValue);
                    if (stringVal.includes(";")) {
                        // Split tags, clean spaces, and add each individually
                        stringVal.split(";").forEach(tag => uniqueValues.add(tag.trim()));
                    } else {
                        uniqueValues.add(stringVal.trim());
                    }
                }
            });

            let optionList = Array.from(uniqueValues);

            // ?? APPLY CUSTOM BUTTON SORT PRIORITY AND FALLBACK TO NATURAL SORT
            const rowPriorityMap = this.config.customSortPriority?.[filterSchema.key];

            optionList.sort((a, b) => {
                const priorityA = rowPriorityMap?.[a];
                const priorityB = rowPriorityMap?.[b];

                // If BOTH items have a manually specified priority, sort by those weights
                if (priorityA !== undefined && priorityB !== undefined) {
                    return priorityA - priorityB;
                }
                // If only 'a' has a priority weight, move it based on value
                if (priorityA !== undefined) {
                    return priorityA === 999 ? 1 : -1; // 999 goes to back, others go to front
                }
                // If only 'b' has a priority weight, move it based on value
                if (priorityB !== undefined) {
                    return priorityB === 999 ? -1 : 1;
                }

                // ?? Fallback: If neither has a manual weight, use standard natural sorting
                return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
            });

            // Always prepend "All" option to the front of the filter row tracking
            optionList = ["All", ...optionList];


            const groupDiv = document.createElement("div");
            groupDiv.className = "filter-group";

            const labelSpan = document.createElement("span");
            labelSpan.className = "filter-label";
            labelSpan.textContent = filterSchema.label;
            groupDiv.appendChild(labelSpan);

            const optionsDiv = document.createElement("div");
            optionsDiv.className = "filter-options";

            optionList.forEach(option => {
                const btn = document.createElement("button");
                btn.className = `filter-btn ${this.activeFilters[filterSchema.key] === option ? 'active' : ''}`;
                btn.textContent = option;
                
                btn.addEventListener("click", () => {
                    this.activeFilters[filterSchema.key] = option;
                    
                    optionsDiv.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");

                    this.onFilterChange(this.activeFilters);
                });

                optionsDiv.appendChild(btn);
            });

            groupDiv.appendChild(optionsDiv);
            container.appendChild(groupDiv);
        });
    }

    resetUIFilters() {
        Object.keys(this.activeFilters).forEach(key => {
            this.activeFilters[key] = "All";
        });
        document.querySelectorAll(".filter-group").forEach(group => {
            const buttons = group.querySelectorAll(".filter-btn");
            buttons.forEach(btn => {
                if (btn.textContent === "All") btn.classList.add("active");
                else btn.classList.remove("active");
            });
        });
    }
}
