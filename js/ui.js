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

            // ?? MASTER SLICER BUTTON SORTING RULES (BORROWED FROM YOUR WORKING ENGINE)
            const rowPriorityMap = this.config.customSortPriority?.[filterSchema.key];

            optionList.sort((a, b) => {
                // 1?? RULE: Clean up string wrappers and alternative parentheses structures
                const checkA = String(a).trim().replace(/¡]/g, '(').replace(/¡^/g, ')');
                const checkB = String(b).trim().replace(/¡]/g, '(').replace(/¡^/g, ')');

                // 2?? RULE: Hardcoded exceptions (e.g., "(None)" or "N/A" options always drop to the absolute end)
                if (checkA === "(None)" || checkA === "N/A") return 1;
                if (checkB === "(None)" || checkB === "N/A") return -1;

                // 3?? RULE: Evaluate fuzzy partial match values via .startsWith() dictionary mapping
                let priorityA = undefined; 
                let priorityB = undefined;

                if (rowPriorityMap) {
                    for (const key in rowPriorityMap) {
                        if (checkA.startsWith(key)) priorityA = rowPriorityMap[key];
                        if (checkB.startsWith(key)) priorityB = rowPriorityMap[key];
                    }
                }

                // If both items are found in your custom priority mapping dictionary
                if (priorityA !== undefined && priorityB !== undefined) {
                    return priorityA - priorityB;
                }
                // If only item A is prioritized, move it to the front
                if (priorityA !== undefined) return -1; 
                // If only item B is prioritized, move it to the front
                if (priorityB !== undefined) return 1;

                // 4?? FALLBACK RULE: Natural sorting for anything else
                return checkA.localeCompare(checkB, undefined, { numeric: true, sensitivity: 'base' });
            });

            // Always prepend "All" option to the front of the filter row list
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
