const SurpriseMe = {
    api: "https://api.jikan.moe/v4",

    genres: [
        { id: 1, name: "Action" },
        { id: 2, name: "Adventure" },
        { id: 4, name: "Comedy" },
        { id: 8, name: "Drama" },
        { id: 10, name: "Fantasy" },
        { id: 14, name: "Horror" },
        { id: 22, name: "Romance" },
        { id: 24, name: "Sci-Fi" },
        { id: 27, name: "Shounen" },
        { id: 36, name: "Slice of Life" },
        { id: 37, name: "Supernatural" },
        { id: 41, name: "Suspense" }
    ],

    init() {
        const hero = document.getElementById("hero");
        if (!hero) return;

        const section = document.createElement("section");
        section.id = "surprise-me";

        section.innerHTML = `
            <div class="section-heading">
                <h2>Surprise Me 🎲</h2>
                <p>Discover your next favourite anime.</p>
            </div>

            <div class="surprise-panel">
                <label for="surprise-genre">Genre</label>
                <select id="surprise-genre">
                    <option value="">Any Genre</option>
                    ${this.genres.map(genre => `
                        <option value="${genre.id}">
                            ${genre.name}
                        </option>
                    `).join("")}
                </select>

                <label for="surprise-year">Release Year</label>
                <select id="surprise-year">
                    <option value="">Any Year</option>
                    ${Array.from(
                        { length: 2026 - 1980 + 1 },
                        (_, i) => 2026 - i
                    ).map(year => `
                        <option value="${year}">${year}</option>
                    `).join("")}
                </select>

                <label for="surprise-rating">Minimum Rating</label>
                <select id="surprise-rating">
                    <option value="0">Any Rating</option>
                    <option value="6">6+</option>
                    <option value="7">7+</option>
                    <option value="8">8+</option>
                    <option value="9">9+</option>
                </select>

                <label for="surprise-type">Anime Type</label>
                <select id="surprise-type">
                    <option value="">Any Type</option>
                    <option value="tv">TV</option>
                    <option value="movie">Movie</option>
                    <option value="ova">OVA</option>
                    <option value="ona">ONA</option>
                </select>

                <button id="surprise-button" type="button">
                    Find Random Anime
                </button>
            </div>

            <div id="surprise-result" aria-live="polite"></div>
        `;

        hero.after(section);

        document.getElementById("surprise-button")
            .addEventListener("click", () => this.find());
    },

    async find() {
        const button = document.getElementById("surprise-button");
        const result = document.getElementById("surprise-result");

        const genre = document.getElementById("surprise-genre").value;
        const year = document.getElementById("surprise-year").value;
        const rating = document.getElementById("surprise-rating").value;
        const type = document.getElementById("surprise-type").value;

        const params = new URLSearchParams({
            limit: "25",
            order_by: "score",
            sort: "desc",
            sfw: "true"
        });

        if (genre) params.set("genres", genre);
        if (year) params.set("start_date", `${year}-01-01`);
        if (year) params.set("end_date", `${year}-12-31`);
        if (rating !== "0") params.set("min_score", rating);
        if (type) params.set("type", type);

        button.disabled = true;
        button.textContent = "Finding anime...";
        result.innerHTML = "<p>Searching for your next anime...</p>";

        try {
            const response = await fetch(
                `${this.api}/anime?${params.toString()}`
            );

            if (!response.ok) {
                throw new Error("Anime discovery failed.");
            }

            const data = await response.json();
            const animeList = data.data || [];

            if (!animeList.length) {
                result.innerHTML = "<p>No anime found. Try changing your filters.</p>";
                return;
            }

            const anime = animeList[
                Math.floor(Math.random() * animeList.length)
            ];

            result.innerHTML = `
                <article class="surprise-card">
                    <img
                        src="${this.escape(anime.images?.jpg?.large_image_url || "")}"
                        alt="${this.escape(anime.title)}">

                    <div>
                        <p class="section-label">YOUR RANDOM PICK</p>
                        <h3>${this.escape(anime.title)}</h3>
                        <p>⭐ ${anime.score ?? "N/A"} · ${this.escape(anime.type || "Anime")}</p>
                        <p>${this.escape(anime.synopsis || "Synopsis unavailable.")}</p>

                        <button
                            type="button"
                            data-anime-id="${Number(anime.mal_id)}">
                            View Details
                        </button>
                    </div>
                </article>
            `;
        } catch (error) {
            result.innerHTML = "<p>Unable to discover anime right now. Try again later.</p>";
            console.error(error);
        } finally {
            button.disabled = false;
            button.textContent = "Find Random Anime";
        }
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

document.addEventListener("DOMContentLoaded", () => SurpriseMe.init());
