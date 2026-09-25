// GLOBAL FAVOURITE FILTER SYSTEM STATES 🎯
window.showFavouritesOnlyActive = false; 

/**
 * Global macro execution function to toggle the Favorite cross-filtering layer state
 */
window.toggleFavouritesOnlyFilterMode = function() {
    window.showFavouritesOnlyActive = !window.showFavouritesActiveState();
    
    // Update structural button UI rendering tokens across viewports
    const favHeaderButtons = document.querySelectorAll(".fav-toggle-action-trigger");
    favHeaderButtons.forEach(btn => {
        btn.classList.toggle("fav-filter-active-state", window.showFavouritesOnlyActive);
    });
    
    // Core pipeline execution block triggers runtime viewport filtration
    window.applyCombinedFilter();
};

window.showFavouritesActiveState = function() {
    return !!window.showFavouritesOnlyActive;
};

// UNIFIED RUNTIME BOOTLOADER ENGINE (Combines all listeners into one safe thread) 🎯
document.addEventListener("DOMContentLoaded", () => {
    const tbody = document.getElementById("tableBody");
    if (!tbody) return;
    window.globalTableRows = [];

    // A. Bind UI Controls Panel Elements safely within the active thread [INDEX: 0.1.217]
    document.getElementById("dashboardToggleBtn")?.addEventListener("click", function() {
        const isCollapsed = document.querySelector(".filter-dashboard-panel")?.classList.toggle("collapsed-state");
        this.innerHTML = isCollapsed ? "&#9660;" : "&#9650;";
        
        // 🚀 INJECT THIS CALL TO TRIGGER THE SWAP ON CLICK:
        if (typeof window.synchronizeMirrorChipsViewport === "function") {
            window.synchronizeMirrorChipsViewport();
        }
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

        // Initialise row cells content tracking as a blank text canvas layer [▲]
        let cellsContentHtml = "";

        // 🎯 THE DIRECT FIX: Use a dedicated data value tracking index counter [▲]
        // This separates the JSON schema array index from your physical val1, val2 data properties!
        let dataValueKeyIndexTracker = 1;

        // Loop column schema components dynamically straight from your JSON file! [▲]
        columnConfigs.forEach((colConf) => {
            
            // Is this index track configured as our selector checkbox? [▲]
            if (colConf.type === "checkbox") {
                cellsContentHtml += `
                    <td class="checkbox-data-cell" style="width: ${colConf.width || '40px'}; min-width: ${colConf.minWidth || '33px'};">
                        <input type="checkbox" class="row-selector-checkbox" ${checkedAttributeMarker} aria-label="Select row">
                    </td>
                `;
            }
            else if (colConf.isToggle === true) {
                // Keep your working Fav button toggle code track exactly verbatim [▲]
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
				// 🎯 THE UNIVERSAL HOOK: Read explicitly from the jsonKey configuration parameter map!
				// Fall back to a blank string if the database cell field doesn't exist.
				const variableKey = colConf.jsonKey || "";
				const rawValue = variableKey ? (item[variableKey] || "").trim() : "";

				let stylesArray = [];
				if (colConf.textColor) stylesArray.push(`color: ${colConf.textColor} !important;`);
				if (colConf.alignRight) stylesArray.push(`text-align: right !important;`);

				const stylingAttributes = stylesArray.length > 0 ? `style="${stylesArray.join(' ')}"` : '';
				let cellDisplayValue = rawValue;
                if (colConf.isCurrency && rawValue !== "") {
                    const numericValue = parseFloat(rawValue.replace(/,/g, ''));
                    if (!isNaN(numericValue)) {
                        const decimals = typeof colConf.precision !== 'undefined' ? colConf.precision : 2;
                        cellDisplayValue = "\$" + numericValue.toLocaleString('en-US', {
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
					const statusWordsArray = cellDisplayValue.trim().split(/\s+/);
					let compiledBadgesHtmlString = "";

					statusWordsArray.forEach(word => {
						const badgeLookupKey = word.toLowerCase();

						if (badgeLookupKey === "<br>" || badgeLookupKey === "<br/>" || badgeLookupKey === "<br />") {
							compiledBadgesHtmlString += `<div style="flex-basis: 100%; height: 0; margin: 0; padding: 0;"></div>`;
						}
						else if (badgeSchema[badgeLookupKey]) {
							const badgeRules = badgeSchema[badgeLookupKey];
							
							// 🚀 CLEAN & LEAN INLINE WRITER: Maps JSON inputs directly without duplicate code strings!
							let inlineStyles = [];
							
							// 🚀 MOVED TO TOP: Map Background/Color modifiers first so they cannot wipe sizing structures!
							if (badgeRules.background)    inlineStyles.push(`background: ${badgeRules.background} !important;`);
							if (badgeRules.bg)           inlineStyles.push(`background-color: ${badgeRules.bg} !important;`);
							if (badgeRules.text)         inlineStyles.push(`color: ${badgeRules.text} !important;`);
							if (badgeRules.border)       inlineStyles.push(`border: 1px solid ${badgeRules.border} !important;`);
							if (badgeRules.borderRadius) inlineStyles.push(`border-radius: ${badgeRules.borderRadius} !important;`);
							if (badgeRules.boxShadow)     inlineStyles.push(`box-shadow: ${badgeRules.boxShadow} !important;`);
							if (badgeRules.letterSpacing) inlineStyles.push(`letter-spacing: ${badgeRules.letterSpacing} !important;`);
							if (badgeRules.fontWeight)    inlineStyles.push(`font-weight: ${badgeRules.fontWeight} !important;`);
							if (badgeRules.fontStyle)     inlineStyles.push(`font-style: ${badgeRules.fontStyle} !important;`);

							// 🚀 MOVED TO BOTTOM: Sizing parameters are evaluated LAST, overriding all shorthand layouts!
							if (badgeRules.padding)       inlineStyles.push(`padding: ${badgeRules.padding} !important;`);
							
							if (badgeRules.minWidth) {
								inlineStyles.push(`min-width: ${badgeRules.minWidth} !important;`);
								inlineStyles.push(`width: ${badgeRules.minWidth} !important;`); // Lock width to force compliance
							}

							const finalInlineStylesString = inlineStyles.length > 0 ? `style="${inlineStyles.join(' ')}"` : '';

							compiledBadgesHtmlString += `
								<span class="status-badge-token" ${finalInlineStylesString}>
									${badgeRules.label || word}
								</span>
							`;
						} else if (word !== "") {
							compiledBadgesHtmlString += `<span style="margin-right: 4px !important; display: inline-block;">${word}</span>`;
						}
					});

					const multiBadgeWrapperHtml = `
						<div style="display: flex !important; flex-wrap: wrap !important; align-items: center !important;">
							${compiledBadgesHtmlString}
						</div>
					`;

					cellsContentHtml += `<td ${stylingAttributes}>${multiBadgeWrapperHtml}</td>`;
				}
				else {
                    cellsContentHtml += `<td ${stylingAttributes}>${cellDisplayValue}</td>`;
                }
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
            // =============================================================
            // 🎯 THE INITIAL SORT ENGINE SCANNER DIRECT INJECTION
            // =============================================================
            if (typeof window.executeSort === "function" && columnConfigs) {
                // Find the index offset position mapping your target column
                const defaultSortColumnIndex = columnConfigs.findIndex(col => col && col.initSort === true);
                
                if (defaultSortColumnIndex !== -1) {
                    const targetSortConfig = columnConfigs[defaultSortColumnIndex];
                    // Verify if target sort direction is descending; default to ascending true
                    const isAscendingSortOrder = String(targetSortConfig.initsortOrder).toLowerCase() !== "desc";
                    
                    // 🚀 Execute your core sort engine function onto live table elements!
                    window.executeSort(defaultSortColumnIndex, isAscendingSortOrder);
                    
                    // Synchronize visual caret symbols cleanly on the active header cell node
                    const headerElements = document.querySelectorAll("#dataTable th");
                    if (headerElements[defaultSortColumnIndex]) {
                        // Clear old caret indicators across headers to avoid collision errors
                        document.querySelectorAll(".sort-icon-trigger").forEach(c => c.classList.remove("asc", "desc"));
                        
                        const sortCaretSpan = headerElements[defaultSortColumnIndex].querySelector(".sort-icon-trigger");
                        if (sortCaretSpan) {
                            sortCaretSpan.classList.add(isAscendingSortOrder ? "asc" : "desc");
                        }
                    }
                }
            }
            // Initialize background calculations and triggers safely
            if (typeof window.initHorizontalFilters === "function") window.initHorizontalFilters(window.globalTableRows);
            if (typeof window.applyCombinedFilter === "function") window.applyCombinedFilter();
            if (typeof window.bindSortingTriggers === "function") window.bindSortingTriggers();
            if (typeof window.initColumnResizableEngine === "function") window.initColumnResizableEngine();
			const layoutColumnsSchema = window.activeColumnsWidthsSchema || [];
			const defaultStatColumnProfile = layoutColumnsSchema.find(col => col && col.isStatistics === true && col.isStatMode === true);

			if (defaultStatColumnProfile) {
				// Assign the default active tracking key to global window variables
				window.activeStatisticsColumnJsonKey = defaultStatColumnProfile.jsonKey;
				
				// Locate the rendered header trigger button component using its attribute matches
				const targetHeaderCells = document.querySelectorAll("#dataTable th");
				let matchingStatBtnElement = null;

				targetHeaderCells.forEach((th, idx) => {
					if (layoutColumnsSchema[idx] && layoutColumnsSchema[idx].jsonKey === defaultStatColumnProfile.jsonKey) {
						matchingStatBtnElement = th.querySelector(".header-column-stat-trigger-btn");
					}
				});

				// If the button component exists, visually toggle its operational active class layout properties
				if (matchingStatBtnElement) {
					matchingStatBtnElement.classList.add("active-panel-visible");
				}

				// Trigger real-time math evaluation calculation loops instantly on initial page load bounds
				if (typeof window.executeRealtimeTableStatistics === "function") {
					window.executeRealtimeTableStatistics();
				}
			}
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

        // 🎯 FIXED: Swapped out foreign index names with correct localized variables
        if (!nextStateSaved && window.showFavouritesActiveState()) {
            // If we are un-favoriting a row under active filter mode, mark it as pending
            parentRowNode.classList.add("is-unfav-pending");
        } else {
            // If favoriting or if filter mode is turned off, clear the state
            parentRowNode.classList.remove("is-unfav-pending");
        }

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
		// INJECT THIS CALL RIGHT BEFORE CLOSING THE EVENT LISTENER LAYER:
		window.recalculateRealtimeFavCounters();
		window.applyCombinedFilter(); // Re-evaluates viewport matching layers instantly
    });

});
window.recalculateRealtimeFavCounters = function() {
    const activeRowsArray = window.getRuntimeRows();
    const favColumnIndex = (window.activeColumnsWidthsSchema || []).findIndex(col => col && col.isToggle === true);
    
    if (favColumnIndex === -1) return;
    
    let matchedVisibleFavoritesCount = 0;
    const savedFavouritesDatabase = JSON.parse(localStorage.getItem("dashboardPersistentFavKeys") || "[]");
    
    activeRowsArray.forEach(row => {
        const rowStorageKeySignature = row.getAttribute("data-row-key");
        const isFav = savedFavouritesDatabase.includes(rowStorageKeySignature);
        
        if (isFav) {
            // Count rows matching active text queries, filters, or checkboxes
            if (row.style.display !== "none" && !row.classList.contains("is-unchecked-pending")) {
                matchedVisibleFavoritesCount++;
            }
        }
    });
    
    // Update the master column label marker badge element only
    const columnHeaderCounterSlot = document.getElementById("favColumnCounterBadge");
    if (columnHeaderCounterSlot) {
        columnHeaderCounterSlot.textContent = `(${matchedVisibleFavoritesCount})`;
    }
    
    // Keep button label static as "★ only" and use class tracking for highlights
    const toggleButton = document.getElementById("favFilterToggleBtn");
    if (toggleButton) {
        toggleButton.textContent = "★ only";
        toggleButton.classList.toggle("fav-filter-active-state", window.showFavouritesActiveState());
    }
};
