import {
    auth,
    db
} from "./firebase.js";

import {
    collection,
    getDocs,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const memberList = document.getElementById("member-list");

async function loadMembers() {

    const querySnapshot = await getDocs(collection(db, "members"));

    memberList.innerHTML = "";

    querySnapshot.forEach((doc) => {

        const data = doc.data();

        memberList.innerHTML += `

<div style="
padding:15px;
margin:10px 0;
border:1px solid #ddd;
border-radius:12px;
">

<b>${data.nickname}</b>

<br>

${data.email}

<br>

狀態：${data.status}

<br><br>

<button class="approve" data-id="${doc.id}">
✅ 通過
</button>

<button class="hold" data-id="${doc.id}">
⏳ 保留
</button>

<button class="reject" data-id="${doc.id}">
❌ 拒絕
</button>

</div>

`;

    });

}

loadMembers();

document.addEventListener("click", async (e) => {

    if (!e.target.dataset.id) return;

    const id = e.target.dataset.id;

    let status = "";

    if (e.target.className === "approve") {

        status = "已通過";

    }

    if (e.target.className === "hold") {

        status = "保留";

    }

    if (e.target.className === "reject") {

        status = "已拒絕";

    }

    if (!status) return;

    await updateDoc(doc(db, "members", id), {

        status: status

    });

    alert("更新成功");

   onAuthStateChanged(auth, async (user) => {

    if (!user) {

        location.href = "login.html";

        return;

    }

    const member = await getDocs(collection(db, "members"));

    let isAdmin = false;

    member.forEach((m) => {

        if (m.id === user.uid) {

            if (m.data().role === "管理員") {

                isAdmin = true;

            }

        }

    });

    if (!isAdmin) {

        alert("沒有權限");

        location.href = "app.html";

        return;

    }

    loadMembers();

});

});
