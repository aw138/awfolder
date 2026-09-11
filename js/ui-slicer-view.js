/**
 * HYBRID CONDITIONAL UI SLICER ENGINE - PART A
 * Supports switchable conditional Tab layouts based on schema options profiles.
 */

// 1. UNIVERSAL ROW FILTER BUILDER SYSTEM
window.initHorizontalFilters = function(rows) {
    const container = document.getElementById("horizontalFiltersContainer");
    if (!container) return;
    container.innerHTML = "";

    const filterSchema = window.activeFiltersSchema || [];

    filterSchema.forEach((config, index) => {
        const cleanKey = String(config.jsonKey || "").replace('data-', '').replace('-', '').trim();

        if (!window.selectedFilters[cleanKey]) window.selectedFilters[cleanKey] = new Set();
        if (window.booleanLogicalModes[cleanKey] === undefined) window.booleanLogicalModes[cleanKey] = true;
        if (window.slicerExpandedStates[cleanKey] === undefined) window.slicerExpandedStates[cleanKey] = false;

        const rowDiv = document.createElement('div');
        rowDiv.className = 'filter-row';
        rowDiv.dataset.attr = cleanKey;
        rowDiv.style.setProperty('order', (index + 1), 'important');

        // ROW 1: HEADER CONTROLS (Label + Selected Chips Wrapper)
        const headerLine = document.createElement('div');
        headerLine.className = 'filter-row-header-line';

        const leftGroup = document.createElement('div');
        leftGroup.className = 'filter-header-left-group';

        const labelDiv = document.createElement('div');
        labelDiv.className = 'filter-label';
        labelDiv.textContent = config.title || "";
        let customWidth = config.labelWidth ? config.labelWidth : 54;
        labelDiv.style.setProperty('min-width', customWidth + 'px', 'important');
        labelDiv.style.setProperty('max-width', customWidth + 'px', 'important');
        leftGroup.appendChild(labelDiv);

        const chipsWrapper = document.createElement('div');
        chipsWrapper.className = 'filter-selected-chips-wrapper';
        chipsWrapper.id = `chips-wrapper-${cleanKey}`;
        leftGroup.appendChild(chipsWrapper);
        headerLine.appendChild(leftGroup);

        // ROW 1 RIGHT CONTROLS: AND/OR Toggle + Dropdown Arrow
        const rightControls = document.createElement('div');
        rightControls.className = 'filter-header-right-controls';

        const logicToggleBtn = document.createElement('button');
        logicToggleBtn.type = 'button';
        logicToggleBtn.className = 'boolean-logic-toggle-btn' + (window.booleanLogicalModes[cleanKey] ? '' : ' or-state');
        logicToggleBtn.textContent = window.booleanLogicalModes[cleanKey] ? 'And' : 'Or';
        logicToggleBtn.onclick = () => {
            window.booleanLogicalModes[cleanKey] = !window.booleanLogicalModes[cleanKey];
            logicToggleBtn.textContent = window.booleanLogicalModes[cleanKey] ? 'And' : 'Or';
            logicToggleBtn.classList.toggle('or-state', !window.booleanLogicalModes[cleanKey]);
            window.applyCombinedFilter();
        };
        rightControls.appendChild(logicToggleBtn);

        const expandToggleBtn = document.createElement('button');
        expandToggleBtn.type = 'button';
        expandToggleBtn.className = 'row-dropdown-expand-btn';
        expandToggleBtn.innerHTML = window.slicerExpandedStates[cleanKey] ? '&#8722;' : '&#43;';
        rightControls.appendChild(expandToggleBtn);
        headerLine.appendChild(rightControls);
        rowDiv.appendChild(headerLine);

        // ROW 2: OPTIONS DRAWER DECK PANEL
        const optionsDeck = document.createElement('div');
        optionsDeck.className = 'filter-options-dropdown-deck' + (window.slicerExpandedStates[cleanKey] ? '' : ' hidden-drawer-state');
        optionsDeck.id = `options-deck-${cleanKey}`;
        rowDiv.appendChild(optionsDeck);

        expandToggleBtn.onclick = () => {
            window.slicerExpandedStates[cleanKey] = !window.slicerExpandedStates[cleanKey];
            expandToggleBtn.innerHTML = window.slicerExpandedStates[cleanKey] ? '&#8722;' : '&#43;';
            optionsDeck.classList.toggle('hidden-drawer-state', !window.slicerExpandedStates[cleanKey]);
        };

        container.appendChild(rowDiv);
    });
    window.updateAllSlicerButtonsUI(rows);
};
// HYBRID CONDITIONAL UI SLICER ENGINE - PART B (Paste directly beneath Part A)

// 2. LIVE CHIP SELECTION RENDER LOOP
window.updateAllSlicerButtonsUI = function(rows) {
    const container = document.getElementById("horizontalFiltersContainer");
    if (!container) return;

    const searchCtx = document.getElementById("tableSearch")?.value.toLowerCase().trim() || "";
    const currentFilters = window.selectedFilters || {};

    container.querySelectorAll('.filter-row').forEach(rowEl => {
        const currentAttr = rowEl.dataset.attr;
        const chipsWrapper = rowEl.querySelector('.filter-selected-chips-wrapper');
        const optionsDeck = rowEl.querySelector('.filter-options-dropdown-deck');
        if (!chipsWrapper || !optionsDeck) return;

        const activeSet = currentFilters[currentAttr] || new Set();

        // Draw Row 1 Active Removable Chips
        chipsWrapper.innerHTML = "";
        activeSet.forEach(chosenValue => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'active-selected-chip';
            chip.innerHTML = `${chosenValue} <span>&times;</span>`;
            chip.onclick = (e) => {
                e.stopPropagation();
                activeSet.delete(chosenValue);
                window.applyCombinedFilter();
            };
            chipsWrapper.appendChild(chip);
        });

        // Collect and calculate options availability
        const uniqueTags = new Set();
        rows.forEach(row => {
            const attrVal = row.getAttribute(currentAttr) || row.getAttribute(`data-${currentAttr}`) || "";
            attrVal.split(';').forEach(tag => { if (tag.trim()) uniqueTags.add(tag.trim()); });
        });

        optionsDeck.innerHTML = "";
        const tagsWithAvailability = window.getTagAvailabilityList(currentAttr, uniqueTags, rows, searchCtx);

        const filterConfig = (window.activeFiltersSchema || []).find(f => String(f.jsonKey || "").replace(/data-|-/g, '').trim() === currentAttr);
        const customTextColor = filterConfig && filterConfig.textColor ? filterConfig.textColor : "";
        const assignedDataType = filterConfig && filterConfig.dataType ? filterConfig.dataType.toLowerCase() : "string";

        // VERBATIM RESTORATION OF ORIGINAL SORT ENGINE CRITERIA RULES
        tagsWithAvailability.sort((a, b) => {
            if (a.available !== b.available) return a.available ? -1 : 1;
            const checkA = a.value.trim(); const checkB = b.value.trim();
            if (checkA === "None" || checkB === "None" || checkA === "" || checkB === "") return checkA === "None" ? 1 : -1;

            // CASE A: Custom Priority Weights
            let priorityA = undefined; let priorityB = undefined;
            const priorityRules = window.currentCustomSortPriority || {};
            const strippedA = checkA.replace(/[\s（）()]/g, ''); const strippedB = checkB.replace(/[\s（）()]/g, '');

            for (const key in priorityRules) {
                const cleanKey = key.trim().replace(/[\s（）()]/g, '');
                if (strippedA === cleanKey || strippedA.startsWith(cleanKey)) priorityA = priorityRules[key];
                if (strippedB === cleanKey || strippedB.startsWith(cleanKey)) priorityB = priorityRules[key];
            }
            if (priorityA !== undefined && priorityB !== undefined) return priorityA - priorityB;
            if (priorityA !== undefined) return priorityA === 999 ? 1 : -1;
            if (priorityB !== undefined) return priorityB === 999 ? -1 : 1;

            // CASE B: Explicit Date Timeline Sorting (🎯 THE EXACT TRACKING INDEX POINTERS REFIXED VERBATIM)
            if (assignedDataType === "date") {
                const matchA = checkA.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
                const matchB = checkB.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
                if (matchA && matchB) {
                    const timeA = new Date(parseInt(matchA[1], 10), parseInt(matchA[2], 10) - 1, parseInt(matchA[3], 10)).getTime();
                    const timeB = new Date(parseInt(matchB[1], 10), parseInt(matchB[2], 10) - 1, parseInt(matchB[3], 10)).getTime();
                    return timeA - timeB;
                }
            }

            // CASE C: Pure Mathematical Currency / Numerical Sorting
            if (assignedDataType === "number") {
                const numA = parseFloat(strippedA.replace(/[^\d.-]/g, '')) || 0;
                const numB = parseFloat(strippedB.replace(/[^\d.-]/g, '')) || 0;
                return numA - numB;
            }

            // CASE D: Pure Text ASCII-First sort rules
            const lenA = checkA.length; const lenB = checkB.length; const maxLen = Math.max(lenA, lenB);
            function getCharTier(ch) {
                if (!ch) return 0; const code = ch.charCodeAt(0);
                if (code >= 0 && code <= 127) return 1; if (code >= 0x4E00 && code <= 0x9FFF) return 2; return 3;
            }
            let resolvedDiff = null;
            for (let i = 0; i < maxLen; i++) {
                const charA = checkA[i] || ""; const charB = checkB[i] || "";
                if (charA === "" && charB !== "") { resolvedDiff = -1; break; }
                if (charA !== "" && charB === "") { resolvedDiff = 1; break; }
                const tierA = getCharTier(charA); const tierB = getCharTier(charB);
                if (tierA !== tierB) { resolvedDiff = tierA - tierB; break; }
                if (tierA === 1) {
                    const codeA = charA.charCodeAt(0); const codeB = charB.charCodeAt(0);
                    if (codeA !== codeB) { resolvedDiff = codeA - codeB; break; }
                }
                if (tierA === 2) {
                    const suffixA = checkA.substring(i); const suffixB = checkB.substring(i);
                    const zhStrokeCollator = new Intl.Collator('zh-CN-u-co-stroke', { sensitivity: 'base' });
                    resolvedDiff = zhStrokeCollator.compare(suffixA, suffixB); break;
                }
            }
            if (resolvedDiff !== null) return resolvedDiff;
        });

        // Redirect safely onto rendering layers
        window.renderTargetedSlicerLayoutGroup(rows, tagsWithAvailability, filterConfig, customTextColor, activeSet, optionsDeck, currentAttr);
    });
};
// HYBRID CONDITIONAL UI SLICER ENGINE - PART C (Fully Dynamic Badge Counters Engine)

window.renderTargetedSlicerLayoutGroup = function(rows, tagsWithAvailability, filterConfig, customTextColor, activeSet, optionsDeck, currentAttr) {
    const isTabEnabledForThisSlicer = filterConfig && filterConfig.useTab === true;

    if (isTabEnabledForThisSlicer) {
        // MODULE A: THE DYNAMIC TAB DECK RENDERER (Filters out empty tabs with dynamic badges)
        const alphaGroupsMap = {};
        const tabAvailabilityTracker = {};
        const tabDynamicLiveCountMap = {}; // 🎯 Tracks ONLY available, clickable options per letter
        let totalLiveAvailableOptionsInDrawer = 0; // 🎯 Tracks total available options across ALL letters

        tagsWithAvailability.forEach(tagObj => {
            const displayChar = tagObj.value.trim().charAt(0).toUpperCase();
            const targetTabKey = /[A-Z]/.test(displayChar) ? displayChar : '#';
            
            if (!alphaGroupsMap[targetTabKey]) {
                alphaGroupsMap[targetTabKey] = [];
                tabAvailabilityTracker[targetTabKey] = false;
                tabDynamicLiveCountMap[targetTabKey] = 0; // Initialize counter
            }
            alphaGroupsMap[targetTabKey].push(tagObj);
            
            // 🧠 🎯 DYNAMIC COUNT ENGINE: Only count options that match current cross-filters!
            if (tagObj.available) {
                tabAvailabilityTracker[targetTabKey] = true;
                tabDynamicLiveCountMap[targetTabKey]++; // Increment letter badge count dynamically
                totalLiveAvailableOptionsInDrawer++; // Increment global master drawer count
            }
        });

        const tabDeckWrapper = document.createElement('div');
        tabDeckWrapper.className = 'slicer-alphabet-tab-deck';
        
        // Filter out empty letter groups, keeping only active matching ones
        const sortedActiveTabKeys = Object.keys(alphaGroupsMap)
            .filter(key => tabAvailabilityTracker[key] === true)
            .sort((a, b) => {
                if (a === '#') return 1; if (b === '#') return -1; 
                return a.localeCompare(b);
            });

        // Append the "All" navigation master key to the end of the active tabs array
        if (sortedActiveTabKeys.length > 0) {
            sortedActiveTabKeys.push('All');
            tabAvailabilityTracker['All'] = true; // Always selectable
        }

        if (!window.activeSlicerTabStates) window.activeSlicerTabStates = {};
        
        let targetCurrentTab = window.activeSlicerTabStates[currentAttr];
        
        // Sequential Chronological Fallback Engine
        const getNextClosestAvailableTabKey = () => {
            if (tabAvailabilityTracker['A']) return 'A';
            const nextValidLetterKey = sortedActiveTabKeys.find(key => key !== 'All');
            return nextValidLetterKey || (sortedActiveTabKeys.includes('All') ? 'All' : '');
        };

        // Handle initial page load state mapping configuration rules
        if (!targetCurrentTab) {
            targetCurrentTab = getNextClosestAvailableTabKey();
            window.activeSlicerTabStates[currentAttr] = targetCurrentTab;
        }
        
        // Handle cross-filtering context shifts when choices disappear dynamically
        if (!sortedActiveTabKeys.includes(targetCurrentTab) || !tabAvailabilityTracker[targetCurrentTab]) {
            targetCurrentTab = getNextClosestAvailableTabKey();
            window.activeSlicerTabStates[currentAttr] = targetCurrentTab;
        }

        // Draw Tab Navigation Elements (A-Z strings + "All" token button)
        sortedActiveTabKeys.forEach(tabCharKey => {
            const tabBtn = document.createElement('button');
            tabBtn.type = 'button';
            tabBtn.className = 'slicer-alpha-tab-btn' + (targetCurrentTab === tabCharKey ? ' active-tab' : '');
            
            // 🧠 🎯 INJECT DYNAMIC BADGE NUMBERS
            if (tabCharKey === 'All') {
                // Shows how many total options are clickable inside this drawer right now
                tabBtn.innerHTML = `All <span class="tab-badge-count">(${totalLiveAvailableOptionsInDrawer})</span>`;
            } else {
                // Shows how many options under this specific letter match your active filters right now
                tabBtn.innerHTML = `${tabCharKey} <span class="tab-badge-count">(${tabDynamicLiveCountMap[tabCharKey]})</span>`;
            }
            
            tabBtn.onclick = (e) => {
                e.stopPropagation(); 
                window.activeSlicerTabStates[currentAttr] = tabCharKey; 
                window.updateAllSlicerButtonsUI(rows);
            };
            tabDeckWrapper.appendChild(tabBtn);
        });
        
        if (sortedActiveTabKeys.length > 1) {
            optionsDeck.appendChild(tabDeckWrapper);
        }

        const buttonsContainerNode = document.createElement('div');
        buttonsContainerNode.className = 'slicer-tabbed-buttons-grid';
        
        // Draw either single letter arrays or merge everything for "All"
        let activeTabGroupItems = [];
        if (targetCurrentTab === 'All') {
            activeTabGroupItems = tagsWithAvailability;
        } else {
            activeTabGroupItems = alphaGroupsMap[targetCurrentTab] || [];
        }

        activeTabGroupItems.forEach(tagObj => {
            const btn = document.createElement('button'); 
            btn.type = 'button';
            btn.className = 'filter-item-btn' + (activeSet.has(tagObj.value) ? ' active' : (!tagObj.available ? ' disabled-tag' : ''));
            btn.textContent = tagObj.value;
            
            if (customTextColor && !activeSet.has(tagObj.value) && tagObj.available) {
                btn.style.setProperty('color', customTextColor, 'important'); 
                btn.style.setProperty('border-color', customTextColor, 'important');
            }
            
            btn.onclick = () => {
                window.activeSlicerKey = currentAttr;
                if (activeSet.has(tagObj.value)) activeSet.delete(tagObj.value); 
                else activeSet.add(tagObj.value);
                window.applyCombinedFilter();
            };
            buttonsContainerNode.appendChild(btn);
        });
        optionsDeck.appendChild(buttonsContainerNode);

    } else {
        // MODULE B: ORIGINAL FLAT CHIP DECK (Maintained verbatim)
        tagsWithAvailability.forEach(tagObj => {
            const btn = document.createElement('button'); 
            btn.type = 'button';
            btn.className = 'filter-item-btn' + (activeSet.has(tagObj.value) ? ' active' : (!tagObj.available ? ' disabled-tag' : ''));
            btn.textContent = tagObj.value;

            if (customTextColor && !activeSet.has(tagObj.value) && tagObj.available) {
                btn.style.setProperty('color', customTextColor, 'important'); 
                btn.style.setProperty('border-color', customTextColor, 'important');
            }
            
            btn.onclick = () => {
                window.activeSlicerKey = currentAttr;
                if (activeSet.has(tagObj.value)) activeSet.delete(tagObj.value); 
                else activeSet.add(tagObj.value);
                window.applyCombinedFilter();
            };
            optionsDeck.appendChild(btn);
        });
    }
};
// =============================================================
// GLOBAL BULLETPROOF SLICERS ACCORDION EXPANSION ENGINE 🎯
// =============================================================
window.toggleAllSlicerDrawersGlobal = function() {
    const globalBtn = document.getElementById("globalSlicersToggleBtn");
    if (!globalBtn) return;

    // Check if we should expand or collapse (true if button currently says "Expand all")
    const shouldExpandAll = !globalBtn.classList.contains("collapse-active-state");

    (window.activeFiltersSchema || []).forEach(config => {
        const cleanKey = String(config.jsonKey || "").replace('data-', '').replace('-', '').trim();
        
        // 1. Synchronize the state tracks globally across arrays [INDEX: 0.1.222]
        window.slicerExpandedStates[cleanKey] = shouldExpandAll;

        // 2. Query target layout container components inside the document tree [INDEX: 0.1.222]
        const optionsDeck = document.getElementById(`options-deck-${cleanKey}`);
        const rowEl = document.querySelector(`.filter-row[data-attr="${cleanKey}"]`);
        
        if (optionsDeck && rowEl) {
            const arrowBtn = rowEl.querySelector('.row-dropdown-expand-btn');
            
            // 3. Force toggle display visibilities smoothly across standard and tabbed elements [INDEX: 0.1.222]
            if (shouldExpandAll) {
                optionsDeck.classList.remove('hidden-drawer-state');
                if (arrowBtn) arrowBtn.innerHTML = '&#8722;'; // Horizontal Minus sign [INDEX: 0.1.222]
            } else {
                optionsDeck.classList.add('hidden-drawer-state');
                if (arrowBtn) arrowBtn.innerHTML = '&#43;'; // Plus sign [INDEX: 0.1.222]
            }
        }
    });

    // 4. Toggle the Master Toggle Label State visually [INDEX: 0.1.222]
    if (shouldExpandAll) {
        globalBtn.textContent = "Collapse all";
        globalBtn.classList.add("collapse-active-state");
    } else {
        globalBtn.textContent = "Expand all";
        globalBtn.classList.remove("collapse-active-state");
    }
};
