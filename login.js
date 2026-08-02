import {
    auth,
    provider,
    db,
    signInWithPopup
} from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// ==========================
// 已登入直接跳轉
// ==========================

onAuthStateChanged(auth, async (user) => {

    if (!user) return;

    const docRef = doc(db, "members", user.uid);

    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {

        location.href = "register.html";
        return;

    }

    const data = docSnap.data();

    switch (data.status) {

        case "已通過":
            location.href = "app.html";
            break;

        case "待審核":
            location.href = "pending.html";
            break;

        case "保留":
            location.href = "pending.html";
            break;

        case "已拒絕":
            location.href = "rejected.html";
            break;

    }

});


// ==========================
// Google 登入
// ==========================

const loginButton = document.getElementById("google-login");

loginButton.addEventListener("click", async () => {

    try {

        const result = await signInWithPopup(auth, provider);

        const user = result.user;

        const docRef = doc(db, "members", user.uid);

        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {

            location.href = "register.html";

            return;

        }

        const data = docSnap.data();

        switch (data.status) {

            case "已通過":
                location.href = "app.html";
                break;

            case "待審核":
                location.href = "pending.html";
                break;

            case "保留":
                location.href = "pending.html";
                break;

            case "已拒絕":
                location.href = "rejected.html";
                break;

            default:
                alert("未知狀態");

        }

    } catch (error) {

        console.error(error);

        alert("登入失敗");

    }

});
