"use strict";

const AnimeDetails = {
    api: "https://api.jikan.moe/v4",

    escape(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    },

    async open(animeId) {
        const modal = document.querySelector("#anime-details-modal");
        const content = document.querySelector("#anime-details-content");

        modal.hidden = false;
        document.body.style.overflow = "hidden";

        content.innerHTML = "<p>Loading anime details...</p>";

        try {
            const response = await fetch(
                `${this.api}/anime/${animeId}/full`
            );

            if (!response.ok) {
                throw new Error("Unable to load anime details.");
            }

            const result = await response.json();
            const anime = result.data;

            const trailerId = anime.trailer?.youtube_id;
            const validTrailer = /^[a-zA-Z0-9_-]{11}$/.test(trailerId || "");

            content.innerHTML = `
                <div class="details-layout">
                    <img
                        class="details-poster"
                        src="${this.escape(anime.images?.jpg?.large_image_url)}"
                        alt="${this.escape(anime.title)}"
                    >

                    <div class="details-info">
                        <h2>${this.escape(anime.title)}</h2>

                        <p class="details-score">
                            ⭐ ${anime.score ?? "N/A"} / 10
                        </p>

                        <p>
                            <strong>Type:</strong>
                            ${this.escape(anime.type || "Unknown")}
                        </p>

                        <p>
                            <strong>Episodes:</strong>
                            ${anime.episodes ?? "Unknown"}
                        </p>

                        <p>
                            <strong>Status:</strong>
                            ${this.escape(anime.status || "Unknown")}
                        </p>

                        <p>
                            <strong>Year:</strong>
                            ${anime.year ?? "Unknown"}
                        </p>

                        <p>
                            <strong>Duration:</strong>
                            ${this.escape(anime.duration || "Unknown")}
                        </p>

                        <p>
                            <strong>Genres:</strong>
                            ${anime.genres?.map(g => this.escape(g.name)).join(", ") || "Unknown"}
                        </p>
                    </div>
                </div>

                <div class="details-synopsis">
                    <h3>Synopsis</h3>
                    <p>${this.escape(anime.synopsis || "Synopsis unavailable.")}</p>
                </div>

                ${validTrailer ? `
                    <div class="details-trailer">
                        <h3>Official Trailer</h3>
                        <a
                            href="https://www.youtube.com/watch?v=${trailerId}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Watch Trailer ↗
                        </a>
                    </div>
                ` : ""}
            `;

        } catch (error) {
            content.textContent = error.message;
        }
    },

    close() {
        document.querySelector("#anime-details-modal").hidden = true;
        document.body.style.overflow = "";
    },

    init() {
        document.body.insertAdjacentHTML("beforeend", `
            <div id="anime-details-modal" class="details-modal" hidden>
                <div class="details-dialog">
                    <button id="details-close" class="details-close"
                        aria-label="Close details">✕</button>
                    <div id="anime-details-content"></div>
                </div>
            </div>
        `);

        document.addEventListener("click", event => {
            if (event.target.closest("#details-close")) {
                this.close();
            }

            if (event.target.id === "anime-details-modal") {
                this.close();
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
document.addEventListener("DOMContentLoaded", () => AnimeDetails.init());
