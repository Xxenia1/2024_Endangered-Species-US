// config.js - shared dashboard state and visual scales

var speciesVariables = [
    "Species_Count",
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

// These fields are exported by final_data.geojson and are rendered as
// choropleth indicators outside the Species Distribution mode.
var indicatorVariables = [
    "Species_Density",
    "Human_Pressure",
    "Forest_Pct",
    "Urban_Pct",
    "Crop_Pct",
    "Wetland_Pct",
    "GDP_Per_Capita",
    "Population_Density",
    "Risk_Overall",
    "Risk_Wildfire",
    "Risk_Drought",
    "Risk_Flooding",
    "Protected_Pct",
    "Conservation_Effectiveness",
    "Biodiversity_Risk",
    "Ecological_Vulnerability"
];

var analysisModes = {
    species: {
        label: "Species Distribution",
        variables: [
            "Species_Count",
            "Species_Density",
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
        ],
        visualization: "bubble",
        help: "Bubble size represents species distribution."
    },
    environment: {
        label: "Environmental & Socioeconomic",
        variables: [
            "Human_Pressure",
            "Forest_Pct",
            "Urban_Pct",
            "Crop_Pct",
            "Wetland_Pct",
            "GDP_Per_Capita",
            "Population_Density"
        ],
        visualization: "choropleth",
        help: "Color intensity represents indicator value."
    },
    risk: {
        label: "Risk Assessment",
        variables: [
            "Risk_Overall",
            "Risk_Wildfire",
            "Risk_Drought",
            "Risk_Flooding",
            "Biodiversity_Risk",
            "Ecological_Vulnerability"
        ],
        visualization: "choropleth",
        help: "Color intensity represents indicator value."
    },
    conservation: {
        label: "Conservation",
        variables: [
            "Protected_Pct",
            "Conservation_Effectiveness"
        ],
        visualization: "choropleth",
        help: "Color intensity represents indicator value."
    }
};

var indicatorCategoryScores = {
    "Risk_Wildfire": {
        "No Expected Annual Losses": 0,
        "Very Low": 1,
        "Relatively Low": 2,
        "Relatively Moderate": 3,
        "Relatively High": 4,
        "Very High": 5
    },
    "Risk_Drought": {
        "No Expected Annual Losses": 0,
        "Very Low": 1,
        "Relatively Low": 2,
        "Relatively Moderate": 3,
        "Relatively High": 4,
        "Very High": 5
    },
    "Risk_Flooding": {
        "No Expected Annual Losses": 0,
        "Very Low": 1,
        "Relatively Low": 2,
        "Relatively Moderate": 3,
        "Relatively High": 4,
        "Very High": 5
    }
};

var jenksVariables = ["Species_Density", "Human_Pressure"];
var indicatorClassColors = [
    "#cfe8c6",
    "#9ed293",
    "#62b86d",
    "#2c9850",
    "#006d2c"
];

// Presentation metadata keeps the source data unchanged while making small
// or index-based indicators readable in labels, legends, and the ranking chart.
var indicatorDisplayConfig = {
    "Species_Density": {
        factor: 1000,
        unit: "species / 1,000 km²",
        decimals: 3
    },
    "Forest_Pct": { factor: 1, unit: "% of state area", decimals: 1 },
    "Urban_Pct": { factor: 1, unit: "% of state area", decimals: 1 },
    "Crop_Pct": { factor: 1, unit: "% of state area", decimals: 1 },
    "Wetland_Pct": { factor: 1, unit: "% of state area", decimals: 1 },
    "GDP_Per_Capita": { factor: 1, unit: "$ per person", decimals: 0 },
    "Population_Density": { factor: 1, unit: "people / km²", decimals: 1 },
    "Human_Pressure": {
        factor: 1,
        unit: "0–100 index",
        decimals: 1
    },
    "Risk_Overall": {
        factor: 1,
        unit: "0–100 index",
        decimals: 1
    },
    "Risk_Wildfire": { factor: 1, unit: "risk class", decimals: 0 },
    "Risk_Drought": { factor: 1, unit: "risk class", decimals: 0 },
    "Risk_Flooding": { factor: 1, unit: "risk class", decimals: 0 },
    "Protected_Pct": {
        factor: 1,
        unit: "% of state area",
        decimals: 1
    },
    "Conservation_Effectiveness": {
        factor: 1,
        unit: "conservation score",
        decimals: 1
    },
    "Biodiversity_Risk": {
        factor: 1,
        unit: "0–100 index",
        decimals: 1
    },
    "Ecological_Vulnerability": {
        factor: 1,
        unit: "0–100 index",
        decimals: 1
    }
};

var attrArray = speciesVariables.concat(indicatorVariables);

// The final dataset exposes the overall endangered-species count as
// `Species_Count` (the old source-column name `Grand Total` is not exported).
var analysisMode = "species";
var expressed = "Species_Count";
var rankingScope = "all";

// Every map, chart, and report interaction reads these same state records.
var currentStateData = [];
var currentStateFeatures = [];

var chartHeight = 250;
var chartMargins = { top: 12, right: 12, bottom: 42, left: 46 };

var stateAbbreviations = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
    "California": "CA", "Colorado": "CO", "Connecticut": "CT",
    "Delaware": "DE", "District of Columbia": "DC", "Florida": "FL",
    "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL",
    "Indiana": "IN", "Iowa": "IA", "Kansas": "KS", "Kentucky": "KY",
    "Louisiana": "LA", "Maine": "ME", "Maryland": "MD", "Massachusetts": "MA",
    "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO",
    "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH",
    "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
    "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
    "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI",
    "South Carolina": "SC", "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX",
    "Utah": "UT", "Vermont": "VT", "Virginia": "VA", "Washington": "WA",
    "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY"
};

function getStateCode(stateName) {
    return stateAbbreviations[stateName] || stateName;
}

function getDisplayName(attribute) {
    var displayNames = {
        "Species_Count": "Species Count",
        "Species_Density": "Species Density",
        "Human_Pressure": "Human Pressure",
        "Forest_Pct": "Forest %",
        "Urban_Pct": "Urban %",
        "Crop_Pct": "Crop %",
        "Wetland_Pct": "Wetland %",
        "GDP_Per_Capita": "GDP Per Capita",
        "Population_Density": "Population Density",
        "Risk_Overall": "Risk Overall",
        "Risk_Wildfire": "Wildfire Risk",
        "Risk_Drought": "Drought Risk",
        "Risk_Flooding": "Flooding Risk",
        "Protected_Pct": "Protected Area Coverage",
        "Conservation_Effectiveness": "Conservation Effectiveness",
        "Biodiversity_Risk": "Biodiversity Risk",
        "Ecological_Vulnerability": "Ecological Vulnerability"
    };
    return displayNames[attribute] || attribute;
}

function isIndicatorVariable(attribute) {
    return indicatorVariables.indexOf(attribute) !== -1;
}

function isJenksVariable(attribute) {
    return jenksVariables.indexOf(attribute) !== -1;
}

function getVariablesForMode(mode) {
    return analysisModes[mode] ? analysisModes[mode].variables : analysisModes.species.variables;
}

function getModeLabel(mode) {
    return analysisModes[mode] ? analysisModes[mode].label : analysisModes.species.label;
}

function getModeHelp(mode) {
    return analysisModes[mode] ? analysisModes[mode].help : analysisModes.species.help;
}

function isChoroplethMode(mode) {
    var selectedMode = mode || analysisMode;
    return analysisModes[selectedMode] && analysisModes[selectedMode].visualization === "choropleth";
}

function getIndicatorNumericValue(value, attribute) {
    var number = Number(value);
    if (Number.isFinite(number)) return number;

    var categories = indicatorCategoryScores[attribute || expressed];
    if (categories && Object.prototype.hasOwnProperty.call(categories, value)) {
        return categories[value];
    }
    return NaN;
}

function getIndicatorDisplayConfig(attribute) {
    return indicatorDisplayConfig[attribute] || {
        factor: 1,
        unit: "indicator value",
        decimals: 2
    };
}

function getVisualValue(value) {
    var number = getIndicatorNumericValue(value, expressed);
    if (!Number.isFinite(number)) return 0;
    return isIndicatorVariable(expressed)
        ? number * getIndicatorDisplayConfig(expressed).factor
        : number;
}

function formatVisualValue(value, attribute) {
    var number = Number(value);
    if (!Number.isFinite(number)) {
        return value === null || value === undefined || String(value).trim() === ""
            ? "—"
            : String(value);
    }
    var config = getIndicatorDisplayConfig(attribute || expressed);
    var scaled = number * config.factor;
    return scaled.toLocaleString(undefined, {
        minimumFractionDigits: config.decimals,
        maximumFractionDigits: config.decimals
    });
}

function formatIndicatorLegendValue(value, attribute) {
    var categories = indicatorCategoryScores[attribute || expressed];
    if (categories) {
        var category = Object.keys(categories).find(function(label) {
            return categories[label] === value;
        });
        if (category) return category;
    }
    return formatVisualValue(value, attribute);
}

function getIndicatorUnit(attribute) {
    return getIndicatorDisplayConfig(attribute).unit;
}

function getJenksBreaks(values, requestedClasses) {
    var sorted = values.slice().sort(function(a, b) { return a - b; });
    var unique = sorted.filter(function(value, index) {
        return index === 0 || value !== sorted[index - 1];
    });
    var classCount = Math.max(1, Math.min(requestedClasses, unique.length));
    var n = sorted.length;
    var lowerClassLimits = [];
    var varianceCombinations = [];

    for (var row = 0; row <= n; row += 1) {
        lowerClassLimits[row] = [];
        varianceCombinations[row] = [];
        for (var column = 0; column <= classCount; column += 1) {
            lowerClassLimits[row][column] = 0;
            varianceCombinations[row][column] = Infinity;
        }
    }

    for (var classes = 1; classes <= classCount; classes += 1) {
        lowerClassLimits[0][classes] = 1;
        varianceCombinations[0][classes] = 0;
    }

    for (var length = 1; length <= n; length += 1) {
        var sum = 0;
        var sumSquares = 0;
        var width = 0;
        var variance = 0;

        for (var member = 1; member <= length; member += 1) {
            var index = length - member;
            var value = sorted[index];
            width += 1;
            sum += value;
            sumSquares += value * value;
            variance = sumSquares - (sum * sum) / width;
            var previous = index;

            if (previous !== 0) {
                for (var candidateClass = 2; candidateClass <= classCount; candidateClass += 1) {
                    var candidateVariance = variance + varianceCombinations[previous][candidateClass - 1];
                    if (varianceCombinations[length][candidateClass] >= candidateVariance) {
                        lowerClassLimits[length][candidateClass] = index + 1;
                        varianceCombinations[length][candidateClass] = candidateVariance;
                    }
                }
            }
        }

        lowerClassLimits[length][1] = 1;
        varianceCombinations[length][1] = variance;
    }

    var breaks = new Array(classCount + 1);
    breaks[classCount] = sorted[n - 1];
    var remaining = n;
    for (var breakClass = classCount; breakClass > 1; breakClass -= 1) {
        var lowerLimit = lowerClassLimits[remaining][breakClass] - 1;
        breaks[breakClass - 1] = sorted[lowerLimit];
        remaining = lowerClassLimits[remaining][breakClass] - 1;
    }
    breaks[0] = sorted[0];

    // Duplicate values can produce repeated limits. Keep the scale monotonic.
    for (var breakIndex = 1; breakIndex < breaks.length; breakIndex += 1) {
        breaks[breakIndex] = Math.max(breaks[breakIndex], breaks[breakIndex - 1]);
    }
    return breaks;
}

function getIndicatorClassification(data) {
    if (!isJenksVariable(expressed)) return null;

    var values = data.map(function(d) {
        return getIndicatorNumericValue(d[expressed], expressed);
    }).filter(Number.isFinite);
    if (!values.length) return null;

    var breaks = getJenksBreaks(values, indicatorClassColors.length).filter(function(value, index, all) {
        return index === 0 || value > all[index - 1];
    });
    return {
        breaks: breaks,
        colors: indicatorClassColors.slice(0, breaks.length - 1)
    };
}

function getVisualizationColorScale(data) {
    if (isChoroplethMode()) {
        return getIndicatorColorScale(data);
    }
    return function() {
        return "#0da982";
    };
}

function getIndicatorDomain(data) {
    var values = data.map(function(d) {
        return getIndicatorNumericValue(d[expressed], expressed);
    }).filter(Number.isFinite);
    var minValue = values.length ? d3.min(values) : 0;
    var maxValue = values.length ? d3.max(values) : 1;
    if (minValue === maxValue) {
        maxValue = minValue + 1;
    }
    return [minValue, maxValue];
}

function getIndicatorColorScale(data) {
    var classification = getIndicatorClassification(data);
    if (classification) {
        return d3.scaleThreshold()
            .domain(classification.breaks.slice(1, -1))
            .range(classification.colors);
    }

    var domain = getIndicatorDomain(data);
    return d3.scaleLinear()
        .domain(domain)
        .range(["#cfe8c6", "#238b45"])
        .clamp(true);
}

function getSizeScale(data) {
    var maxValue = d3.max(data, function(d) {
        return getIndicatorNumericValue(d[expressed], expressed) || 0;
    }) || 1;

    return d3.scaleSqrt().domain([0, maxValue]).range([0, 31]);
}

function getInsetSizeScale(data) {
    var maxValue = d3.max(data, function(d) {
        return getIndicatorNumericValue(d[expressed], expressed) || 0;
    }) || 1;

    return d3.scaleSqrt().domain([0, maxValue]).range([1.5, 10]);
}
