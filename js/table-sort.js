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

// CORRECTED: Pure Text ASCII-First + Chinese Stroke Suffix Engine 🎯
function compareValues(a, b) {
    if (a === "" && b !== "") return 1;
    if (a !== "" && b === "") return -1;
    if (a === "" && b === "") return 0;

    const lenA = a.length;
    const lenB = b.length;
    const maxLen = Math.max(lenA, lenB);

    // Helper to evaluate script priority tier per character
    function getCharTier(ch) {
        if (!ch) return 0; // Empty string buffer fallback
        const code = ch.charCodeAt(0);
        // ASCII range covering numbers, English letters, spaces, and punctuation codes
        if (code >= 0 && code <= 127) return 1; 
        // Chinese characters range
        if (code >= 0x4E00 && code <= 0x9FFF) return 2;
        return 3; // Alternate international symbols
    }

    // 1. Loop character-by-character from left to right to respect exact ASCII sequence alignment
    for (let i = 0; i < maxLen; i++) {
        const charA = a[i] || "";
        const charB = b[i] || "";

        // If one string ends early, the shorter string comes first
        if (charA === "" && charB !== "") return -1;
        if (charA !== "" && charB === "") return 1;

        const tierA = getCharTier(charA);
        const tierB = getCharTier(charB);

        // If characters belong to different categories (e.g. ASCII vs Chinese)
        if (tierA !== tierB) {
            return tierA - tierB; // Tier 1 (ASCII) always comes before Tier 2 (Chinese)
        }

        // If both characters are in the ASCII block, sort strictly by their literal code values
        if (tierA === 1) {
            const codeA = charA.charCodeAt(0);
            const codeB = charB.charCodeAt(0);
            if (codeA !== codeB) {
                return codeA - codeB; // Strict text ASCII order (space ' ' is 32, which is less than any letter/number)
            }
        }

        // If we hit Chinese characters at this index, both strings share an identical ASCII prefix
        // We isolate the remaining Chinese suffixes and sort the rest of the string by strokes
        if (tierA === 2) {
            const suffixA = a.substring(i);
            const suffixB = b.substring(i);
            const zhStrokeCollator = new Intl.Collator('zh-CN-u-co-stroke', { sensitivity: 'base' });
            return zhStrokeCollator.compare(suffixA, suffixB);
        }
    }

    return 0; // Strings are perfectly identical
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

// FIXED MASTER RESET ENGINE: "Show all" now clears text, buttons, AND updates UI states smoothly 🎯
document.getElementById("clearAllFiltersBtn")?.addEventListener("click", () => {
    const searchInput = document.getElementById("tableSearch");
    const showCheckedOnlyToggle = document.getElementById("showCheckedOnlyToggle");

    if (searchInput) searchInput.value = "";
    if (showCheckedOnlyToggle) showCheckedOnlyToggle.checked = false;

    // 1. Reset category logic variables back to default safe starting rules
    for (const dataAttr in window.selectedFilters) {
        window.selectedFilters[dataAttr].clear();
        window.booleanLogicalModes[dataAttr] = true; // Reset background variables back to 'AND'
    }

    // 2. 🔥 THE DIRECT FIX: Instantly force the visual HTML buttons to match the background states
    document.querySelectorAll('.boolean-logic-toggle-btn').forEach(btn => {
        btn.textContent = 'And';
        btn.classList.remove('or-state'); // Removes the orange background color accent instantly
    });

    // 3. Clear transient tracking variables and execute a fresh data render recalculation
    window.activeSlicerKey = null;
    window.applyCombinedFilter();
});
