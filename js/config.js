export const APP_CONFIG = {
    // ?? Central Data Source Location
    DATA_SOURCE_URL: "https://githubusercontent.com",

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

    // ?? Filter Slicer Data Properties Mapping
    filters: [
        { key: "data-tag-1", label: "Year" },
        { key: "data-tag-2", label: "Season" },
        { key: "data-tag-3", label: "Country" },
        { key: "data-tag-4", label: "Place" },
        { key: "data-tag-5", label: "Agent" },
        { key: "data-tag-6", label: "Days" }
    ],

    // ?? Flat Button Priorities Mapping Dictionary Array Rules
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
