import { auth, db } from "./firebase.js";

import {
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const saveButton = document.getElementById("save");

onAuthStateChanged(auth, (user) => {

    if (!user) {

        location.href = "login.html";

        return;

    }

    saveButton.addEventListener("click", async () => {

        const nickname = document.getElementById("nickname").value.trim();

        const platform = document.getElementById("platform").value;

        const account = document.getElementById("account").value.trim();

        if (!nickname || !platform || !account) {

            alert("請填寫完整資料！");

            return;

        }

        await setDoc(doc(db, "members", user.uid), {

            email: user.email,

            nickname: nickname,

            socialPlatform: platform,

            socialAccount: account,

            memberNo: "",

            role: "會員",

            status: "待審核",

            previousNicknames: [nickname],

            adminNote: ""

        });

        alert("申請已送出！");

    });

});
