/**
 * UI CORE ENGINE
 * Manages global window structures, layouts, and resizable column frames.
 */

window.selectedFilters = window.selectedFilters || {};
window.booleanLogicalModes = window.booleanLogicalModes || {};  // True = AND, False = OR
window.slicerExpandedStates = window.slicerExpandedStates || {}; // Tracks dropdown open/shut
window.currentCustomSortPriority = window.currentCustomSortPriority || {};
window.activeFiltersSchema = window.activeFiltersSchema || [];
window.activeColumnsWidthsSchema = window.activeColumnsWidthsSchema || [];

// 🎯 REPLACE THE OLD window.initColumnResizableEngine BLOCK VERBATIM WITH:
// AUTOMATED DYNAMIC COLUMN HEADER GENERATOR & RESIZER ENGINE
window.initColumnResizableEngine = function() {
    const tableHeaderRow = document.querySelector("#dataTable thead tr");
    if (!tableHeaderRow) return;

    // Clear old elements completely to guarantee no duplicate cells materialize on sorts
    tableHeaderRow.innerHTML = "";

    const layoutSchema = window.activeColumnsWidthsSchema || [];

    // Loop through your JSON layout rules to build out components dynamically
    layoutSchema.forEach((columnConfig, idx) => {
        if (!columnConfig) return;

        const th = document.createElement("th");

        let remoteWidth = columnConfig.width ? columnConfig.width : "140px";
        let remoteMinWidth = columnConfig.minWidth ? columnConfig.minWidth : "80px";
        let parsedWidthStyle = String(remoteWidth).includes("%") || String(remoteWidth).includes("px") ? remoteWidth : remoteWidth + "px";
        let parsedMinWidthStyle = String(remoteMinWidth).includes("px") || String(remoteMinWidth).includes("%") ? remoteMinWidth : remoteMinWidth + "px";

        th.dataset.minWidthPixels = parseFloat(remoteMinWidth) || 40;
        th.style.width = parsedWidthStyle;
        th.style.minWidth = parsedMinWidthStyle;
        th.style.maxWidth = parsedWidthStyle;

		// 🔍 LOCATE AND REPLACE THIS COMPLETELY IN js/ui-core.js:
        // CASE 1: ROW SELECTION INPUT CHECKBOX
        if (columnConfig.type === "checkbox") {
            th.className = "checkbox-header-cell";
            th.style.width = "40px";
            th.style.minWidth = "40px";

            th.innerHTML = `
                <div class="header-checkbox-stack-wrapper">
                    <input type="checkbox" id="selectAllRowsCheckbox" aria-label="Select all rows">
                    <div id="invertVisibleRowsBtn" class="table-invert-trigger" title="Invert visible selection">&#9744;&#8651;&#9745;</div>
                </div>
            `;
            tableHeaderRow.appendChild(th);
            return;
        }

        // CASE 2: DECLARATIVE FAVOURITES FILTER CONTROL BUTTON MODULE
        if (columnConfig.isToggle === true) {
            th.className = "declarative-toggle-header-alignment custom-fav-header-cell";
            th.style.width = "65px";
            th.style.minWidth = "65px";

            th.innerHTML = `
                <div class="fav-header-stack-wrapper">
                    <span class="fav-header-label-text">Fav <span id="favColumnCounterBadge" class="fav-mini-badge">(0)</span></span>
                    <button type="button" id="favFilterToggleBtn" class="fav-toggle-action-trigger" title="Filter by Favorites only" aria-label="Toggle favorites filtration">★</button>
                </div>
            `;
            tableHeaderRow.appendChild(th);
            
            // Timeout delay ensures element is natively active in DOM tree before attaching listeners
            setTimeout(() => {
                document.getElementById("favFilterToggleBtn")?.addEventListener("click", function(e) {
                    e.stopPropagation();
                    if (typeof window.toggleFavouritesOnlyFilterMode === "function") {
                        window.toggleFavouritesOnlyFilterMode();
                    }
                });
            }, 0);
            return;
        }

        // CASE 3: STANDARD SORTABLE COLUMNS
        th.className = "sortable";
        // Below line is to adjust header alignment if data aligned right
		if (columnConfig.alignRight) th.style.textAlign = "left";

        th.appendChild(document.createTextNode(columnConfig.label || ""));
        th.appendChild(document.createElement("br"));

        const caretSpan = document.createElement("span");
        caretSpan.className = "sort-icon-trigger";
        th.appendChild(caretSpan);

        // CASE 4: CONDITIONAL NESTED "STAT" ANALYTICS TRIGGERS
        if (columnConfig.isStatistics === true && columnConfig.dataType === "number") {
            const statButton = document.createElement("button");
            statButton.type = "button";
            statButton.className = "header-column-stat-trigger-btn";
            // statButton.textContent = "Stat";
            statButton.textContent = "∑";
            statButton.title = "Toggle metrics summary calculation metrics description logs row";
            
            statButton.addEventListener("click", (event) => {
                event.stopPropagation();
                event.preventDefault();
                if (typeof window.toggleColumnStatisticsDisplayView === "function") {
                    window.toggleColumnStatisticsDisplayView(columnConfig.jsonKey, statButton);
                }
            });
            th.appendChild(statButton);
        }

        tableHeaderRow.appendChild(th);
    });

    // 🔄 STEP B: MOUSE DRAG RESIZING HANDLES BINDINGS SYSTEM
    const freshlyRenderedHeaders = document.querySelectorAll("#dataTable th");
    
    freshlyRenderedHeaders.forEach(th => {
        if (!th.querySelector(".th-resize-handle")) {
            const handleDiv = document.createElement("div");
            handleDiv.className = "th-resize-handle";
            th.appendChild(handleDiv);
        }

        const handle = th.querySelector(".th-resize-handle");
        if (!handle) return;

        const freshHandle = handle.cloneNode(true);
        handle.parentNode.replaceChild(freshHandle, handle);

        freshHandle.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            e.preventDefault();

            const originalCalculatedPixelWidth = th.offsetWidth;
            th.style.maxWidth = "none";
            th.style.width = originalCalculatedPixelWidth + "px";
            th.dataset.userDragged = "true";

            const startX = e.pageX;
            const startWidth = originalCalculatedPixelWidth;

            const onMouseMove = (moveEvent) => {
                const currentWidth = startWidth + (moveEvent.pageX - startX);
                const absoluteMinThreshold = parseFloat(th.dataset.minWidthPixels) || 40;

                if (currentWidth >= absoluteMinThreshold) {
                    th.style.width = currentWidth + "px";
                }
            };

            const onMouseUp = () => {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            };

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });
    });
};
