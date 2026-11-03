const AnimeLayout = {
    init() {
        document.addEventListener("click", event => {
            const button = event.target.closest("[data-view]");
            if (!button) return;

            const controls = button.closest(".anime-view-controls");
            const section = controls?.parentElement;
            const grid = section?.querySelector(".anime-grid");

            if (!grid) return;

            controls.querySelectorAll("[data-view]").forEach(item => {
                item.classList.toggle("active", item === button);
            });

            grid.classList.toggle(
                "list-view",
                button.dataset.view === "list"
            );
        });

        document.addEventListener("change", event => {
            if (!event.target.matches(".anime-sort")) return;

            const section = event.target.closest("section");
            this.sort(section, event.target.value);
        });

        ["trending", "popular", "seasonal", "search-results"].forEach(id => {
            const section = document.getElementById(id);
            if (section) this.refresh(section);
        });
    },

    refresh(section) {
        if (!section.querySelector(".anime-grid")) return;

        let controls = section.querySelector(".anime-view-controls");

        if (!controls) {
            controls = document.createElement("div");
            controls.className = "anime-view-controls";

            controls.innerHTML = `
                <div class="view-buttons">
                    <button type="button" data-view="grid" class="active">Grid</button>
                    <button type="button" data-view="list">List</button>
                </div>

                <select class="anime-sort" aria-label="Sort anime">
                    <option value="combined">Recommended</option>
                    <option value="score">Highest Rated</option>
                    <option value="popularity">Most Popular</option>
                    <option value="title">Title A–Z</option>
                </select>
            `;

            section.querySelector(".section-heading")
                ?.after(controls);
        }

        const grid = section.querySelector(".anime-grid");
        const activeView = controls.querySelector(
            '[data-view].active'
        )?.dataset.view || "grid";

        grid.classList.toggle("list-view", activeView === "list");
        this.sort(section, controls.querySelector(".anime-sort").value);
    },

    sort(section, method) {
        const grid = section?.querySelector(".anime-grid");
        if (!grid) return;

        const cards = [...grid.children];

        cards.sort((a, b) => {
            const scoreA = Number(a.dataset.score || 0);
            const scoreB = Number(b.dataset.score || 0);
            const popularityA = Number(a.dataset.popularity || 999999);
            const popularityB = Number(b.dataset.popularity || 999999);

            if (method === "score") return scoreB - scoreA;
            if (method === "popularity") return popularityA - popularityB;
            if (method === "title") {
                return a.dataset.title.localeCompare(b.dataset.title);
            }

            return scoreB - scoreA;
        });

        cards.forEach(card => grid.appendChild(card));
    }
};

document.addEventListener("DOMContentLoaded", () => {
    AnimeLayout.init();
});
