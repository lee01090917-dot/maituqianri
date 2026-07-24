const API = "https://script.google.com/macros/s/AKfycbwow8HLqsqki1Plrj6qWFQXXa8UYuYfRwyCzY5NBM9spdoh8bsZJUE3t0paKewm2g5v/exec";

let allEvents = [];
let currentCategory = "ALL";

document.addEventListener("DOMContentLoaded", () => {

    loadEvents();
    loadNotice();
    loadCurrent();
    loadLinks();

    initCategory();
    initSearch();

});

function initSearch() {

    const input = document.getElementById("searchInput");

    if (!input) return;

    input.addEventListener("input", () => {

        renderEvents();

    });

}

function initCategory() {

    const buttons = document.querySelectorAll(".category button");

    buttons.forEach(btn => {

        btn.addEventListener("click", () => {

            buttons.forEach(b => b.classList.remove("active"));

            btn.classList.add("active");

            currentCategory = btn.dataset.category || "ALL";

            renderEvents();

        });

    });

}

async function loadEvents() {

    const container = document.getElementById("event-list");

    if (!container) return;

    container.innerHTML = "<div class='card'>載入中...</div>";

    try {

        const res = await fetch(API + "?type=events");

        allEvents = await res.json();

        renderEvents();

    } catch (err) {

        console.error(err);

        container.innerHTML = "<div class='card'>讀取失敗</div>";

    }

}

function renderEvents() {

    const container = document.getElementById("event-list");

    if (!container) return;

    container.innerHTML = "";

    let keyword = "";

    const input = document.getElementById("searchInput");

    if (input) {

        keyword = input.value.trim().toLowerCase();

    }

    let list = [...allEvents];

    if (currentCategory !== "ALL") {

        list = list.filter(item => item["分類"] === currentCategory);

    }

    if (keyword) {

        list = list.filter(item => {

            const text = [

                item["ID"],

                item["場次"],

                item["成員"],

                item["分類"],

                item["備註"]

            ].join(" ").toLowerCase();

            return text.includes(keyword);

        });

    }

    if (list.length === 0) {

        container.innerHTML = `
            <div class="card">
                找不到符合的資料
            </div>
        `;

        return;

    }

    list.forEach(event => {

        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `
            <div class="event-title">
                ${event["場次"] || ""}
            </div>

            <div class="member">
                成員｜${event["成員"] || ""}
            </div>

            <div class="member">
                分類｜${event["分類"] || ""}
            </div>

            <div class="price">
                ${formatPrice(event)}
            </div>

            ${
                event["備註"]
                ? `<div class="note">${event["備註"]}</div>`
                : ""
            }
        `;

        container.appendChild(card);

    });

}
function formatPrice(event) {

    const type = event["拆團方式"] || "";
    const price = event["規格／價格"] || "";

    if (!price) return "";

    if (type === "包數") {
        return formatPackage(price);
    }

    if (type === "P數") {
        return formatP(price);
    }

    return price.replace(/\n/g, "<br>");

}

function formatPackage(text) {

    const rows = text.split("\n");

    let html = "";

    rows.forEach((row, index) => {

        const data = row.split("|");

        if (data.length < 3) return;

        const name = data[0];
        const p = Number(data[1]);
        const price = Number(data[2]);

        const perPrice = (price / p).toFixed(2).replace(/\.00$/, "");

        if (index === 0) {

            html += `
                ${name}　${p}P／$${price}（1P／$${perPrice}）
            `;

        } else {

            html += `
                <br><br>
                ${name}　${p}P／$${price}
            `;

        }

    });

    return html;

}

function formatP(text) {

    const data = text.split("|");

    if (data.length < 2) return text;

    return `
        ${data[0]}P（1P／$${data[1]}）
    `;

}

async function loadNotice() {

    const container = document.getElementById("notice-list");

    if (!container) return;

    container.innerHTML = "<div class='card'>載入中...</div>";

    try {

        const res = await fetch(API + "?type=notice");

        const data = await res.json();

        container.innerHTML = "";

        if (!Array.isArray(data) || data.length === 0) {

            container.innerHTML = "<div class='card'>目前沒有公告</div>";

            return;

        }

        data.forEach(item => {

            const card = document.createElement("div");

            card.className = "card";

            card.innerHTML = `
                <div class="event-title">
                    ${item["場次"] || ""}
                </div>

                <div class="note">
                    ${item["公告"] || ""}
                </div>
            `;

            container.appendChild(card);

        });

    } catch (err) {

        console.error(err);

        container.innerHTML = "<div class='card'>公告讀取失敗</div>";

    }

}
async function loadCurrent() {

    const container = document.getElementById("current-list");

    if (!container) return;

    container.innerHTML = "<div class='card'>載入中...</div>";

    try {

        const res = await fetch(API + "?type=current");

        const data = await res.json();

        container.innerHTML = "";

        if (!Array.isArray(data) || data.length === 0) {

            container.innerHTML = "<div class='card'>目前沒有開拆場次</div>";

            return;

        }

        data.forEach(item => {

            const card = document.createElement("div");

            card.className = "card";

            card.innerHTML = `
                <div class="event-title">
                    ${item["場次"] || ""}
                </div>

                <div class="member">
                    成員｜${item["成員"] || ""}
                </div>
            `;

            container.appendChild(card);

        });

    } catch (err) {

        console.error(err);

        container.innerHTML = "<div class='card'>讀取失敗</div>";

    }

}

async function loadLinks() {

    const container = document.getElementById("link-list");

    if (!container) return;

    try {

        const res = await fetch(API + "?type=links");

        const data = await res.json();

        container.innerHTML = "";

        if (!Array.isArray(data)) return;

        data.forEach(item => {

            const a = document.createElement("a");

            a.className = "link-btn";

            a.href = item["網址"] || "#";

            a.target = "_blank";

            a.rel = "noopener noreferrer";

            a.textContent = item["名稱"] || "未命名";

            container.appendChild(a);

        });

    } catch (err) {

        console.error(err);

    }

}

/* ===========================
   ❤️ 我的收藏（V3預留）
=========================== */

let favoriteList = [];

/* ===========================
   🛒 我的清單（V3預留）
=========================== */

let cartList = [];

/* ===========================
   🧮 試算器（V3預留）
=========================== */

function calculateTotal() {

    let total = 0;

    cartList.forEach(item => {

        total += item.price || 0;

    });

    return total;

}
