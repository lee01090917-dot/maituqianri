import {
    auth,
    db
} from "./firebase.js";

import {
    collection,
    getDocs,
    getDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// ==========================
// DOM
// ==========================

const memberList = document.querySelector(".member-list");
const profileCard = document.querySelector(".profile-card");

const memberCount = document.getElementById("memberCount");
const pendingCount = document.getElementById("pendingCount");
const lineCount = document.getElementById("lineCount");
const todayCount = document.getElementById("todayCount");

const memberSearch = document.getElementById("memberSearch");


// ==========================
// 全域資料
// ==========================

let members = [];
let currentMember = null;


// ==========================
// 權限檢查
// ==========================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        location.href = "login.html";

        return;

    }

    try {

        const memberRef = doc(db, "members", user.uid);

        const memberSnap = await getDoc(memberRef);

        if (!memberSnap.exists()) {

            alert("找不到會員資料");

            location.href = "app.html";

            return;

        }

        if (memberSnap.data().role !== "管理員") {

            alert("沒有權限");

            location.href = "app.html";

            return;

        }

        await loadMembers();

    } catch (error) {

        console.error("權限檢查失敗：", error);

    }

});


// ==========================
// 載入會員
// ==========================

async function loadMembers() {

    try {

        const snapshot =
            await getDocs(collection(db, "members"));

        members = [];

        snapshot.forEach(memberDoc => {

            members.push({

                id: memberDoc.id,

                ...memberDoc.data()

            });

        });

        renderDashboard();

        renderMemberList();

    } catch (error) {

        console.error("會員資料載入失敗：", error);

    }

}


// ==========================
// Dashboard
// ==========================

function renderDashboard() {

    const total = members.length;

    let pending = 0;

    let line = 0;

    let today = 0;

    const todayString =
        new Date().toLocaleDateString("sv-SE");


    members.forEach(member => {

        if (member.status !== "已通過") {

            pending++;

        }

        if (member.officialLine) {

            line++;

        }

        if (member.joinDate) {

            let joinDate = "";

            if (member.joinDate.toDate) {

                joinDate =
                    member.joinDate
                        .toDate()
                        .toLocaleDateString("sv-SE");

            } else {

                joinDate =
                    String(member.joinDate).slice(0, 10);

            }

            if (joinDate === todayString) {

                today++;

            }

        }

    });


    memberCount.textContent = total;

    pendingCount.textContent = pending;

    lineCount.textContent = line;

    todayCount.textContent = today;

}


// ==========================
// 左側會員列表
// ==========================

function renderMemberList(keyword = "") {

    memberList.innerHTML = "";

    const searchKeyword =
        keyword.trim().toLowerCase();


    const list = members.filter(member => {

        const text = [

            member.memberNo || "",

            member.nickname || "",

            member.socialPlatform || "",

            member.socialAccount || "",

            member.favoriteMember || ""

        ]

            .join(" ")

            .toLowerCase();


        return text.includes(searchKeyword);

    });


    list.forEach(member => {

        const card = document.createElement("div");

        card.className = "member-card";

        card.dataset.id = member.id;


        const statusClass =
            member.status === "已通過"
                ? "approved"
                : member.status === "已拒絕"
                    ? "rejected"
                    : "pending";


        card.innerHTML = `

            <div class="member-top">

                <strong>
                    ${escapeHTML(member.memberNo || "待發號")}
                </strong>

                <span class="status ${statusClass}">
                    ${escapeHTML(member.status || "-")}
                </span>

            </div>

            <div class="member-name">

                ${escapeHTML(member.nickname || "-")}

            </div>

            <div class="member-info">

                ❤️ ${escapeHTML(member.favoriteMember || "-")}

            </div>

            <div class="member-info">

                ${escapeHTML(member.socialPlatform || "-")}

            </div>

        `;


        memberList.appendChild(card);

    });


    bindMemberClick();

}


// ==========================
// 點會員
// ==========================

function bindMemberClick() {

    const cards =
        document.querySelectorAll(".member-card");


    cards.forEach(card => {

        card.onclick = () => {

            cards.forEach(c =>
                c.classList.remove("active")
            );


            card.classList.add("active");


            currentMember =
                members.find(
                    member =>
                        member.id === card.dataset.id
                );


            renderProfile();

        };

    });


    if (cards.length > 0 && !currentMember) {

        cards[0].click();

    }

}


// ==========================
// 右側會員資料
// ==========================

function renderProfile() {

    if (!currentMember) {

        profileCard.innerHTML = `

            <div class="empty">

                請先選擇一位會員

            </div>

        `;

        return;

    }


    const subFavorites =
        Array.isArray(currentMember.subFavoriteMembers)
            ? currentMember.subFavoriteMembers.join("、")
            : "-";


    profileCard.innerHTML = `

        <!-- Profile Header -->

        <div class="profile-header">

            <div class="profile-person">

                <div class="profile-avatar">

                    👤

                </div>

                <div class="profile-title">

                    <h2>

                        ${escapeHTML(
                            currentMember.nickname || "-"
                        )}

                    </h2>

                    <p>

                        ${escapeHTML(
                            currentMember.memberNo || "待發號"
                        )}

                    </p>

                </div>

            </div>


            <div class="profile-actions">

                <button id="editMember">

                    ✏️ 編輯

                </button>

                <button id="saveMember">

                    💾 儲存

                </button>

            </div>

        </div>


        <!-- Profile Grid -->

        <div class="profile-grid">

            <div class="profile-box">

                <small>
                    📱 社群平台
                </small>

                <strong>
                    ${escapeHTML(
                        currentMember.socialPlatform || "-"
                    )}
                </strong>

            </div>


            <div class="profile-box">

                <small>
                    🔗 帳號
                </small>

                <strong>
                    ${escapeHTML(
                        currentMember.socialAccount || "-"
                    )}
                </strong>

            </div>


            <div class="profile-box">

                <small>
                    ❤️ 主擔
                </small>

                <strong>
                    ${escapeHTML(
                        currentMember.favoriteMember || "-"
                    )}
                </strong>

            </div>


            <div class="profile-box">

                <small>
                    💛 副擔
                </small>

                <strong>
                    ${escapeHTML(subFavorites)}
                </strong>

            </div>


            <div class="profile-box">

                <small>
                    🟢 官方 LINE
                </small>

                <strong>
                    ${currentMember.officialLine
                        ? "已加入"
                        : "未加入"}
                </strong>

            </div>


            <div class="profile-box">

                <small>
                    📍 加入來源
                </small>

                <strong>
                    ${escapeHTML(
                        currentMember.joinSource || "-"
                    )}
                </strong>

            </div>


            <div class="profile-box">

                <small>
                    👥 推薦人
                </small>

                <strong>
                    ${escapeHTML(
                        currentMember.referrerNickname || "-"
                    )}
                </strong>

            </div>


            <div class="profile-box">

                <small>
                    📝 管理員備註
                </small>

                <strong>
                    ${escapeHTML(
                        currentMember.adminNote || "-"
                    )}
                </strong>

            </div>

        </div>

    `;

}


// ==========================
// 搜尋
// ==========================

if (memberSearch) {

    memberSearch.addEventListener(
        "input",
        event => {

            currentMember = null;

            renderMemberList(event.target.value);

        }
    );

}


// ==========================
// Modal
// ==========================

const memberModal =
    document.getElementById("memberModal");

const taskModal =
    document.getElementById("taskModal");

const addMemberBtn =
    document.getElementById("addMember");

const addTaskBtn =
    document.getElementById("addTask");

const closeMemberModal =
    document.getElementById("closeMemberModal");

const closeTaskModal =
    document.getElementById("closeTaskModal");


// ==========================
// 新增會員
// ==========================

addMemberBtn?.addEventListener(
    "click",
    () => {

        memberModal?.classList.remove("hidden");

    }
);


// ==========================
// 關閉會員 Modal
// ==========================

closeMemberModal?.addEventListener(
    "click",
    () => {

        memberModal?.classList.add("hidden");

    }
);


// ==========================
// 新增待辦
// ==========================

addTaskBtn?.addEventListener(
    "click",
    () => {

        taskModal?.classList.remove("hidden");

    }
);


// ==========================
// 關閉待辦 Modal
// ==========================

closeTaskModal?.addEventListener(
    "click",
    () => {

        taskModal?.classList.add("hidden");

    }
);


// ==========================
// HTML 安全處理
// ==========================

function escapeHTML(value) {

    return String(value ?? "")

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


console.log("admin2.js V3 已載入");
