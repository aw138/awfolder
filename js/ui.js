// Handles UI generation (writing tables and
// filter elements to the DOM) based on whatever
// metadata configuration object is passed to it.

export class SlicerUIEngine {
    constructor(config, onFilterChange) {
        this.config = config;
        this.onFilterChange = onFilterChange;
        this.activeFilters = {}; // State tracking object: { country: "Japan", year: "All" }
        
        // Init active state entries based on configs
        this.config.filters.forEach(f => {
            this.activeFilters[f.key] = "All";
        });
    }

    // Dynamic Head Header Generation
    renderTableHeader() {
        const headerRow = document.getElementById("table-header-row");
        headerRow.innerHTML = this.config.columns
            .map(col => `<th class="${col.align || ''}">${col.label}</th>`)
            .join("");
    }

    // Dynamic Row Elements Generation
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
                // Append custom styling tags if data column is duration metrics
                const visualValue = col.key === 'duration_days' ? `${cellValue} Days` : cellValue;
                return `<td class="${col.align || ''}">${visualValue}</td>`;
            }).join("");
            
            return `<tr>${columnsHtml}</tr>`;
        }).join("");
    }

    // Automatic Engine Slicer UI Generation
    renderFilters(fullDataset) {
        const container = document.getElementById("filters-sidebar");
        container.innerHTML = ""; // Clear existing layout

        this.config.filters.forEach(filterSchema => {
            // Find distinct options present inside dataset array elements automatically
            const distinctValues = [...new Set(fullDataset.map(item => item[filterSchema.key]))].sort();
            const optionList = ["All", ...distinctValues];

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
                    
                    // Highlight selected element
                    optionsDiv.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");

                    // Trigger logical dataset filter reduction loop
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
        // Select all 'All' buttons visually
        document.querySelectorAll(".filter-group").forEach(group => {
            const buttons = group.querySelectorAll(".filter-btn");
            buttons.forEach(btn => {
                if (btn.textContent === "All") btn.classList.add("active");
                else btn.classList.remove("active");
            });
        });
    }
}
