// query.js - transparent natural-language query interpretation layer
//
// This module intentionally uses deterministic, local rules rather than a
// remote LLM. It converts common analytic phrases into percentile conditions
// over the same records already used by the map, chart, and state report.

var aiQueryState = {
    active: false,
    text: "",
    conditions: [],
    matchedCodes: new Set()
};

function isAIQueryActive() {
    return Boolean(aiQueryState && aiQueryState.active);
}

function getAIQueryMatchedCodes() {
    return aiQueryState && aiQueryState.matchedCodes
        ? aiQueryState.matchedCodes
        : new Set();
}

function queryValue(record, field) {
    return getIndicatorNumericValue(record[field], field);
}

function percentile(values, fraction) {
    var sorted = values.filter(Number.isFinite).sort(function(a, b) { return a - b; });
    if (!sorted.length) return NaN;
    var index = (sorted.length - 1) * fraction;
    var lower = Math.floor(index);
    var upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function queryCondition(data, field, direction, label) {
    var values = data.map(function(record) {
        return queryValue(record, field);
    }).filter(Number.isFinite);
    var percentileValue = direction === "high" ? 0.75 : 0.25;
    var threshold = percentile(values, percentileValue);
    if (!Number.isFinite(threshold)) return null;

    return {
        field: field,
        direction: direction,
        percentile: direction === "high" ? 75 : 25,
        threshold: threshold,
        label: label || getDisplayName(field) +
            (direction === "high" ? " > 75%" : " < 25%")
    };
}

function hasQueryField(conditions, field) {
    return conditions.some(function(condition) {
        return condition.field === field;
    });
}

function parseNaturalLanguageQuery(text, data) {
    var normalized = String(text || "")
        .toLowerCase()
        .replace(/[–—]/g, "-")
        .replace(/\s+/g, " ")
        .trim();
    var conditions = [];
    if (!normalized) return conditions;

    // “Conservation priority” is a useful compound intent that combines the
    // most actionable high-risk / low-protection signals in this dataset.
    var priorityIntent = /conservation\s+priorit|priority\s+state|priority\s+area/.test(normalized);
    var highBiodiversity = /high\s+(?:biodiversity\s+)?risk|biodiversity\s+risk[^a-z]{0,12}high|biodiversity\s+risk/.test(normalized);
    var lowProtected = /low\s+(?:protected\s+area|protected\s+area\s+coverage|protection)|protected\s+area[^a-z]{0,12}low|low\s+conservation/.test(normalized);
    var highHuman = /high\s+human\s+pressure|human\s+pressure[^a-z]{0,12}high/.test(normalized);
    var lowHuman = /low\s+human\s+pressure|human\s+pressure[^a-z]{0,12}low/.test(normalized);
    var highVulnerability = /high\s+(?:ecological\s+)?vulnerab|ecological\s+vulnerab[^a-z]{0,12}high/.test(normalized);
    var highOverallRisk = /high\s+(?:overall\s+)?risk|risk\s+overall[^a-z]{0,12}high/.test(normalized);

    if (priorityIntent || highBiodiversity) {
        conditions.push(queryCondition(data, "Biodiversity_Risk", "high", "Biodiversity Risk > 75%"));
    }
    if (priorityIntent || lowProtected) {
        conditions.push(queryCondition(data, "Protected_Pct", "low", "Protected Area < 25%"));
    }
    if (priorityIntent || highHuman) {
        conditions.push(queryCondition(data, "Human_Pressure", "high", "Human Pressure > 75%"));
    }
    if (lowHuman) {
        conditions.push(queryCondition(data, "Human_Pressure", "low", "Human Pressure < 25%"));
    }
    if (highVulnerability) {
        conditions.push(queryCondition(data, "Ecological_Vulnerability", "high", "Ecological Vulnerability > 75%"));
    }
    if (highOverallRisk && !hasQueryField(conditions, "Biodiversity_Risk")) {
        conditions.push(queryCondition(data, "Risk_Overall", "high", "Risk Overall > 75%"));
    }

    return conditions.filter(function(condition) { return condition !== null; });
}

function matchesAIQuery(record, conditions) {
    return conditions.every(function(condition) {
        var value = queryValue(record, condition.field);
        if (!Number.isFinite(value)) return false;
        return condition.direction === "high"
            ? value >= condition.threshold
            : value <= condition.threshold;
    });
}

function formatQueryThreshold(condition) {
    return formatVisualValue(condition.threshold, condition.field);
}

function renderAIQueryInterpretation(message) {
    var panel = d3.select("#ai-query-interpretation");
    if (panel.empty()) return;

    panel.selectAll(".ai-query-condition-list, .ai-query-condition, .ai-query-result, .ai-query-empty, .ai-query-message").remove();
    if (message) {
        panel.append("p").attr("class", "ai-query-message").text(message);
    }

    if (!aiQueryState.active) {
        panel.append("p")
            .attr("class", "ai-query-empty")
            .text("No query applied. Existing map, chart, and report interactions remain unchanged.");
        return;
    }

    var list = panel.append("div").attr("class", "ai-query-condition-list");
    aiQueryState.conditions.forEach(function(condition) {
        var chip = list.append("span").attr("class", "ai-query-condition");
        chip.append("strong").text(condition.label);
        chip.append("small").text("Threshold: " + formatQueryThreshold(condition));
    });

    panel.append("p")
        .attr("class", "ai-query-result")
        .text(aiQueryState.matchedCodes.size + " of " + currentStateData.length + " states match all conditions.");
}

function refreshAIQueryVisuals() {
    if (typeof updateMapFilter === "function") updateMapFilter(currentStateData);
    if (typeof updateChartFilter === "function") updateChartFilter(currentStateData);
}

function applyAIQuery(text) {
    var conditions = parseNaturalLanguageQuery(text, currentStateData);
    if (!conditions.length) {
        aiQueryState.active = false;
        aiQueryState.text = String(text || "").trim();
        aiQueryState.conditions = [];
        aiQueryState.matchedCodes = new Set();
        renderAIQueryInterpretation(
            aiQueryState.text
                ? "I could not identify a supported filter. Try high/low biodiversity risk, protected area, human pressure, or conservation priority."
                : ""
        );
        refreshAIQueryVisuals();
        return;
    }

    aiQueryState.active = true;
    aiQueryState.text = String(text || "").trim();
    aiQueryState.conditions = conditions;
    aiQueryState.matchedCodes = new Set(
        currentStateData
            .filter(function(record) { return matchesAIQuery(record, conditions); })
            .map(function(record) { return record.State_Code; })
    );

    renderAIQueryInterpretation();
    refreshAIQueryVisuals();

    // Keep the linked State Report useful after an AI query: show the first
    // matching state so the report is immediately synchronized with the map.
    var firstMatch = currentStateFeatures.find(function(feature) {
        return aiQueryState.matchedCodes.has(feature.properties.State_Code);
    });
    if (firstMatch && typeof updatePanel === "function") {
        updatePanel(firstMatch.properties);
    }
}

function clearAIQuery() {
    aiQueryState.active = false;
    aiQueryState.text = "";
    aiQueryState.conditions = [];
    aiQueryState.matchedCodes = new Set();
    var input = document.getElementById("ai-query-input");
    if (input) input.value = "";
    renderAIQueryInterpretation();
    refreshAIQueryVisuals();
}

function setupAIAssistantToggle() {
    var toggle = document.getElementById("ai-assistant-toggle");
    var content = document.getElementById("ai-assistant-content");
    var assistant = document.querySelector(".ai-assistant-panel");
    if (!toggle || !content || toggle.dataset.ready === "true") return;

    toggle.dataset.ready = "true";
    content.hidden = true;
    toggle.addEventListener("click", function() {
        var isOpen = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!isOpen));
        content.hidden = isOpen;
        if (assistant) assistant.classList.toggle("is-open", !isOpen);
        var chevron = toggle.querySelector(".ai-assistant-chevron");
        if (chevron) chevron.textContent = isOpen ? "＋" : "－";
    });
}

function setupAIQuery(data) {
    currentStateData = data;
    setupAIAssistantToggle();
    var form = document.getElementById("ai-query-form");
    var input = document.getElementById("ai-query-input");
    var clear = document.getElementById("ai-query-clear");
    if (!form || !input || form.dataset.ready === "true") return;

    form.dataset.ready = "true";
    form.addEventListener("submit", function(event) {
        event.preventDefault();
        applyAIQuery(input.value);
    });
    clear.addEventListener("click", clearAIQuery);
    d3.selectAll("[data-ai-query-example]").on("click", function() {
        input.value = this.getAttribute("data-ai-query-example");
        applyAIQuery(input.value);
    });
    renderAIQueryInterpretation();
}
