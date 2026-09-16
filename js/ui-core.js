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

// DYNAMIC ADJUSTABLE COLUMN GRID ENGINE [PDF: 0.1.186]
window.initColumnResizableEngine = function() {
 const headers = document.querySelectorAll("#dataTable th");
 const layoutSchema = window.activeColumnsWidthsSchema || [];
 
 headers.forEach((th, idx) => {
 // Skip over the master selector checkbox column cell [PDF: 0.1.186]
 if (idx === 0) return;
 
 // If the cell was already dragged by the user, preserve that custom size [PDF: 0.1.186]
 if (th.style.width && th.style.width !== "" && th.style.width.includes("px") && th.dataset.userDragged === "true") return;
 
 const configIndex = idx - 1;
 const columnConfig = layoutSchema[configIndex];
 if (!columnConfig) return;
 
 // Extract the config bounds from your active JSON payload [PDF: 0.1.186]
 let remoteWidth = columnConfig.width ? columnConfig.width : "140px";
 let remoteMinWidth = columnConfig.minWidth ? columnConfig.minWidth : "80px"; 
 
 let parsedWidthStyle = String(remoteWidth).includes("%") || String(remoteWidth).includes("px") ? remoteWidth : remoteWidth + "px";
 let parsedMinWidthStyle = String(remoteMinWidth).includes("px") || String(remoteMinWidth).includes("%") ? remoteMinWidth : remoteMinWidth + "px";
 
 // Force write initial percentage values onto the DOM head [PDF: 0.1.186]
 th.style.width = parsedWidthStyle;
 th.style.minWidth = parsedMinWidthStyle;
 th.style.maxWidth = parsedWidthStyle; // Keeps column stable during browser window resizing
 });
 
 // Re-binds mouse dragging handle tracking coordinates seamlessly across cells [PDF: 0.1.186]
 headers.forEach(th => {
 if (!th.querySelector(".th-resize-handle")) {
 const handleDiv = document.createElement("div");
 handleDiv.className = "th-resize-handle";
 th.appendChild(handleDiv);
 }
 
 const handle = th.querySelector(".th-resize-handle");
 if (!handle) return;
 
 // Clean up residual event listeners by cloning the element node [PDF: 0.1.186]
 const freshHandle = handle.cloneNode(true);
 handle.parentNode.replaceChild(freshHandle, handle);
 
 freshHandle.addEventListener("mousedown", (e) => {
 e.stopPropagation();
 e.preventDefault();
 
 // 🎯 THE FIX: Convert current layout size to absolute pixels and clear maxWidth restrictions
 const originalCalculatedPixelWidth = th.offsetWidth;
 th.style.maxWidth = "none"; 
 th.style.width = originalCalculatedPixelWidth + "px";
 th.dataset.userDragged = "true"; // Tag column to preserve user manual dimensions
 
 const startX = e.pageX;
 const startWidth = originalCalculatedPixelWidth;
 
 const onMouseMove = (moveEvent) => {
 const currentWidth = startWidth + (moveEvent.pageX - startX);
 
 // Read raw physical pixels and compare directly with your JSON minWidth value
 const rawMinThreshold = parseFloat(th.style.minWidth) || 40;
 
 if (currentWidth >= rawMinThreshold) {
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
