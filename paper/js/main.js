// Lightweight notebook navigation: mobile sidebar, smooth section jumps,
// active chapter state, and a back-to-top control.
(function() {
    var sidebar = document.getElementById("report-sidebar");
    var toggle = document.querySelector(".sidebar-toggle");
    var navigation = document.getElementById("sidebar-navigation");
    var backToTop = document.querySelector(".back-to-top");
    var links = Array.prototype.slice.call(document.querySelectorAll(".chapter-navigation a[href^='#']"));
    var sections = links.map(function(link) {
        return document.querySelector(link.getAttribute("href"));
    }).filter(Boolean);

    function closeSidebar() {
        if (!sidebar || !toggle) return;
        sidebar.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
    }

    if (toggle) {
        toggle.addEventListener("click", function() {
            var open = sidebar.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", String(open));
        });
    }

    links.forEach(function(link) {
        link.addEventListener("click", closeSidebar);
    });

    function updateReadingState() {
        var scrollY = window.scrollY || window.pageYOffset;
        if (backToTop) backToTop.classList.toggle("is-visible", scrollY > 520);
        var active = null;
        sections.forEach(function(section) {
            if (section.getBoundingClientRect().top <= 150) active = section;
        });
        links.forEach(function(link) {
            link.classList.toggle("is-active", Boolean(active) && link.getAttribute("href") === "#" + active.id);
        });
    }

    window.addEventListener("scroll", updateReadingState, { passive: true });
    updateReadingState();

    if (backToTop) {
        backToTop.addEventListener("click", function() {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
})();
