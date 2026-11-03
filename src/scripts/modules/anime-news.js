const AnimeNews = {
    api: "https://api.jikan.moe/v4",

    async init() {
        const section = document.getElementById("news");
        if (!section) return;

        section.innerHTML = `
            <div class="section-heading">
                <div>
                    <p class="section-label">STAY UPDATED</p>
                    <h2>Anime News</h2>
                </div>
            </div>
            <div class="news-categories">
                <button class="active" data-category="all">All</button>
                <button data-category="announcements">Announcements</button>
                <button data-category="releases">Releases</button>
                <button data-category="adaptations">Adaptations</button>
                <button data-category="events">Events</button>
            </div>
            <div id="anime-news-list" class="news-grid">
                <p>Loading latest anime news...</p>
            </div>
        `;

        this.bindCategories();
        await this.load();
    },

    async load() {
        const container = document.getElementById("anime-news-list");

        try {
            const response = await fetch(`${this.api}/top/anime?limit=5`);
            if (!response.ok) throw new Error("Unable to load anime list.");

            const result = await response.json();
            const animeList = result.data || [];
            const newsItems = [];

            for (const anime of animeList) {
                try {
                    const newsResponse = await fetch(
                        `${this.api}/anime/${anime.mal_id}/news`
                    );

                    if (!newsResponse.ok) continue;

                    const newsResult = await newsResponse.json();

                    for (const item of newsResult.data || []) {
                        newsItems.push({
                            ...item,
                            animeTitle: anime.title
                        });
                    }
                } catch (error) {
                    console.warn("News unavailable:", anime.title);
                }

                await new Promise(resolve => setTimeout(resolve, 400));
            }

            newsItems.sort((a, b) =>
                new Date(b.date) - new Date(a.date)
            );

            this.items = newsItems;
            this.render(newsItems);
        } catch (error) {
            container.innerHTML =
                "<p>News could not be loaded. Please try again later.</p>";
        }
    },

    items: [],

    render(items) {
        const container = document.getElementById("anime-news-list");

        if (!items.length) {
            container.innerHTML = "<p>No news available right now.</p>";
            return;
        }

        container.innerHTML = items.slice(0, 12).map(item => `
            <article class="news-card">
                <div class="news-card-content">
                    <span class="news-tag">ANIME NEWS</span>
                    <h3>${this.escape(item.title)}</h3>
                    <p class="news-anime">${this.escape(item.animeTitle)}</p>
                    <p class="news-date">
                        ${item.date
                            ? new Date(item.date).toLocaleDateString()
                            : "Date unavailable"}
                    </p>
                    <a href="${this.safeUrl(item.url)}"
                       target="_blank"
                       rel="noopener noreferrer">
                        Read full article →
                    </a>
                </div>
            </article>
        `).join("");
    },

    bindCategories() {
        document.querySelectorAll(".news-categories button")
            .forEach(button => {
                button.addEventListener("click", () => {
                    document.querySelectorAll(".news-categories button")
                        .forEach(item => item.classList.remove("active"));

                    button.classList.add("active");

                    // Jikan provides anime news, not reliable global
                    // category metadata. Keep all results until categories
                    // are backed by a dedicated news source.
                    this.render(this.items);
                });
            });
    },

    safeUrl(value) {
        try {
            const url = new URL(value);
            return url.protocol === "https:" ? this.escape(url.href) : "#";
        } catch {
            return "#";
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

document.addEventListener("DOMContentLoaded", () => AnimeNews.init());
