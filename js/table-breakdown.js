/**
 * DYNAMIC REAL-TIME BREAKDOWN COMPILATION ENGINE
 */
window.executeBreakdownAggregation = function(categoryKey, columnConfig) {
    const activeRows = window.getRuntimeRows().filter(row => row.style.display !== "none");
    const widthsSchema = window.activeColumnsWidthsSchema || [];
    
    // 1. Locate numerical value targeted column index mapping parameters profile
    const numericTargetKey = window.activeStatisticsColumnJsonKey;
    const columnIndex = widthsSchema.findIndex(col => col && col.jsonKey === numericTargetKey);
    if (columnIndex === -1) return;

    let aggregateMap = {};
    let grandSumTotal = 0;

    // 2. Loop through visible data blocks to compile counts
    activeRows.forEach(row => {
        // Extract the category tag parameter string directly from row structural properties
        const rawTagsStr = row.getAttribute(categoryKey) || row.getAttribute(`data-${categoryKey}`) || "";
        const rowParsedTags = rawTagsStr.split(';').map(x => x.trim()).filter(x => x !== "");
        
        // Extract numerical value cell text logs
        const targetCell = row.querySelectorAll("td")[columnIndex];
        if (!targetCell) return;
        const rawCleanString = String(targetCell.textContent || "").replace(/[^\d.-]/g, "").trim();
        const value = parseFloat(rawCleanString) || 0;

        if (rowParsedTags.length === 0) {
            rowParsedTags.push("Unknown");
        }

        rowParsedTags.forEach(tag => {
            if (!aggregateMap[tag]) aggregateMap[tag] = 0;
            aggregateMap[tag] += value;
            grandSumTotal += value;
        });
    });

    // 3. Sort options database array text values from highest amount to lowest
    const sortedDataArray = Object.entries(aggregateMap).sort((a, b) => b[1] - a[1]);
    const maxSingleValue = sortedDataArray.length > 0 ? sortedDataArray[0][1] : 1;

    // 4. Output dynamic bars list to the dashboard view screen layout
    const rowsWrapper = document.getElementById("breakdownRowsWrapper");
    if (!rowsWrapper) return;
    rowsWrapper.innerHTML = "";

    if (sortedDataArray.length === 0) {
        rowsWrapper.innerHTML = `<div style="text-align:center; padding:20px; color:#64748B; font-style:italic;">No active visible data available to parse.</div>`;
        return;
    }

    // 🎯 THE JSON PROPERTY LOOKUP RESOLUTION: Looks for either column root keys or nested statisticsConfig parameters automatically
    const activeTargetColumnKey = window.activeStatisticsColumnJsonKey || "";
    const nestedStatsConfigProfile = (window.globalStatisticsConfigSchema && window.globalStatisticsConfigSchema[activeTargetColumnKey]) ? window.globalStatisticsConfigSchema[activeTargetColumnKey].total : {};
    
    // Safely reads precision digits and currency flags from whichever schema location your active JSON utilizes
    const targetPrecisionDigits = (nestedStatsConfigProfile.precision !== undefined) ? parseInt(nestedStatsConfigProfile.precision, 10) : ((columnConfig?.precision !== undefined) ? parseInt(columnConfig.precision, 10) : 2);
    const isCurrencyFormatActive = (nestedStatsConfigProfile.isCurrency !== undefined) ? (nestedStatsConfigProfile.isCurrency === true) : (columnConfig?.isCurrency === true);

    // Number formatter targets USD or general formats matching your schema
    const formatter = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: targetPrecisionDigits,
        maximumFractionDigits: targetPrecisionDigits
    });

    sortedDataArray.forEach(([label, amount]) => {
        // THE MATHEMATICAL SCALING MATH: Compiles exact weight relative to the highest peak item
        const proportionalPercentageWidth = maxSingleValue > 0 ? ((amount / maxSingleValue) * 100) : 0;
        const shareOfGrandTotal = grandSumTotal > 0 ? ((amount / grandSumTotal) * 100) : 0;

        // 🎯 THE CLEAN REMEDY: Keep the JS 100% free of text fonts and styles. Let CSS handle all fonts naturally.
        const rowNode = document.createElement("div");
        rowNode.className = "breakdown-data-row";
        
        let formattedAmountString = "";
        if (isCurrencyFormatActive) {
            const currencyFormatter = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: targetPrecisionDigits,
                maximumFractionDigits: targetPrecisionDigits
            });
            formattedAmountString = currencyFormatter.format(amount);
            if (!formattedAmountString.startsWith("\$")) {
                formattedAmountString = "\$" + formattedAmountString;
            }
        } else {
            formattedAmountString = formatter.format(amount);
        }

        rowNode.innerHTML = `
            <div class="breakdown-label-slot" style="font-family: inherit !important;" title="${label}">${label}</div>
            <div class="breakdown-bar-corridor">
                <div class="breakdown-bar-fill-fluid" style="width: ${proportionalPercentageWidth}%;"></div>
            </div>
            <div class="breakdown-metrics-slot" style="font-family: inherit !important;">
                ${formattedAmountString} (${shareOfGrandTotal.toFixed(0)}%)
            </div>
        `;
        rowsWrapper.appendChild(rowNode);
    });
};

// GLOBAL INTERACTION ROUTER DELEGATION PIPELINE WITH REVERSIBLE VIEWPORT TOGGLE 🎯
window.bindBreakdownInteractionTrigger = function() {
    const tableContainerNode = document.querySelector(".table-container");
    const breakdownContainerNode = document.getElementById("breakdownContainer");
    const showMoreInfoBtnElement = document.getElementById("openBreakdownBtn");

    if (!showMoreInfoBtnElement) return;

    // Flush out previous event parameters to prevent memory stacking leakage bugs
    showMoreInfoBtnElement.onclick = null;
    
    showMoreInfoBtnElement.onclick = function(e) {
        e.stopPropagation();
        e.preventDefault();
        
        if (!tableContainerNode || !breakdownContainerNode) return;
        
        // 🎯 THE REVERSIBLE SCREEN DETECTOR: Check if the breakdown chart is already active on screen right now
        const isBreakdownCurrentlyVisible = breakdownContainerNode.style.display === "flex";
        
        if (isBreakdownCurrentlyVisible) {
            // CONDITION A: Breakdown is open -> Close it, turn off style colors, and slide back onto Data Table smoothly
            window.activeBreakdownCategoryKey = null;
            showMoreInfoBtnElement.classList.remove("active-profile-state"); // Drops button active theme color on close
            
            breakdownContainerNode.style.setProperty("display", "none", "important");
            tableContainerNode.style.setProperty("display", "flex", "important");
        } else {
            // CONDITION B: Table is open -> Move to breakdown mode and repaint graphs
            showMoreInfoBtnElement.classList.add("active-profile-state"); // Colors the "..." card button matching your active theme presets
            
            tableContainerNode.style.setProperty("display", "none", "important");
            breakdownContainerNode.style.setProperty("display", "flex", "important");

            // Automatically populate or refresh button deck toolbars matching schema profiles
            const buttonsDeckSlot = document.getElementById("breakdownCategoryButtonsDeck");
            if (buttonsDeckSlot) {
                buttonsDeckSlot.innerHTML = "";
                
                const filterSchema = window.activeFiltersSchema || [];
                filterSchema.forEach(config => {
					const cleanKey = String(config.jsonKey || "").replace(/data-|-/g, '').trim();
					const btn = document.createElement("button");
					btn.type = "button";
					btn.className = "filter-item-btn"; // 🎯 CLEAN BALANCING: Removes hardcoded font sizes. Inherits layout styles.
					btn.textContent = config.title || cleanKey;
                    
                    btn.onclick = () => {
                        window.activeBreakdownCategoryKey = cleanKey;
                        
                        // Toggle color tracking highlights across buttons
                        buttonsDeckSlot.querySelectorAll("button").forEach(b => b.classList.remove("active"));
                        btn.classList.add("active");
                        
                        const activeColumns = window.activeColumnsWidthsSchema || [];
                        const configProfile = activeColumns.find(c => c && c.jsonKey === window.activeStatisticsColumnJsonKey);
                        
                        window.executeBreakdownAggregation(cleanKey, configProfile);
                    };
                    buttonsDeckSlot.appendChild(btn);
                });
                
                // Force-click the first category automatically to initialize data on open frame
                buttonsDeckSlot.querySelector("button")?.click();
            }
        }
    };
};

// Fallback background script initialization layer hook
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        window.bindBreakdownInteractionTrigger();
    }, 200);
});
