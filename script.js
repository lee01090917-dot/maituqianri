/* ==========================================================
   買圖千日 用在一時
   ATEEZ FanPhoto Database
   script.js V2
   PART 01
========================================================== */

"use strict";

/* ==========================================================
   API
========================================================== */

const API = "https://script.google.com/macros/s/AKfycbwow8HLqsqki1Plrj6qWFQXXa8UYuYfRwyCzY5NBM9spdoh8bsZJUE3t0paKewm2g5v/exec";

/* ==========================================================
   LocalStorage Key
========================================================== */

const STORAGE = {

    FAVORITE: "favoriteList",

    CART: "cartList"

};

/* ==========================================================
   Global State
========================================================== */

const State = {

    /* API */

    events: [],

    notices: [],

    currents: [],

    links: [],

    /* Search */

    keyword: "",

    category: "",

    /* Favorite */

    favorites: [],

    /* Cart */

    cart: [],

    /* Modal */

    modalEvent: null,

    selectedOption: null,

    /* Loading */

    loading: false

};

/* ==========================================================
   DOM Cache
========================================================== */

const DOM = {

    eventList: null,

    noticeList: null,

    currentList: null,

    linkList: null,

    searchInput: null,

    categoryButtons: [],

    overlay: null,

    /* Hero */

    favoriteCount: null,

cartCount: null,

cartMoney: null,

favoriteOpen: null,

cartOpen: null,

    /* Favorite */

    favoritePanel: null,

    favoriteItems: null,

    favoriteClose: null,

    /* Cart */

    cartPanel: null,

    cartItems: null,

    cartTotal: null,

    cartCopy: null,

    cartClear: null,

    cartClose: null,

    /* Modal */

    modal: null,

    modalTitle: null,

    modalOptions: null,

    modalConfirm: null,

    modalCancel: null

};

/* ==========================================================
   Cache DOM
========================================================== */

function cacheDOM() {

    DOM.eventList = document.getElementById("event-list");

    DOM.noticeList = document.getElementById("notice-list");

    DOM.currentList = document.getElementById("current-list");

    DOM.linkList = document.getElementById("link-list");

    DOM.searchInput = document.getElementById("searchInput");

    DOM.categoryButtons = [
        ...document.querySelectorAll(".category button")
    ];

    DOM.overlay = document.getElementById("overlay");

   DOM.favoriteCount = document.getElementById("favorite-count");

DOM.cartCount = document.getElementById("cart-count");

DOM.cartMoney = document.getElementById("cart-money");

DOM.favoriteOpen = document.getElementById("favorite-open");

DOM.cartOpen = document.getElementById("cart-open");

    DOM.favoritePanel = document.getElementById("favorite-panel");

    DOM.favoriteItems = document.getElementById("favorite-items");

    DOM.favoriteClose = document.getElementById("close-favorite");

    DOM.cartPanel = document.getElementById("cart-panel");

    DOM.cartItems = document.getElementById("cart-items");

    DOM.cartTotal = document.getElementById("cart-total");

    DOM.cartCopy = document.getElementById("copy-cart");

    DOM.cartClear = document.getElementById("clear-cart");

    DOM.cartClose = document.getElementById("close-cart");

    DOM.modal = document.getElementById("option-modal");

    DOM.modalTitle = document.getElementById("modal-title");

    DOM.modalOptions = document.getElementById("modal-options");

    DOM.modalConfirm = document.getElementById("modal-confirm");

    DOM.modalCancel = document.getElementById("modal-cancel");

}

/* ==========================================================
   LocalStorage
========================================================== */

function loadStorage() {

    try {

        State.favorites = JSON.parse(

            localStorage.getItem(STORAGE.FAVORITE)

        ) || [];

    } catch {

        State.favorites = [];

    }

    try {

        State.cart = JSON.parse(

            localStorage.getItem(STORAGE.CART)

        ) || [];

    } catch {

        State.cart = [];

    }

}

function saveFavorite() {

    localStorage.setItem(

        STORAGE.FAVORITE,

        JSON.stringify(State.favorites)

    );

}

function saveCart() {

    localStorage.setItem(

        STORAGE.CART,

        JSON.stringify(State.cart)

    );

}

/* ==========================================================
   Start
========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    init

);
/* ==========================================================
   PART 02
   Utils
========================================================== */

/* ==========================================================
   Init
========================================================== */

async function init() {

    cacheDOM();

    loadStorage();

    bindEvents();

    updateHeroCount();

    showEventLoading();

    showNoticeLoading();

    showCurrentLoading();

    showLinkLoading();

    await loadAllData();

}

/* ==========================================================
   HTML Escape
========================================================== */

function escapeHTML(text = "") {

    return String(text)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}

/* ==========================================================
   Number
========================================================== */

function toNumber(value) {

    const number = Number(value);

    return Number.isNaN(number)
        ? 0
        : number;

}

function formatCurrency(value) {

    return `NT$${toNumber(value).toLocaleString("zh-TW")}`;

}

/* ==========================================================
   UUID
========================================================== */

function uuid() {

    if (window.crypto?.randomUUID) {

        return crypto.randomUUID();

    }

    return Date.now().toString(36) +

        Math.random()

            .toString(36)

            .substring(2);

}

/* ==========================================================
   Toast
========================================================== */

function showToast(message = "") {

    let toast = document.getElementById("toast");

    if (!toast) {

        toast = document.createElement("div");

        toast.id = "toast";

        toast.style.position = "fixed";

        toast.style.left = "50%";

        toast.style.bottom = "35px";

        toast.style.transform = "translateX(-50%)";

        toast.style.background = "#222";

        toast.style.color = "#fff";

        toast.style.padding = "12px 18px";

        toast.style.borderRadius = "999px";

        toast.style.fontSize = "14px";

        toast.style.zIndex = "999999";

        toast.style.opacity = "0";

        toast.style.transition = ".25s";

        document.body.appendChild(toast);

    }

    toast.textContent = message;

    toast.style.opacity = "1";

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {

        toast.style.opacity = "0";

    }, 2200);

}

/* ==========================================================
   Clipboard
========================================================== */

async function copyText(text) {

    try {

        await navigator.clipboard.writeText(text);

        showToast("📋 已複製到剪貼簿");

        return true;

    }

    catch {

        const textarea = document.createElement("textarea");

        textarea.value = text;

        textarea.style.position = "fixed";

        textarea.style.opacity = "0";

        document.body.appendChild(textarea);

        textarea.focus();

        textarea.select();

        document.execCommand("copy");

        textarea.remove();

        showToast("📋 已複製到剪貼簿");

        return true;

    }

}

/* ==========================================================
   Debounce
========================================================== */

function debounce(fn, delay = 300) {

    let timer = null;

    return (...args) => {

        clearTimeout(timer);

        timer = setTimeout(() => {

            fn(...args);

        }, delay);

    };

}

/* ==========================================================
   Loading
========================================================== */

function loadingHTML(icon, title, text = "") {

    return `

        <div class="empty-state">

            <div class="icon">

                ${icon}

            </div>

            <h3>

                ${title}

            </h3>

            ${text ? `<p>${text}</p>` : ""}

        </div>

    `;

}

function showEventLoading() {

    DOM.eventList.innerHTML = loadingHTML(

        "⏳",

        "飯拍資料載入中..."

    );

}

function showNoticeLoading() {

    DOM.noticeList.innerHTML = `

        <div class="card">

            載入公告中...

        </div>

    `;

}

function showCurrentLoading() {

    DOM.currentList.innerHTML = `

        <div class="card">

            載入中...

        </div>

    `;

}

function showLinkLoading() {

    DOM.linkList.innerHTML = `

        <a class="link-btn">

            載入中...

        </a>

    `;

}
/* ==========================================================
   PART 03
   API
========================================================== */

/* ==========================================================
   API Request
========================================================== */

async function api(type) {

    const response = await fetch(

        `${API}?type=${encodeURIComponent(type)}`,

        {
            method: "GET",
            cache: "no-store"
        }

    );

    if (!response.ok) {

        throw new Error(`HTTP ${response.status}`);

    }

    return await response.json();

}

/* ==========================================================
   Load All Data
========================================================== */

async function loadAllData() {

    State.loading = true;

    try {

        const [

            events,

            notices,

            currents,

            links

        ] = await Promise.all([

            api("events"),

            api("notice"),

            api("current"),

            api("links")

        ]);

        State.events = Array.isArray(events)

            ? events

            : [];

        State.notices = Array.isArray(notices)

            ? notices

            : [];

        State.currents = Array.isArray(currents)

            ? currents

            : [];

        State.links = Array.isArray(links)

            ? links

            : [];

        renderAll();

    }

    catch (error) {

        console.error(error);

        renderLoadError();

    }

    finally {

        State.loading = false;

    }

}

/* ==========================================================
   Render All
========================================================== */

function renderAll() {

    renderNotice();

    renderCurrent();

    renderLinks();

    renderEvents();

    renderFavorite();

    renderCart();

    updateHeroCount();

}

/* ==========================================================
   Error
========================================================== */

function renderLoadError() {

    DOM.eventList.innerHTML = loadingHTML(

        "❌",

        "資料載入失敗",

        "請重新整理後再試"

    );

}

/* ==========================================================
   Empty View
========================================================== */

function emptySearchHTML() {

    return `

        <div class="empty-state">

            <div class="icon">

                🔍

            </div>

            <h3>

                開始搜尋即可查看飯拍資料

            </h3>

            <p>

                可搜尋：
                場次、成員、ID、分類

            </p>

        </div>

    `;

}

function noResultHTML() {

    return `

        <div class="empty-state">

            <div class="icon">

                😢

            </div>

            <h3>

                找不到符合的資料

            </h3>

        </div>

    `;

}

function emptyFavoriteHTML() {

    return `

        <div class="empty-cart">

            尚未收藏任何飯拍

        </div>

    `;

}

function emptyCartHTML() {

    return `

        <div class="empty-cart">

            尚未加入任何飯拍

        </div>

    `;

}

/* ==========================================================
   Render Helpers
========================================================== */

function clearElement(element) {

    if (!element) return;

    element.innerHTML = "";

}

function appendChildren(parent, children) {

    if (!parent) return;

    children.forEach(child => {

        parent.appendChild(child);

    });

}
/* ==========================================================
   PART 04
   Event Binding
========================================================== */

/* ==========================================================
   Bind Events
========================================================== */

function bindEvents() {

    bindSearch();

    bindCategory();

    bindHero();

    bindFavoritePanel();

    bindCartPanel();

    bindModal();

    bindOverlay();

}

/* ==========================================================
   Search
========================================================== */

function bindSearch() {

    if (!DOM.searchInput) return;

    DOM.searchInput.addEventListener(

        "input",

        debounce(event => {

            State.keyword =

                event.target.value

                    .trim()

                    .toLowerCase();

            renderEvents();

        }, 200)

    );

}

/* ==========================================================
   Category
========================================================== */

function bindCategory() {

    DOM.categoryButtons.forEach(button => {

        button.addEventListener("click", () => {

            DOM.categoryButtons.forEach(item => {

                item.classList.remove("active");

            });

            button.classList.add("active");

            State.category =

                button.dataset.category || "";

            renderEvents();

        });

    });

}

/* ==========================================================
   Hero
========================================================== */

function bindHero() {

    DOM.favoriteOpen?.addEventListener(

        "click",

        openFavoritePanel

    );

    DOM.cartOpen?.addEventListener(

        "click",

        openCartPanel

    );

}

/* ==========================================================
   Favorite Panel
========================================================== */

function bindFavoritePanel() {

    DOM.favoriteClose?.addEventListener(

        "click",

        closeFavoritePanel

    );

}

/* ==========================================================
   Cart Panel
========================================================== */

function bindCartPanel() {

    DOM.cartClose?.addEventListener(

        "click",

        closeCartPanel

    );

    DOM.cartCopy?.addEventListener(

        "click",

        copyCart

    );

    DOM.cartClear?.addEventListener(

        "click",

        clearCart

    );

}

/* ==========================================================
   Modal
========================================================== */

function bindModal() {

    DOM.modalCancel?.addEventListener(

        "click",

        closeModal

    );

    DOM.modalConfirm?.addEventListener(

        "click",

        confirmCart

    );

    DOM.modal?.addEventListener(

        "click",

        event => {

            if (event.target === DOM.modal) {

                closeModal();

            }

        }

    );

    document.addEventListener(

        "keydown",

        event => {

            if (event.key !== "Escape") return;

            closeModal();

            closePanels();

        }

    );

}

/* ==========================================================
   Overlay
========================================================== */

function bindOverlay() {

    DOM.overlay?.addEventListener(

        "click",

        () => {

            closePanels();

            closeModal();

        }

    );

}
/* ==========================================================
   PART 05
   Notice
   Current
   Links
========================================================== */

/* ==========================================================
   Render Notice
========================================================== */

function renderNotice() {

    clearElement(DOM.noticeList);

    if (State.notices.length === 0) {

        DOM.noticeList.innerHTML = `

            <div class="card">

                目前沒有公告

            </div>

        `;

        return;

    }

    const fragment = document.createDocumentFragment();

    State.notices.forEach(item => {

        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `

            <div class="event-title">

                ${escapeHTML(item["場次"] || "")}

            </div>

            <div class="note">

                ${escapeHTML(item["公告"] || "")}

            </div>

        `;

        fragment.appendChild(card);

    });

    DOM.noticeList.appendChild(fragment);

}

/* ==========================================================
   Render Current
========================================================== */

function renderCurrent() {

    clearElement(DOM.currentList);

    if (State.currents.length === 0) {

        DOM.currentList.innerHTML = `

            <div class="card">

                目前沒有開拆場次

            </div>

        `;

        return;

    }

    const fragment = document.createDocumentFragment();

    State.currents.forEach(item => {

        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `

            <div class="event-title">

                ${escapeHTML(item["場次"] || "")}

            </div>

            <div class="member">

                👤 ${escapeHTML(item["成員"] || "")}

            </div>

        `;

        fragment.appendChild(card);

    });

    DOM.currentList.appendChild(fragment);

}

/* ==========================================================
   Render Links
========================================================== */

function renderLinks() {

    clearElement(DOM.linkList);

    if (State.links.length === 0) {

        DOM.linkList.innerHTML = `

            <a class="link-btn">

                尚無快速連結

            </a>

        `;

        return;

    }

    const fragment = document.createDocumentFragment();

    State.links.forEach(item => {

        const link = document.createElement("a");

        link.className = "link-btn";

        link.href = item["網址"] || "#";

        link.target = "_blank";

        link.rel = "noopener noreferrer";

        link.textContent = item["名稱"] || "未命名";

        fragment.appendChild(link);

    });

    DOM.linkList.appendChild(fragment);

}
/* ==========================================================
   PART 06
   Search
   Event Render
========================================================== */

/* ==========================================================
   Render Events
========================================================== */

function renderEvents() {

    if (!DOM.eventList) return;

    clearElement(DOM.eventList);

    const keyword = State.keyword;

    const category = State.category;

    /* ---------- 尚未搜尋 ---------- */

    if (!keyword && !category) {

        DOM.eventList.innerHTML = emptySearchHTML();

        return;

    }

    /* ---------- 篩選 ---------- */

    const list = State.events.filter(event => {

        if (
            category &&
            event["分類"] !== category
        ) {

            return false;

        }

        if (!keyword) {

            return true;

        }

        const target = [

            event["ID"],

            event["場次"],

            event["成員"],

            event["分類"],

            event["備註"]

        ]

            .join(" ")

            .toLowerCase();

        return target.includes(keyword);

    });

    /* ---------- 沒資料 ---------- */

    if (list.length === 0) {

        DOM.eventList.innerHTML = noResultHTML();

        return;

    }

    /* ---------- Render ---------- */

    const fragment = document.createDocumentFragment();

    list.forEach(event => {

        fragment.appendChild(

            createEventCard(event)

        );

    });

    DOM.eventList.appendChild(fragment);

}

/* ==========================================================
   Create Event Card
========================================================== */

function createEventCard(event) {

    const card = document.createElement("div");

    card.className = "card";

    const favorite = State.favorites.includes(

        event["ID"]

    );

    card.innerHTML = `

        <div
            style="
                display:flex;
                justify-content:space-between;
                align-items:flex-start;
                gap:12px;
            ">

            <div>

                <div class="event-title">

                    ${escapeHTML(event["場次"] || "")}

                </div>

            </div>

            <div
                style="
                    display:flex;
                    gap:8px;
                ">

                <button
                    class="favorite-btn">

                    ${favorite ? "❤️" : "🤍"}

                </button>

                <button
                    class="cart-btn">

                    🛒

                </button>

            </div>

        </div>

        <div class="member">

            👤 成員｜
            ${escapeHTML(event["成員"] || "")}

        </div>

        <div class="member">

            📂 分類｜
            ${escapeHTML(event["分類"] || "")}

        </div>

        <div class="price">

            ${renderPrice(event)}

        </div>

        ${

            event["備註"]

                ?

                `

                <div class="note">

                    📝 ${escapeHTML(event["備註"])}

                </div>

                `

                :

                ""

        }

    `;

    /* ---------- 收藏 ---------- */

    card
        .querySelector(".favorite-btn")
        .addEventListener("click", () => {

            toggleFavorite(event);

        });

    /* ---------- 喊單 ---------- */

    card
        .querySelector(".cart-btn")
        .addEventListener("click", () => {

            openModal(event);

        });

    return card;

}
/* ==========================================================
   PART 07
   Price Parser
========================================================== */

/* ==========================================================
   Render Price
========================================================== */

function renderPrice(event) {

    const mode = event["拆團方式"] || "";

    const text = event["規格／價格"] || "";

    if (!text) {

        return "";

    }

    switch (mode) {

        case "包數":

            return renderPackagePrice(text);

        case "P數":

            return renderPointPrice(text);

        default:

            return renderNormalPrice(text);

    }

}

/* ==========================================================
   一般價格
========================================================== */

function renderNormalPrice(text) {

    return escapeHTML(text)

        .replace(/\n/g, "<br>");

}

/* ==========================================================
   包數
========================================================== */

function renderPackagePrice(text) {

    const rows = text

        .split("\n")

        .filter(row => row.trim() !== "");

    let html = "";

    rows.forEach((row, index) => {

        const cols = row.split("|");

        if (cols.length < 3) return;

        const name = cols[0];

      const point = toNumber(cols[1]);
const eachPrice = toNumber(cols[2]);
const price = point * eachPrice;

       const each = eachPrice;
        html += `

            ${index ? "<br><br>" : ""}

            <strong>

                ${escapeHTML(name)}

            </strong>

            <br>

           ${point}包 ／ ${formatCurrency(price)}

            <br>

            <small>

               1包 ／ ${formatCurrency(each)}

            </small>

        `;

    });

    return html;

}

/* ==========================================================
   P數
========================================================== */

function renderPointPrice(text) {

    const cols = text.split("|");

    if (cols.length < 2) {

        return renderNormalPrice(text);

    }

    const point = toNumber(cols[0]);

    const price = toNumber(cols[1]);

    return `

        <strong>

            ${point}P

        </strong>

        <br>

        1P ／ ${formatCurrency(price)}

    `;

}

/* ==========================================================
   Parse Option
========================================================== */

function parseOptions(event) {

    const mode = event["拆團方式"] || "";

    const text = event["規格／價格"] || "";

    const options = [];

    if (!text) {

        return options;

    }

    /* ---------- 包數 ---------- */

    if (mode === "包數") {

        text

            .split("\n")

            .filter(Boolean)

            .forEach(row => {

                const cols = row.split("|");

                if (cols.length < 3) return;

               options.push({

    mode: "包數",

    name: cols[0],

    point: toNumber(cols[1]),

    eachPrice: toNumber(cols[2]),

    price: toNumber(cols[1]) * toNumber(cols[2])

});

            });

    }

    /* ---------- P數 ---------- */

    else if (mode === "P數") {

        const cols = text.split("|");

        if (cols.length >= 2) {

            options.push({

                mode: "P數",

                point: toNumber(cols[0]),

                price: toNumber(cols[1]),

                name: `${cols[0]}P`

            });

        }

    }

    /* ---------- 一般 ---------- */

    else {

        options.push({

            mode: "一般",

            name: text,

            point: 0,

            price: 0

        });

    }

    return options;

}
/* ==========================================================
   PART 08
   Favorite
========================================================== */

/* ==========================================================
   Toggle Favorite
========================================================== */

function toggleFavorite(event) {

    const id = event["ID"];

    if (!id) return;

    const index = State.favorites.indexOf(id);

    if (index === -1) {

        State.favorites.push(id);

        showToast("❤️ 已加入收藏");

    } else {

        State.favorites.splice(index, 1);

        showToast("💔 已取消收藏");

    }

    saveFavorite();

    updateHeroCount();

    renderEvents();

    renderFavorite();

}

/* ==========================================================
   Render Favorite
========================================================== */

function renderFavorite() {

    if (!DOM.favoriteItems) return;

    clearElement(DOM.favoriteItems);

    if (State.favorites.length === 0) {

        DOM.favoriteItems.innerHTML =

            emptyFavoriteHTML();

        return;

    }

    const fragment = document.createDocumentFragment();

    const list = State.events.filter(event =>

        State.favorites.includes(event["ID"])

    );

    list.forEach(event => {

        fragment.appendChild(

            createFavoriteCard(event)

        );

    });

    DOM.favoriteItems.appendChild(fragment);

}

/* ==========================================================
   Favorite Card
========================================================== */

function createFavoriteCard(event) {

    const card = document.createElement("div");

    card.className = "cart-item";

    card.innerHTML = `

        <div class="cart-item-title">

            ${escapeHTML(event["場次"] || "")}

        </div>

        <div class="member">

            👤 ${escapeHTML(event["成員"] || "")}

        </div>

        <div class="member">

            📂 ${escapeHTML(event["分類"] || "")}

        </div>

        <div style="margin-top:15px;">

            ${renderPrice(event)}

        </div>

        <div
            style="
                display:flex;
                gap:10px;
                margin-top:18px;
            ">

            <button
                class="favorite-btn">

                💔 取消收藏

            </button>

            <button
                class="cart-btn">

                🛒 加入喊單

            </button>

        </div>

    `;

    /* ---------- 取消收藏 ---------- */

    card
        .querySelector(".favorite-btn")
        .addEventListener("click", () => {

            toggleFavorite(event);

        });

    /* ---------- 加入喊單 ---------- */

    card
        .querySelector(".cart-btn")
        .addEventListener("click", () => {

            openModal(event);

        });

    return card;

}

/* ==========================================================
   Open Favorite Panel
========================================================== */

function openFavoritePanel() {

    closeCartPanel();

    DOM.favoritePanel.classList.add("show");

    DOM.overlay.classList.add("show");

}

/* ==========================================================
   Close Favorite Panel
========================================================== */

function closeFavoritePanel() {

    DOM.favoritePanel.classList.remove("show");

    if (

        !DOM.cartPanel.classList.contains("show")

    ) {

        DOM.overlay.classList.remove("show");

    }

}
/* ==========================================================
   PART 09
   Modal
========================================================== */

/* ==========================================================
   Open Modal
========================================================== */

function openModal(event) {

    State.modalEvent = event;

    State.selectedOption = null;

    const options = parseOptions(event);

    DOM.modalTitle.textContent =

        event["場次"] || "選擇方案";

    clearElement(DOM.modalOptions);

    /* ---------- 沒有方案 ---------- */

    if (options.length === 0) {

        const option = {

            mode: "一般",

            name: "一般",

            point: 0,

            price: 0

        };

        State.selectedOption = option;

        DOM.modalOptions.appendChild(

            createOptionCard(option, true)

        );

    }

    /* ---------- 有方案 ---------- */

    else {

        options.forEach((option, index) => {

            const active = index === 0;

            if (active) {

                State.selectedOption = option;

            }

            DOM.modalOptions.appendChild(

                createOptionCard(

                    option,

                    active

                )

            );

        });

    }

    DOM.modal.classList.add("show");

}

/* ==========================================================
   Close Modal
========================================================== */

function closeModal() {

    DOM.modal.classList.remove("show");

    State.modalEvent = null;

    State.selectedOption = null;

}

/* ==========================================================
   Create Option Card
========================================================== */

function createOptionCard(

    option,

    active = false

) {

    const div = document.createElement("div");

    div.className = "modal-option";

    if (active) {

        div.classList.add("active");

    }

    div.innerHTML = optionHTML(option);

    div.addEventListener("click", () => {

        DOM.modalOptions

            .querySelectorAll(".modal-option")

            .forEach(item => {

                item.classList.remove("active");

            });

        div.classList.add("active");

        State.selectedOption = option;

    });

    return div;

}

/* ==========================================================
   Option HTML
========================================================== */

function optionHTML(option) {

    switch (option.mode) {

       case "包數":

    return `

        <strong>

            ${escapeHTML(option.name)}

        </strong>

        <br>

        ${option.point}P ／ ${formatCurrency(option.price)}

        <br>

        <small>

            1P ／ ${formatCurrency(option.eachPrice)}

        </small>

    `;

        case "P數":

            return `

                <strong>

                    ${option.point}P

                </strong>

                <br>

                1P ／

                ${formatCurrency(option.price)}

            `;

        default:

            return `

                <strong>

                    ${escapeHTML(option.name)}

                </strong>

            `;

    }

}

/* ==========================================================
   Confirm Cart
========================================================== */

function confirmCart() {

    if (!State.modalEvent) {

        return;

    }

    if (!State.selectedOption) {

        showToast("請先選擇方案");

        return;

    }

    addCart(

        State.modalEvent,

        State.selectedOption

    );

    closeModal();

}
/* ==========================================================
   PART 10
   Cart
========================================================== */

/* ==========================================================
   Add Cart
========================================================== */

function addCart(event, option) {

    const item = {

        uid: uuid(),

        id: event["ID"] || "",

        event: event["場次"] || "",

        member: event["成員"] || "",

        category: event["分類"] || "",

        mode: option.mode,

        option: option.name,

        point: toNumber(option.point),

        price: toNumber(option.price)

    };

    State.cart.push(item);

    saveCart();

    renderCart();

    updateHeroCount();

    showToast("🛒 已加入喊單");

}

/* ==========================================================
   Remove Cart
========================================================== */

function removeCart(uid) {

    State.cart = State.cart.filter(item => {

        return item.uid !== uid;

    });

    saveCart();

    renderCart();

    updateHeroCount();

    showToast("🗑️ 已移除");

}

/* ==========================================================
   Render Cart
========================================================== */

function renderCart() {

    clearElement(DOM.cartItems);

    if (State.cart.length === 0) {

        DOM.cartItems.innerHTML =

            emptyCartHTML();

        updateCartTotal();

        return;

    }

    const fragment = document.createDocumentFragment();

    State.cart.forEach(item => {

        fragment.appendChild(

            createCartCard(item)

        );

    });

    DOM.cartItems.appendChild(fragment);

    updateCartTotal();

}

/* ==========================================================
   Create Cart Card
========================================================== */

function createCartCard(item) {

    const card = document.createElement("div");

    card.className = "cart-item";

    card.innerHTML = `

        <div class="cart-item-title">

            ${escapeHTML(item.event)}

        </div>

        <div class="member">

            👤 ${escapeHTML(item.member)}

        </div>

        <div class="member">

            📂 ${escapeHTML(item.category)}

        </div>

        <div class="member">

            📦 ${escapeHTML(item.option)}

        </div>

        <div class="cart-item-price">

            ${cartPriceText(item)}

        </div>

        <div
            style="
                display:flex;
                justify-content:flex-end;
                margin-top:15px;
            ">

            <button
                class="favorite-btn">

                🗑️ 移除

            </button>

        </div>

    `;

    card
        .querySelector("button")
        .addEventListener("click", () => {

            removeCart(item.uid);

        });

    return card;

}

/* ==========================================================
   Cart Price Text
========================================================== */

function cartPriceText(item) {

    switch (item.mode) {

       case "包數":

return `
${item.point}包 ／ ${formatCurrency(item.price)}
`;

        case "P數":

            return `

                ${item.point}P

                ×

                ${formatCurrency(item.price)}

            `;

        default:

            return item.price

                ? formatCurrency(item.price)

                : "依公告";

    }

}
/* ==========================================================
   PART 11
   Cart Total
   Copy
   Hero Count
========================================================== */

/* ==========================================================
   Update Cart Total
========================================================== */

function updateCartTotal() {

    if (!DOM.cartTotal) return;

    DOM.cartTotal.textContent =

        `總金額：${formatCurrency(calculateCartTotal())}`;

}

/* ==========================================================
   Calculate Cart Total
========================================================== */

function calculateCartTotal() {

    return State.cart.reduce((total, item) => {

        switch (item.mode) {

            case "包數":

                return total + item.price;

            case "P數":

                return total + (item.point * item.price);

            default:

                return total + item.price;

        }

    }, 0);

}

/* ==========================================================
   Hero Count
========================================================== */

function updateHeroCount() {

    if (DOM.favoriteCount) {

        DOM.favoriteCount.textContent =
            `${State.favorites.length} 筆`;

    }

    if (DOM.cartCount) {

        DOM.cartCount.textContent =
            `${State.cart.length} 筆`;

    }

    if (DOM.cartMoney) {

        DOM.cartMoney.textContent =
            formatCurrency(
                calculateCartTotal()
            );

    }

}

/* ==========================================================
   Copy Cart
========================================================== */

async function copyCart() {

    if (State.cart.length === 0) {

        showToast("目前沒有喊單");

        return;

    }

    await copyText(

        buildCartText()

    );

}

/* ==========================================================
   Build Cart Text
========================================================== */

function buildCartText() {

    const lines = [];

    lines.push("===== 我的喊單 =====");

    lines.push("");

    State.cart.forEach((item, index) => {

        lines.push(

            `${index + 1}. ${item.event}`

        );

        lines.push(

            `成員｜${item.member}`

        );

        lines.push(

            `方案｜${item.option}`

        );

        lines.push(

            `價格｜${cartPriceText(item)}`

        );

        lines.push("");

    });

    lines.push("----------------------------");

    lines.push(

        `總金額｜${formatCurrency(

            calculateCartTotal()

        )}`

    );

    return lines.join("\n");

}

/* ==========================================================
   Clear Cart
========================================================== */

function clearCart() {

    if (State.cart.length === 0) {

        return;

    }

    const result = confirm(

        "確定要清空我的喊單嗎？"

    );

    if (!result) {

        return;

    }

    State.cart = [];

    saveCart();

    renderCart();

    updateHeroCount();

    showToast("🗑️ 已清空喊單");

}

/* ==========================================================
   Open Cart Panel
========================================================== */

function openCartPanel() {

    closeFavoritePanel();

    DOM.cartPanel.classList.add("show");

    DOM.overlay.classList.add("show");

}

/* ==========================================================
   Close Cart Panel
========================================================== */

function closeCartPanel() {

    DOM.cartPanel.classList.remove("show");

    if (

        !DOM.favoritePanel.classList.contains("show")

    ) {

        DOM.overlay.classList.remove("show");

    }

}
/* ==========================================================
   PART 12
   Overlay
   Panel
   Finish
========================================================== */

/* ==========================================================
   Close Panels
========================================================== */

function closePanels() {

    closeFavoritePanel();

    closeCartPanel();

}

/* ==========================================================
   Overlay
========================================================== */

function showOverlay() {

    DOM.overlay.classList.add("show");

}

function hideOverlay() {

    if (

        DOM.favoritePanel.classList.contains("show") ||

        DOM.cartPanel.classList.contains("show")

    ) {

        return;

    }

    DOM.overlay.classList.remove("show");

}

/* ==========================================================
   Override Panel Functions
========================================================== */

function openFavoritePanel() {

    DOM.cartPanel.classList.remove("show");

    DOM.favoritePanel.classList.add("show");

    showOverlay();

}

function closeFavoritePanel() {

    DOM.favoritePanel.classList.remove("show");

    hideOverlay();

}

function openCartPanel() {

    DOM.favoritePanel.classList.remove("show");

    DOM.cartPanel.classList.add("show");

    showOverlay();

}

function closeCartPanel() {

    DOM.cartPanel.classList.remove("show");

    hideOverlay();

}

/* ==========================================================
   Refresh
========================================================== */

function refreshAll() {

    renderNotice();

    renderCurrent();

    renderLinks();

    renderEvents();

    renderFavorite();

    renderCart();

    updateHeroCount();

}

/* ==========================================================
   Debug
========================================================== */

window.App = {

    state: State,

    refresh: refreshAll,

    renderEvents,

    renderFavorite,

    renderCart,

    openFavoritePanel,

    openCartPanel,

    closePanels,

    clearCart,

    copyCart

};

/* ==========================================================
   Version
========================================================== */

console.log(

    "%c買圖千日 用在一時",

    "font-size:16px;font-weight:bold;color:#ff4f7b;"

);

console.log(

    "%cATEEZ FanPhoto Database",

    "color:#666;"

);

console.log(

    "%cscript.js V2 Loaded",

    "color:#2e7d32;font-weight:bold;"

);

/* ==========================================================
   End
========================================================== */
