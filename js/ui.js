window.selectedFilters = window.selectedFilters || {};
window.multiSelectModes = window.multiSelectModes || {};
window.currentCustomSortPriority = window.currentCustomSortPriority || {};
window.activeFiltersSchema = window.activeFiltersSchema || [];
window.activeColumnsWidthsSchema = window.activeColumnsWidthsSchema || [];

// DYNAMIC ADJUSTABLE COLUMN ENGINE [INDEX: 0.1.125]
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
        
        // 🎯 THE FIX: Force write both values explicitly onto the DOM node!
        th.style.width = remoteWidth + "px";
        th.style.minWidth = remoteMinWidth + "px"; // 👈 Enables your custom constraint boundary limits!
    });
    
    // Re-binds mouse dragging handle tracking coordinates seamlessly across the updated cells
    headers.forEach(th => {
        if (!th.querySelector(".th-resize-handle")) {
            const handleDiv = document.createElement("div");
            handleDiv.className = "th-resize-handle";
            th.appendChild(handleDiv);
        }

        const handle = th.querySelector(".th-resize-handle");
        if (!handle) return;

        // Clean up any residual event listeners by copying the element node cleanly
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


// UNIVERSAL HORIZONTAL ROW FILTER GENERATOR: Formatted strictly using "tagX" structures
window.initHorizontalFilters = function(rows) {
    const container = document.getElementById("horizontalFiltersContainer");
    if (!container) return;
    container.innerHTML = "";

    const filterSchema = window.activeFiltersSchema || [];

    filterSchema.forEach(config => {
        const cleanKey = String(config.jsonKey || "").replace('data-', '').replace('-', '').trim();
        
        window.selectedFilters[cleanKey] = new Set();
        window.multiSelectModes[cleanKey] = false;

        const rowDiv = document.createElement('div');
        rowDiv.className = 'filter-row';
        rowDiv.dataset.attr = cleanKey; 

        // Locate this block around line 797 in your original script layout: [INDEX: 0.1.117]
        const labelDiv = document.createElement('div');
        labelDiv.className = 'filter-label';
        labelDiv.textContent = config.title || "";
        
        // ============================================================================
        // 🎯 THE FIX: DYNAMIC JSON LABEL WIDTH LOADER
        // ============================================================================
        // Extract width from JSON if it exists; otherwise fall back to a standard 54px
        let customWidth = config.labelWidth ? config.labelWidth : 54;
        
        // Force write the values directly to the DOM inline styles to override CSS
        labelDiv.style.setProperty('min-width', customWidth + 'px', 'important');
        labelDiv.style.setProperty('max-width', customWidth + 'px', 'important');
        // ============================================================================
        
        rowDiv.appendChild(labelDiv); // [Keep your existing layout appends unchanged] [INDEX: 0.1.117]

        const optionsWrapper = document.createElement('div');
        optionsWrapper.className = 'filter-options-wrapper';
        rowDiv.appendChild(optionsWrapper);

        const actionArea = document.createElement('div');
        actionArea.className = 'filter-action-toggle-area';

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'multiple-toggle-btn';
        toggleBtn.textContent = 'Multi';

        toggleBtn.onclick = () => {
            window.multiSelectModes[cleanKey] = !window.multiSelectModes[cleanKey];
            toggleBtn.classList.toggle('active', window.multiSelectModes[cleanKey]);
            if (!window.multiSelectModes[cleanKey]) {
                window.selectedFilters[cleanKey].clear();
                window.applyCombinedFilter();
            }
        };

        actionArea.appendChild(toggleBtn);
        rowDiv.appendChild(actionArea);
        container.appendChild(rowDiv);
    });
    window.updateAllSlicerButtonsUI(rows);
};

// 🚀 STATE-AWARE DUAL-MODE FILTER MATRIX: Differentiates active vs passive slicer rows flawlessly!
function getTagAvailabilityList(currentAttr, uniqueTags, rows, searchCtx) {
    const showCheckedOnly = document.getElementById("showCheckedOnlyToggle")?.checked || false;
    const currentFilters = window.selectedFilters || {};
    
    // Determine if this specific category row is the active driver steering the current view session
    const isActiveSteeringSlicer = (window.activeSlicerKey === currentAttr);

    return Array.from(uniqueTags).map(tagValue => {
        // Keep selected chips active natively
        let isAvailable = currentFilters[currentAttr] && currentFilters[currentAttr].has(tagValue);
        
        if (!isAvailable) {
            isAvailable = rows.some(row => {
                
                if (isActiveSteeringSlicer) {
                    // ============================================================================
                    // MODE A: ACTIVE STEERING SLICER ROW EVALUATION RULE (e.g., The row you just clicked!)
                    // ============================================================================
                    // To enable quick switching between siblings, this row MUST ignore its own filter values,
                    // but it must still respect all external filters (text queries, checks, and OTHER categories).

                    // 1. Text Search Constraints
                    if (searchCtx !== "") {
                        const rowCells = Array.from(row.querySelectorAll("td"));
                        const matchesText = rowCells.some((el, idx) => idx !== 0 && el.textContent.toLowerCase().includes(searchCtx));
                        if (!matchesText) return false;
                    }

                    // 2. Checkbox Constraints
                    if (showCheckedOnly) {
                        const isChecked = row.querySelector(".row-selector-checkbox")?.checked || false;
                        const isPending = row.classList.contains("is-unchecked-pending");
                        if (!isChecked && !isPending) return false;
                    }

                    // 3. Sibling Slicer Constraints (Explicitly skip checking our own category!)
                    for (const [otherAttr, otherFilterSet] of Object.entries(currentFilters)) {
                        if (otherAttr === currentAttr || !otherFilterSet || otherFilterSet.size === 0) continue;
                        const nestedTags = row.getAttribute(otherAttr) || row.getAttribute(`data-${otherAttr}`) || "";
                        if (!Array.from(otherFilterSet).some(t => nestedTags.split(';').map(x => x.trim()).includes(t))) return false;
                    }

                } else {
                    // ============================================================================
                    // MODE B: PASSIVE SLICER ROWS EVALUATION RULE (All other adjacent slicer rows)
                    // ============================================================================
                    // These rows are completely passive, so they must match the raw on-screen reality.
                    // If a table row is hidden on screen for ANY reason, its tag options drop out immediately!
                    if (row.style.display === "none") {
                        return false;
                    }
                }

                // D. Ensure the row actually contains this specific button token value
                const rowTagsStr = row.getAttribute(currentAttr) || row.getAttribute(`data-${currentAttr}`) || "";
                return rowTagsStr.split(';').map(t => t.trim()).includes(tagValue);
            });
        }
        return { value: tagValue, available: isAvailable };
    });
}

window.updateAllSlicerButtonsUI = function(rows) {
    const container = document.getElementById("horizontalFiltersContainer");
    if (!container) return;
    
    const searchCtx = document.getElementById("tableSearch")?.value.toLowerCase().trim() || "";
    const filterRowsElements = container.querySelectorAll('.filter-row');
    const currentFilters = window.selectedFilters || {};

    filterRowsElements.forEach(rowEl => {
        const currentAttr = rowEl.dataset.attr;
        const optionsWrapper = rowEl.querySelector('.filter-options-wrapper');
        if (!optionsWrapper) return;
        
        const activeSet = currentFilters[currentAttr] || new Set();

        const uniqueTags = new Set();
        rows.forEach(row => {
            const attrVal = row.getAttribute(currentAttr) || row.getAttribute(`data-${currentAttr}`) || "";
            attrVal.split(';').forEach(tag => { if (tag.trim()) uniqueTags.add(tag.trim()); });
        });

        optionsWrapper.innerHTML = "";
        const allBtn = document.createElement('button');
        allBtn.className = 'filter-item-btn master-all-btn' + (activeSet.size === 0 ? ' active' : '');
        allBtn.textContent = 'All';
        allBtn.onclick = () => { if (currentFilters[currentAttr]) currentFilters[currentAttr].clear(); window.applyCombinedFilter(); };
        optionsWrapper.appendChild(allBtn);

        const tagsWithAvailability = getTagAvailabilityList(currentAttr, uniqueTags, rows, searchCtx);
        
        // 🎯 DYNAMIC CONFIG EXTRACTOR: Moved above the sort routine to allow safe metric checking [INDEX: 1]
        const filterConfigBlock = (window.activeFiltersSchema || []).find(f => {
            const schemaCleanKey = String(f.jsonKey || "").replace('data-', '').replace('-', '').trim();
            return schemaCleanKey === currentAttr;
        });
        
        const customBtnTextColor = filterConfigBlock && filterConfigBlock.textColor ? filterConfigBlock.textColor : "";
        const assignedDataType = filterConfigBlock && filterConfigBlock.dataType ? filterConfigBlock.dataType.toLowerCase() : "string";

		// Traditional Chinese Stroke-Count / Alphanumeric Sorting Rule (100% Verbatim Duplicate of table-sort.js Logic)
		tagsWithAvailability.sort((a, b) => {
			if (a.available !== b.available) return a.available ? -1 : 1;

			// Standard baseline text (Preserves spaces and brackets exactly like data cells)
			const checkA = a.value.trim();
			const checkB = b.value.trim();
			if (checkA === "None" || checkB === "None" || checkA === "" || checkB === "") return checkA === "None" ? 1 : -1;

			// ============================================================================
			// STEP 1: JSON CUSTOM PRIORITY ROUTER LAYER
			// ============================================================================
			let priorityA = undefined; 
			let priorityB = undefined;
			const priorityRules = window.currentCustomSortPriority || {};
			
			const strippedA = checkA.replace(/[\s（）()]/g, '');
			const strippedB = checkB.replace(/[\s（）()]/g, '');

			for (const key in priorityRules) {
				const cleanKey = key.trim().replace(/[\s（）()]/g, '');
				if (strippedA === cleanKey || strippedA.startsWith(cleanKey)) priorityA = priorityRules[key];
				if (strippedB === cleanKey || strippedB.startsWith(cleanKey)) priorityB = priorityRules[key];
			}

			// Handles priority weights. Items with 999 priority sink to the absolute bottom.
			if (priorityA !== undefined && priorityB !== undefined) return priorityA - priorityB;
			if (priorityA !== undefined) return priorityA === 999 ? 1 : -1; 
			if (priorityB !== undefined) return priorityB === 999 ? -1 : 1;

			// ============================================================================
			// STEP 2: TRACK ROUTING MIRRORED VERBATIM FROM table-sort.js
			// ============================================================================
			
			// CASE A: Explicit Date Timeline Sort Rule
			if (assignedDataType === "date") { 
				const matchA = checkA.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/); 
				const matchB = checkB.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/); 
				if (matchA && matchB) { 
					const timeA = new Date(parseInt(matchA[1], 10), parseInt(matchA[2], 10) - 1, parseInt(matchA[3], 10)).getTime();
					const timeB = new Date(parseInt(matchB[1], 10), parseInt(matchB[2], 10) - 1, parseInt(matchB[3], 10)).getTime();
					return timeA - timeB;
				} 
			} 

			// CASE B: Explicit Pure Mathematical Currency/Numeric Sort Rule
			if (assignedDataType === "number") {
				const numA = parseFloat(strippedA.replace(/[^\d.-]/g, '')) || 0;
				const numB = parseFloat(strippedB.replace(/[^\d.-]/g, '')) || 0;
				return numA - numB; 
			}

			// CASE C: Universal Alphanumeric & Traditional Chinese Stroke-Count Sort Rule
			// VERBATIM ADOPTION OF YOUR INTERNAL ENGINE LOGIC RULES:
			const enCollator = new Intl.Collator('en-US', { sensitivity: 'base' });
			const zhStrokeCollator = new Intl.Collator('zh-CN-u-co-stroke', { sensitivity: 'base' });

			function checkIsChinese(str) {
				if (!str) return false;
				return /[\u4e00-\u9fff]/.test(str.charAt(0));
			}

			const typeA = checkIsChinese(checkA) ? 'cn' : 'en';
			const typeB = checkIsChinese(checkB) ? 'cn' : 'en';

			// 规则1：英文/数字排在中文前面
			if (typeA !== typeB) {
				return typeA === 'en' ? -1 : 1;
			}

			// 规则2：同类型比较
			if (typeA === 'en') {
				// 字典序比较
				return enCollator.compare(checkA, checkB);
			} else {
				// 笔画比较
				return zhStrokeCollator.compare(checkA, checkB);
			}
		});

        tagsWithAvailability.forEach(tagObj => {
            const btn = document.createElement('button');
            btn.className = 'filter-item-btn regular-tag-btn' + (activeSet.has(tagObj.value) ? ' active' : (!tagObj.available ? ' disabled-tag' : ''));
            btn.textContent = tagObj.value;

            if (customBtnTextColor && !activeSet.has(tagObj.value) && tagObj.available) {
                btn.style.setProperty('color', customBtnTextColor, 'important');
                btn.style.setProperty('border-color', customBtnTextColor, 'important');
            }

            btn.addEventListener('mouseenter', () => {
                if (!btn.classList.contains('active') && !btn.classList.contains('disabled-tag')) {
                    btn.style.removeProperty('color');
                    btn.style.removeProperty('border-color');
                }
            });

            btn.addEventListener('mouseleave', () => {
                if (customBtnTextColor && !btn.classList.contains('active') && !btn.classList.contains('disabled-tag')) {
                    btn.style.setProperty('color', customBtnTextColor, 'important');
                    btn.style.setProperty('border-color', customBtnTextColor, 'important');
                }
            });

			// 🎯 UPDATE FILTER CHIP CLICK LISTENERS TO LOG THE ACTIVE STEERING SLICER ROW
			btn.onclick = (e) => {
				if (btn.classList.contains('disabled-tag') && !btn.classList.contains('active')) return;
				
				// 🚀 THE DIRECT FIX: Log this category row key as the master active steering driver!
				window.activeSlicerKey = currentAttr;

				if (window.multiSelectModes[currentAttr]) {
					if (activeSet.has(tagObj.value)) activeSet.delete(tagObj.value);
					else activeSet.add(tagObj.value);
				} else {
					const dynamicState = activeSet.has(tagObj.value); 
					activeSet.clear(); 
					if (!dynamicState) activeSet.add(tagObj.value);
				}
				window.applyCombinedFilter();
			};
						optionsWrapper.appendChild(btn);
        });
    });
};
