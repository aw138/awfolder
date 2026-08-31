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

// DYNAMIC ADJUSTABLE COLUMN GRID ENGINE [INDEX: 0.1.125]
window.initColumnResizableEngine = function() {
    const headers = document.querySelectorAll("#dataTable th");
    const layoutSchema = window.activeColumnsWidthsSchema || [];
    
    headers.forEach((th, idx) => {
        // Skip over the master selector checkbox column cell [INDEX: 0.1.125]
        if (idx === 0) return;
        
        // If the cell was already dragged by the user, preserve that custom size [INDEX: 0.1.125]
        if (th.style.width && th.style.width !== "") return;
        
        const configIndex = idx - 1;
        const columnConfig = layoutSchema[configIndex];
        
        // Extract the config bounds from your active JSON payload [INDEX: 0.1.125]
        let remoteWidth = columnConfig && columnConfig.width ? columnConfig.width : 140;
        let remoteMinWidth = columnConfig && columnConfig.minWidth ? columnConfig.minWidth : 80;
        
        // Force write both values explicitly onto the DOM node! 🎯
        th.style.width = remoteWidth + "px";
        th.style.minWidth = remoteMinWidth + "px"; // Enables your custom constraint limits!
    });
    
    // Re-binds mouse dragging handle tracking coordinates seamlessly across cells
    headers.forEach(th => {
        if (!th.querySelector(".th-resize-handle")) {
            const handleDiv = document.createElement("div");
            handleDiv.className = "th-resize-handle";
            th.appendChild(handleDiv);
        }

        const handle = th.querySelector(".th-resize-handle");
        if (!handle) return;

        // Clean up residual event listeners by cloning the element node
        const freshHandle = handle.cloneNode(true);
        handle.parentNode.replaceChild(freshHandle, handle);

        freshHandle.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            e.preventDefault();

            const startX = e.pageX;
            const startWidth = th.offsetWidth;

            const onMouseMove = (moveEvent) => {
                const currentWidth = startWidth + (moveEvent.pageX - startX);
                if (currentWidth > 15) {
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
