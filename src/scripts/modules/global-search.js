const GlobalSearch = {
    api: "https://api.jikan.moe/v4",
    timer: null,
    controller: null,

    init() {
        const navbar = document.getElementById("navbar");
        if (!navbar) return;

        const section = document.createElement("section");
        section.id = "global-search";

        section.innerHTML = `
            <div class="section-heading">
                <h2>Explore the Anime Universe</h2>
                <p>Search anime, characters and people in one place.</p>
            </div>

            <div class="global-search-controls">
                <input
                    id="global-search-input"
                    type="search"
                    placeholder="Search anime, characters or people..."
                    autocomplete="off">

                <select id="global-search-type" aria-label="Search category">
                    <option value="anime">Anime</option>
                    <option value="characters">Characters</option>
                    <option value="people">People</option>
                </select>

                <button id="global-search-button" type="button">
                    Search
                </button>
            </div>

            <div id="global-search-results" aria-live="polite"></div>
        `;

        navbar.after(section);

        document.getElementById("global-search-button")
            .addEventListener("click", () => this.search());

        document.getElementById("global-search-input")
            .addEventListener("keydown", event => {
                if (event.key === "Enter") this.search();
            });
    },

    async search() {
        const query = document.getElementById("global-search-input")
            .value.trim();

        const type = document.getElementById("global-search-type").value;
        const results = document.getElementById("global-search-results");

        if (!query) {
            results.innerHTML = "<p>Enter something to search.</p>";
            return;
        }

        clearTimeout(this.timer);
        this.controller?.abort();

        const controller = new AbortController();
        this.controller = controller;

        results.innerHTML = "<p>Searching...</p>";

        try {
            const response = await fetch(
                `${this.api}/${type}?q=${encodeURIComponent(query)}&limit=24`,
                { signal: controller.signal }
            );

            if (!response.ok) throw new Error("Search failed.");

            const data = await response.json();

            if (this.controller !== controller) return;

            this.render(data.data || [], type);
        } catch (error) {
            if (error.name !== "AbortError") {
                results.innerHTML = "<p>Search unavailable. Please try again.</p>";
            }
        }
    },

    render(items, type) {
        const results = document.getElementById("global-search-results");

        if (!items.length) {
            results.innerHTML = "<p>No results found.</p>";
            return;
        }

        results.innerHTML = `
            <div class="global-results-grid">
                ${items.map(item => {
                    const title = item.title || item.name || "Unknown";
                    const image =
                        item.images?.jpg?.image_url || "";

                    const id = Number(item.mal_id);
                    const isAnime = type === "anime";

                    return `
                        <article class="global-result-card">
                            <img
                                src="${this.escape(image)}"
                                alt="${this.escape(title)}"
                                loading="lazy">

                            <div>
                                <h3>${this.escape(title)}</h3>
                                <p>${this.escape(
                                    isAnime
                                        ? `⭐ ${item.score ?? "N/A"} · ${item.type || "Anime"}`
                                        : type === "characters"
                                            ? item.name_kanji || "Character"
                                            : item.family_name || "Person"
                                )}</p>

                                ${isAnime ? `
                                    <button
                                        type="button"
                                        data-anime-id="${id}">
                                        View Details
                                    </button>
                                ` : `
                                    <a
                                        href="https://myanimelist.net/${type}/${id}"
                                        target="_blank"
                                        rel="noopener noreferrer">
                                        View Profile →
                                    </a>
                                `}
                            </div>
                        </article>
                    `;
                }).join("")}
            </div>
        `;
    },

    escape(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    GlobalSearch.init();
});
