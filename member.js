import { auth, db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {

    if (!user) return;

    const snap = await getDoc(
        doc(db, "members", user.uid)
    );

    if (!snap.exists()) return;

    const data = snap.data();

    const userName = document.getElementById("user-name");
    if (userName) {
        userName.textContent = data.nickname;
    }

    const memberNo = document.getElementById("member-no");
    if (memberNo) {
        memberNo.textContent = data.memberNo || "待發號";
    }

});
