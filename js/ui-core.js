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

// DYNAMIC ADJUSTABLE COLUMN GRID ENGINE [✦]
window.initColumnResizableEngine = function() {
    const headers = document.querySelectorAll("#dataTable th");
    const layoutSchema = window.activeColumnsWidthsSchema || [];
    
    headers.forEach((th, idx) => {
        const columnConfig = layoutSchema[idx];
        if (!columnConfig) return;
        
        // Extract the config bounds from your active JSON payload [✦]
        let remoteWidth = columnConfig.width ? columnConfig.width : "140px";
        let remoteMinWidth = columnConfig.minWidth ? columnConfig.minWidth : "80px"; 
        
        let parsedWidthStyle = String(remoteWidth).includes("%") || String(remoteWidth).includes("px") ? remoteWidth : remoteWidth + "px";
        let parsedMinWidthStyle = String(remoteMinWidth).includes("px") || String(remoteMinWidth).includes("%") ? remoteMinWidth : remoteMinWidth + "px";
        
        // 🎯 THE FIX Part 1: Strip "px" clean so raw numerical values are preserved on the element dataset cache for drag trackers
        th.dataset.minWidthPixels = parseFloat(remoteMinWidth) || 40;
        
// 🎯 REPLACE VERBATIM WITH THIS CONDITIONAL STAT BUTTON INJECTOR INSIDE THE LOOP:
        th.style.width = parsedWidthStyle;
        th.style.minWidth = parsedMinWidthStyle;
        th.style.maxWidth = parsedWidthStyle;

        // 🌟 Injected: Append a "Stat" trigger button ONLY if it doesn't already exist
        if (columnConfig.isStatistics === true && columnConfig.dataType === "number") {
            
            // 🎯 THE FIX: Check if this header th cell already contains a Stat button
            let existingStatBtn = th.querySelector(".header-column-stat-trigger-btn");
            
            if (!existingStatBtn) {
                const statButton = document.createElement("button");
                statButton.type = "button";
                statButton.className = "header-column-stat-trigger-btn";
                statButton.textContent = "Stat";
                statButton.title = "Toggle metrics data summary calculation metrics description logs row";
                
                // Defend cell click event captures hierarchy chain bubbles up triggers
                statButton.addEventListener("click", (event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    if (typeof window.toggleColumnStatisticsDisplayView === "function") {
                        window.toggleColumnStatisticsDisplayView(columnConfig.jsonKey, statButton);
                    }
                });
                th.appendChild(statButton);
            } else {
                // 🔄 OPTIONAL SAFETY: If the button already exists, re-sync its active class state
                if (window.activeStatisticsColumnJsonKey === columnConfig.jsonKey) {
                    existingStatBtn.classList.add("active-panel-visible");
                } else {
                    existingStatBtn.classList.remove("active-panel-visible");
                }
            }
        }
    });
    
    // Re-binds mouse dragging handle tracking coordinates seamlessly across cells [✦]
    headers.forEach(th => {
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
            
            // 🎯 THE FIX Part 2: Temporarily clear the percentage maxWidth restriction so the cell can stretch freely in pixels [✦]
            th.style.maxWidth = "none"; 
            th.style.width = originalCalculatedPixelWidth + "px";
            th.dataset.userDragged = "true"; 
            
            const startX = e.pageX;
            const startWidth = originalCalculatedPixelWidth;
            
            const onMouseMove = (moveEvent) => {
                const currentWidth = startWidth + (moveEvent.pageX - startX);
                
                // 🎯 THE FIX Part 3: Read our clean dataset cache token value safely without string unit clipping failures
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
