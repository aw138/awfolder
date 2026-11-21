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

	// Helper: Exact Data Table Category Comparator (Numbers -> English/ASCII -> Chinese Stroke -> Others)
	const zhStrokeCollator = new Intl.Collator("zh-CN-u-co-stroke", { sensitivity: "base" });
	const getCharTier = (ch) => {
		if (!ch) return 0;
		const code = ch.charCodeAt(0);
		if (code >= 0 && code <= 127) return 1;        // ASCII / English
		if (code >= 0x4E00 && code <= 0x9FFF) return 2; // Chinese CJK
		return 3;
	};

	const compareCategoryLabels = (rawA, rawB) => {
		const strA = String(rawA || "").trim();
		const strB = String(rawB || "").trim();

		if (strA === strB) return 0;
		// if (strA === "(None)" || strA === "") return 1;
		// if (strB === "(None)" || strB === "") return -1;

		// 1. Pure numeric & fraction comparison (e.g., Days: 1, 2, 8, 12, 21 or Shutter: 1/100, 1/5)
		const numA = parseNumericOrFraction(strA);
		const numB = parseNumericOrFraction(strB);
		if (!isNaN(numA) && !isNaN(numB)) {
			return numA - numB;
		}

		// 2. Character-by-character Tier Comparison (English/ASCII before Chinese)
		const maxLen = Math.max(strA.length, strB.length);
		for (let i = 0; i < maxLen; i++) {
			const charA = strA[i] || "";
			const charB = strB[i] || "";
			if (charA === "" && charB !== "") return -1;
			if (charA !== "" && charB === "") return 1;

			const tierA = getCharTier(charA);
			const tierB = getCharTier(charB);
			if (tierA !== tierB) return tierA - tierB;

			if (tierA === 1) {
				const codeA = charA.toLowerCase().charCodeAt(0);
				const codeB = charB.toLowerCase().charCodeAt(0);
				if (codeA !== codeB) return codeA - codeB;
			} else if (tierA === 2) {
				return zhStrokeCollator.compare(strA.substring(i), strB.substring(i));
			} else {
				const cmp = strA.substring(i).localeCompare(strB.substring(i));
				if (cmp !== 0) return cmp;
			}
		}
		return 0;
	};

	// 3. Sort options database array based on active breakdown sort mode
	window.breakdownSortMode = window.breakdownSortMode || "value_desc";
	const sortedDataArray = Object.entries(aggregateMap).sort((a, b) => {
		if (window.breakdownSortMode === "value_asc") return a[1] - b[1];
		if (window.breakdownSortMode === "label_asc") return compareCategoryLabels(a[0], b[0]);
		if (window.breakdownSortMode === "label_desc") return -compareCategoryLabels(a[0], b[0]);
		return b[1] - a[1]; // Default: "value_desc"
	});
	const maxSingleValue = sortedDataArray.length > 0 ? Math.max(...sortedDataArray.map(item => item[1])): 1;

	// Sync grouped bar values to the Stat Panel (Mean & SD per bar category)
	window.activeBreakdownChartValues = sortedDataArray.map(item => item[1]);
	if (typeof window.executeRealtimeTableStatistics === "function") {
		window.executeRealtimeTableStatistics();
	}

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
			window.activeBreakdownChartValues = null;
			showMoreInfoBtnElement.classList.remove("active-profile-state"); // Drops button active theme color on close

			breakdownContainerNode.style.setProperty("display", "none", "important");
			tableContainerNode.style.setProperty("display", "flex", "important");
			if (typeof window.executeRealtimeTableStatistics === "function") {
				window.executeRealtimeTableStatistics();
			}
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

				// 1. Category Sort Trigger (reuses .sort-icon-trigger next to the last category button)
				const catSortWrap = document.createElement("span");
				catSortWrap.className = "breakdown-sort-trigger";
				catSortWrap.title = "Sort Categories";
				const catCaret = document.createElement("span");
				catCaret.className = "sort-icon-trigger";
				catSortWrap.appendChild(catCaret);
				buttonsDeckSlot.appendChild(catSortWrap);

				// 2. Dynamic Column Title ("Amount") + Value Sort Trigger on the right
				const headerContainer = buttonsDeckSlot.parentElement;
				let valCaret = null;

				if (headerContainer) {
					const oldMetricHeader = headerContainer.querySelector(".breakdown-metric-header");
					if (oldMetricHeader) oldMetricHeader.remove();

					const activeCols = window.activeColumnsWidthsSchema || [];
					const statColCfg = activeCols.find(c => c && c.jsonKey === window.activeStatisticsColumnJsonKey);
					const metricLabel = statColCfg?.label || "Amount";

					const metricHeader = document.createElement("div");
					metricHeader.className = "breakdown-metric-header";
					metricHeader.title = `Sort by ${metricLabel}`;

					const titleSpan = document.createElement("span");
					titleSpan.textContent = metricLabel;

					valCaret = document.createElement("span");
					valCaret.className = "sort-icon-trigger desc";

					metricHeader.appendChild(titleSpan);
					metricHeader.appendChild(valCaret);
					headerContainer.appendChild(metricHeader);

					metricHeader.onclick = () => {
						window.breakdownSortMode = (window.breakdownSortMode === "value_desc") ? "value_asc" : "value_desc";
						updateSortCarets();
						rerunActiveCategory();
					};
				}

				const updateSortCarets = () => {
					const mode = window.breakdownSortMode || "value_desc";
					catCaret.className = "sort-icon-trigger" + (mode === "label_asc" ? " asc" : (mode === "label_desc" ? " desc" : ""));
					if (valCaret) {
						valCaret.className = "sort-icon-trigger" + (mode === "value_asc" ? " asc" : (mode === "value_desc" ? " desc" : ""));
					}
				};

				const rerunActiveCategory = () => {
					const activeCat = window.activeBreakdownCategoryKey;
					if (activeCat) {
						const activeCols = window.activeColumnsWidthsSchema || [];
						const cfg = activeCols.find(c => c && c.jsonKey === window.activeStatisticsColumnJsonKey);
						window.executeBreakdownAggregation(activeCat, cfg);
					}
				};

				catSortWrap.onclick = () => {
					window.breakdownSortMode = (window.breakdownSortMode === "label_asc") ? "label_desc" : "label_asc";
					updateSortCarets();
					rerunActiveCategory();
				};

				updateSortCarets();

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
function parseNumericOrFraction(rawText) {
	const cleaned = String(rawText || "").replace(/,/g, "").trim();
	
	// Match fractions like "1/5", "1/100", "1/4000", or mixed numbers like "1 1/2"
	const mixedMatch = cleaned.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
	if (mixedMatch) {
		const whole = parseFloat(mixedMatch[1]);
		const num = parseFloat(mixedMatch[2]);
		const den = parseFloat(mixedMatch[3]);
		if (den !== 0) return whole < 0 ? whole - (num / den) : whole + (num / den);
	}
	
	const fracMatch = cleaned.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
	if (fracMatch) {
		const num = parseFloat(fracMatch[1]);
		const den = parseFloat(fracMatch[2]);
		if (den !== 0) return num / den;
	}
	
	// Fallback for regular numbers (strips units like "s", "sec", "mm", "$")
	const numOnly = cleaned.replace(/[^\d.-]/g, "");
	return numOnly !== "" ? parseFloat(numOnly) : NaN;
}
