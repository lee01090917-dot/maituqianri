const API = "https://script.google.com/macros/s/AKfycbwow8HLqsqki1Plrj6qWFQXXa8UYuYfRwyCzY5NBM9spdoh8bsZJUE3t0paKewm2g5v/exec";

let allEvents = [];
let currentCategory = "";

document.addEventListener("DOMContentLoaded", () => {

    loadEvents();
    loadNotice();
    loadCurrent();
    loadLinks();

    initSearch();
    initCategory();

    loadFavorite();
    loadCart();

});

function initSearch() {

    const input = document.getElementById("searchInput");

    if (!input) return;

    input.addEventListener("input", renderEvents);

}

function initCategory() {

    const buttons = document.querySelectorAll(".category button");

    buttons.forEach(btn => {

        btn.addEventListener("click", () => {

            buttons.forEach(b => b.classList.remove("active"));

            btn.classList.add("active");

            currentCategory = btn.dataset.category || "";

            renderEvents();

        });

    });

}

async function loadEvents() {

    const container = document.getElementById("event-list");

    if (container) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">⏳</div>
                <h3>載入資料中...</h3>
            </div>
        `;

    }

    try {

        const res = await fetch(API + "?type=events");

        allEvents = await res.json();

        renderEvents();

    } catch (err) {

        console.error(err);

        if (container) {

            container.innerHTML = `
                <div class="card">
                    ❌ 資料讀取失敗
                </div>
            `;

        }

    }

}

function renderEvents() {

    const container = document.getElementById("event-list");

    if (!container) return;

    const keyword = (
        document.getElementById("searchInput")?.value || ""
    ).trim().toLowerCase();

    const hasKeyword = keyword.length > 0;

    const hasCategory = currentCategory !== "";

    if (!hasKeyword && !hasCategory) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="icon">
                    🔍
                </div>

                <h3>
                    開始搜尋或選擇分類即可查看飯拍資料
                </h3>

                <p>
                    可搜尋：場次、成員、ID、分類
                </p>

            </div>
        `;

        return;

    }

    let list = [...allEvents];

    if (hasCategory) {

        list = list.filter(item => item["分類"] === currentCategory);

    }

    if (hasKeyword) {

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
            <div class="empty-state">

                <div class="icon">😢</div>

                <h3>
                    找不到符合的資料
                </h3>

            </div>
        `;

        return;

    }

    container.innerHTML = "";
        list.forEach(event => {

        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `

            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">

                <div class="event-title">
                    ${event["場次"] || ""}
                </div>

                <div style="display:flex;gap:8px;">

                    <button
                        class="favorite-btn"
                        onclick="addFavorite('${event["ID"]}')"
                        title="加入收藏">
                        ❤️
                    </button>

                    <button
                        class="cart-btn"
                        onclick="addCart(${JSON.stringify(event).replace(/"/g,"&quot;")})"
                        title="加入喊單">
                        🛒
                    </button>

                </div>

            </div>

            <div class="member">
                👤 成員｜${event["成員"] || ""}
            </div>

            <div class="member">
                📂 分類｜${event["分類"] || ""}
            </div>

            <div class="price">
                ${formatPrice(event)}
            </div>

            ${
                event["備註"]
                ? `
                    <div class="note">
                        📝 ${event["備註"]}
                    </div>
                `
                : ""
            }

        `;

        container.appendChild(card);

    });

}

/* ===========================
   價格格式
=========================== */

function formatPrice(event){

    const type = event["拆團方式"] || "";

    const text = event["規格／價格"] || "";

    if(!text) return "";

    if(type==="包數"){

        return formatPackage(text);

    }

    if(type==="P數"){

        return formatPoint(text);

    }

    return text.replace(/\n/g,"<br>");

}

function formatPackage(text){

    let html="";

    text.split("\n").forEach((row,index)=>{

        const data=row.split("|");

        if(data.length<3) return;

        const name=data[0];

        const p=Number(data[1]);

        const price=Number(data[2]);

        const per=(price/p)
            .toFixed(2)
            .replace(/\.00$/,"");

        if(index===0){

            html+=`
                ${name}　${p}P／$${price}
                （1P／$${per}）
            `;

        }else{

            html+=`
                <br><br>

                ${name}　${p}P／$${price}
            `;

        }

    });

    return html;

}

function formatPoint(text){

    const data=text.split("|");

    if(data.length<2) return text;

    return `
        ${data[0]}P（1P／$${data[1]}）
    `;

}
/* ===========================
   最新公告
=========================== */

async function loadNotice(){

    const container=document.getElementById("notice-list");

    if(!container) return;

    try{

        const res=await fetch(API+"?type=notice");

        const data=await res.json();

        container.innerHTML="";

        if(!Array.isArray(data) || data.length===0){

            container.innerHTML=`
                <div class="card">
                    目前沒有公告
                </div>
            `;

            return;

        }

        data.forEach(item=>{

            const card=document.createElement("div");

            card.className="card";

            card.innerHTML=`

                <div class="event-title">
                    ${item["場次"]||""}
                </div>

                <div class="note">
                    ${item["公告"]||""}
                </div>

            `;

            container.appendChild(card);

        });

    }catch(err){

        console.error(err);

    }

}

/* ===========================
   現正開拆中
=========================== */

async function loadCurrent(){

    const container=document.getElementById("current-list");

    if(!container) return;

    try{

        const res=await fetch(API+"?type=current");

        const data=await res.json();

        container.innerHTML="";

        if(!Array.isArray(data) || data.length===0){

            container.innerHTML=`
                <div class="card">
                    目前沒有開拆場次
                </div>
            `;

            return;

        }

        data.forEach(item=>{

            const card=document.createElement("div");

            card.className="card";

            card.innerHTML=`

                <div class="event-title">
                    ${item["場次"]||""}
                </div>

                <div class="member">
                    👤 ${item["成員"]||""}
                </div>

            `;

            container.appendChild(card);

        });

    }catch(err){

        console.error(err);

    }

}

/* ===========================
   快速連結
=========================== */

async function loadLinks(){

    const container=document.getElementById("link-list");

    if(!container) return;

    try{

        const res=await fetch(API+"?type=links");

        const data=await res.json();

        container.innerHTML="";

        if(!Array.isArray(data)) return;

        data.forEach(item=>{

            const a=document.createElement("a");

            a.className="link-btn";

            a.href=item["網址"]||"#";

            a.target="_blank";

            a.rel="noopener noreferrer";

            a.textContent=item["名稱"]||"未命名";

            container.appendChild(a);

        });

    }catch(err){

        console.error(err);

    }

}
/* ===========================
   ❤️ 我的收藏
=========================== */

let favoriteList = JSON.parse(
    localStorage.getItem("favoriteList") || "[]"
);

function addFavorite(id){

    if(favoriteList.includes(id)){

        alert("已經收藏過囉❤️");

        return;

    }

    favoriteList.push(id);

    localStorage.setItem(
        "favoriteList",
        JSON.stringify(favoriteList)
    );

    alert("❤️ 已加入收藏");

}

function loadFavorite(){

    favoriteList = JSON.parse(
        localStorage.getItem("favoriteList") || "[]"
    );

}

/* ===========================
   🛒 我的喊單
=========================== */

let cartList = JSON.parse(
    localStorage.getItem("cartList") || "[]"
);

function addCart(event){

    cartList.push(event);

    localStorage.setItem(
        "cartList",
        JSON.stringify(cartList)
    );

    alert("🛒 已加入我的喊單");

}

function loadCart(){

    cartList = JSON.parse(
        localStorage.getItem("cartList") || "[]"
    );

}

/* ===========================
   試算（預留）
=========================== */

function getCartTotal(){

    let total = 0;

    cartList.forEach(item=>{

        // 之後會依照包數 / P數計算
        // 目前先預留

    });

    return total;

}

/* ===========================
   清空收藏
=========================== */

function clearFavorite(){

    if(!confirm("確定清空收藏嗎？")) return;

    favoriteList = [];

    localStorage.removeItem("favoriteList");

}

/* ===========================
   清空喊單
=========================== */

function clearCart(){

    if(!confirm("確定清空我的喊單嗎？")) return;

    cartList = [];

    localStorage.removeItem("cartList");

}

/* ===========================
   初始化
=========================== */

loadFavorite();

loadCart();
