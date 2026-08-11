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

            // ?? FIXED MASTER SLICER BUTTON SORTING RULES ENGINE
            const rowPriorityMap = this.config.customSortPriority?.[filterSchema.key];

            optionList.sort((a, b) => {
                // If a priority map exists for this row, look up the custom weight.
                // If the button text is NOT in your config, assign it a neutral middle score of 500.
                const weightA = rowPriorityMap && rowPriorityMap[a] !== undefined ? rowPriorityMap[a] : 500;
                const weightB = rowPriorityMap && rowPriorityMap[b] !== undefined ? rowPriorityMap[b] : 500;

                // 1?? Rule: If they have different weights, sort strictly by their custom priority scores
                if (weightA !== weightB) {
                    return weightA - weightB;
                }

                // 2?? Fallback Rule: If they have the exact same priority score (e.g. both are unmapped 500s),
                // use standard natural alphanumeric sorting relative to each other.
                return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
            });

            // Always prepend "All" option to the front of the filter row list row tracking
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
