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

const memberList = document.querySelector(".member-list");
const profileCard = document.querySelector(".profile-card");

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

    const querySnapshot = await getDocs(collection(db, "members"));

    memberList.innerHTML = "";

    querySnapshot.forEach((memberDoc) => {

        const data = memberDoc.data();

        memberList.innerHTML += `

<div class="member-card" data-id="${memberDoc.id}">

    <div class="member-top">

        <strong>${data.memberNo || "待發號"}</strong>

        <span class="status ${data.status === "已通過" ? "approved" : "pending"}">

            ${data.status || "-"}

        </span>

    </div>

    <div class="member-name">

        ${data.nickname || "-"}

    </div>

    <div class="member-info">

        ❤️ ${data.favoriteMember || "-"}

    </div>

    <div class="member-info">

        ${data.socialPlatform || ""}

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

        card.addEventListener("click", async () => {

            cards.forEach(c => c.classList.remove("active"));

            card.classList.add("active");

            const snap = await getDoc(
                doc(db, "members", card.dataset.id)
            );

            const data = snap.data();

            profileCard.innerHTML = `

<div class="profile-item">
<label>MQ編號</label>
<span>${data.memberNo || "-"}</span>
</div>

<div class="profile-item">
<label>暱稱</label>
<span>${data.nickname || "-"}</span>
</div>

<div class="profile-item">
<label>平台</label>
<span>${data.socialPlatform || "-"}</span>
</div>

<div class="profile-item">
<label>帳號</label>
<span>${data.socialAccount || "-"}</span>
</div>

<div class="profile-item">
<label>❤️ 主擔</label>
<span>${data.favoriteMember || "-"}</span>
</div>

<div class="profile-item">
<label>💛 副擔</label>
<span>${(data.subFavoriteMembers || []).join("、") || "-"}</span>
</div>

<div class="profile-item">
<label>🟢 官方LINE</label>
<span>${data.officialLine ? "已加入" : "未加入"}</span>
</div>

<div class="profile-item">
<label>📍 加入來源</label>
<span>${data.joinSource || "-"}</span>
</div>

<div class="profile-item">
<label>👥 推薦人</label>
<span>${data.referrerNickname || "-"}</span>
</div>

<div class="profile-item">
<label>📝 備註</label>
<span>${data.adminNote || "-"}</span>
</div>

`;

        });

    });

}
