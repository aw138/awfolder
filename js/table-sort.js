// 🎯 LOGICAL SPLIT 2: CHRONOLOGICAL COLUMN SORTING & ZEBRA-STRIPING UTILITIES
window.recalculateZebraStriping = function() { 
    const activeRows = window.getRuntimeRows(); 
    let visibleIndex = 0; 
    activeRows.forEach(row => { 
        if (row.style.display !== "none") row.classList.toggle("visible-even-row", (visibleIndex++) % 2 === 1); 
        else row.classList.remove("visible-even-row"); 
    }); 
};

function executeSort(columnIndex, ascending) {
    const tbody = document.getElementById("tableBody");
    const activeRows = window.getRuntimeRows();
    const layoutSchema = window.activeColumnsWidthsSchema || [];
    if (!tbody) return;

    // Offset the index by -1 to account for the checkbox column row selector cell
    const schemaConfig = layoutSchema[columnIndex - 1] || {};
    const assignedDataType = schemaConfig.dataType ? schemaConfig.dataType.toLowerCase() : "string";

    // 🚀 ATTACHED MODULE ENGINE COLLATORS (Lexicographical Dictionary Sort) [INDEX: 0.1.112]
    const enCollator = new Intl.Collator('en-US', { sensitivity: 'base' });
    const zhStrokeCollator = new Intl.Collator('zh-CN-u-co-stroke', { sensitivity: 'base' });

    // Check first character to determine type [INDEX: 0.1.112]
    function isChinese(str) {
        if (!str) return false;
        return /[\u4e00-\u9fff]/.test(str.charAt(0));
    }

    // Core comparison logic matching your attached sample exactly [INDEX: 0.1.112, 0.1.113]
    function compareValues(a, b) {
        // 🧱 BASELINE RULE: Handle blank entries instantly to prevent index locking
        if (a === "" && b !== "") return 1;
        if (a !== "" && b === "") return -1;
        if (a === "" && b === "") return 0;

        const typeA = isChinese(a) ? 'cn' : 'en';
        const typeB = isChinese(b) ? 'cn' : 'en';

        // 规则1：英文/数字排在中文前面 [INDEX: 0.1.112]
        if (typeA !== typeB) {
            return typeA === 'en' ? -1 : 1;
        }

        // 规则2：同类型比较 [INDEX: 0.1.112]
        if (typeA === 'en') {
            // 字典序比较 [INDEX: 0.1.113]
            return enCollator.compare(a, b);
        } else {
            // 笔画比较 [INDEX: 0.1.113]
            return zhStrokeCollator.compare(a, b);
        }
    }

    // Determine sorting direction multiplier strictly based on the active tab state [INDEX: 0.1.113]
    // 1 for Ascending, -1 for Descending [INDEX: 0.1.113]
    const direction = ascending ? 1 : -1;

    activeRows.sort((rowA, rowB) => {
        const valA = rowA.getElementsByTagName("td")[columnIndex].textContent.trim();
        const valB = rowB.getElementsByTagName("td")[columnIndex].textContent.trim();

        // SPECIAL CASE OVERRIDE: Explicit Date Timeline Sorting 📅
        if (assignedDataType === "date" || columnIndex === 1) {
            const matchA = valA.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
            const matchB = valB.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
            if (matchA && matchB) {
                const timeA = new Date(parseInt(matchA[1], 10), parseInt(matchA[2], 10) - 1, parseInt(matchA[3], 10)).getTime();
                const timeB = new Date(parseInt(matchB[1], 10), parseInt(matchB[2], 10) - 1, parseInt(matchB[3], 10)).getTime();
                return ascending ? timeA - timeB : timeB - timeA;
            }
        }

        // SPECIAL CASE OVERRIDE: Explicit Pure Numeric Sorting 🔢
        if (assignedDataType === "number") {
            const cleanNumA = parseFloat(valA.replace(/[^\d.-]/g, '')) || 0;
            const cleanNumB = parseFloat(valB.replace(/[^\d.-]/g, '')) || 0;
            return ascending ? cleanNumA - cleanNumB : cleanNumB - cleanNumA;
        }

        // 🎯 THE DIRECT FIX: Apply core evaluation multiplied by directional vector [INDEX: 0.1.113]
        return compareValues(valA, valB) * direction;
    });

    // Re-insert rows into the live table DOM container layout tree fragment [INDEX: 0.1.113]
    const fragment = document.createDocumentFragment();
    activeRows.forEach(row => fragment.appendChild(row));
    tbody.appendChild(fragment);
    window.recalculateZebraStriping();
}

window.bindSortingTriggers = function() {
    const table = document.getElementById("dataTable");
    if (!table) return;

    table.querySelectorAll("th.sortable").forEach(thCell => {
        const trigger = thCell.querySelector(".sort-icon-trigger") || thCell;
        const freshTrigger = trigger.cloneNode(true);

        if (thCell.querySelector(".sort-icon-trigger")) {
            trigger.parentNode.replaceChild(freshTrigger, trigger);
        } else {
            thCell.parentNode.replaceChild(freshTrigger, thCell);
        }

        freshTrigger.addEventListener("click", (e) => {
            e.stopPropagation();
            const index = Array.from(thCell.parentNode.children).indexOf(thCell);
            let currentIcon = thCell.querySelector(".sort-icon-trigger") || freshTrigger;
            let currentSortAscending = !currentIcon.classList.contains("asc");

            table.querySelectorAll(".sort-icon-trigger").forEach(c => c.classList.remove("asc", "desc"));
            currentIcon.classList.add(currentSortAscending ? "asc" : "desc");
            executeSort(index, currentSortAscending);

            if (typeof window.initColumnResizableEngine === "function") {
                window.initColumnResizableEngine();
            }
        });
    });
};

// 🎯 THE FIX: Isolated Master Reset Button Handler [INDEX: 0.1.128]
// 🎯 FIXED MASTER RESET ENGINE: "Show all" now clears text, buttons, AND checkbox filters [INDEX: 0.1.149]
document.getElementById("clearAllFiltersBtn")?.addEventListener("click", () => {
    const searchInput = document.getElementById("tableSearch");
    const showCheckedOnlyToggle = document.getElementById("showCheckedOnlyToggle");

    if (searchInput) searchInput.value = "";
    if (showCheckedOnlyToggle) showCheckedOnlyToggle.checked = false;

    // Reset categories sets...
    for (const dataAttr in window.selectedFilters) {
        window.selectedFilters[dataAttr].clear();
    }

    // 🎯 This will execute your new dynamic counter and reset the text back to (0) or your total rows instantly!
    window.applyCombinedFilter();
	// Add this line inside your clearAllFiltersBtn click listener function:
	window.activeSlicerKey = null;

});
