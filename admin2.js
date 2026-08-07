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

    loadMembers();

});

// ==========================
// 載入會員
// ==========================

async function loadMembers() {

    const snapshot = await getDocs(collection(db, "members"));

    members = [];

    snapshot.forEach(memberDoc => {

        members.push({

            id: memberDoc.id,

            ...memberDoc.data()

        });

    });

    renderDashboard();

    renderMemberList();

}

// ==========================
// Dashboard
// ==========================

function renderDashboard() {

    let total = members.length;

    let pending = 0;

    let line = 0;

    let today = 0;

    const todayString = new Date().toLocaleDateString("sv-SE");

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

                joinDate = member.joinDate
                    .toDate()
                    .toLocaleDateString("sv-SE");

            } else {

                joinDate = String(member.joinDate).slice(0,10);

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

    const list = members.filter(member => {

        const text = (

            (member.memberNo || "") +

            (member.nickname || "") +

            (member.socialPlatform || "") +

            (member.socialAccount || "") +

            (member.favoriteMember || "")

        ).toLowerCase();

        return text.includes(keyword.toLowerCase());

    });

    list.forEach(member => {

        memberList.innerHTML += `

<div class="member-card"

data-id="${member.id}">

    <div class="member-top">

        <strong>

            ${member.memberNo || "待發號"}

        </strong>

        <span class="status ${member.status === "已通過" ? "approved" : "pending"}">

            ${member.status || "-"}

        </span>

    </div>

    <div class="member-name">

        ${member.nickname || "-"}

    </div>

    <div class="member-info">

        ❤️ ${member.favoriteMember || "-"}

    </div>

    <div class="member-info">

        ${member.socialPlatform || ""}

    </div>

</div>

`;

    });

    bindMemberClick();

}

// ==========================
// 點會員
// ==========================

function bindMemberClick() {

    const cards = document.querySelectorAll(".member-card");

    cards.forEach(card => {

        card.onclick = () => {

            cards.forEach(c => c.classList.remove("active"));

            card.classList.add("active");

            currentMember = members.find(
                m => m.id === card.dataset.id
            );

            renderProfile();

        };

    });

    // 第一次自動選第一位會員
    if (cards.length > 0 && !currentMember) {

        cards[0].click();

    }

}

// ==========================
// 右側會員資料
// ==========================

function renderProfile() {

    if (!currentMember) return;

    profileCard.innerHTML = `

<div class="profile-header">

    <div class="profile-avatar">

        👤

    </div>

    <div>

        <h2>

            ${currentMember.nickname || "-"}

        </h2>

        <p>

            ${currentMember.memberNo || "-"}

        </p>

    </div>

</div>

<div class="profile-grid">

    <div class="profile-box">

        <small>📱 社群平台</small>

        <strong>

            ${currentMember.socialPlatform || "-"}

        </strong>

    </div>

    <div class="profile-box">

        <small>🔗 帳號</small>

        <strong>

            ${currentMember.socialAccount || "-"}

        </strong>

    </div>

    <div class="profile-box">

        <small>❤️ 主擔</small>

        <strong>

            ${currentMember.favoriteMember || "-"}

        </strong>

    </div>

    <div class="profile-box">

        <small>💛 副擔</small>

        <strong>

            ${(currentMember.subFavoriteMembers || []).join("、") || "-"}

        </strong>

    </div>

    <div class="profile-box">

        <small>🟢 官方LINE</small>

        <strong>

            ${currentMember.officialLine ? "已加入" : "未加入"}

        </strong>

    </div>

    <div class="profile-box">

        <small>📍 加入來源</small>

        <strong>

            ${currentMember.joinSource || "-"}

        </strong>

    </div>

    <div class="profile-box">

        <small>👥 推薦人</small>

        <strong>

            ${currentMember.referrerNickname || "-"}

        </strong>

    </div>

    <div class="profile-box full">

        <small>📝 管理員備註</small>

        <strong>

            ${currentMember.adminNote || "目前沒有備註"}

        </strong>

    </div>

</div>

`;

}

// ==========================
// 搜尋
// ==========================

if (memberSearch) {

    memberSearch.addEventListener("input", e => {

        renderMemberList(e.target.value);

    });

}

// ==========================
// Modal
// ==========================

const memberModal = document.getElementById("memberModal");
const taskModal = document.getElementById("taskModal");

const addMemberBtn = document.getElementById("addMember");
const addTaskBtn = document.getElementById("addTask");

const closeMemberModal = document.getElementById("closeMemberModal");
const closeTaskModal = document.getElementById("closeTaskModal");

// 開啟會員 Modal
addMemberBtn?.addEventListener("click", () => {
    memberModal.classList.remove("hidden");
});

// 關閉會員 Modal
closeMemberModal?.addEventListener("click", () => {
    memberModal.classList.add("hidden");
});

// 開啟待辦 Modal
addTaskBtn?.addEventListener("click", () => {
    taskModal.classList.remove("hidden");
});

// 關閉待辦 Modal
closeTaskModal?.addEventListener("click", () => {
    taskModal.classList.add("hidden");
});

console.log("admin2.js 已載入");
