// UNIFIED RUNTIME BOOTLOADER ENGINE (Combines all listeners into one safe thread) 🎯
document.addEventListener("DOMContentLoaded", () => {
    const tbody = document.getElementById("tableBody");
    if (!tbody) return;
    window.globalTableRows = [];

    // A. Bind UI Controls Panel Elements safely within the active thread
    document.getElementById("dashboardToggleBtn")?.addEventListener("click", function() {
        const isCollapsed = document.querySelector(".filter-dashboard-panel")?.classList.toggle("collapsed-state");
        this.innerHTML = isCollapsed ? "&#9660;" : "&#9650;";
    });

    let fontTrackerSize = 14;
    document.getElementById("decreaseFontBtn")?.addEventListener("click", () => {
        if (fontTrackerSize > 8) {
            document.documentElement.style.setProperty('--base-font', (fontTrackerSize -= 1) + "px");
        }
    });
    document.getElementById("increaseFontBtn")?.addEventListener("click", () => {
        if (fontTrackerSize < 20) {
            document.documentElement.style.setProperty('--base-font', (fontTrackerSize += 1) + "px");
        }
    });

    // 🎯 THE EXACT PLACE: Hooking up the global accordion toggle listener on line 25
    document.getElementById("globalSlicersToggleBtn")?.addEventListener("click", function() {
        if (typeof window.toggleAllSlicerDrawersGlobal === "function") {
            window.toggleAllSlicerDrawersGlobal();
        }
    });

    // B. Initiate Cloud Data Connection Pipeline [INDEX: 0.1.98]
    const targetSourceUrl = window.APP_DATA_SOURCE_URL || "js/fallback-data.json";

    fetch(targetSourceUrl)
        .then(res => {
            if (!res.ok) throw new Error("Cloud data response failed");
            return res.json();
        })
        .then(payload => {
            tbody.innerHTML = "";

            const config = payload.CONFIG || {};
            window.currentCustomSortPriority = config.customSortPriority || {};
            window.activeFiltersSchema = config.filters || [];
            window.activeColumnsWidthsSchema = config.columns || [];

            const configurationTitle = config.pageTitle || "Dashboard";
            document.title = configurationTitle;

            const targetTitleHeader = document.getElementById("dynamicDashboardTitle");
            if (targetTitleHeader) {
                targetTitleHeader.textContent = configurationTitle;
            }

            const records = payload.DATA || [];
            const columnConfigs = config.columns || [];
            const badgeSchema = config.statusBadges || {};

            // BULLETPROOF RESTORATION ENGINE FOR POPULATING SAVED ROW CHECKBOXES 🔄 [INDEX: 0.1.98]
            records.forEach(item => {
                const tr = document.createElement("tr");

                const rowStorageKeySignature = `${String(item.val1 || '')}_${String(item.val4 || '')}_${String(item.val5 || '')}`.trim().toLowerCase();
                const savedCheckedKeysDatabase = JSON.parse(localStorage.getItem("dashboardSelectedCheckedKeys") || "[]");
                const initialCheckedMemoryState = savedCheckedKeysDatabase.includes(rowStorageKeySignature);

                tr.setAttribute("data-row-key", rowStorageKeySignature);
                tr.setAttribute("tag1", item.tag1 || "");
                tr.setAttribute("tag2", item.tag2 || "");
                tr.setAttribute("tag3", item.tag3 || "");
                tr.setAttribute("tag4", item.tag4 || "");
                tr.setAttribute("tag5", item.tag5 || "");
                tr.setAttribute("tag6", item.tag6 || "");

                let checkedAttributeMarker = initialCheckedMemoryState ? "checked" : "";

                let cellsContentHtml = `
                <td class="checkbox-data-cell">
                <input type="checkbox" class="row-selector-checkbox" ${checkedAttributeMarker} aria-label="Select row">
                </td>
                `;

                columnConfigs.forEach((colConf, idx) => {
                    const variableKey = `val${idx + 1}`;
                    const rawValue = (item[variableKey] || "").trim();

                    let stylesArray = [];
                    if (colConf.textColor) stylesArray.push(`color: ${colConf.textColor} !important;`);
                    if (colConf.alignRight) stylesArray.push(`text-align: right !important;`);

                    const stylingAttributes = stylesArray.length > 0 ? `style="${stylesArray.join(' ')}"` : '';
                    let cellDisplayValue = rawValue;

                    if (colConf.isCurrency && rawValue !== "") {
                        const numericValue = parseFloat(rawValue.replace(/,/g, ''));
                        if (!isNaN(numericValue)) {
                            const decimals = typeof colConf.precision !== 'undefined' ? colConf.precision : 2;
                            cellDisplayValue = "$" + numericValue.toLocaleString('en-US', {
                                minimumFractionDigits: decimals,
                                maximumFractionDigits: decimals
                            });
                        }
                    }

                    if (colConf.format === "uri" && rawValue !== "") {
                        const targetUrl = rawValue.startsWith("http") ? rawValue : `https://${rawValue}`;
                        cellDisplayValue = `<a href="${targetUrl}" target="_blank" class="table-cell-hyperlink" style="color: inherit !important;">${rawValue}</a>`;
                    }

                    if (colConf.isStatusBadge) {
                        const badgeLookupKey = cellDisplayValue.toLowerCase();
                        let badgeHtml = cellDisplayValue;

                        if (badgeSchema[badgeLookupKey]) {
                            const badgeRules = badgeSchema[badgeLookupKey];
                            const boundaryBorder = badgeRules.border ? `border: 1px solid ${badgeRules.border} !important;` : 'border: 1px solid transparent !important;';

                            badgeHtml = `
                            <span class="status-badge-token" style="background-color: ${badgeRules.bg} !important; color: ${badgeRules.text} !important; ${boundaryBorder}">
                            ${badgeRules.label || cellDisplayValue}
                            </span>
                            `;
                        }
                        cellsContentHtml += `<td ${stylingAttributes}>${badgeHtml}</td>`;
                    } else {
                        cellsContentHtml += `<td ${stylingAttributes}>${cellDisplayValue}</td>`;
                    }
                });

                tr.innerHTML = cellsContentHtml;
                tbody.appendChild(tr);
            });

            window.globalTableRows = Array.from(tbody.querySelectorAll("tr"));

            if (typeof window.initHorizontalFilters === "function") window.initHorizontalFilters(window.globalTableRows);
            if (typeof window.applyCombinedFilter === "function") window.applyCombinedFilter();
            if (typeof window.bindSortingTriggers === "function") window.bindSortingTriggers();
            if (typeof window.initColumnResizableEngine === "function") window.initColumnResizableEngine();
        })
        .catch(err => {
            console.error("JSON Pipeline initial load halted:", err);
            tbody.innerHTML = `<tr><td colspan="20" style="text-align:center;color:#D13438;font-weight:bold;padding:20px;">無法自雲端載入 JSON 數據。</td></tr>`;
        });
});
