"use strict";

const AnimeFilters = {
    api: "https://api.jikan.moe/v4",

    genres: [
        ["1", "Action"],
        ["2", "Adventure"],
        ["4", "Comedy"],
        ["8", "Drama"],
        ["10", "Fantasy"],
        ["14", "Horror"],
        ["7", "Mystery"],
        ["22", "Romance"],
        ["24", "Sci-Fi"],
        ["36", "Slice of Life"],
        ["30", "Sports"],
        ["37", "Supernatural"],
        ["41", "Suspense"]
    ],

    init() {
        const search = document.querySelector("#search-results");

        search.insertAdjacentHTML("afterend", `
            <section id="anime-filters">
                <div class="section-heading">
                    <h2>Discover Anime</h2>
                </div>

                <form id="filter-form" class="filter-form">
                    <select name="genre">
                        <option value="">All Genres</option>
                        ${this.genres.map(([id, name]) =>
                            `<option value="${id}">${name}</option>`
                        ).join("")}
                    </select>

                    <select name="type">
                        <option value="">All Types</option>
                        <option value="tv">TV</option>
                        <option value="movie">Movie</option>
                        <option value="ova">OVA</option>
                        <option value="ona">ONA</option>
                        <option value="special">Special</option>
                    </select>

                    <input name="year" type="number"
                        min="1960" max="2035" placeholder="Release year">

                    <select name="season">
                        <option value="">All Seasons</option>
                        <option value="winter">Winter</option>
                        <option value="spring">Spring</option>
                        <option value="summer">Summer</option>
                        <option value="fall">Fall</option>
                    </select>

                    <select name="rating">
                        <option value="">Any Rating</option>
                        <option value="7">7+ Score</option>
                        <option value="8">8+ Score</option>
                        <option value="9">9+ Score</option>
                    </select>

                    <select name="status">
                        <option value="">All Status</option>
                        <option value="airing">Currently Airing</option>
                        <option value="complete">Completed</option>
                        <option value="upcoming">Upcoming</option>
                    </select>

                    <select name="sort">
                        <option value="score">Top Rated</option>
                        <option value="popularity">Popularity</option>
                        <option value="members">Most Members</option>
                    </select>

                    <button type="submit">Apply Filters</button>
                    <button type="reset" class="filter-reset">Reset</button>
                </form>

                <div id="filter-results" aria-live="polite">
                    <p>Choose filters to discover anime.</p>
                </div>
            </section>
        `);

        document.querySelector("#filter-form")
            .addEventListener("submit", event => {
                event.preventDefault();
                this.search();
            });

        document.querySelector("#filter-form")
            .addEventListener("reset", () => {
                setTimeout(() => {
                    document.querySelector("#filter-results").innerHTML =
                        "<p>Choose filters to discover anime.</p>";
                }, 0);
            });
    },

    async search() {
        const form = document.querySelector("#filter-form");
        const data = new FormData(form);
        const results = document.querySelector("#filter-results");

        const params = new URLSearchParams({
            limit: "24",
            order_by: data.get("sort"),
            sort: "desc"
        });

        const genre = data.get("genre");
        const type = data.get("type");
        const year = data.get("year");
        const season = data.get("season");
        const rating = data.get("rating");
        const status = data.get("status");

        if (genre) params.set("genres", genre);
        if (type) params.set("type", type);
        if (rating) params.set("min_score", rating);
        if (status) params.set("status", status);

        if (year && season) {
            const months = {
                winter: ["01-01", "03-31"],
                spring: ["04-01", "06-30"],
                summer: ["07-01", "09-30"],
                fall: ["10-01", "12-31"]
            };

            params.set("start_date", `${year}-${months[season][0]}`);
            params.set("end_date", `${year}-${months[season][1]}`);
        } else if (year) {
            params.set("start_date", `${year}-01-01`);
            params.set("end_date", `${year}-12-31`);
        } else if (season) {
            results.textContent = "Please select a release year with a season.";
            return;
        }

        results.innerHTML = "<p>Finding anime...</p>";

        try {
            const response = await fetch(
                `${this.api}/anime?${params.toString()}`
            );

            if (!response.ok) {
                throw new Error("Unable to fetch filtered anime.");
            }

            const result = await response.json();

            this.render(result.data || []);

        } catch (error) {
            results.textContent = error.message;
        }
    },

    render(animeList) {
        const results = document.querySelector("#filter-results");

        if (!animeList.length) {
            results.textContent = "No anime found. Try different filters.";
            return;
        }

        results.innerHTML = `
            <div class="anime-grid">
                ${animeList.map(anime => `
                    <article class="anime-card"
                        data-anime-id="${anime.mal_id}"
                        tabindex="0"
                        role="button">

                        <img
                            src="${anime.images?.jpg?.large_image_url || ""}"
                            alt="${this.escape(anime.title)}"
                            loading="lazy">

                        <div class="anime-info">
                            <h3>${this.escape(anime.title)}</h3>
                            <p>⭐ ${anime.score ?? "N/A"} ·
                                ${this.escape(anime.type || "Anime")}
                            </p>
                        </div>
                    </article>
                `).join("")}
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

document.addEventListener("DOMContentLoaded", () => AnimeFilters.init());
