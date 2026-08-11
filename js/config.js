export const TRAVEL_PROJECT_CONFIG = {
    DATA_URL: "travel-data.json",

    columns: [
        { key: "date", label: "Date", align: "text-left" },
        { key: "lunar", label: "Lunar", align: "text-left" },
        { key: "days", label: "Days", align: "text-left" },
        { key: "agent", label: "Agent", align: "text-left" },
        { key: "country", label: "Country", align: "text-left" },
        { key: "description", label: "Description", align: "text-left" }
    ],
    
    filters: [
        { key: "tag1", label: "Year" },
        { key: "tag2", label: "Season" },
        { key: "tag3", label: "Country" }, // Holds values like "Japan"
        { key: "tag4", label: "Place" },
        { key: "tag5", label: "Agent" },  // Holds values like "星晨"
        { key: "tag6", label: "Days" }
    ], 

    // ?? MATCH THE EXACT STRINGS FROM YOUR JSON HERE:
    customSortPriority: {
        "tag3": {
            "中國": 1,
            "N/A": 999
        },
        "tag5": {
            "自由行": 1,
            "Others": 999
        },
        "tag2": {
            "春季": 1,
            "夏季": 2,
            "秋季": 3,
            "冬季": 4
        }
    }
};
