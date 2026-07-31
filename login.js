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
                alert("您的帳號正在等待管理員審核。");
                break;

            case "保留":
                alert("您的帳號目前需要補充資料。");
                break;

            case "已拒絕":
                alert("您的申請未通過，請聯繫神燈精靈。");
                break;

            case "已停權":
                alert("您的帳號已停權。");
                break;

            default:
                alert("未知狀態");
        }

    } catch (error) {

        console.error(error);

        alert("登入失敗");

    }

});
