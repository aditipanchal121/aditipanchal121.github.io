(function () {
    var root = document.documentElement;
    function store(key, value) {
        try { value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value); } catch (e) {}
    }

    // ---------------------------------------------------------------
    // Rotating tagline (static when animations are off)
    // ---------------------------------------------------------------
    var taglines = ["applied scientist.", "ML engineer.", "evaluation nerd.",
        "health-tech builder.", "grad student @ Georgia Tech.", "researcher.",
        "volunteer.", "avid reader.", "food enthusiast.", "dancer.", "puzzler.", "reader."];
    document.querySelector(".tagline-sr").textContent = taglines.join(" ");
    var typedEl = document.querySelector(".typed");
    var typed = null;

    var osReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    function motionReduced() {
        if (root.dataset.motion) return root.dataset.motion === "reduce";
        return osReduce.matches;
    }
    function startTagline() {
        if (typed) { typed.destroy(); typed = null; }
        if (motionReduced() || !window.Typed) {
            typedEl.textContent = taglines[0];
            return;
        }
        typed = new Typed(".typed", {
            strings: taglines,
            typeSpeed: 50,
            backSpeed: 10,
            startDelay: 600,
            loop: true,
            showCursor: true
        });
    }
    startTagline();

    // ---------------------------------------------------------------
    // Light/dark toggle (defaults to the OS setting until the visitor picks one)
    // ---------------------------------------------------------------
    var themeBtn = document.querySelector(".theme-toggle");
    function toggleTheme() {
        var dark = root.dataset.theme
            ? root.dataset.theme === "dark"
            : window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.dataset.theme = dark ? "light" : "dark";
        store("theme", root.dataset.theme);
    }
    themeBtn.addEventListener("click", toggleTheme);

    // ---------------------------------------------------------------
    // Small popover helper: toggles, closes on outside click or Escape
    // ---------------------------------------------------------------
    function popover(btn, panel) {
        function set(open) {
            panel.hidden = !open;
            btn.setAttribute("aria-expanded", String(open));
        }
        btn.addEventListener("click", function () { set(panel.hidden); });
        document.addEventListener("click", function (e) {
            if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) set(false);
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && !panel.hidden) { set(false); btn.focus(); }
        });
        return set;
    }

    // ---------------------------------------------------------------
    // Section nav: collapses into a Menu dropdown when links don't fit
    // ---------------------------------------------------------------
    var nav = document.querySelector(".sections");
    var menuBtn = document.querySelector(".menu-toggle");
    function setMenu(open) {
        nav.classList.toggle("open", open);
        menuBtn.setAttribute("aria-expanded", String(open));
    }
    menuBtn.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });

    var navLinks = document.querySelectorAll(".nav-links a");
    function fitNav() {
        nav.classList.remove("compact");
        var first = navLinks[0], last = navLinks[navLinks.length - 1];
        var compact = last.offsetTop !== first.offsetTop;
        nav.classList.toggle("compact", compact);
        if (!compact) setMenu(false);
    }
    fitNav();
    window.addEventListener("resize", fitNav);
    if (document.fonts) document.fonts.ready.then(fitNav);
    navLinks.forEach(function (a) {
        a.addEventListener("click", function () { setMenu(false); });
    });
    document.addEventListener("click", function (e) { if (!nav.contains(e.target)) setMenu(false); });
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && nav.classList.contains("open")) { setMenu(false); menuBtn.focus(); }
    });

    // Info popover explaining full vs. brief view
    popover(document.querySelector(".info-toggle"), document.getElementById("view-info"));

    // ---------------------------------------------------------------
    // Display settings: text size, high contrast, animations
    // ---------------------------------------------------------------
    popover(document.querySelector(".display-toggle"), document.getElementById("display-menu"));

    var textSizes = [100, 112, 125, 140];
    var sizeValue = document.querySelector(".text-size-value");
    var sizeBtns = document.querySelectorAll("[data-text-size]");
    function currentSizeIndex() {
        var i = textSizes.indexOf(parseInt(root.style.fontSize, 10) || 100);
        return i < 0 ? 0 : i;
    }
    function setTextSize(i) {
        i = Math.max(0, Math.min(textSizes.length - 1, i));
        root.style.fontSize = i === 0 ? "" : textSizes[i] + "%";
        store("textScale", i === 0 ? null : String(textSizes[i]));
        renderDisplaySettings();
        fitNav();
        layoutTimeline();
    }
    sizeBtns.forEach(function (b) {
        b.addEventListener("click", function () { setTextSize(currentSizeIndex() + parseInt(b.dataset.textSize, 10)); });
    });

    var contrastSwitch = document.querySelector('[data-setting="contrast"]');
    var motionSwitch = document.querySelector('[data-setting="motion"]');
    function toggleContrast() {
        if (root.dataset.contrast === "high") delete root.dataset.contrast;
        else root.dataset.contrast = "high";
        store("contrast", root.dataset.contrast || null);
        renderDisplaySettings();
    }
    function toggleMotion() {
        var reduce = !motionReduced();
        // Only store a choice that differs from the OS setting
        if (reduce === osReduce.matches) delete root.dataset.motion;
        else root.dataset.motion = reduce ? "reduce" : "full";
        store("motion", root.dataset.motion || null);
        renderDisplaySettings();
        startTagline();
    }
    contrastSwitch.addEventListener("click", toggleContrast);
    motionSwitch.addEventListener("click", toggleMotion);
    osReduce.addEventListener && osReduce.addEventListener("change", function () { renderDisplaySettings(); startTagline(); });

    function renderDisplaySettings() {
        var i = currentSizeIndex();
        sizeValue.textContent = textSizes[i] + "%";
        sizeBtns[0].disabled = i === 0;
        sizeBtns[1].disabled = i === textSizes.length - 1;
        contrastSwitch.setAttribute("aria-checked", String(root.dataset.contrast === "high"));
        motionSwitch.setAttribute("aria-checked", String(!motionReduced()));
    }
    renderDisplaySettings();

    // ---------------------------------------------------------------
    // Brief view: hide bullet points/descriptions
    // ---------------------------------------------------------------
    var detailBtn = document.querySelector(".detail-toggle");
    function toggleBrief() {
        var brief = document.body.classList.toggle("brief");
        detailBtn.setAttribute("aria-pressed", String(brief));
        detailBtn.textContent = brief ? "Full view" : "Brief view";
    }
    detailBtn.addEventListener("click", toggleBrief);

    // ---------------------------------------------------------------
    // Project filters
    // ---------------------------------------------------------------
    var filterBtns = document.querySelectorAll(".filters button");
    var projects = document.querySelectorAll(".projects > li");
    function filterProjects(f) {
        filterBtns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.filter === f)); });
        projects.forEach(function (p) {
            p.hidden = f !== "all" && p.dataset.tags.split(" ").indexOf(f) === -1;
        });
    }
    filterBtns.forEach(function (btn) {
        btn.addEventListener("click", function () { filterProjects(btn.dataset.filter); });
    });

    // ---------------------------------------------------------------
    // Jump to an entry and briefly highlight it
    // ---------------------------------------------------------------
    function flash(el) {
        el.classList.remove("flash");
        void el.offsetWidth; // restart the animation
        el.classList.add("flash");
    }
    function jumpTo(el) {
        if (el.hidden) filterProjects("all");
        el.scrollIntoView({ behavior: motionReduced() ? "auto" : "smooth", block: "center" });
        if (el.classList.contains("entry")) flash(el);
    }

    // ---------------------------------------------------------------
    // Skill evidence: click a skill to highlight where it was used
    // ---------------------------------------------------------------
    var evidence = Array.prototype.slice.call(document.querySelectorAll("[data-skills]"));
    var skillStatus = document.querySelector(".skill-status");
    var skillStatusText = document.querySelector(".skill-status-text");
    var activeSkill = null;
    var skillChips = {};

    function usesSkill(el, key) { return el.dataset.skills.split(" ").indexOf(key) !== -1; }
    function entryKind(el) {
        var section = el.closest("section").id;
        return { experience: "role", research: "research role", education: "degree", projects: "project" }[section] || "entry";
    }
    function plural(n, word) { return n + " " + word + (n === 1 ? "" : "s"); }

    document.querySelectorAll(".skills [data-skill]").forEach(function (span) {
        var key = span.dataset.skill;
        if (!evidence.some(function (el) { return usesSkill(el, key); })) return;
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chip";
        btn.dataset.skill = key;
        btn.innerHTML = span.innerHTML;
        btn.setAttribute("aria-pressed", "false");
        btn.title = "Highlight where I've used this";
        span.replaceWith(btn);
        skillChips[key] = btn;
        btn.addEventListener("click", function () { selectSkill(activeSkill === key ? null : key); });
    });

    function skillName(key) {
        return skillChips[key].childNodes[0].textContent.trim();
    }
    function selectSkill(key) {
        activeSkill = key;
        Object.keys(skillChips).forEach(function (k) { skillChips[k].setAttribute("aria-pressed", String(k === key)); });
        document.body.classList.toggle("skill-filter", !!key);
        evidence.forEach(function (el) { el.classList.toggle("match", !!key && usesSkill(el, key)); });
        if (!key) { skillStatus.hidden = true; return; }

        filterProjects("all");
        var counts = {}, order = [];
        evidence.forEach(function (el) {
            if (!usesSkill(el, key)) return;
            var kind = entryKind(el);
            if (!counts[kind]) { counts[kind] = 0; order.push(kind); }
            counts[kind]++;
        });
        skillStatusText.textContent = skillName(key) + ": " + order.map(function (k) { return plural(counts[k], k); }).join(" · ");
        skillStatus.hidden = false;
    }
    document.querySelector(".skill-status-clear").addEventListener("click", function () { selectSkill(null); });
    document.querySelector(".skill-status-jump").addEventListener("click", function () {
        var first = document.querySelector(".entry.match");
        if (first) jumpTo(first);
    });
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && activeSkill && !palette.open) selectSkill(null);
    });

    // ---------------------------------------------------------------
    // Career timeline, built from data-start / data-end on entries
    // ---------------------------------------------------------------
    var chart = document.querySelector(".tl-chart");
    var readout = document.querySelector(".tl-readout");
    var readoutDefault = readout.textContent;
    var lanes = [["work", "Work"], ["research", "Research"], ["education", "Education"]];
    var now = new Date();
    var nowYear = now.getFullYear() + now.getMonth() / 12;

    function toYear(ym, isEnd) {
        if (ym === "present") return nowYear;
        var parts = ym.split("-");
        return parseInt(parts[0], 10) + (parseInt(parts[1], 10) - 1 + (isEnd ? 1 : 0)) / 12;
    }

    function buildTimeline() {
        var items = Array.prototype.slice.call(document.querySelectorAll("[data-start]")).map(function (el) {
            return {
                el: el,
                lane: el.dataset.lane,
                start: toYear(el.dataset.start),
                end: toYear(el.dataset.end, true),
                title: el.querySelector("h3, h4").textContent.trim(),
                short: el.dataset.short,
                when: el.querySelector(".when").textContent.trim()
            };
        });
        var min = Math.floor(Math.min.apply(null, items.map(function (i) { return i.start; })));
        var max = Math.ceil(Math.max.apply(null, items.map(function (i) { return i.end; }).concat([nowYear])));
        function pct(y) { return ((y - min) / (max - min) * 100).toFixed(3) + "%"; }

        var html = "";
        lanes.forEach(function (lane) {
            var bars = items.filter(function (i) { return i.lane === lane[0]; }).map(function (i) {
                var label = i.title + ", " + i.when;
                return '<a class="tl-bar tl-' + i.lane + '" href="#' + i.el.id + '" style="left:' + pct(i.start) +
                    ";width:calc(" + pct(i.end) + " - " + pct(i.start) + ')" aria-label="' + label.replace(/"/g, "&quot;") +
                    '" data-readout="' + label.replace(/"/g, "&quot;") + '"><span class="tl-label">' + i.short + "</span></a>";
            }).join("");
            html += '<div class="tl-lane"><span class="tl-lane-label">' + lane[1] + '</span><div class="tl-track">' + bars + "</div></div>";
        });
        var ticks = "";
        for (var y = min; y <= max; y++) {
            ticks += '<span class="tl-tick" data-year="' + y + '" style="left:' + pct(y) + '">&rsquo;' + String(y).slice(2) + "</span>";
        }
        chart.innerHTML = html + '<div class="tl-axis">' + ticks + "</div>";

        // "Now" marker spanning the lanes
        var firstTrack = chart.querySelector(".tl-track");
        var nowMark = document.createElement("div");
        nowMark.className = "tl-now";
        nowMark.innerHTML = "<span>now</span>";
        chart.appendChild(nowMark);
        chart._place = function () {
            var offset = firstTrack.offsetLeft;
            nowMark.style.left = (offset + firstTrack.offsetWidth * (nowYear - min) / (max - min)) + "px";
        };

        chart.querySelectorAll(".tl-bar").forEach(function (bar) {
            function show() {
                readout.textContent = bar.dataset.readout;
                chart.querySelectorAll(".tl-bar.active").forEach(function (b) { b.classList.remove("active"); });
                bar.classList.add("active");
            }
            function hide() { readout.textContent = readoutDefault; bar.classList.remove("active"); }
            bar.addEventListener("mouseenter", show);
            bar.addEventListener("focus", show);
            bar.addEventListener("mouseleave", hide);
            bar.addEventListener("blur", hide);
            bar.addEventListener("click", function (e) {
                e.preventDefault();
                jumpTo(document.getElementById(bar.getAttribute("href").slice(1)));
            });
        });
    }

    function layoutTimeline() {
        if (!chart._place) return;
        chart._place();
        // Hide labels that don't fit inside their bar; thin out year ticks on narrow screens
        chart.querySelectorAll(".tl-bar").forEach(function (bar) {
            var label = bar.querySelector(".tl-label");
            label.classList.remove("clipped");
            if (label.offsetWidth > bar.clientWidth - 4) label.classList.add("clipped");
        });
        var every = chart.offsetWidth < 520 ? 2 : 1;
        chart.querySelectorAll(".tl-tick").forEach(function (t) {
            t.style.visibility = parseInt(t.dataset.year, 10) % every === 0 ? "" : "hidden";
        });
    }
    buildTimeline();
    layoutTimeline();
    window.addEventListener("resize", layoutTimeline);
    if (document.fonts) document.fonts.ready.then(layoutTimeline);

    // ---------------------------------------------------------------
    // Toast for small confirmations (e.g. email copied)
    // ---------------------------------------------------------------
    var toast = document.querySelector(".toast");
    var toastTimer;
    function showToast(msg) {
        toast.textContent = msg;
        toast.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toast.hidden = true; }, 2200);
    }

    // ---------------------------------------------------------------
    // Command palette (Ctrl/Cmd + K)
    // ---------------------------------------------------------------
    var palette = document.querySelector(".palette");
    var paletteInput = palette.querySelector(".palette-input");
    var paletteList = palette.querySelector(".palette-list");
    var paletteBtn = document.querySelector(".palette-toggle");
    var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    paletteBtn.querySelector("kbd").textContent = isMac ? "⌘K" : "Ctrl K";
    paletteBtn.title = "Search the page and run commands (" + (isMac ? "⌘K" : "Ctrl+K") + ")";

    var email = "aditipanchal121@gmail.com";
    function openUrl(url) { return function () { window.open(url, "_blank", "noopener"); }; }

    function commands() {
        var list = [];
        navLinks.forEach(function (a) {
            var target = document.querySelector(a.getAttribute("href"));
            list.push({ label: "Go to " + a.textContent.trim(), kind: "Section", run: function () { jumpTo(target); } });
        });
        document.querySelectorAll("main .entry").forEach(function (el) {
            var h = el.querySelector("h3, h4");
            if (!h) return;
            var where = el.closest(".group") ? el.closest(".group").querySelector(".group-title").textContent : el.closest("section").querySelector("h2").textContent;
            list.push({ label: h.textContent.trim(), kind: where.trim(), keywords: el.textContent, run: function () { jumpTo(el); } });
        });
        Object.keys(skillChips).forEach(function (key) {
            list.push({ label: "Where I've used " + skillName(key), kind: "Skill", run: function () { selectSkill(key); jumpTo(document.querySelector(".entry.match")); } });
        });
        list.push(
            { label: document.body.classList.contains("brief") ? "Switch to full view" : "Switch to brief view", kind: "Action", run: toggleBrief },
            { label: "Toggle dark mode", kind: "Action", keywords: "theme light", run: toggleTheme },
            { label: "Copy email address", kind: "Action", keywords: email + " contact", run: function () {
                (navigator.clipboard ? navigator.clipboard.writeText(email) : Promise.reject())
                    .then(function () { showToast("Copied " + email); }, function () { showToast(email); });
            } },
            { label: "Larger text", kind: "Display", keywords: "font size zoom", run: function () { setTextSize(currentSizeIndex() + 1); } },
            { label: "Smaller text", kind: "Display", keywords: "font size zoom", run: function () { setTextSize(currentSizeIndex() - 1); } },
            { label: "Toggle high contrast", kind: "Display", keywords: "accessibility", run: toggleContrast },
            { label: motionReduced() ? "Turn animations on" : "Turn animations off", kind: "Display", keywords: "motion accessibility", run: toggleMotion },
            { label: "Open resume (PDF)", kind: "Link", run: openUrl("resume/AditiPanchal.pdf") },
            { label: "Open LinkedIn", kind: "Link", run: openUrl("https://www.linkedin.com/in/aditipanchal/") },
            { label: "Open GitHub", kind: "Link", run: openUrl("https://github.com/aditipanchal121") },
            { label: "Open Google Scholar", kind: "Link", run: openUrl("https://scholar.google.com/citations?user=2lNyq74AAAAJ&hl=en&oi=ao") },
            { label: "Send an email", kind: "Link", keywords: email, run: function () { location.href = "mailto:" + email; } }
        );
        return list;
    }

    var allCommands = [], results = [], selected = 0;
    function score(cmd, words) {
        var label = cmd.label.toLowerCase();
        var hay = (label + " " + cmd.kind + " " + (cmd.keywords || "")).toLowerCase();
        var s = 0;
        for (var i = 0; i < words.length; i++) {
            var w = words[i];
            if (label.indexOf(w) === 0) s += 4;
            else if (label.indexOf(" " + w) !== -1) s += 3;
            else if (label.indexOf(w) !== -1) s += 2;
            else if (hay.indexOf(w) !== -1) s += 1;
            else return -1;
        }
        return s;
    }
    function renderPalette() {
        var q = paletteInput.value.trim().toLowerCase();
        var words = q ? q.split(/\s+/) : [];
        results = allCommands
            .map(function (c, i) { return { c: c, s: words.length ? score(c, words) : 0, i: i }; })
            .filter(function (r) { return r.s >= 0; })
            .sort(function (a, b) { return b.s - a.s || a.i - b.i; })
            .slice(0, 40)
            .map(function (r) { return r.c; });
        selected = Math.min(selected, Math.max(results.length - 1, 0));
        paletteList.innerHTML = "";
        if (!results.length) {
            paletteList.innerHTML = '<li class="empty" role="option" aria-disabled="true">No matches</li>';
            paletteInput.removeAttribute("aria-activedescendant");
            return;
        }
        results.forEach(function (c, i) {
            var li = document.createElement("li");
            li.id = "palette-opt-" + i;
            li.setAttribute("role", "option");
            li.setAttribute("aria-selected", String(i === selected));
            var label = document.createElement("span");
            label.textContent = c.label;
            var kind = document.createElement("span");
            kind.className = "kind";
            kind.textContent = c.kind;
            li.appendChild(label);
            li.appendChild(kind);
            li.addEventListener("mousemove", function () { if (selected !== i) { selected = i; highlight(); } });
            li.addEventListener("click", function () { runSelected(i); });
            paletteList.appendChild(li);
        });
        highlight();
    }
    function highlight() {
        paletteList.querySelectorAll("li[role=option]").forEach(function (li, i) {
            li.setAttribute("aria-selected", String(i === selected));
            if (i === selected) {
                paletteInput.setAttribute("aria-activedescendant", li.id);
                li.scrollIntoView({ block: "nearest" });
            }
        });
    }
    function runSelected(i) {
        var cmd = results[i];
        if (!cmd) return;
        palette.close();
        cmd.run();
    }
    function openPalette() {
        if (palette.open) return;
        allCommands = commands();
        paletteInput.value = "";
        selected = 0;
        renderPalette();
        palette.showModal();
        paletteInput.focus();
    }
    paletteInput.addEventListener("input", function () { selected = 0; renderPalette(); });
    paletteInput.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown") { e.preventDefault(); selected = Math.min(selected + 1, results.length - 1); highlight(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); selected = Math.max(selected - 1, 0); highlight(); }
        else if (e.key === "Enter") { e.preventDefault(); runSelected(selected); }
    });
    palette.addEventListener("click", function (e) { if (e.target === palette) palette.close(); });
    paletteBtn.addEventListener("click", openPalette);
    document.addEventListener("keydown", function (e) {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            palette.open ? palette.close() : openPalette();
        }
    });

    // ---------------------------------------------------------------
    // Highlight the nav link for the section in view
    // ---------------------------------------------------------------
    var links = {};
    navLinks.forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    if ("IntersectionObserver" in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    Object.keys(links).forEach(function (id) { links[id].classList.toggle("active", id === e.target.id); });
                }
            });
        }, { rootMargin: "-40% 0px -55% 0px" });
        document.querySelectorAll("main section").forEach(function (s) { observer.observe(s); });
    }
})();
