// chart.js - the ranking view shares the exact state records used by the map

function getFilteredCodes(data) {
    var sorted = data.slice().sort(function(a, b) {
        return (getIndicatorNumericValue(b[expressed], expressed) || 0) -
            (getIndicatorNumericValue(a[expressed], expressed) || 0);
    });

    var countByScope = { top10: 10, top20: 20, bottom10: 10 };
    var count = countByScope[rankingScope];
    var scopedData = rankingScope === "bottom10"
        ? sorted.slice(-count)
        : count ? sorted.slice(0, count) : sorted;

    return new Set(scopedData.map(function(d) { return d.State_Code; }));
}

function updateRankingHeading() {
    var heading = document.getElementById("rankingHeading");
    if (!heading) return;

    heading.textContent = "State Ranking: " + getDisplayName(expressed) + " (All 51 States)";
}

function formatRankingValue(record) {
    if (isIndicatorVariable(expressed)) {
        return formatVisualValue(record[expressed], expressed);
    }
    var number = Number(record[expressed]);
    return Number.isFinite(number) ? Math.round(number).toLocaleString() : "—";
}

function updateTopStates(data) {
    var list = d3.select("#topStatesList");
    if (list.empty()) return;

    var topStates = data.slice().sort(function(a, b) {
        return (getIndicatorNumericValue(b[expressed], expressed) || 0) -
            (getIndicatorNumericValue(a[expressed], expressed) || 0);
    }).slice(0, 5);

    list.selectAll("li").remove();
    topStates.forEach(function(record, index) {
        var item = list.append("li");
        item.append("span").attr("class", "top-state-rank").text(index + 1);
        item.append("span").attr("class", "top-state-name")
            .text(record.State + " (" + record.State_Code + ")");
        item.append("strong").attr("class", "top-state-value")
            .text(formatRankingValue(record));
    });
}

function setChart(data) {
    currentStateData = data;
    d3.select(".chart-container").selectAll("svg.chart").remove();

    var container = document.querySelector(".chart-container");
    var width = Math.max(1, container.clientWidth || 900);
    var height = Math.max(1, container.clientHeight || chartHeight);
    var innerWidth = width - chartMargins.left - chartMargins.right;
    var innerHeight = height - chartMargins.top - chartMargins.bottom;
    var sortedData = data.slice().sort(function(a, b) {
        return (getIndicatorNumericValue(b[expressed], expressed) || 0) -
            (getIndicatorNumericValue(a[expressed], expressed) || 0);
    });

    var xScale = d3.scaleBand()
        .domain(sortedData.map(function(d) { return d.State_Code; }))
        .range([0, innerWidth])
        .padding(0.12);
    var maxValue = d3.max(sortedData, function(d) {
        return getVisualValue(d[expressed]);
    }) || 1;
    var yScale = d3.scaleLinear().domain([0, maxValue]).nice().range([innerHeight, 0]);

    var chart = d3.select(".chart-container").append("svg")
        .attr("class", "chart")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");
    var plot = chart.append("g")
        .attr("transform", `translate(${chartMargins.left},${chartMargins.top})`);

    plot.append("g").attr("class", "axis y-axis").call(d3.axisLeft(yScale).ticks(5));
    plot.append("g").attr("class", "axis x-axis")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).tickSizeOuter(0));
    plot.append("rect").attr("class", "chartFrame")
        .attr("width", innerWidth).attr("height", innerHeight);

    // Use the same scale as the active map mode: the Bubble Map's teal for
    // species variables, and the Choropleth Map's indicator gradient for
    // environmental variables.
    var colorScale = getVisualizationColorScale(data);
    plot.selectAll(".bars").data(sortedData).enter().append("rect")
        .attr("class", function(d) { return "bars state-" + d.State_Code; })
        .attr("x", function(d) { return xScale(d.State_Code); })
        .attr("width", xScale.bandwidth())
        .attr("y", function(d) { return yScale(getVisualValue(d[expressed])); })
        .attr("height", function(d) { return innerHeight - yScale(getVisualValue(d[expressed])); })
        .style("fill", function(d) {
            return colorScale(getIndicatorNumericValue(d[expressed], expressed) || 0);
        })
        .on("click", function(event, d) { updatePanel(d); })
        .on("mouseover", function(event, d) { highlight(d); setLabel(d); })
        .on("mouseout", function(event, d) { dehighlight(d); })
        .on("mousemove", function(event) { moveLabel(event); });

    updateChartFilter(data);
    updateRankingHeading();
    updateTopStates(data);
}

function updateChartFilter(data) {
    var activeCodes = getFilteredCodes(data);
    var scopeActive = rankingScope !== "all";
    var queryActive = typeof isAIQueryActive === "function" && isAIQueryActive();
    var queryCodes = typeof getAIQueryMatchedCodes === "function"
        ? getAIQueryMatchedCodes()
        : new Set();
    d3.selectAll(".bars")
        .classed("filter-active", function(d) {
            return scopeActive && activeCodes.has(d.State_Code);
        })
        .classed("filter-muted", function(d) {
            return scopeActive && !activeCodes.has(d.State_Code);
        })
        .classed("ai-query-match", function(d) {
            return queryActive && queryCodes.has(d.State_Code);
        })
        .classed("ai-query-nonmatch", function(d) {
            return queryActive && !queryCodes.has(d.State_Code);
        });
}

var chartResizeFrame;
window.addEventListener("resize", function() {
    if (!currentStateData.length) return;
    window.cancelAnimationFrame(chartResizeFrame);
    chartResizeFrame = window.requestAnimationFrame(function() {
        setChart(currentStateData);
    });
});
