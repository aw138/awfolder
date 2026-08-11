// This file strictly drives the metadata for your
// dataset layout. Notice how we cleanly map keys to header 
// labels and mark specific fields as dynamic filter slicers.

export const TRAVEL_PROJECT_CONFIG = {
    // Specify your remote data location here 
    DATA_URL: "https://aw138.github.io/awfolder/travel-data.json",

    columns: [
        { key: "id", label: "ID", align: "text-center" },
        { key: "destination", label: "Destination", align: "text-left" },
        { key: "country", label: "Country", align: "text-left" },
        { key: "category", label: "Travel Type", align: "text-center" },
        { key: "year", label: "Year", align: "text-center" },
        { key: "duration_days", label: "Duration", align: "text-right" },
        { key: "budget_rating", label: "Budget Tier", align: "text-center" }
    ],
    filters: [
        { key: "country", label: "Country" },
        { key: "category", label: "Travel Type" },
        { key: "year", label: "Year" },
        { key: "days", label: "Days" }
    ]
};
