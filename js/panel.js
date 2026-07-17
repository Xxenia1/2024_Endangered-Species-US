// panel.js - state-level report rendered from the shared dashboard record

function formatNumber(value, digits) {
    if (value === null || value === undefined || String(value).trim() === "") {
        return "—";
    }

    var number = Number(value);
    if (!Number.isFinite(number)) {
        return "—";
    }

    return number.toLocaleString(undefined, {
        minimumFractionDigits: digits || 0,
        maximumFractionDigits: digits || 0
    });
}

function formatPercent(value) {
    var formattedValue = formatNumber(value, 1);
    return formattedValue === "—" ? formattedValue : formattedValue + "%";
}

function formatCurrency(value) {
    var formattedValue = formatNumber(value);
    return formattedValue === "—" ? formattedValue : "$" + formattedValue;
}

function reportMetric(container, label, value, note) {
    var metric = container.append("div").attr("class", "report-metric");
    metric.append("span").attr("class", "report-metric-label").text(label);
    metric.append("strong").text(value);

    if (note) {
        metric.append("small").text(note);
    }
}

function reportSection(panel, title) {
    var section = panel.append("section").attr("class", "report-section");
    section.append("h4").text(title);
    return section.append("div").attr("class", "report-grid");
}

function reportProgressCard(container, label, value, note) {
    var numericValue = Number(value);
    var hasValue = Number.isFinite(numericValue);
    var boundedValue = hasValue ? Math.max(0, Math.min(100, numericValue)) : 0;
    var card = container.append("div").attr("class", "conservation-card");

    card.append("span")
        .attr("class", "report-metric-label")
        .text(label);
    card.append("strong")
        .attr("class", "conservation-value")
        .text(hasValue ? formatPercent(numericValue) : "—");

    var progress = card.append("div")
        .attr("class", "conservation-progress")
        .attr("role", "progressbar")
        .attr("aria-label", label)
        .attr("aria-valuemin", 0)
        .attr("aria-valuemax", 100)
        .attr("aria-valuenow", hasValue ? boundedValue : 0);
    progress.append("div")
        .attr("class", "conservation-progress-fill")
        .style("width", boundedValue + "%");

    if (note) {
        card.append("small").text(note);
    }
}

function reportIndicatorCard(container, label, value, note) {
    var card = container.append("div").attr("class", "indicator-card");
    card.append("span").attr("class", "report-metric-label").text(label);
    card.append("strong")
        .attr("class", "indicator-value")
        .text(formatNumber(value, 2));
    if (note) {
        card.append("small").text(note);
    }
}

function updatePanel(state) {
    var panel = d3.select("#right-panel");
    panel.html("");

    panel.append("div").attr("class", "panel-kicker").text("Selected State");
    panel.append("h2").text("State Report");
    panel.append("p")
        .attr("class", "report-state-name")
        .text(state.State);

    var overview = panel.append("div").attr("class", "report-overview");
    reportMetric(overview, "Species Count", formatNumber(state.Species_Count));
    reportMetric(
        overview,
        "Species Density",
        formatNumber(Number(state.Species_Density) * 100, 2),
        "per 100 km²"
    );

    var habitat = reportSection(panel, "Habitat Composition");
    reportMetric(habitat, "Forest", formatPercent(state.Forest_Pct));
    reportMetric(habitat, "Urban", formatPercent(state.Urban_Pct));
    reportMetric(habitat, "Crop", formatPercent(state.Crop_Pct));
    reportMetric(habitat, "Wetland", formatPercent(state.Wetland_Pct));

    var human = reportSection(panel, "Human & Economy");
    reportMetric(human, "Population", formatNumber(state.Pop_2024));
    reportMetric(human, "GDP / Capita", formatCurrency(state.GDP_Per_Capita));
    reportMetric(human, "Human Pressure", formatPercent(state.Human_Pressure), "0–100 composite score");

    var risk = reportSection(panel, "Environmental Risk (FEMA NRI)");
    reportMetric(risk, "Expected Annual Loss Score", formatNumber(state.Risk_Overall, 1), "0–100 score, not probability");
    reportMetric(risk, "Wildfire", state.Risk_Wildfire || "—");
    reportMetric(risk, "Drought", state.Risk_Drought || "—");
    reportMetric(risk, "Flooding", state.Risk_Flooding || "—");

    // These values are properties of the selected feature from final_data.geojson.
    var conservation = reportSection(panel, "Conservation");
    reportProgressCard(
        conservation,
        "Protected Area",
        state.Protected_Pct,
        "Share of state area"
    );
    reportProgressCard(
        conservation,
        "Conservation Effectiveness",
        state.Conservation_Effectiveness,
        "Protected-coverage score"
    );

    var composite = reportSection(panel, "Composite Indicators");
    reportIndicatorCard(
        composite,
        "Biodiversity Risk",
        state.Biodiversity_Risk,
        "0–100 composite score"
    );
    reportIndicatorCard(
        composite,
        "Ecological Vulnerability",
        state.Ecological_Vulnerability,
        "0–100 composite score"
    );

    var findings = panel.append("section").attr("class", "key-findings");
    findings.append("h4").text("Key Findings");
    var list = findings.append("ul");
    list.append("li").text(
        formatNumber(Number(state.Species_Density) * 100, 2) +
        " endangered species per 100 km²."
    );
    list.append("li").text(
        "FEMA NRI expected annual loss score: " +
        formatNumber(state.Risk_Overall, 1) + "."
    );
    list.append("li").text(
        "Protected area coverage: " + formatPercent(state.Protected_Pct) + "."
    );
}

function addToolDescription() {
    // The old footer is intentionally omitted to keep attention on analysis.
}

function continueToMap() {
    var initialPage = document.getElementById("initialPage");
    if (initialPage) {
        initialPage.style.display = "none";
    }
}

function setupEventListeners() {
    // Map controls and explorer interactions are registered by map.js.
}
