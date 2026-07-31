import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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

</div>

`;

    });

}

loadMembers();
