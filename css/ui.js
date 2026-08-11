window.tagColumnsConfig = [
    { dataAttr: 'data-tag-1', title: 'Year' },
    { dataAttr: 'data-tag-2', title: 'Season' },
    { dataAttr: 'data-tag-3', title: 'Country' },
    { dataAttr: 'data-tag-6', title: 'Days' },
    { dataAttr: 'data-tag-4', title: 'Place' },
    { dataAttr: 'data-tag-5', title: 'Agent' }
];

window.selectedFilters = {};
window.multiSelectModes = {};
const customSortPriority = { "自由行": 1, "中國": 1, "台灣": 2, "春季": 1, "夏季": 2, "秋季": 3, "冬季": 4 };

window.initHorizontalFilters = function(rows) {
    const container = document.getElementById("horizontalFiltersContainer");
    container.innerHTML = "";

    window.tagColumnsConfig.forEach(config => {
        window.selectedFilters[config.dataAttr] = new Set();
        window.multiSelectModes[config.dataAttr] = false;

        const rowDiv = document.createElement('div');
        rowDiv.className = 'filter-row';
        rowDiv.dataset.attr = config.dataAttr;

        const labelDiv = document.createElement('div');
        labelDiv.className = 'filter-label';
        labelDiv.textContent = config.title;
        rowDiv.appendChild(labelDiv);

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
            window.multiSelectModes[config.dataAttr] = !window.multiSelectModes[config.dataAttr];
            toggleBtn.classList.toggle('active', window.multiSelectModes[config.dataAttr]);
            if (!window.multiSelectModes[config.dataAttr]) {
                window.selectedFilters[config.dataAttr].clear();
                window.applyCombinedFilter();
            }
        };

        actionArea.appendChild(toggleBtn);
        rowDiv.appendChild(actionArea);
        container.appendChild(rowDiv);
    });
    window.updateAllSlicerButtonsUI(rows);
};

function getTagAvailabilityList(currentAttr, uniqueTags, rows, searchCtx) {
    const showCheckedOnly = document.getElementById("showCheckedOnlyToggle")?.checked || false;

    return Array.from(uniqueTags).map(tagValue => {
        let isAvailable = window.selectedFilters[currentAttr].has(tagValue);
        if (!isAvailable) {
            isAvailable = rows.some(row => {
                if (showCheckedOnly && !row.querySelector(".row-selector-checkbox")?.checked) return false;
                if (searchCtx !== "" && !Array.from(row.children).some(c => c.textContent.toLowerCase().includes(searchCtx))) return false;
                if (!(row.getAttribute(currentAttr) || "").split(';').map(t => t.trim()).includes(tagValue)) return false;

                for (const [otherAttr, otherFilterSet] of Object.entries(window.selectedFilters)) {
                    if (otherAttr === currentAttr || otherFilterSet.size === 0) continue;
                    if (!Array.from(otherFilterSet).some(t => (row.getAttribute(otherAttr) || "").split(';').map(x => x.trim()).includes(t))) return false;
                }
                return true;
            });
        }
        return { value: tagValue, available: isAvailable };
    });
}

window.updateAllSlicerButtonsUI = function(rows) {
    const container = document.getElementById("horizontalFiltersContainer");
    const searchCtx = document.getElementById("tableSearch").value.toLowerCase().trim();
    const filterRowsElements = container.querySelectorAll('.filter-row');

    filterRowsElements.forEach(rowEl => {
        const currentAttr = rowEl.dataset.attr;
        const optionsWrapper = rowEl.querySelector('.filter-options-wrapper');
        const activeSet = window.selectedFilters[currentAttr];

        const uniqueTags = new Set();
        rows.forEach(row => {
            (row.getAttribute(currentAttr) || "").split(';').forEach(tag => { if (tag.trim()) uniqueTags.add(tag.trim()); });
        });

        optionsWrapper.innerHTML = "";
        const allBtn = document.createElement('button');
        allBtn.className = 'filter-item-btn master-all-btn' + (activeSet.size === 0 ? ' active' : '');
        allBtn.textContent = 'All';
        allBtn.onclick = () => { window.selectedFilters[currentAttr].clear(); window.applyCombinedFilter(); };
        optionsWrapper.appendChild(allBtn);

        const tagsWithAvailability = getTagAvailabilityList(currentAttr, uniqueTags, rows, searchCtx);
        tagsWithAvailability.sort((a, b) => {
            if (a.available !== b.available) return a.available ? -1 : 1;
            const checkA = a.value.trim().replace(/（/g, '(').replace(/）/g, ')');
            const checkB = b.value.trim().replace(/（/g, '(').replace(/）/g, ')');
            if (checkA === "(None)" || checkB === "(None)") return checkA === "(None)" ? 1 : -1;

            let priorityA = undefined; let priorityB = undefined;
            for (const key in customSortPriority) {
                if (checkA.startsWith(key)) priorityA = customSortPriority[key];
                if (checkB.startsWith(key)) priorityB = customSortPriority[key];
            }
            if (priorityA !== undefined && priorityB !== undefined) return priorityA - priorityB;
            if (priorityA !== undefined) return -1; if (priorityB !== undefined) return 1;

            return checkA.localeCompare(checkB, undefined, { numeric: true, sensitivity: 'base' });
        });

        tagsWithAvailability.forEach(tagObj => {
            const btn = document.createElement('button');
            btn.className = 'filter-item-btn regular-tag-btn' + (activeSet.has(tagObj.value) ? ' active' : (!tagObj.available ? ' disabled-tag' : ''));
            btn.textContent = tagObj.value;
            btn.onclick = () => {
                if (btn.classList.contains('disabled-tag') && !btn.classList.contains('active')) return;
                if (window.multiSelectModes[currentAttr]) {
                    if (activeSet.has(tagObj.value)) activeSet.delete(tagObj.value); else activeSet.add(tagObj.value);
                } else {
                    const dynamicState = activeSet.has(tagObj.value); activeSet.clear(); if (!dynamicState) activeSet.add(tagObj.value);
                }
                window.applyCombinedFilter();
            };
            optionsWrapper.appendChild(btn);
        });
    });
};
