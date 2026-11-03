const AnimeWatchlist = {
    storageKey: "animeverse_watchlist",
    items: [],

    init() {
        this.load();
        this.createSection();
        this.addButtons();

        document.addEventListener("click", event => {
            const button = event.target.closest("[data-watchlist-action]");
            if (!button) return;

            const card = button.closest("[data-anime-id]");
            if (!card) return;

            const id = Number(card.dataset.animeId);
            const anime = {
                id,
                title: card.querySelector("h3")?.textContent || "Unknown Anime",
                image: card.querySelector("img")?.src || "",
                status: "Plan to Watch"
            };

            if (button.dataset.watchlistAction === "add") {
                this.add(anime);
            } else {
                this.remove(id);
            }
        });

        this.render();
    },

    load() {
        try {
            const saved = JSON.parse(
                localStorage.getItem(this.storageKey) || "[]"
            );

            this.items = Array.isArray(saved)
                ? saved.filter(item =>
                    Number.isSafeInteger(Number(item.id)) &&
                    Number(item.id) > 0
                )
                : [];
        } catch {
            this.items = [];
        }
    },

    save() {
        try {
            localStorage.setItem(
                this.storageKey,
                JSON.stringify(this.items)
            );
        } catch {
            alert("Unable to save watchlist in this browser.");
        }
    },

    createSection() {
        const main = document.querySelector("main");
        if (!main || document.getElementById("watchlist")) return;

        const section = document.createElement("section");
        section.id = "watchlist";
        section.innerHTML = `
            <div class="section-heading">
                <h2>My Watchlist ❤️</h2>
                <p>Your personal anime collection</p>
            </div>
            <div id="watchlist-items" class="watchlist-grid"></div>
        `;

        main.appendChild(section);
    },

    addButtons() {
        const observer = new MutationObserver(() => {
            document.querySelectorAll(
                ".anime-card[data-anime-id], .global-result-card[data-anime-id], .surprise-card[data-anime-id]"
            ).forEach(card => {
                if (card.querySelector("[data-watchlist-action]")) return;

                const button = document.createElement("button");
                button.type = "button";
                button.dataset.watchlistAction = "add";
                button.textContent = "❤️ Add to Watchlist";
                card.appendChild(button);
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },

    add(anime) {
        if (this.items.some(item => item.id === anime.id)) {
            alert("This anime is already in your watchlist.");
            return;
        }

        this.items.push(anime);
        this.save();
        this.render();
    },

    remove(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.save();
        this.render();
    },

    updateStatus(id, status) {
        const anime = this.items.find(item => item.id === id);
        if (!anime) return;

        anime.status = status;
        this.save();
        this.render();
    },

    render() {
        const container = document.getElementById("watchlist-items");
        if (!container) return;

        if (!this.items.length) {
            container.innerHTML = "<p>Your watchlist is empty. Add anime to get started!</p>";
            return;
        }

        container.innerHTML = this.items.map(anime => `
            <article class="watchlist-card">
                <img src="${this.escape(anime.image)}"
                     alt="${this.escape(anime.title)}">

                <div class="watchlist-info">
                    <h3>${this.escape(anime.title)}</h3>

                    <select
                        aria-label="Watch status"
                        onchange="AnimeWatchlist.updateStatus(${Number(anime.id)}, this.value)">
                        ${["Plan to Watch", "Watching", "Completed", "On Hold", "Dropped"]
                            .map(status => `
                                <option value="${status}"
                                    ${anime.status === status ? "selected" : ""}>
                                    ${status}
                                </option>
                            `).join("")}
                    </select>

                    <button type="button"
                        onclick="AnimeWatchlist.remove(${Number(anime.id)})">
                        Remove
                    </button>
                </div>
            </article>
        `).join("");
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
    AnimeWatchlist.init();
});
