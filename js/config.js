export const APP_CONFIG = {
    // ?? LOCAL FILE FETCH: Bypasses network security blocks completely [INDEX: 1.1.13]
    DATA_SOURCE_URL: "travel-data.json",

    // The data mapping array parameters copied directly from your setup [PDF: 0.1.10]
    tagColumnsConfig: [
        { dataAttr: 'data-tag-1', title: 'Year' },
        { dataAttr: 'data-tag-2', title: 'Season' },
        { dataAttr: 'data-tag-3', title: 'Country' },
        { dataAttr: 'data-tag-6', title: 'Days' },
        { dataAttr: 'data-tag-4', title: 'Place' },
        { dataAttr: 'data-tag-5', title: 'Agent' }
    ],

    // Your exact priority sorting criteria weights dictionary [PDF: 0.1.11]
    customSortPriority: { 
        "自由行": 1, 
        "中國": 1, 
        "台灣": 2, 
        "春季": 1, 
        "夏季": 2, 
        "秋季": 3, 
        "冬季": 4 
    }
};
