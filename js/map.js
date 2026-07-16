// map.js - 地图与空间模块（定义地图绘制、投影、符号、下拉菜单切换等）

// ---- 地图辅助函数 ----

function setGraticule(map, path){
    var graticule = d3.geoGraticule()
        .step([10, 10]);
    var gratBackground = map.append("path")
        .datum(graticule.outline())
        .attr("class", "gratBackground")
        .attr("d", path);
    var gratLines = map.selectAll(".gratLines")
        .data(graticule.lines())
        .enter()
        .append("path")
        .attr("class", "gratLines")
        .attr("d", path);
}

function joinData(usStates, csvData){
    for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i];
        var csvKey = csvRegion.adm1_code;
        for (var a=0; a<usStates.length; a++){
            var geojsonProps = usStates[a].properties;
            var geojsonKey = geojsonProps.adm1_code;
            if (geojsonKey == csvKey){
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]);
                    geojsonProps[attr] = val;
                });
            }
        }
    }
    return usStates;
}

// 绘制各州（点击时使用 csvSpecies 更新面板）
function setEnumerationUnits(usStates, map, path, csvSpecies){
    var state = map.selectAll(".regions")
        .data(usStates)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "regions " + d.properties.adm1_code;
        })
        .attr("d", path)        
        .style("fill", "#D3D3D3")
        .style("stroke", "#FFFFFF")
        .style("stroke-width", "1px")
        .on("click", function(event, d) {
            var currentStateCode = d.properties.adm1_code;
            var speciesInState = csvSpecies.filter(function(row) {
                return row.adm1_code === currentStateCode;
            });
            var clickedStateName = d.properties.name;
            updatePanel(speciesInState, clickedStateName);
        })
        .on("mouseover", function(event, d){
            highlight(d.properties);
        })
        .on("mouseout", function(event, d){
            dehighlight(d.properties);
        })
        .on("mousemove", moveLabel);
    var desc = state.append("desc")
        .text('{"stroke": "#FFF", "stroke-width": "0.5px"}');
}

function setProportionalSymbols(usStates, map, path, sizeScale){
    usStates.forEach(function(d) {
        d.properties.centroid = path.centroid(d);
    });
    var symbols = map.selectAll(".symbol")
        .data(usStates)
        .enter()
        .append("circle")
        .attr("class", "symbol")
        .attr("cx", function(d) { return d.properties.centroid[0]; })
        .attr("cy", function(d) { return d.properties.centroid[1]; })
        .attr("r", function(d) {
            var value = d.properties[expressed];
            return value ? sizeScale(value) : 0;
        })
        .style("fill", "#008866")
        .style("opacity", 0.6);
}

// ---- 高亮与标签 ----

function highlight(props){
    var selected = d3.selectAll("." + props.adm1_code)
        .style("stroke", "black")
        .style("stroke-width", "2");
    setLabel(props)
}

function dehighlight(props) {
    if (!props || !props.adm1_code) {
        d3.select(".infolabel").remove();
        return;
    }

    d3.selectAll("." + props.adm1_code)
        .each(function() {
            var element = d3.select(this);
            var descNode = element.select("desc").node();

            /*
             * 主地图旧元素如果存在 desc，
             * 就按照原来的样式记录恢复。
             */
            if (descNode && descNode.textContent) {
                try {
                    var styleObject = JSON.parse(descNode.textContent);

                    if (styleObject.stroke !== undefined) {
                        element.style("stroke", styleObject.stroke);
                    }

                    if (styleObject["stroke-width"] !== undefined) {
                        element.style(
                            "stroke-width",
                            styleObject["stroke-width"]
                        );
                    }

                    return;
                } catch (error) {
                    console.warn(
                        "Could not restore stored element style:",
                        error
                    );
                }
            }

            if (element.classed("inset-region")) {
                element
                    .style("stroke", "#ffffff")
                    .style("stroke-width", "1px");
            } else if (element.classed("inset-symbol")) {
                element
                    .style("stroke", "#ffffff")
                    .style("stroke-width", "0.6px");
            } else if (element.classed("regions")) {
                element
                    .style("stroke", "#ffffff")
                    .style("stroke-width", "0.9px");
            } else if (element.classed("symbol")) {
                element
                    .style("stroke", "none")
                    .style("stroke-width", "0px");
            }
        });

    d3.select(".infolabel").remove();
}

function setLabel(props){
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.adm1_code + "_label")
        .html(labelAttribute);
    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.name);
}

function moveLabel(){
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;
    var x1 = event.clientX + 10,
        y1 = event.clientY - 75,
        x2 = event.clientX - labelWidth - 10,
        y2 = event.clientY + 25;
    var x = event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    var y = event.clientY < 75 ? y2 : y1; 
    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
}

// ---- 下拉菜单与属性切换 ----

function createDropdown(csvData){
    var dropdown = d3.select(".dropdown-container")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });

    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
}

function changeAttribute(attribute, csvData) {
    // 更新当前变量
    expressed = attribute;

    // 保存当前数据
    currentCsvData = csvData;

    // 重新生成比例尺
    var colorScale = makeColorScale(csvData);
    var sizeScale = getSizeScale(csvData);
    var insetSizeScale = getInsetSizeScale(csvData);

    // =========================
    // 更新主地图气泡
    // =========================

    d3.selectAll(".symbol")
        .transition()
        .duration(700)
        .attr("r", function(d) {
            var value = Number(d.properties[expressed]);

            if (!Number.isFinite(value) || value <= 0) {
                return 0;
            }

            return sizeScale(value);
        })
        .style("fill", function(d) {
            var value = Number(d.properties[expressed]);

            if (!Number.isFinite(value)) {
                return "#cccccc";
            }

            return colorScale(value);
        });

    // =========================
    // 更新东北局部图气泡
    // =========================

    d3.selectAll(".inset-symbol")
        .transition()
        .duration(700)
        .attr("r", function(d) {
            var value = Number(d.properties[expressed]);

            if (!Number.isFinite(value) || value <= 0) {
                return 0;
            }

            return insetSizeScale(value);
        })
        .style("fill", function(d) {
            var value = Number(d.properties[expressed]);

            if (!Number.isFinite(value)) {
                return "#cccccc";
            }

            return colorScale(value);
        });

    // =========================
    // 更新地图图例标题
    // =========================

    var legendTitle = document.querySelector(
        "#map-legend .legend-title"
    );

    if (legendTitle) {
        legendTitle.textContent = getDisplayName(expressed);
    }

    // =========================
    // 重新绘制完整51州图表
    // =========================

    setChart(csvData, colorScale);

    // =========================
    // 重新应用当前Top/Bottom筛选
    // =========================

    if (typeof updateMapFilter === "function") {
        updateMapFilter(csvData);
    }

    if (typeof updateChartFilter === "function") {
        updateChartFilter(csvData);
    }
}

// ---- 主地图函数（由 main.js 调用） ----

function setMap(){
    var mapElement =
        document.getElementById("map");

    var width =
        mapElement.clientWidth || 900;

    var height =
        mapElement.clientHeight || 620;

    var map = d3.select("#map")
        .append("svg")
        .attr("class", "map")
        .attr(
            "viewBox",
            `0 0 ${width} ${height}`
        )
        .attr(
            "preserveAspectRatio",
            "xMidYMid meet"
        );
    // 缩放
    var zoom = d3.zoom()
        .scaleExtent([1,3])
        .on("zoom", function(event) {
            map.selectAll("path, circle")
                .attr("transform", event.transform);
        });
    map.call(zoom);

    // 重置按钮
    function resetMap() {
        map.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity);
    }
    document.getElementById('resetMap').addEventListener('click', resetMap);

    // 搜索框
    var searchContainer = document.querySelector(".search-container");
    var stateSearch = document.createElement("input");
    stateSearch.setAttribute("type", "text");
    stateSearch.setAttribute("id", "stateSearch");
    stateSearch.setAttribute("placeholder", "Search for a state");
    searchContainer.appendChild(stateSearch);

    var searchButton = document.createElement("button");
    searchButton.innerHTML = "Search";
    searchButton.setAttribute("id", "searchButton");
    searchContainer.appendChild(searchButton);

    // 投影与路径
    var projection = d3.geoAlbers()
    .center([3.64, 41])
    .rotate([102, 0, 0])
    .parallels([40, 75])
    .scale(width * 1.08)
    .translate([
        width / 2,
        height * 0.43
    ]);

    var path = d3.geoPath()
        .projection(projection);

    // 加载数据
    var promises = [];    
    promises.push(d3.csv("data/Species.csv"));
    promises.push(d3.json("data/countries.topojson"));
    promises.push(d3.json("data/states.topojson"));
    promises.push(d3.csv("data/species_az.csv"));
    Promise.all(promises).then(callback);

    function callback(data){    
        var csvData = data[0];    
        var countries = data[1];   
        var states = data[2]; 
        var csvSpecies = data[3];

        setGraticule(map, path);

        var worldCountries = topojson.feature(countries, countries.objects.world_administrative_boundaries),
            usStates = topojson.feature(states, states.objects.ne_110m_admin_1_states_provinces).features;

        usStates = joinData(usStates, csvData);

        // 绘制背景国家
        map.append("path")
            .datum(worldCountries)
            .attr("class", "countries")
            .attr("d", path);

        // 颜色与符号比例尺
        var colorScale = makeColorScale(csvData);
        var sizeScale = getSizeScale(csvData);

        // 绘制各州（传入 csvSpecies 用于点击面板）
        setEnumerationUnits(usStates, map, path, csvSpecies);
        
        // 绘制比例符号
        setProportionalSymbols(usStates, map, path, sizeScale);
        setNortheastInset(
            usStates,
            csvSpecies
        );

        createRankingScopeFilter(
            csvData
        );

        // 绘制图表
        setChart(csvData, colorScale);

        // 创建下拉菜单
        createDropdown(csvData);

        // 搜索按钮事件
        searchButton.addEventListener("click", function() {
            var stateName = document.getElementById('stateSearch').value;
            var state = usStates.find(function(d) {
                return d.properties.name.toLowerCase() === stateName.toLowerCase();
            });
            if (state) {
                var bounds = path.bounds(state),
                    dx = bounds[1][0] - bounds[0][0],
                    dy = bounds[1][1] - bounds[0][1],
                    x = (bounds[0][0] + bounds[1][0]) / 2,
                    y = (bounds[0][1] + bounds[1][1]) / 2,
                    scale = 2,
                    translate = [width / 2 - scale * x, height / 2 - scale * y];
                map.transition()
                    .duration(750)
                    .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
            } else {
                alert("State not found.");
            }
        });
    }
}

function createRankingScopeFilter(csvData) {
    var selector =
        document.getElementById("rankingScope");

    if (!selector) {
        return;
    }

    selector.addEventListener(
        "change",
        function() {
            rankingScope = this.value;

            updateMapFilter(csvData);
            updateChartFilter(csvData);
        }
    );
}

function updateMapFilter(csvData) {
    var activeCodes =
        getFilteredCodes(csvData);

    var scopeActive =
        rankingScope !== "all";

    d3.selectAll(".symbol")
        .classed(
            "filter-active",
            function(d) {
                return !scopeActive ||
                    activeCodes.has(
                        d.properties.adm1_code
                    );
            }
        )
        .classed(
            "filter-muted",
            function(d) {
                return scopeActive &&
                    !activeCodes.has(
                        d.properties.adm1_code
                    );
            }
        );

    d3.selectAll(".regions")
        .style(
            "opacity",
            function(d) {
                if (!scopeActive) {
                    return 1;
                }

                return activeCodes.has(
                    d.properties.adm1_code
                )
                    ? 1
                    : 0.35;
            }
        );

    d3.selectAll(".inset-symbol")
        .classed(
            "filter-active",
            function(d) {
                return !scopeActive ||
                    activeCodes.has(
                        d.properties.adm1_code
                    );
            }
        )
        .classed(
            "filter-muted",
            function(d) {
                return scopeActive &&
                    !activeCodes.has(
                        d.properties.adm1_code
                    );
            }
        );
}

/* 东北部和DC局部放大图 */
function setNortheastInset(
    usStates,
    csvSpecies
) {
    var insetContainer =
        document.getElementById(
            "northeast-map"
        );

    if (!insetContainer) {
        return;
    }

    d3.select("#northeast-map")
        .selectAll("*")
        .remove();

    var insetWidth =
        insetContainer.clientWidth || 220;

    var insetHeight =
        insetContainer.clientHeight || 175;

    var northeastNames = new Set([
        "District of Columbia",
        "Maryland",
        "Delaware",
        "Virginia",
        "West Virginia",
        "Pennsylvania",
        "New Jersey",
        "New York",
        "Connecticut",
        "Rhode Island",
        "Massachusetts"
    ]);

    var northeastStates =
        usStates.filter(function(d) {
            return northeastNames.has(
                d.properties.name
            );
        });

    if (!northeastStates.length) {
        return;
    }

    var northeastCollection = {
        type: "FeatureCollection",
        features: northeastStates
    };

    var insetProjection =
        d3.geoMercator()
            .fitExtent(
                [
                    [8, 8],
                    [
                        insetWidth - 8,
                        insetHeight - 8
                    ]
                ],
                northeastCollection
            );

    var insetPath =
        d3.geoPath()
            .projection(insetProjection);

    var insetSvg =
        d3.select("#northeast-map")
            .append("svg")
            .attr(
                "viewBox",
                `0 0 ${insetWidth} ${insetHeight}`
            );

    insetSvg.selectAll(".inset-region")
        .data(northeastStates)
        .enter()
        .append("path")
        .attr(
            "class",
            function(d) {
                return (
                    "inset-region " +
                    d.properties.adm1_code
                );
            }
        )
        .attr("d", insetPath)
        .on("mouseover", function(event, d) {
            highlight(d.properties);
        })
        .on("mouseout", function(event, d) {
            dehighlight(d.properties);
        })
        .on("click", function(event, d) {
            var currentStateCode =
                d.properties.adm1_code;

            var speciesInState =
                csvSpecies.filter(
                    function(row) {
                        return (
                            row.adm1_code ===
                            currentStateCode
                        );
                    }
                );

            updatePanel(
                speciesInState,
                d.properties.name
            );
        });

    var insetSizeScale =
        getInsetSizeScale(currentCsvData);

    var insetSizeScale = getInsetSizeScale(currentCsvData);

var insetSymbols = insetSvg
    .selectAll(".inset-symbol")
    .data(northeastStates)
    .enter()
    .append("circle")
    .attr("class", function(d) {
        return "inset-symbol " + d.properties.adm1_code;
    })
    .attr("cx", function(d) {
        return insetPath.centroid(d)[0];
    })
    .attr("cy", function(d) {
        return insetPath.centroid(d)[1];
    })
    .attr("r", function(d) {
        var value = Number(d.properties[expressed]);

        if (!Number.isFinite(value) || value <= 0) {
            return 0;
        }

        return insetSizeScale(value);
    })
    .style("fill", "#0da982")
    .style("fill-opacity", 0.72)
    .style("stroke", "#ffffff")
    .style("stroke-width", "0.6px")
    .on("mouseover", function(event, d) {
        highlight(d.properties);
    })
    .on("mouseout", function(event, d) {
        dehighlight(d.properties);
    })
    .on("mousemove", moveLabel);

/*
 * 保存局部图气泡的默认样式，
 * 让 dehighlight() 可以安全恢复。
 */
insetSymbols.append("desc")
    .text('{"stroke":"#ffffff","stroke-width":"0.6px"}');
}