"use strict";

const AnimeDetails = {
    api: "https://api.jikan.moe/v4",
    controller: null,

    escape(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    },

    formatList(items) {
        return items?.length
            ? items.map(item => this.escape(item.name)).join(", ")
            : "Unknown";
    },

    async open(animeId) {
        this.controller?.abort();

        const controller = new AbortController();
        this.controller = controller;

        const modal = document.querySelector("#anime-details-modal");
        const content = document.querySelector("#anime-details-content");

        modal.hidden = false;
        document.body.style.overflow = "hidden";
        content.innerHTML = "<p>Loading anime details...</p>";

        try {
            const response = await fetch(
                `${this.api}/anime/${Number(animeId)}/full`,
                { signal: controller.signal }
            );

            if (!response.ok) {
                throw new Error("Unable to load anime details.");
            }

            const result = await response.json();

            if (this.controller !== controller) return;

            const anime = result.data;

            const trailerId = anime.trailer?.youtube_id;
            const validTrailer = /^[a-zA-Z0-9_-]{11}$/.test(
                trailerId || ""
            );

            const studios = this.formatList(anime.studios);
            const producers = this.formatList(anime.producers);
            const genres = this.formatList(anime.genres);
            const themes = this.formatList(anime.themes);
            const demographics = this.formatList(anime.demographics);

            content.innerHTML = `
                <div class="details-layout">

                    <img
                        class="details-poster"
                        src="${this.escape(anime.images?.jpg?.large_image_url || "")}"
                        alt="${this.escape(anime.title)}"
                    >

                    <div class="details-info">

                        <h2>${this.escape(anime.title)}</h2>

                        ${anime.title_japanese ? `
                            <p class="details-japanese">
                                ${this.escape(anime.title_japanese)}
                            </p>
                        ` : ""}

                        <p class="details-score">
                            ⭐ ${anime.score ?? "N/A"} / 10
                        </p>

                        <p><strong>Rank:</strong> ${anime.rank ?? "N/A"}</p>

                        <p><strong>Popularity:</strong> #${anime.popularity ?? "N/A"}</p>

                        <p><strong>Type:</strong> ${this.escape(anime.type || "Unknown")}</p>

                        <p><strong>Source:</strong> ${this.escape(anime.source || "Unknown")}</p>

                        <p><strong>Episodes:</strong> ${anime.episodes ?? "Unknown"}</p>

                        <p><strong>Status:</strong> ${this.escape(anime.status || "Unknown")}</p>

                        <p><strong>Season:</strong>
                            ${this.escape(anime.season || "Unknown")}
                            ${anime.year || ""}
                        </p>

                        <p><strong>Aired:</strong>
                            ${this.escape(anime.aired?.string || "Unknown")}
                        </p>

                        <p><strong>Duration:</strong>
                            ${this.escape(anime.duration || "Unknown")}
                        </p>

                        <p><strong>Rating:</strong>
                            ${this.escape(anime.rating || "Unknown")}
                        </p>

                        <p><strong>Genres:</strong> ${genres}</p>

                        <p><strong>Themes:</strong> ${themes}</p>

                        <p><strong>Demographics:</strong> ${demographics}</p>

                        <p><strong>Studios:</strong> ${studios}</p>

                        <p><strong>Producers:</strong> ${producers}</p>

                    </div>
                </div>

                <div class="details-synopsis">
                    <h3>Synopsis</h3>
                    <p>${this.escape(anime.synopsis || "Synopsis unavailable.")}</p>
                </div>

                ${anime.background ? `
                    <div class="details-background">
                        <h3>Background</h3>
                        <p>${this.escape(anime.background)}</p>
                    </div>
                ` : ""}

                ${validTrailer ? `
                    <div class="details-trailer">
                        <h3>Official Trailer</h3>
                        <a
                            href="https://www.youtube.com/watch?v=${trailerId}"
                            target="_blank"
                            rel="noopener noreferrer">
                            Watch Trailer ↗
                        </a>
                    </div>
                ` : ""}

                <div class="details-external">
                    <a
                        href="https://myanimelist.net/anime/${Number(anime.mal_id)}"
                        target="_blank"
                        rel="noopener noreferrer">
                        View on MyAnimeList ↗
                    </a>
                </div>
            `;

        } catch (error) {
            if (error.name !== "AbortError") {
                content.textContent = error.message;
            }
        }
    },

    close() {
        this.controller?.abort();
        this.controller = null;

        document.querySelector("#anime-details-modal").hidden = true;
        document.body.style.overflow = "";
    },

    init() {
        document.body.insertAdjacentHTML("beforeend", `
            <div id="anime-details-modal" class="details-modal" hidden>
                <div class="details-dialog">
                    <button
                        id="details-close"
                        class="details-close"
                        aria-label="Close details">
                        ✕
                    </button>

                    <div id="anime-details-content"></div>
                </div>
            </div>
        `);

        document.addEventListener("click", event => {
            if (event.target.closest("#details-close")) {
                this.close();
                return;
            }

            if (event.target.id === "anime-details-modal") {
                this.close();
                return;
            }

            // Ignore watchlist and other interactive controls.
            if (
                event.target.closest("[data-watchlist-action]") ||
                event.target.closest("a") ||
                event.target.closest("button:not([data-anime-id])")
            ) {
                return;
            }

            const button = event.target.closest("[data-anime-id]");

            if (button) {
                this.open(button.dataset.animeId);
            }
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") this.close();
        });
    }
};

window.AnimeDetails = AnimeDetails;

document.addEventListener("DOMContentLoaded", () => {
    AnimeDetails.init();
});
