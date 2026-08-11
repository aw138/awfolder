    renderFilters(allRecords) {
        const container = document.getElementById("horizontalFiltersContainer");
        const searchCtx = document.getElementById("tableSearch").value.toLowerCase().trim();
        container.innerHTML = "";

        APP_CONFIG.filters.forEach(config => {
            const currentAttr = config.attr;
            const activeSet = this.selectedFilters[currentAttr];

            const uniqueTags = new Set();
            rows.forEach(row => {
                (row.getAttribute(currentAttr) || "").split(';').forEach(tag => { if (tag.trim()) uniqueTags.add(tag.trim()); });
            });

            const rowDiv = document.createElement('div');
            rowDiv.className = 'filter-row';
            rowDiv.dataset.attr = currentAttr;

            const labelDiv = document.createElement('div');
            labelDiv.className = 'filter-label';
            labelDiv.textContent = config.label;
            rowDiv.appendChild(labelDiv);

            const optionsWrapper = document.createElement('div');
            optionsWrapper.className = 'filter-options-wrapper';
            rowDiv.appendChild(optionsWrapper);

            const allBtn = document.createElement('button');
            allBtn.className = 'filter-item-btn master-all-btn' + (activeSet.size === 0 ? ' active' : '');
            allBtn.textContent = 'All';
            allBtn.onclick = () => { this.selectedFilters[currentAttr].clear(); window.applyCombinedFilter(); };
            optionsWrapper.appendChild(allBtn);

            const tagsWithAvailability = this.getTagAvailabilityList(currentAttr, uniqueTags, rows, searchCtx);
            
            tagsWithAvailability.sort((a, b) => {
                if (a.available !== b.available) return a.available ? -1 : 1;
                const checkA = a.value.trim().replace(/¡]/g, '(').replace(/¡^/g, ')');
                const checkB = b.value.trim().replace(/¡]/g, '(').replace(/¡^/g, ')');
                if (checkA === "(None)" || checkB === "(None)") return checkA === "(None)" ? 1 : -1;

                let priorityA = undefined; let priorityB = undefined;
                
                // ?? FIXED KEY LOOKUP: Strips 'data-' string wrappers to match your flat config keys perfectly
                const flatPriorityMap = APP_CONFIG.customSortPriority || {};
                
                for (const key in flatPriorityMap) {
                    if (checkA.startsWith(key)) priorityA = flatPriorityMap[key];
                    if (checkB.startsWith(key)) priorityB = flatPriorityMap[key];
                }
                if (priorityA !== undefined && priorityB !== undefined) return priorityA - priorityB;
                if (priorityA !== undefined) return -1; 
                if (priorityB !== undefined) return 1;

                return checkA.localeCompare(checkB, undefined, { numeric: true, sensitivity: 'base' });
            });

            tagsWithAvailability.forEach(tagObj => {
                const btn = document.createElement('button');
                btn.className = 'filter-item-btn regular-tag-btn' + (activeSet.has(tagObj.value) ? ' active' : (!tagObj.available ? ' disabled-tag' : ''));
                btn.textContent = tagObj.value;
                btn.onclick = () => {
                    if (btn.classList.contains('disabled-tag') && !btn.classList.contains('active')) return;
                    if (this.multiSelectModes[currentAttr]) {
                        if (activeSet.has(tagObj.value)) activeSet.delete(tagObj.value);
                        else activeSet.add(tagObj.value);
                    } else {
                        const dynamicState = activeSet.has(tagObj.value);
                        activeSet.clear(); if (!dynamicState) activeSet.add(tagObj.value);
                    }
                    window.applyCombinedFilter();
                };
                optionsWrapper.appendChild(btn);
            });

            const actionArea = document.createElement('div');
            actionArea.className = 'filter-action-toggle-area';
            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'multiple-toggle-btn' + (this.multiSelectModes[currentAttr] ? ' active' : '');
            toggleBtn.textContent = 'Multi';
            toggleBtn.onclick = () => {
                this.multiSelectModes[currentAttr] = !this.multiSelectModes[currentAttr];
                toggleBtn.classList.toggle('active', this.multiSelectModes[currentAttr]);
                if (!this.multiSelectModes[currentAttr]) {
                    this.selectedFilters[currentAttr].clear();
                    window.applyCombinedFilter();
                }
            };
            actionArea.appendChild(toggleBtn);
            rowDiv.appendChild(actionArea);
            container.appendChild(rowDiv);
        });
    }

    resetUIFilters() {
        Object.keys(this.selectedFilters).forEach(key => {
            this.selectedFilters[key].clear();
        });
    }
}
