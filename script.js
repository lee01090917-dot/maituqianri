const API = "https://script.google.com/macros/s/AKfycbzE-HKTDCYDPHnJxEJzsAlSXyC2LMe9H4vTMISMsLv4dNQVEzNiNqN8OPUF2Igy_Yaj/exec";

let allEvents = [];
let currentCategory = "ALL";

document.addEventListener("DOMContentLoaded", () => {
    loadEvents();
    loadNotice();
    loadLinks();

    const search = document.getElementById("searchInput");

    if (search) {
        search.addEventListener("input", () => {
            renderEvents();
        });
    }

    document.querySelectorAll(".category button").forEach(btn => {

        btn.addEventListener("click", () => {

            currentCategory = btn.textContent.replace(/[✍️✈️🎤👕📁]/g,"").trim();

            if(currentCategory==="OTHER"){
                currentCategory="OTHER";
            }

            renderEvents();

        });

    });

});

async function loadEvents(){

    const container=document.getElementById("event-list");

    container.innerHTML="<div class='card'>載入活動中...</div>";

    try{

        const res=await fetch(API+"?type=events");

        allEvents=await res.json();

        renderEvents();

    }catch(e){

        console.error(e);

        container.innerHTML="<div class='card'>❌ 活動讀取失敗</div>";

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

        list = list.filter(item => {

            return (item["分類"] || "") === currentCategory;

        });

    }

    if (keyword !== "") {

        list = list.filter(item => {

            const text = [
                item["場次名稱"],
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
                找不到符合的活動
            </div>
        `;

        return;

    }

    list.forEach(event => {

        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `
            <div class="event-title">
                ${event["場次名稱"] || ""}
            </div>

            <div class="member">
                👤 ${event["成員"] || ""}
            </div>

            <div class="badge ${getBadge(event["狀態"])}">
                ${event["狀態"] || ""}
            </div>

            <div class="price">
                ${(event["價格"] || "").replace(/\n/g,"<br>")}
            </div>

            <div style="margin-top:12px;color:#666;">
                ${event["備註"] || ""}
            </div>
        `;

        container.appendChild(card);

    });

}
async function loadNotice() {

    const container = document.getElementById("notice-list");

    if (!container) return;

    container.innerHTML = "<div class='card'>載入公告中...</div>";

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
                <strong>${item["標題"] || ""}</strong>
                <div style="font-size:13px;color:#888;margin:8px 0;">
                    ${item["日期"] || ""}
                </div>
                <div>
                    ${item["內容"] || ""}
                </div>
            `;

            container.appendChild(card);

        });

    } catch (e) {

        console.error(e);

        container.innerHTML = "<div class='card'>公告讀取失敗</div>";

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

    } catch (e) {

        console.error(e);

    }

}
function getBadge(status) {

    status = status || "";

    if (status === "已成團") {
        return "success";
    }

    if (status.includes("差")) {
        return "warning";
    }

    if (status === "已成團 可先候補") {
        return "danger";
    }

    return "";

}
