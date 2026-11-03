"use strict";

const AnimeVerse = {
    api: "https://api.jikan.moe/v4",

    state: {
        trending: [],
        popular: [],
        seasonal: [],
        searchController: null,
        searchTimer: null,
        searchQuery: "",
        searchPage: 1,
        searchTotalPages: 1
    },

    init() {
        this.renderNavbar();
        this.renderHero();
        this.createSearchSection();
        this.bindSearch();
        this.loadHomepage();
    },

    renderNavbar() {
        document.querySelector("#navbar").innerHTML = `
            <nav class="navbar">
                <a href="#home" class="logo">Anime<span>Verse</span></a>

                <div class="nav-links">
                    <a href="#home">Home</a>
                    <a href="#trending">Trending</a>
                    <a href="#popular">Popular</a>
                    <a href="#seasonal">Seasonal</a>
                    <a href="#news">News</a>
                </div>

                <input
                    type="search"
                    id="anime-search"
                    placeholder="Search anime..."
                    aria-label="Search anime">
            </nav>
        `;
    },

    renderHero() {
        document.querySelector("#hero").innerHTML = `
            <div class="hero-content" id="home">
                <p class="eyebrow">WELCOME TO THE ANIME UNIVERSE</p>
                <h1>Discover Your Next <span>Anime Adventure.</span></h1>
                <p>
                    Explore anime, discover new stories and experience
                    the world of Japanese animation.
                </p>
                <a href="#trending" class="hero-button">
                    Explore Anime →
                </a>
            </div>
        `;
    },

    createSearchSection() {
        document.querySelector("#hero").insertAdjacentHTML(
            "afterend",
            '<section id="search-results" hidden></section>'
        );
    },

    bindSearch() {
        const input = document.querySelector("#anime-search");

        input.addEventListener("input", event => {
            clearTimeout(this.state.searchTimer);

            const query = event.target.value.trim();

            if (!query) {
                this.clearSearch();
                return;
            }

            this.state.searchQuery = query;
            this.state.searchPage = 1;

            this.state.searchTimer = setTimeout(() => {
                this.searchAnime(query, 1);
            }, 700);
        });

        document.addEventListener("click", event => {
            const button = event.target.closest("[data-search-page]");
            if (!button || button.disabled) return;

            const page = Number(button.dataset.searchPage);

            if (
                !Number.isInteger(page) ||
                page < 1 ||
                page > this.state.searchTotalPages
            ) return;

            this.searchAnime(this.state.searchQuery, page);
        });
    },

    async request(endpoint, signal) {
        const response = await fetch(
            `${this.api}${endpoint}`,
            { signal }
        );

        if (!response.ok) {
            throw new Error(`Anime API error: ${response.status}`);
        }

        return response.json();
    },

    async loadHomepage() {
        const sections = [
            {
                id: "trending",
                title: "Trending Anime",
                endpoint: "/top/anime?limit=12",
                state: "trending"
            },
            {
                id: "popular",
                title: "Most Popular Anime",
                endpoint: "/top/anime?filter=bypopularity&limit=12",
                state: "popular"
            },
            {
                id: "seasonal",
                title: "Currently Airing Anime",
                endpoint: "/seasons/now?limit=12",
                state: "seasonal"
            }
        ];

        for (const item of sections) {
            try {
                const result = await this.request(item.endpoint);

                this.state[item.state] = result.data || [];

                this.renderAnimeSection(
                    item.id,
                    item.title,
                    this.state[item.state]
                );
            } catch (error) {
                this.showError(item.id, error.message);
            }
        }
    },

    async searchAnime(query, page = 1) {
        if (!query) return;

        this.state.searchController?.abort();

        const controller = new AbortController();
        this.state.searchController = controller;

        const section = document.querySelector("#search-results");

        section.hidden = false;
        section.innerHTML = "<p>Searching anime...</p>";

        try {
            const params = new URLSearchParams({
                q: query,
                limit: "24",
                page: String(page),
                sfw: "true"
            });

            const result = await this.request(
                `/anime?${params.toString()}`,
                controller.signal
            );

            if (this.state.searchController !== controller) return;

            this.state.searchPage = page;
            this.state.searchTotalPages =
                result.pagination?.last_visible_page || 1;

            this.renderAnimeSection(
                "search-results",
                `Search Results: ${query}`,
                result.data || []
            );

            if (!result.data?.length) {
                section.innerHTML = `
                    <p>No anime found. Try another title.</p>
                `;
                return;
            }

            this.renderPagination();

        } catch (error) {
            if (error.name !== "AbortError") {
                this.showError("search-results", error.message);
            }
        }
    },

    renderPagination() {
        const section = document.querySelector("#search-results");

        if (!section) return;

        const oldPagination = section.querySelector(".search-pagination");
        oldPagination?.remove();

        const current = this.state.searchPage;
        const total = this.state.searchTotalPages;

        if (total <= 1) return;

        const pagination = document.createElement("div");
        pagination.className = "search-pagination";

        pagination.innerHTML = `
            <button
                type="button"
                data-search-page="${current - 1}"
                ${current <= 1 ? "disabled" : ""}>
                ← Previous
            </button>

            <span>
                Page ${current} of ${total}
            </span>

            <button
                type="button"
                data-search-page="${current + 1}"
                ${current >= total ? "disabled" : ""}>
                Next →
            </button>
        `;

        section.appendChild(pagination);
    },

    clearSearch() {
        clearTimeout(this.state.searchTimer);

        this.state.searchController?.abort();
        this.state.searchController = null;

        this.state.searchQuery = "";
        this.state.searchPage = 1;
        this.state.searchTotalPages = 1;

        const section = document.querySelector("#search-results");

        section.hidden = true;
        section.innerHTML = "";
    },

    renderAnimeSection(id, title, animeList) {
        const section = document.getElementById(id);
        if (!section) return;

        section.hidden = false;

        section.innerHTML = `
            <div class="section-heading">
                <h2>${this.escape(title)}</h2>
            </div>

            <div class="anime-grid">
                ${animeList.map(anime => `
                    <article
                        class="anime-card"
                        data-anime-id="${Number(anime.mal_id)}"
                        data-score="${Number(anime.score) || 0}"
                        data-popularity="${Number(anime.popularity) || 999999}"
                        data-title="${this.escape(anime.title).toLowerCase()}"
                        tabindex="0"
                        role="button"
                        aria-label="View ${this.escape(anime.title)} details">

                        <img
                            src="${this.escape(anime.images?.jpg?.large_image_url || "")}"
                            alt="${this.escape(anime.title)}"
                            loading="lazy">

                        <div class="anime-info">
                            <h3>${this.escape(anime.title)}</h3>
                            <p>
                                ⭐ ${anime.score ?? "N/A"}
                                · ${this.escape(anime.type || "Anime")}
                            </p>
                        </div>
                    </article>
                `).join("")}
            </div>
        `;

        if (window.AnimeLayout) {
            AnimeLayout.refresh(section);
        }
    },

    showError(id, message) {
        const section = document.getElementById(id);
        if (!section) return;

        section.innerHTML = `
            <p>Unable to load this section. Please try again later.</p>
        `;

        console.error(message);
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
    AnimeVerse.init();
});
