// config.js - 全局配置与共享状态

// =========================
// 可切换属性
// =========================

var attrArray = [
    "Grand Total",
    "Amphibians",
    "Arachnids",
    "Birds",
    "Clams",
    "Conifers and Cycads",
    "Crustaceans",
    "Ferns and Allies",
    "Fishes",
    "Flowering Plants",
    "Insects",
    "Lichens",
    "Mammals",
    "Reptiles",
    "Snails"
];

var attrArraySpecies = [
    "Scientific Name",
    "Common Name",
    "Where Listed",
    "Region",
    "ESA Listing Status",
    "Group",
    "State"
];

// 当前选中的变量
var expressed = attrArray[0];
var expressedSpecies = attrArraySpecies[0];

// =========================
// 排名筛选状态
// =========================

// 可选值：
// all
// top10
// top20
// bottom10
var rankingScope = "all";

// 保存当前完整CSV数据，供地图、图表和筛选共享
var currentCsvData = [];

// =========================
// 图表配置
// =========================

var chartHeight = 190;

var chartMargins = {
    top: 10,
    right: 10,
    bottom: 32,
    left: 44
};

// =========================
// 颜色比例尺
// =========================

function makeColorScale(data) {
    var validValues = data
        .map(function(d) {
            return Number(d[expressed]);
        })
        .filter(function(value) {
            return Number.isFinite(value);
        });

    var maxValue = d3.max(validValues);

    if (!Number.isFinite(maxValue) || maxValue <= 0) {
        maxValue = 1;
    }

    return d3.scaleSequential()
        .domain([0, maxValue])
        .interpolator(d3.interpolateGnBu);
}

// =========================
// 主地图气泡大小比例尺
// =========================

function getSizeScale(csvData) {
    var maxValue = d3.max(csvData, function(d) {
        var value = Number(d[expressed]);
        return Number.isFinite(value) ? value : 0;
    });

    if (!Number.isFinite(maxValue) || maxValue <= 0) {
        maxValue = 1;
    }

    return d3.scaleSqrt()
        .domain([0, maxValue])
        .range([0, 40]);
}

// =========================
// 东北部局部图气泡大小比例尺
// =========================

function getInsetSizeScale(csvData) {
    var maxValue = d3.max(csvData, function(d) {
        var value = Number(d[expressed]);
        return Number.isFinite(value) ? value : 0;
    });

    if (!Number.isFinite(maxValue) || maxValue <= 0) {
        maxValue = 1;
    }
    return d3.scaleSqrt()
        .domain([0, maxValue])
        .range([1.5, 6]);
}

// =========================
// 显示名称映射
// =========================

function getDisplayName(attribute) {
    var displayNames = {
        "Grand Total": "Species Count",
        "Amphibians": "Amphibians",
        "Arachnids": "Arachnids",
        "Birds": "Birds",
        "Clams": "Clams",
        "Conifers and Cycads": "Conifers and Cycads",
        "Crustaceans": "Crustaceans",
        "Ferns and Allies": "Ferns and Allies",
        "Fishes": "Fishes",
        "Flowering Plants": "Flowering Plants",
        "Insects": "Insects",
        "Lichens": "Lichens",
        "Mammals": "Mammals",
        "Reptiles": "Reptiles",
        "Snails": "Snails"
    };

    return displayNames[attribute] || attribute;
}