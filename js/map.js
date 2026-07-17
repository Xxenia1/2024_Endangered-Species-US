// map.js - shared-state Bubble Map and spatial interactions

function getRecordCode(record) {
    return "state-" + record.State_Code;
}

function formatBubbleValue(value, attribute) {
    if (attribute === "Species_Density") {
        return formatVisualValue(value, attribute);
    }
    var number = Number(value);
    return Number.isFinite(number) ? Math.round(number).toLocaleString() : "—";
}

function formatMapValue(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) {
        return isIndicatorVariable(expressed) ? formatVisualValue(value, expressed) : "—";
    }
    return isIndicatorVariable(expressed)
        ? formatVisualValue(number, expressed)
        : formatBubbleValue(number);
}

function highlight(record) {
    d3.selectAll("." + getRecordCode(record)).classed("is-highlighted", true);
}

function dehighlight(record) {
    if (record) {
        d3.selectAll("." + getRecordCode(record)).classed("is-highlighted", false);
    }
    d3.select(".infolabel").remove();
}

function setLabel(record) {
    d3.select(".infolabel").remove();
    var label = d3.select("body").append("div")
        .attr("class", "infolabel")
        .attr("id", record.State_Code + "_label");

    label.append("strong").text(record.State);
    label.append("span").text(
        getDisplayName(expressed) + ": " + formatMapValue(record[expressed])
    );
}

function moveLabel(event) {
    var label = d3.select(".infolabel");
    if (label.empty()) return;

    var labelWidth = label.node().getBoundingClientRect().width;
    var x = event.clientX + 14;
    if (x + labelWidth > window.innerWidth - 12) {
        x = event.clientX - labelWidth - 14;
    }

    label.style("left", x + "px").style("top", (event.clientY + 14) + "px");
}

function addMapPointerEvents(selection) {
    selection
        .on("click", function(event, feature) {
            updatePanel(feature.properties || feature);
        })
        .on("mouseover", function(event, feature) {
            var record = feature.properties || feature;
            highlight(record);
            setLabel(record);
        })
        .on("mouseout", function(event, feature) {
            dehighlight(feature.properties || feature);
        })
        .on("mousemove", function(event) {
            moveLabel(event);
        });
}

function calculateBubblePositions(features, path, sizeScale) {
    var nodes = features.map(function(feature) {
        var centroid = path.centroid(feature);
        var value = getIndicatorNumericValue(feature.properties[expressed], expressed) || 0;
        return {
            feature: feature,
            baseX: centroid[0],
            baseY: centroid[1],
            x: centroid[0],
            y: centroid[1],
            radius: value > 0 ? sizeScale(value) : 0
        };
    });

    d3.forceSimulation(nodes)
        .force("x", d3.forceX(function(d) { return d.baseX; }).strength(0.48))
        .force("y", d3.forceY(function(d) { return d.baseY; }).strength(0.48))
        .force("collide", d3.forceCollide(function(d) {
            return d.radius + 2;
        }).iterations(4))
        .stop()
        .tick(120);

    nodes.forEach(function(node) {
        node.feature.properties._bubbleX = node.x;
        node.feature.properties._bubbleY = node.y;
        node.feature.properties._bubbleRadius = node.radius;
    });
}

function updateMapLegend(data, sizeScale, colorScale) {
    updateVariablePresentation();
    var legend = d3.select("#map-legend");

    legend.selectAll("*").remove();
    legend.append("div").attr("class", "legend-title").text(getDisplayName(expressed));

    if (isChoroplethMode()) {
        legend.append("div").attr("class", "legend-section-title")
            .text("Color = " + getIndicatorUnit(expressed));

        var classification = getIndicatorClassification(data);
        if (classification) {
            legend.append("div").attr("class", "legend-method")
                .text("Natural Breaks (Jenks)");
            var classList = legend.append("div").attr("class", "legend-color-classes");
            classification.colors.forEach(function(color, index) {
                var row = classList.append("div").attr("class", "legend-color-class");
                row.append("span").attr("class", "legend-color-class-swatch")
                    .style("background-color", color);
                var lower = formatVisualValue(classification.breaks[index], expressed);
                var upper = formatVisualValue(classification.breaks[index + 1], expressed);
                row.append("span").text(
                    index === classification.colors.length - 1
                        ? "≥ " + lower
                        : lower + " – " + upper
                );
            });
            return;
        }

        var domain = getIndicatorDomain(data);
        var colorLegend = legend.append("div").attr("class", "legend-color-scale");
        colorLegend.append("div").attr("class", "legend-color-gradient")
            .style("background", "linear-gradient(90deg, #cfe8c6, #238b45)");
        var colorLabels = colorLegend.append("div").attr("class", "legend-color-labels");
        colorLabels.append("span").text(formatIndicatorLegendValue(domain[0], expressed));
        colorLabels.append("span").text(formatIndicatorLegendValue(domain[1], expressed));
        return;
    }

    var maxValue = d3.max(data, function(d) {
        return getIndicatorNumericValue(d[expressed], expressed) || 0;
    }) || 0;
    var samples = [0.25, 0.6, 1].map(function(fraction) {
        return maxValue * fraction;
    });

    legend.append("div").attr("class", "legend-section-title")
        .text("Bubble size = selected species variable");

    var list = legend.append("div").attr("class", "legend-size-scale");
    samples.forEach(function(value) {
        var row = list.append("div").attr("class", "legend-size-item");
        row.append("span").attr("class", "legend-size-swatch")
            .append("span").attr("class", "legend-size-circle")
            .style("width", Math.max(8, sizeScale(value) * 0.72) + "px")
            .style("height", Math.max(8, sizeScale(value) * 0.72) + "px")
            .style("background-color", "#0da982");
        row.append("span").text(formatBubbleValue(value, expressed));
    });
}

function applyIndicatorColors(selection, colorScale) {
    selection.style("fill", function(d) {
        var record = d.properties || d;
        var value = getIndicatorNumericValue(record[expressed], expressed);
        return Number.isFinite(value) ? colorScale(value) : "#e5ebe7";
    });
}

function resetRegionColors(selection) {
    selection.style("fill", null);
}

function renderMainBubbles(features, mapLayer, path, sizeScale) {
    calculateBubblePositions(features, path, sizeScale);

    var symbols = mapLayer.selectAll(".symbol")
        .data(features, function(d) { return d.properties.State; });
    symbols.exit().remove();

    var entered = symbols.enter().append("circle")
        .attr("class", function(d) {
            return "symbol state-mark " + getRecordCode(d.properties);
        })
        .style("fill", "#0da982")
        .style("fill-opacity", 0.72);
    addMapPointerEvents(entered);

    entered.merge(symbols)
        .attr("cx", function(d) { return d.properties._bubbleX; })
        .attr("cy", function(d) { return d.properties._bubbleY; })
        .attr("r", function(d) { return d.properties._bubbleRadius; });
}

function createDropdown(data, onChange) {
    var container = d3.select(".dropdown-container");
    container.selectAll("select").remove();

    var dropdown = container.append("select")
        .attr("class", "dropdown")
        .attr("aria-label", "Display variable")
        .on("change", function() {
            expressed = this.value;
            onChange();
        });

    dropdown.selectAll("option").data(getVariablesForMode(analysisMode)).enter().append("option")
        .attr("value", function(d) { return d; })
        .property("selected", function(d) { return d === expressed; })
        .text(function(d) { return getDisplayName(d); });

    var help = document.getElementById("variableHelp");
    if (help) help.textContent = getModeHelp(analysisMode);
    updateVariablePresentation();
}

function updateVariablePresentation() {
    var title = getDisplayName(expressed);
    var isChoropleth = isChoroplethMode();
    var heading = document.getElementById("mapHeading");
    var subheading = document.getElementById("mapSubheading");
    var info = document.getElementById("variableInfoText");
    var topStatesVariable = document.getElementById("topStatesVariable");

    if (heading) heading.textContent = title;
    if (subheading) {
        subheading.textContent = isChoropleth
            ? "Color intensity represents the selected indicator value."
            : "Bubble size represents the selected species variable.";
    }
    if (info) {
        info.textContent = isChoropleth
            ? "Darker color indicates a higher indicator value."
            : "Each circle represents the selected species variable.";
    }
    if (topStatesVariable) topStatesVariable.textContent = title;
}

function createAnalysisModeControl(data, onChange) {
    var selector = document.getElementById("analysisMode");
    if (!selector) return;

    function setMode(mode) {
        if (!analysisModes[mode]) return;
        analysisMode = mode;
        selector.value = mode;
        expressed = getVariablesForMode(analysisMode)[0];
        d3.selectAll(".mode-option").classed("is-active", function() {
            return this.getAttribute("data-analysis-mode") === mode;
        });
        createDropdown(data, onChange);
        onChange();
    }

    selector.value = analysisMode;
    selector.addEventListener("change", function() {
        setMode(this.value);
    });

    d3.selectAll("[data-analysis-mode]").on("click", function() {
        setMode(this.getAttribute("data-analysis-mode"));
    });
    d3.selectAll(".mode-option").classed("is-active", function() {
        return this.getAttribute("data-analysis-mode") === analysisMode;
    });
}

function createRankingScopeFilter(data) {
    var selector = document.getElementById("rankingScope");
    selector.onchange = function() {
        rankingScope = this.value;
        updateMapFilter(data);
        updateChartFilter(data);
    };
}

function updateMapFilter(data) {
    var activeCodes = getFilteredCodes(data);
    var scopeActive = rankingScope !== "all";

    d3.selectAll(".state-mark, .regions").classed("filter-active", function(d) {
        var record = d.properties || d;
        return scopeActive && activeCodes.has(record.State_Code);
    }).classed("filter-muted", function(d) {
        var record = d.properties || d;
        return scopeActive && !activeCodes.has(record.State_Code);
    });
}

function normalizeStateQuery(value) {
    return value.trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
}

function setMap() {
    var mapElement = document.getElementById("map");
    var width = mapElement.clientWidth || 900;
    var height = mapElement.clientHeight || 620;
    var svg = d3.select("#map").append("svg").attr("class", "map")
        .attr("viewBox", "0 0 " + width + " " + height)
        .attr("preserveAspectRatio", "xMidYMid meet");
    var mapLayer = svg.append("g").attr("class", "map-layer");

    // Keep the fitted map as the reset view, while allowing three zoom-out steps.
    var zoom = d3.zoom().scaleExtent([0.4, 4]).on("zoom", function(event) {
        mapLayer.attr("transform", event.transform);
    });
    svg.call(zoom);

    function resetMap() {
        svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
    }
    function zoomBy(factor) {
        svg.transition().duration(250).call(zoom.scaleBy, factor);
    }
    document.getElementById("resetMap").addEventListener("click", resetMap);
    var fitUsButton = document.getElementById("fitUs");
    if (fitUsButton) fitUsButton.addEventListener("click", resetMap);
    document.getElementById("zoomIn").addEventListener("click", function() { zoomBy(1.45); });
    document.getElementById("zoomOut").addEventListener("click", function() { zoomBy(1 / 1.45); });

    var searchContainer = document.querySelector(".search-container");
    var stateSearch = document.createElement("input");
    stateSearch.type = "text";
    stateSearch.id = "stateSearch";
    stateSearch.placeholder = "Search any state or abbreviation (e.g., WV)";
    searchContainer.appendChild(stateSearch);
    var searchButton = document.createElement("button");
    searchButton.id = "searchButton";
    searchButton.textContent = "Search";
    searchContainer.appendChild(searchButton);

    Promise.all([
        d3.json("data/final_data.geojson"),
        d3.csv("data/research_dataset.csv")
    ]).then(function(data) {
        var geojson = data[0];
        var researchByState = new Map(data[1].map(function(row) {
            return [row.State, row];
        }));
        var categoryData = geojson.species_categories || {};

        currentStateFeatures = geojson.features.map(function(feature) {
            var stateName = feature.properties.State;
            var record = Object.assign(
                {},
                feature.properties,
                researchByState.get(stateName) || {},
                categoryData[stateName] || {}
            );
            record.State = stateName;
            record.State_Code = getStateCode(stateName);
            feature.properties = record;
            return feature;
        });
        currentStateData = currentStateFeatures.map(function(feature) {
            return feature.properties;
        });

        var unmatched = currentStateData.filter(function(record) {
            return !researchByState.has(record.State);
        });
        if (unmatched.length) {
            console.warn("State records missing from research_dataset.csv:", unmatched);
        }

        var stateCollection = {
            type: "FeatureCollection",
            features: currentStateFeatures
        };
        var projection = d3.geoAlbersUsa().fitExtent(
            [[18, 26], [width - 18, height - 20]],
            stateCollection
        );
        var path = d3.geoPath().projection(projection);

        var regions = mapLayer.selectAll(".regions").data(currentStateFeatures).enter()
            .append("path")
            .attr("class", function(d) {
                return "regions " + getRecordCode(d.properties);
            })
            .attr("d", path);
        addMapPointerEvents(regions);

        function renderDashboard() {
            var sizeScale = getSizeScale(currentStateData);
            var indicatorMode = isChoroplethMode();
            var colorScale = getVisualizationColorScale(currentStateData);

            mapLayer.selectAll(".symbol").remove();
            if (indicatorMode) {
                applyIndicatorColors(mapLayer.selectAll(".regions"), colorScale);
            } else {
                resetRegionColors(mapLayer.selectAll(".regions"));
                renderMainBubbles(currentStateFeatures, mapLayer, path, sizeScale);
            }
            updateMapLegend(currentStateData, sizeScale, colorScale);
            setChart(currentStateData);
            updateMapFilter(currentStateData);
        }

        createAnalysisModeControl(currentStateData, renderDashboard);
        createDropdown(currentStateData, renderDashboard);
        createRankingScopeFilter(currentStateData);
        renderDashboard();

        var stateSuggestions = document.createElement("datalist");
        stateSuggestions.id = "stateSuggestions";
        searchContainer.appendChild(stateSuggestions);
        stateSearch.setAttribute("list", stateSuggestions.id);

        var stateIndex = new Map();
        currentStateFeatures.forEach(function(feature) {
            var record = feature.properties;
            var fullNameOption = document.createElement("option");
            fullNameOption.value = record.State;
            fullNameOption.label = record.State_Code;
            stateSuggestions.appendChild(fullNameOption);

            var abbreviationOption = document.createElement("option");
            abbreviationOption.value = record.State_Code;
            abbreviationOption.label = record.State;
            stateSuggestions.appendChild(abbreviationOption);

            stateIndex.set(normalizeStateQuery(record.State), feature);
            stateIndex.set(normalizeStateQuery(record.State_Code), feature);
        });

        ["washington dc", "washington d c", "district columbia"].forEach(function(alias) {
            stateIndex.set(alias, stateIndex.get("district of columbia"));
        });

        function searchForState() {
            var query = normalizeStateQuery(stateSearch.value);
            var feature = stateIndex.get(query);
            if (!feature) {
                alert("State not found. Use any full state name or postal abbreviation, such as WV or AK.");
                return;
            }

            updatePanel(feature.properties);
            var bounds = path.bounds(feature);
            var x = (bounds[0][0] + bounds[1][0]) / 2;
            var y = (bounds[0][1] + bounds[1][1]) / 2;
            var scale = 2.2;
            svg.transition().duration(550).call(
                zoom.transform,
                d3.zoomIdentity
                    .translate(width / 2 - scale * x, height / 2 - scale * y)
                    .scale(scale)
            );
        }

        searchButton.addEventListener("click", searchForState);
        stateSearch.addEventListener("keydown", function(event) {
            if (event.key === "Enter") searchForState();
        });
    }).catch(function(error) {
        console.error("Dashboard data could not be loaded:", error);
        d3.select("#map").append("p").attr("class", "data-error")
            .text("The dashboard data could not be loaded.");
    });
}
