//详情面板, i.e., info panel
// panel.js - 详情面板与提示框

// 更新右侧面板（显示该州的物种分组）
function updatePanel(speciesInState, stateName) {
    var panel = d3.select("#right-panel");
    panel.html("");

    panel.append("h3").text("Species Groups in "+stateName);

    let groups = new Map();

    speciesInState.forEach(species => {
        if (species.Group && species["Scientific Name"]) {
            if (!groups.has(species.Group)) {
                groups.set(species.Group, []);
            }
            groups.get(species.Group).push(species);
        }
    });

    if (groups.size > 0) {
        groups.forEach((speciesList, group) => {
            let groupContainer = panel.append("div").attr("class", "group-container");
            let header = groupContainer.append("p")
                .text(group)
                .attr("class", "group-header")
                .style("cursor", "pointer");
            let list = groupContainer.append("ul")
                .style("display", "none")
                .attr("class", "species-list");

            speciesList.forEach(species => {
                list.append("li")
                    .text(species["Scientific Name"])
                    .attr("class", "species-name")
                    .on("mouseover", function(event) {
                        showTooltip(event, species);
                    })
                    .on("mouseout", function() {
                        hideTooltip();
                    });
            });

            header.on("click", function() {
                let isVisible = list.style("display") === "none";
                list.style("display", isVisible ? "block" : "none");
            });
        });
    } else {
        panel.append("p").text("No groups available for this state.");
    }
}

// 显示 tooltip（鼠标悬停物种名时）
function showTooltip(event, species) {
    let tooltip = d3.select("#tooltip");

    tooltip.html(`<strong>Scientific Name:</strong> ${species["Scientific Name"]}<br>
                  <strong>Common Name:</strong> ${species["Common Name"]}<br>
                  <strong>Where Listed:</strong> ${species["Where Listed"]}<br>
                  <strong>ESA Listing Status:</strong> ${species["ESA Listing Status "]}`)
           .style("visibility", "visible")
           .style("opacity", 0);

    setTimeout(() => {
        const tooltipWidth = tooltip.node().offsetWidth;
        const viewportWidth = window.innerWidth;
        const leftPosition = 0.8 * viewportWidth - tooltipWidth;
        tooltip.style("left", `${leftPosition}px`)
               .style("top", (event.pageY + 10) + "px")
               .style("opacity", 1);
    }, 10);
}

function hideTooltip() {
    d3.select("#tooltip").style("visibility", "hidden");
}

// 添加页脚描述
function addToolDescription() {
    var descContainer = document.getElementById("toolDescriptionContainer");
    if (descContainer) {
        descContainer.innerHTML = '<p>This map designed by Zhiyi Li and Xun Gong</p>';
        descContainer.classList.add("tool-description");
    }
}

// 点击初始页面后隐藏它（HTML 中的 onclick 调用）
function continueToMap() {
    var initialPage = document.getElementById('initialPage');
    if (initialPage) {
        initialPage.style.display = 'none';
    }
}

// 设置全局事件监听（重置按钮提示、下拉菜单提示）
function setupEventListeners() {
    var resetButton = document.getElementById('resetMap');
    if (resetButton) {
        resetButton.addEventListener('mouseover', function() {
            var tooltip = document.getElementById('resetTooltip');
            if (tooltip) tooltip.style.display = 'block';
        });
        resetButton.addEventListener('mouseout', function() {
            var tooltip = document.getElementById('resetTooltip');
            if (tooltip) tooltip.style.display = 'none';
        });
    }

    var dropdown = document.querySelector('.dropdown-container select');
    var tooltip = document.getElementById('dropdownTooltip');
    if (dropdown && tooltip) {
        dropdown.addEventListener('mouseover', function() {
            tooltip.style.display = 'block';
        });
        dropdown.addEventListener('mouseout', function() {
            tooltip.style.display = 'none';
        });
    }
}

// 工具函数：计算百分比（未在主干中使用，保留）
function calculatePercentages(data) {
    console.log("Sample data for verification:", data.slice(0, 1));
    const grouped = d3.group(data, d => d.State, d => d.Group);
    const percentages = [];
    grouped.forEach((groups, state) => {
        let total = 0;
        groups.forEach((species, group) => {
            total += species.length;
        });
        groups.forEach((species, group) => {
            percentages.push({
                State: state,
                Group: group,
                Percentage: (species.length / total) * 100
            });
        });
    });
    console.log("Computed Percentages:", percentages);
    return percentages;
}