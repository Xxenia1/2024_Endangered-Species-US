// chart.js

function getDisplayName(attribute) {
    var names = {
        "Grand Total": "Species Count"
    };

    return names[attribute] || attribute;
}

function getFilteredCodes(csvData) {
    var sorted = csvData.slice().sort(function(a, b) {
        return (+b[expressed] || 0) - (+a[expressed] || 0);
    });

    if (rankingScope === "top10") {
        return new Set(
            sorted.slice(0, 10).map(function(d) {
                return d.adm1_code;
            })
        );
    }

    if (rankingScope === "top20") {
        return new Set(
            sorted.slice(0, 20).map(function(d) {
                return d.adm1_code;
            })
        );
    }

    if (rankingScope === "bottom10") {
        return new Set(
            sorted.slice(-10).map(function(d) {
                return d.adm1_code;
            })
        );
    }

    return new Set(
        sorted.map(function(d) {
            return d.adm1_code;
        })
    );
}

function isScopeActive() {
    return rankingScope !== "all";
}

function setChart(csvData, colorScale) {
    currentCsvData = csvData;

    d3.select(".chart-container")
        .selectAll("svg.chart")
        .remove();

    var container =
        document.querySelector(".chart-container");

    var chartWidth =
        Math.max(1, container.clientWidth || 900);

    var responsiveChartHeight =
        Math.max(1, container.clientHeight || chartHeight);

    var innerWidth =
        chartWidth -
        chartMargins.left -
        chartMargins.right;

    var innerHeight =
        responsiveChartHeight -
        chartMargins.top -
        chartMargins.bottom;

    var sortedData =
        csvData.slice().sort(function(a, b) {
            return (+b[expressed] || 0) -
                   (+a[expressed] || 0);
        });

    var xScale = d3.scaleBand()
        .domain(
            sortedData.map(function(d) {
                return d.adm1_code;
            })
        )
        .range([0, innerWidth])
        .padding(0.12);

    var maxValue =
        d3.max(sortedData, function(d) {
            return +d[expressed] || 0;
        }) || 1;

    var yScale = d3.scaleLinear()
        .domain([0, maxValue])
        .nice()
        .range([innerHeight, 0]);

    var chart = d3.select(".chart-container")
        .append("svg")
        .attr("class", "chart")
        .attr(
            "viewBox",
            `0 0 ${chartWidth} ${responsiveChartHeight}`
        )
        .attr(
            "preserveAspectRatio",
            "xMidYMid meet"
        );

    var plot = chart.append("g")
        .attr(
            "transform",
            `translate(${chartMargins.left},${chartMargins.top})`
        );

    plot.append("g")
        .attr("class", "axis y-axis")
        .call(
            d3.axisLeft(yScale)
                .ticks(5)
        );

    plot.append("g")
        .attr("class", "axis x-axis")
        .attr(
            "transform",
            `translate(0,${innerHeight})`
        )
        .call(
            d3.axisBottom(xScale)
                .tickSizeOuter(0)
        )
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    plot.append("rect")
        .attr("class", "chartFrame")
        .attr("width", innerWidth)
        .attr("height", innerHeight);

    var bars = plot.selectAll(".bars")
        .data(sortedData)
        .enter()
        .append("rect")
        .attr("class", function(d) {
            return "bars " + d.adm1_code;
        })
        .attr("x", function(d) {
            return xScale(d.adm1_code);
        })
        .attr("width", xScale.bandwidth())
        .attr("y", function(d) {
            return yScale(+d[expressed] || 0);
        })
        .attr("height", function(d) {
            return innerHeight -
                yScale(+d[expressed] || 0);
        })
        .style("fill", function(d) {
            return colorScale(+d[expressed] || 0);
        })
        .on("mouseover", function(event, d) {
            highlight(d);
        })
        .on("mouseout", function(event, d) {
            dehighlight(d);
        })
        .on("mousemove", moveLabel);

    bars.append("desc")
        .text(
            '{"stroke":"none","stroke-width":"0px"}'
        );

    updateChartFilter(csvData);
    updateRankingHeading();
}

function updateChart(bars, n, colorScale) {
    setChart(currentCsvData, colorScale);
}

function updateRankingHeading() {
    var heading =
        document.getElementById("rankingHeading");

    if (!heading) {
        return;
    }

    var scopeText = {
        all: "All 51 States",
        top10: "Top 10 Highlighted",
        top20: "Top 20 Highlighted",
        bottom10: "Bottom 10 Highlighted"
    };

    heading.textContent =
        "State Ranking: " +
        getDisplayName(expressed) +
        " (" +
        scopeText[rankingScope] +
        ")";
}

function updateChartFilter(csvData) {
    var activeCodes = getFilteredCodes(csvData);
    var scopeActive = isScopeActive();

    d3.selectAll(".bars")
        .classed("filter-active", function(d) {
            return !scopeActive ||
                activeCodes.has(d.adm1_code);
        })
        .classed("filter-muted", function(d) {
            return scopeActive &&
                !activeCodes.has(d.adm1_code);
        });

    updateRankingHeading();
}

var chartResizeFrame;

window.addEventListener("resize", function() {
    if (!currentCsvData.length) {
        return;
    }

    window.cancelAnimationFrame(chartResizeFrame);
    chartResizeFrame = window.requestAnimationFrame(function() {
        setChart(
            currentCsvData,
            makeColorScale(currentCsvData)
        );
    });
});
