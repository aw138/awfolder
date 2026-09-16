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

    // Hook up the global accordion toggle listener cleanly
    document.getElementById("globalSlicersToggleBtn")?.addEventListener("click", function() {
        if (typeof window.toggleAllSlicerDrawersGlobal === "function") {
            window.toggleAllSlicerDrawersGlobal();
        }
    });

    // B. Initiate Cloud Data Connection Pipeline
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

			 // 🎯 THE JSON CONFIG DEFAULTS ENGINE
			 const globalAppDefaults = config.defaults || {};
			 const shouldExpandDrawersOnBoot = globalAppDefaults.initialSlicersExpanded === true;
			 
			 // Normalize the string logic state indicator safely
			 const booleanOperatorString = String(globalAppDefaults.defaultBooleanLogicMode || "AND").trim().toUpperCase();
			 const chosenLogicInitialState = booleanOperatorString !== "OR"; 

			 // Setup background tracking structures using your new JSON schema parameters
			 (config.filters || []).forEach(filterConfig => {
				 const cleanKey = String(filterConfig.jsonKey || "").replace('data-', '').replace('-', '').trim();
				 if (!window.selectedFilters) window.selectedFilters = {};
				 
				 if (!window.selectedFilters[cleanKey]) window.selectedFilters[cleanKey] = new Set();
				 window.booleanLogicalModes[cleanKey] = chosenLogicInitialState;
				 window.slicerExpandedStates[cleanKey] = shouldExpandDrawersOnBoot;
			 });

			 const configurationTitle = config.pageTitle || "Dashboard";
			 document.title = configurationTitle;

			 const targetTitleHeader = document.getElementById("dynamicDashboardTitle");
			 if (targetTitleHeader) {
				 targetTitleHeader.textContent = configurationTitle;
			 }

			 // 🎯 LINK UP THE VERSION HOOK: Populates your small sub-digit dynamically from the JSON
			 const targetVersionHeader = document.getElementById("dynamicDashboardVersion");
			 if (targetVersionHeader) {
				 targetVersionHeader.textContent = config.version || "";
			 }

            const records = payload.DATA || [];
            const columnConfigs = config.columns || [];
            const badgeSchema = config.statusBadges || {};

    // CLEAN, DE-DUPLICATED DYNAMIC RESTORATION ENGINE RUNTIME LOOP 🔄 [INDEX: 0.1.242]
    records.forEach(item => {
        const tr = document.createElement("tr");

        // Generate a non-colliding row signature index key [INDEX: 0.1.242]
        const rowStorageKeySignature = `${String(item.val1 || '')}_${String(item.val4 || '')}_${String(item.val5 || '')}`.trim().toLowerCase();
        const savedCheckedKeysDatabase = JSON.parse(localStorage.getItem("dashboardSelectedCheckedKeys") || "[]");
        const initialCheckedMemoryState = savedCheckedKeysDatabase.includes(rowStorageKeySignature);

        // Read persistent favorite statuses from local memory cache blocks on page load
        const savedFavouritesDatabase = JSON.parse(localStorage.getItem("dashboardPersistentFavKeys") || "[]");
        const isRowCurrentlyFavourited = savedFavouritesDatabase.includes(rowStorageKeySignature);

        tr.setAttribute("data-row-key", rowStorageKeySignature);

        // Automatically map tag attributes directly from your JSON parameters [INDEX: 0.1.242]
        (window.activeFiltersSchema || []).forEach(filterConfig => {
            const cleanKey = String(filterConfig.jsonKey || "").replace('data-', '').replace('-', '').trim();
            if (item[cleanKey] !== undefined) {
                tr.setAttribute(cleanKey, item[cleanKey]);
            } else if (item.TAGS && item.TAGS[cleanKey] !== undefined) {
                tr.setAttribute(cleanKey, item.TAGS[cleanKey]);
            } else {
                tr.setAttribute(cleanKey, "");
            }
        });

        let checkedAttributeMarker = initialCheckedMemoryState ? "checked" : "";

        // 1. CLEAR THE HARDCODED STARTING ELEMENT: Initialise row cells content tracking as an empty string canvas layer
        let cellsContentHtml = "";

        // 🧠 THE ENGINE SWITCH: Counter steps up ONLY when hitting non-toggle standard text value keys
        let sourceDataValueIndexCounter = 1;

        // 2. Loop column schema components dynamically straight from your JSON file! [PDF: 0.1.244]
        columnConfigs.forEach((colConf) => {
            
            // 🎯 THE NEW INJECTION SLOT: Is this index track configured as our checkbox?
            if (colConf.type === "checkbox") {
                cellsContentHtml += `
                    <td class="checkbox-data-cell" style="width: ${colConf.width || '33px'}; min-width: ${colConf.minWidth || '33px'};">
                        <input type="checkbox" class="row-selector-checkbox" ${checkedAttributeMarker} aria-label="Select row">
                    </td>
                `;
            }
            else if (colConf.isToggle === true) {
                // ... (Keep your working Fav button toggle code track exactly verbatim) ...
                const textSortingDataValue = isRowCurrentlyFavourited ? "1" : "0";
                const buttonLabel = isRowCurrentlyFavourited ? (colConf.activeLabel || "★") : (colConf.inactiveLabel || "☆");
                const currentColors = isRowCurrentlyFavourited ? colConf.activeColors : colConf.inactiveColors;
                const customConfigStyles = `background-color: ${currentColors.bg} !important; color: ${currentColors.text} !important; border: 1px solid ${currentColors.border} !important; border-radius: ${currentColors.borderRadius || '4px'} !important;`.replace(/\s+/g, ' ');

                cellsContentHtml += `
                    <td class="schema-declarative-data-cell" style="width: ${colConf.width || '65px'};">
                        <span style="display: none !important;">${textSortingDataValue}</span>
                        <button type="button" class="declarative-saved-toggle-btn" style="${customConfigStyles}">${buttonLabel}</button>
                    </td>
                `;
            } else {
                // ... (Keep your working standard text column fallback cell data code track exactly verbatim) ...
                const variableKeyString = `val${sourceDataValueIndexCounter}`;
                const rawValue = (item[variableKeyString] || "").trim();
                sourceDataValueIndexCounter++;
                // ... rest of text cell formatting logic remains completely untouched ...
                let stylesArray = [];
                if (colConf.textColor) stylesArray.push(`color: ${colConf.textColor} !important;`);
                if (colConf.alignRight) stylesArray.push(`text-align: right !important;`);
                const stylingAttributes = stylesArray.length > 0 ? `style="${stylesArray.join(' ')}"` : '';
                cellsContentHtml += `<td ${stylingAttributes}>${rawValue}</td>`;
            }
        });

        tr.innerHTML = cellsContentHtml;
        tbody.appendChild(tr);
    });

			// 🎯 THE RUNTIME OVERHAUL: Dynamic Description Badge Color Mapping Engine
			const descBadgeSchema = config.descriptionBadges || {};
			
			// Scan the freshly built document fragment table body for inline description badges
			tbody.querySelectorAll(".inline-description-badge").forEach(badgeSpan => {
				const badgeTypeKey = badgeSpan.getAttribute("data-badge")?.toLowerCase();
				
				if (badgeTypeKey && descBadgeSchema[badgeTypeKey]) {
					const colorsProfile = descBadgeSchema[badgeTypeKey];
					
					// Write the style properties dynamically from the JSON payload variables
					if (colorsProfile.bg) badgeSpan.style.setProperty("background-color", colorsProfile.bg, "important");
					if (colorsProfile.text) badgeSpan.style.setProperty("color", colorsProfile.text, "important");
					
					if (colorsProfile.border) {
						badgeSpan.style.setProperty("border", `1px solid ${colorsProfile.border}`, "important");
					} else {
						badgeSpan.style.setProperty("border", "1px solid transparent", "important");
					}
				}
			});

			window.globalTableRows = Array.from(tbody.querySelectorAll("tr"));

            // Initialize background calculations and triggers safely
            if (typeof window.initHorizontalFilters === "function") window.initHorizontalFilters(window.globalTableRows);
            if (typeof window.applyCombinedFilter === "function") window.applyCombinedFilter();
            if (typeof window.bindSortingTriggers === "function") window.bindSortingTriggers();
            if (typeof window.initColumnResizableEngine === "function") window.initColumnResizableEngine();
        })
        .catch(err => {
            console.error("JSON Pipeline initial load halted:", err);
            tbody.innerHTML = `<tr><td colspan="20" style="text-align:center;color:#D13438;font-weight:bold;padding:20px;">無法自雲端載入 JSON 數據。</td></tr>`;
        });
    // 🎯 ZERO-INTERFERENCE ACTIONS DELEGATOR FOR SAVING TOGGLE FIELDS
    tbody?.addEventListener("click", function(event) {
        const toggleBtn = event.target.closest(".declarative-saved-toggle-btn");
        if (!toggleBtn) return;
        
        event.stopPropagation();
        
        const parentRowNode = toggleBtn.closest("tr");
        const targetedRowSignatureKey = parentRowNode.getAttribute("data-row-key");
        if (!targetedRowSignatureKey) return;
        
        // Query the schema array mapping layers dynamically directly on clicks
        const schemaColumnConfigs = window.activeColumnsWidthsSchema || [];
        const targetToggleConfig = schemaColumnConfigs.find(c => c.isToggle === true);
        if (!targetToggleConfig) return;
        
        let activeFavKeysDatabase = JSON.parse(localStorage.getItem("dashboardPersistentFavKeys") || "[]");
        const isCurrentlySaved = activeFavKeysDatabase.includes(targetedRowSignatureKey);
        
        if (isCurrentlySaved) {
            activeFavKeysDatabase = activeFavKeysDatabase.filter(key => key !== targetedRowSignatureKey);
        } else {
            activeFavKeysDatabase.push(targetedRowSignatureKey);
        }
        
        // Write the fresh states back to local memory safely
        localStorage.setItem("dashboardPersistentFavKeys", JSON.stringify(activeFavKeysDatabase));
        
        const nextStateSaved = !isCurrentlySaved;
        const targetColors = nextStateSaved ? targetToggleConfig.activeColors : targetToggleConfig.inactiveColors;
        
        // 🎯 THE FIX: Instantly swap the hidden data text string ("1" vs "0") so subsequent sorting clicks evaluate accurately
        const hiddenDataTracker = parentRowNode.querySelector(".schema-declarative-data-cell span");
        if (hiddenDataTracker) {
            hiddenDataTracker.textContent = nextStateSaved ? "1" : "0";
        }
        
        // Re-apply design colors directly from your configurations without triggering re-renders
        toggleBtn.textContent = nextStateSaved ? (targetToggleConfig.activeLabel || "★") : (targetToggleConfig.inactiveLabel || "☆");
        toggleBtn.style.setProperty("background-color", targetColors.bg, "important");
        toggleBtn.style.setProperty("color", targetColors.text, "important");
        toggleBtn.style.setProperty("border", `1px solid ${targetColors.border}`, "important");
        toggleBtn.style.setProperty("border-radius", targetColors.borderRadius, "important");
    });

});
