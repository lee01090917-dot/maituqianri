const API = "https://script.google.com/macros/s/AKfycbzE-HKTDCYDPHnJxEJzsAlSXyC2LMe9H4vTMISMsLv4dNQVEzNiNqN8OPUF2Igy_Yaj/exec";

document.addEventListener("DOMContentLoaded", () => {
    loadEvents();
    loadNotice();
    async function loadLinks() {

    const container = document.getElementById("link-list");

    if (!container) return;

    try {

        const response = await fetch(`${API}?type=links`);

        const data = await response.json();

        container.innerHTML = "";

        if (!Array.isArray(data) || data.length === 0) {
            return;
        }

        data.forEach(item => {

            const a = document.createElement("a");

            a.className = "link-btn";

            a.href = item["網址"];

            a.target = "_blank";
            a.rel = "noopener noreferrer";

            a.textContent = item["名稱"];

            container.appendChild(a);

        });

    } catch (e) {

        console.error("連結錯誤：", e);

    }

}
});

async function loadNotice() {

    const container = document.getElementById("notice-list");

    if (!container) return;

    try {

        const response = await fetch(`${API}?type=notice`);

        const data = await response.json();

        container.innerHTML = "";

        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML = "<div class='card'>目前沒有公告</div>";
            return;
        }

        data.forEach(item => {

            const card = document.createElement("div");

            card.className = "card";

            card.innerHTML = `
                <strong>${item["標題"]}</strong><br>
                <small>${item["日期"]}</small><br><br>
                ${item["內容"]}
            `;

            container.appendChild(card);

        });

    } catch (e) {

        console.error("公告錯誤：", e);

        container.innerHTML = "<div class='card'>公告讀取失敗</div>";

    }

}

    container.innerHTML = "<div class='card'>載入活動中...</div>";

    try {

        const response = await fetch(`${API}?type=events`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        console.log("API 回傳：", data);

        container.innerHTML = "";

        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML = "<div class='card'>目前沒有活動</div>";
            return;
        }

        data.forEach(event => {

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

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="card">
                ❌ 讀取失敗
            </div>
        `;
    }
}
async function loadNotice(){

    const container=document.getElementById("notice-list");

    try{

        const res=await fetch(API+"?type=notice");
        const data=await res.json();

        container.innerHTML="";

        data.forEach(item=>{

            const card=document.createElement("div");

            card.className="card";

            card.innerHTML=`
                <strong>${item["標題"]}</strong><br>
                <small>${item["日期"]}</small><br><br>
                ${item["內容"]}
            `;

            container.appendChild(card);

        });

    }catch{

        container.innerHTML="公告讀取失敗";

    }

}
async function loadLinks(){

    const container=document.getElementById("link-list");

    try{

        const res=await fetch(API+"?type=links");
        const data=await res.json();

        container.innerHTML="";

        data.forEach(item=>{

            const a=document.createElement("a");

            a.className="link-btn";

            a.href=item["網址"];

            a.target="_blank";

            a.textContent=item["名稱"];

            container.appendChild(a);

        });

    }catch{

        console.log("link error");

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
