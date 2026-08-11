export const APP_CONFIG = {
    // ?? Central Data Source Location
    DATA_SOURCE_URL: "travel-data.json",

    // ?? Table Header Column Definitions
    columns: [
        { isCheckbox: true },
        { key: "date", label: "Date", isSortable: true },
        { key: "lunar", label: "Lunar", isSortable: true },
        { key: "days", label: "Days", isSortable: true },
        { key: "agent", label: "Agent", isSortable: true },
        { key: "country", label: "Country/Place", isSortable: true },
        { key: "description", label: "Description", isSortable: false, showCounter: true }
    ],

    // ?? EXACT PAIRING MAPPINGS: Links your CSS layout to your JSON property keys [INDEX]
    filters: [
        { attr: "data-tag-1", jsonKey: "tag1", label: "Year" },
        { attr: "data-tag-2", jsonKey: "tag2", label: "Season" },
        { attr: "data-tag-3", jsonKey: "tag3", label: "Country" },
        { attr: "data-tag-4", jsonKey: "tag4", label: "Place" },
        { attr: "data-tag-5", jsonKey: "tag5", label: "Agent" },
        { attr: "data-tag-6", jsonKey: "tag6", label: "Days" }
    ],

    // ?? Flat Button Priorities Mapping Dictionary Array Rules [INDEX]
    customSortPriority: { 
        "自由行": 1, 
        "星晨": 2,
        "中國": 1, 
        "Japan": 1,
        "台灣": 2, 
        "春季": 1, 
        "夏季": 2, 
        "秋季": 3, 
        "冬季": 4 
    }
};
