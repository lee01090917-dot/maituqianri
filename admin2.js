import {
    auth,
    db
} from "./firebase.js";

import {
    collection,
    getDocs,
    getDoc,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const memberList = document.getElementById("member-list");

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
<div style="
padding:15px;
margin:10px 0;
border:1px solid #ddd;
border-radius:12px;
">

<b>${data.memberNo || "待發號"}　${data.nickname}</b>

<br>

${data.email}

<br>

${data.socialPlatform || ""} ${data.socialAccount || ""}

<br>

狀態：${data.status}

<br><br>

<button class="approve" data-id="${memberDoc.id}">
✅ 通過
</button>

<button class="hold" data-id="${memberDoc.id}">
⏳ 保留
</button>

<button class="reject" data-id="${memberDoc.id}">
❌ 拒絕
</button>

</div>
`;

    });

}

// ==========================
// 更新狀態
// ==========================

document.addEventListener("click", async (e) => {

    if (!e.target.dataset.id) return;

    const id = e.target.dataset.id;

    let status = "";

    if (e.target.classList.contains("approve")) {
        status = "已通過";
    }

    if (e.target.classList.contains("hold")) {
        status = "保留";
    }

    if (e.target.classList.contains("reject")) {
        status = "已拒絕";
    }

    if (!status) return;

    // 通過
    if (status === "已通過") {

        const memberRef = doc(db, "members", id);

        const memberSnap = await getDoc(memberRef);

        const memberData = memberSnap.data();

        // 已有編號就不要重新發
        if (!memberData.memberNo) {

            const counterRef = doc(db, "counters", "member");

            const counterSnap = await getDoc(counterRef);

            const nextNumber = counterSnap.data().nextNumber;

            const memberNo =
                "MQ" + String(nextNumber).padStart(4, "0");

            await updateDoc(memberRef, {
                status: "已通過",
                memberNo: memberNo
            });

            await updateDoc(counterRef, {
                nextNumber: nextNumber + 1
            });

        } else {

            await updateDoc(memberRef, {
                status: "已通過"
            });

        }

    } else {

        await updateDoc(doc(db, "members", id), {
            status: status
        });

    }

    alert("更新成功");

    loadMembers();

});
