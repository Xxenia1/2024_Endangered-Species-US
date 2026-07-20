// Web Paper interaction layer. The paper intentionally uses no external
// libraries: navigation and reading aids remain lightweight and local.
(function() {
    var header = document.querySelector(".site-header");
    var nav = document.getElementById("site-navigation");
    var navToggle = document.querySelector(".nav-toggle");
    var backToTop = document.querySelector(".back-to-top");
    var navLinks = Array.prototype.slice.call(document.querySelectorAll(".site-navigation a[href^='#']"));
    var sections = navLinks.map(function(link) {
        return document.querySelector(link.getAttribute("href"));
    }).filter(Boolean);

    function closeMobileNav() {
        if (!nav || !navToggle) return;
        nav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
    }

    if (navToggle) {
        navToggle.addEventListener("click", function() {
            var isOpen = nav.classList.toggle("is-open");
            navToggle.setAttribute("aria-expanded", String(isOpen));
        });
    }

    navLinks.forEach(function(link) {
        link.addEventListener("click", function() {
            closeMobileNav();
        });
    });

    function updateScrollState() {
        var scrollY = window.scrollY || window.pageYOffset;
        if (header) header.classList.toggle("is-scrolled", scrollY > 12);
        if (backToTop) backToTop.classList.toggle("is-visible", scrollY > 520);

        var activeSection = null;
        sections.forEach(function(section) {
            if (section.getBoundingClientRect().top <= 130) activeSection = section;
        });
        navLinks.forEach(function(link) {
            link.classList.toggle("is-active", activeSection && link.getAttribute("href") === "#" + activeSection.id);
        });
    }

    window.addEventListener("scroll", updateScrollState, { passive: true });
    updateScrollState();

    if (backToTop) {
        backToTop.addEventListener("click", function() {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
})();
