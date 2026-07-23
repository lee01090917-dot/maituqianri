const API = "https://script.google.com/macros/s/AKfycbzE-HKTDCYDPHnJxEJzsAlSXyC2LMe9H4vTMISMsLv4dNQVEzNiNqN8OPUF2Igy_Yaj/exec";

document.addEventListener("DOMContentLoaded", () => {
    loadEvents();
});

async function loadEvents() {

    const container = document.getElementById("event-list");

    container.innerHTML = "載入中...";

    try{

        const res = await fetch(API + "?type=events");

        const data = await res.json();

        container.innerHTML = "";

        data.forEach(event=>{

            const card = document.createElement("div");

            card.className="card";

            card.innerHTML=`

                <div class="event-title">${event["場次名稱"]}</div>

                <div class="member">
                👤 ${event["成員"]}
                </div>

                <div class="badge ${getBadge(event["狀態"])}">
                ${event["狀態"]}
                </div>

                <div class="price">
                ${event["價格說明"] || ""}
                </div>

                <div style="margin-top:10px;color:#888;">
                ${event["備註"] || ""}
                </div>

            `;

            container.appendChild(card);

        });

    }catch(e){

        container.innerHTML="讀取失敗";

        console.error(e);

    }

}

function getBadge(status){

    if(status=="已成團"){

        return "success";

    }

    if(status.includes("差")){

        return "warning";

    }

    if(status=="已成團 可先候補"){

        return "danger";

    }

    return "";

}
