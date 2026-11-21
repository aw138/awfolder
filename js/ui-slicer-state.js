/**
 * UI SLICER STATE ENGINE
 * Calculates filter tag availability states based on dashboard choices.
 */

window.getTagAvailabilityList = function(currentAttr, uniqueTags, rows, searchCtx) {
	const showCheckedOnly = document.getElementById("showCheckedOnlyToggle")?.checked || false;
	const currentFilters = window.selectedFilters || {};
	const activeSelfSet = currentFilters[currentAttr] || new Set();

	// Pre-compile sibling filters once instead of inside the 45k loop
	const siblingFilters = [];
	for (const [otherAttr, otherFilterSet] of Object.entries(currentFilters)) {
		if (otherAttr === currentAttr || !otherFilterSet || otherFilterSet.size === 0) continue;
		siblingFilters.push({
			otherAttr,
			useAnd: window.booleanLogicalModes[otherAttr] === "AND",
			items: Array.from(otherFilterSet)
		});
	}

	// Single pass over rows to collect all available tags for currentAttr
	const availableTagsSet = new Set(activeSelfSet);

	for (let r = 0; r < rows.length; r++) {
		const row = rows[r];

		if (searchCtx !== "" && !(row._searchText && row._searchText.includes(searchCtx))) continue;

		if (showCheckedOnly) {
		const isChecked = row._checkboxEl ? row._checkboxEl.checked : false;
		if (!isChecked && !row.classList.contains("is-unchecked-pending")) continue;
		}

		let passesSiblings = true;
		for (let s = 0; s < siblingFilters.length; s++) {
			const { otherAttr, useAnd, items } = siblingFilters[s];
			const rowSet = row._tagSets ? row._tagSets[otherAttr] : null;
			if (!rowSet || rowSet.size === 0) { passesSiblings = false; break; }

			if (useAnd) {
			for (let k = 0; k < items.length; k++) {
				if (!rowSet.has(items[k])) { passesSiblings = false; break; }
			}
			} else {
				let anyHit = false;
				for (let k = 0; k < items.length; k++) {
					if (rowSet.has(items[k])) { anyHit = true; break; }
				}
				if (!anyHit) passesSiblings = false;
			}
			if (!passesSiblings) break;
		}

		if (passesSiblings && row._tagLists && row._tagLists[currentAttr]) {
			const tagsInRow = row._tagLists[currentAttr];
			for (let t = 0; t < tagsInRow.length; t++) {
				availableTagsSet.add(tagsInRow[t]);
			}
		}
	}

	return Array.from(uniqueTags).map(tagValue => ({ value: tagValue, available: availableTagsSet.has(tagValue)}
	));
};
