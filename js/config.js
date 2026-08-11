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
    filters: [
        { key: "tag1", label: "Year" },
        { key: "tag2", label: "Season" },
        { key: "tag3", label: "Country" },
        { key: "tag4", label: "Place" },
        { key: "tag5", label: "Agent" },
        { key: "tag6", label: "Days" }
    ]
};
