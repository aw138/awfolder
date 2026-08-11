// This file strictly drives the metadata for your
// dataset layout. Notice how we cleanly map keys to header 
// labels and mark specific fields as dynamic filter slicers.

export const TRAVEL_PROJECT_CONFIG = {
    // Specify your remote data location here 
    DATA_URL: "travel-data.json",

    columns: [
        { key: "date", label: "Date", align: "text-left" },
        { key: "lunar", label: "Lunar", align: "text-left" },
        { key: "days", label: "Days", align: "text-left" },
        { key: "agent", label: "Agent", align: "text-left" },
        { key: "country", label: "Country", align: "text-left" },
        { key: "description", label: "Description", align: "text-left" }
    ],
    
    // ?? FIXED: Changed keys to match your actual data properties
    filters: [
        { key: "year", label: "Year" },
        { key: "season", label: "Season" },
        { key: "country", label: "Country" },
        { key: "place", label: "Place" },
        { key: "agent", label: "Agent" },
        { key: "days", label: "Days" }
    ], 

    // ?? FIXED: Keys here now perfectly mirror the filter keys above
    customSortPriority: {
        "country": {
            "中國": 1,
            "N/A": 999
        },
        "agent": {
            "自由行": 1,
            "Others": 999
        },
        "season": {
            "春季": 1,
            "夏季": 2,
            "秋季": 3
        }
    }
};
