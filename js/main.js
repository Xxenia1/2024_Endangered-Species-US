// Core controller and application entry point.

function setupThemeToggle() {
    var button = document.getElementById("themeToggle");
    if (!button) return;

    var savedTheme = "";
    try {
        savedTheme = window.localStorage.getItem("dashboard-theme") || "";
    } catch (error) {
        savedTheme = "";
    }

    function applyTheme(isDark) {
        document.body.classList.toggle("dark-mode", isDark);
        button.setAttribute("aria-pressed", String(isDark));
        button.querySelector(".theme-toggle-icon").textContent = isDark ? "☀" : "☾";
        button.querySelector(".theme-toggle-label").textContent = isDark ? "Light mode" : "Dark mode";
    }

    applyTheme(savedTheme === "dark");
    button.addEventListener("click", function() {
        var isDark = !document.body.classList.contains("dark-mode");
        applyTheme(isDark);
        try {
            window.localStorage.setItem("dashboard-theme", isDark ? "dark" : "light");
        } catch (error) {
            // The toggle still works when storage is unavailable.
        }
    });
}

window.onload = function() {
    setupThemeToggle();

    // 1. Start the map module (map, chart, and explorer controls).
    setMap();
    
    // 2. Add the optional page description from panel.js.
    addToolDescription();
    
    // 3. Register shared UI event listeners.
    setupEventListeners();
    
    console.log("Endangered Species Tracker initialized successfully.");
};
