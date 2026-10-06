import { auth, db } from "./firebase.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* ==========================================================
   神燈精靈
   會員中心 V2
   Firestore 版
   ========================================================== */


/* ----------------------------------------------------------
   State
   ---------------------------------------------------------- */

const MemberState = {

    user: null,

    member: null,

    payments: [],

    selectedPayments: new Set()

};


/* ----------------------------------------------------------
   Firebase Auth
   ---------------------------------------------------------- */

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        return;
    }

    MemberState.user = user;


    try {

        /* ---------- 會員資料 ---------- */

        const memberSnap = await getDoc(
            doc(db, "members", user.uid)
        );


        if (memberSnap.exists()) {

            MemberState.member =
                memberSnap.data();

            renderMemberInfo();

        }


        /* ---------- 應付款資料 ---------- */

        await loadPayments(user.uid);


        /* ---------- Render ---------- */

        renderPaymentCenter();


    } catch (error) {

        console.error(
            "會員中心載入失敗：",
            error
        );

        showPaymentError();

    }

});


/* ==========================================================
   會員資料
   ========================================================== */

function renderMemberInfo() {

    const userName =
        document.getElementById("user-name");

    const memberNo =
        document.getElementById("member-no");


    if (!MemberState.member) {
        return;
    }


    if (userName) {

        userName.textContent =
            MemberState.member.nickname ||
            "會員";

    }


    if (memberNo) {

        memberNo.textContent =
            MemberState.member.memberNo ||
            "待發號";

    }

}


/* ==========================================================
   讀取應付款項
   ========================================================== */

async function loadPayments(uid) {

    MemberState.payments = [];

    MemberState.selectedPayments.clear();


    const paymentsRef =
        collection(db, "payments");


    const paymentQuery =
        query(
            paymentsRef,
            where("memberUid", "==", uid),
            where("status", "==", "unpaid")
        );


    const snapshot =
        await getDocs(paymentQuery);


    snapshot.forEach((docSnap) => {

        const data =
            docSnap.data();


        MemberState.payments.push({

            id: docSnap.id,

            event:
                data.event || "",

            member:
                data.member || "",

            quantity:
                Number(data.quantity || 0),

            amount:
                Number(data.amount || 0),

            status:
                data.status || "unpaid",

            createdAt:
                data.createdAt || null

        });

    });


    /*

       最新建立的款項放前面。
       如果之後我們有正式 createdAt，
       再做更精準的排序。

    */

    MemberState.payments.sort(
        (a, b) => {

            const aTime =
                a.createdAt?.seconds || 0;

            const bTime =
                b.createdAt?.seconds || 0;

            return bTime - aTime;

        }
    );

}


/* ==========================================================
   會員帳務
   ========================================================== */

function renderPaymentCenter() {

    const container =
        document.getElementById(
            "member-payment-center"
        );


    if (!container) {
        return;
    }


    const unpaid =
        MemberState.payments;


    const unpaidTotal =
        unpaid.reduce(
            (sum, item) =>
                sum + Number(item.amount || 0),
            0
        );


    container.innerHTML = `

        <div class="member-center">

            <div class="member-center-header">

                <div>

                    <div class="member-center-label">
                        💳 我的帳務
                    </div>

                    <h2>
                        待付款
                    </h2>

                </div>


                <div class="member-unpaid-summary">

                    <span>
                        ${unpaid.length} 筆
                    </span>

                    <strong>
                        NT$${unpaidTotal.toLocaleString("zh-TW")}
                    </strong>

                </div>

            </div>


            <div
                id="member-payment-list"
                class="member-payment-list"
            >

                ${
                    unpaid.length
                        ? unpaid.map(
                            createPaymentCard
                        ).join("")
                        : createEmptyPayment()
                }

            </div>


            ${
                unpaid.length
                    ? createPaymentFooter()
                    : ""
            }

        </div>

    `;


    bindPaymentEvents();

}


/* ==========================================================
   Payment Card
   ========================================================== */

function createPaymentCard(item) {

    return `

        <label
            class="member-payment-card"
            for="payment-${item.id}"
        >

            <input
                type="checkbox"
                id="payment-${item.id}"
                class="member-payment-checkbox"
                data-payment-id="${item.id}"
            >


            <div class="member-payment-info">

                <div class="member-payment-event">
                    ${escapeHTML(item.event)}
                </div>

                <div class="member-payment-member">
                    👤 ${escapeHTML(item.member)}
                </div>

                <div class="member-payment-quantity">
                    📦 ${item.quantity} 張
                </div>

            </div>


            <div class="member-payment-price">

                NT$${item.amount.toLocaleString("zh-TW")}

            </div>

        </label>

    `;

}


/* ==========================================================
   Footer
   ========================================================== */

function createPaymentFooter() {

    return `

        <div
            id="member-payment-footer"
            class="member-payment-footer"
        >

            <div>

                <span>
                    本次選擇
                </span>

                <strong id="selected-payment-count">
                    0 筆
                </strong>

            </div>


            <div>

                <span>
                    本次應付
                </span>

                <strong id="selected-payment-total">
                    NT$0
                </strong>

            </div>


            <button
                id="confirm-member-payment"
                class="member-payment-confirm"
            >
                確認本次付款
            </button>

        </div>

    `;

}


/* ==========================================================
   Empty
   ========================================================== */

function createEmptyPayment() {

    return `

        <div class="member-payment-empty">

            <div>
                🎉
            </div>

            <h3>
                目前沒有待付款項目
            </h3>

            <p>
                有新的款項時會顯示在這裡
            </p>

        </div>

    `;

}


/* ==========================================================
   Error
   ========================================================== */

function showPaymentError() {

    const container =
        document.getElementById(
            "member-payment-center"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="member-center">

            <div class="member-payment-empty">

                <div>
                    ⚠️
                </div>

                <h3>
                    帳務資料載入失敗
                </h3>

                <p>
                    請重新整理頁面後再試
                </p>

            </div>

        </div>

    `;

}


/* ==========================================================
   Events
   ========================================================== */

function bindPaymentEvents() {

    const checkboxes =
        document.querySelectorAll(
            ".member-payment-checkbox"
        );


    checkboxes.forEach(
        checkbox => {

            checkbox.addEventListener(
                "change",
                () => {

                    const id =
                        checkbox.dataset.paymentId;


                    if (checkbox.checked) {

                        MemberState.selectedPayments
                            .add(id);

                    } else {

                        MemberState.selectedPayments
                            .delete(id);

                    }


                    updatePaymentSummary();

                }
            );

        }
    );


    const confirmButton =
        document.getElementById(
            "confirm-member-payment"
        );


    confirmButton?.addEventListener(
        "click",
        confirmPayment
    );


    updatePaymentSummary();

}


/* ==========================================================
   Summary
   ========================================================== */

function updatePaymentSummary() {

    const selected =
        MemberState.payments.filter(
            item =>
                MemberState.selectedPayments
                    .has(item.id)
        );


    const total =
        selected.reduce(
            (sum, item) =>
                sum + Number(item.amount || 0),
            0
        );


    const countElement =
        document.getElementById(
            "selected-payment-count"
        );


    const totalElement =
        document.getElementById(
            "selected-payment-total"
        );


    if (countElement) {

        countElement.textContent =
            `${selected.length} 筆`;

    }


    if (totalElement) {

        totalElement.textContent =
            `NT$${total.toLocaleString("zh-TW")}`;

    }

}


/* ==========================================================
   Confirm
   ========================================================== */

async function confirmPayment() {

    const selected =
        MemberState.payments.filter(
            item =>
                MemberState.selectedPayments
                    .has(item.id)
        );


    if (!selected.length) {

        alert(
            "請先選擇這次要付款的項目"
        );

        return;

    }


    const total =
        selected.reduce(
            (sum, item) =>
                sum + Number(item.amount || 0),
            0
        );


    const text =
        selected
            .map(
                item =>
                    `${item.event}｜${item.member} × ${item.quantity}｜NT$${item.amount}`
            )
            .join("\n");


    const confirmed =
        confirm(
            `本次選擇 ${selected.length} 筆\n\n${text}\n\n總計：NT$${total.toLocaleString("zh-TW")}\n\n確認後會將這些項目標記為「待對帳」。`
        );


    if (!confirmed) {
        return;
    }


    const confirmButton =
        document.getElementById(
            "confirm-member-payment"
        );


    if (confirmButton) {

        confirmButton.disabled = true;
        confirmButton.textContent = "送出中...";

    }


    try {

        await Promise.all(
            selected.map(
                item =>
                    updateDoc(
                        doc(
                            db,
                            "payments",
                            item.id
                        ),
                        {
                            status: "pending",
                            paymentRequestedAt:
                                serverTimestamp()
                        }
                    )
            )
        );


        MemberState.selectedPayments.clear();


        alert(
            `已送出本次付款申請！\n\n共 ${selected.length} 筆，總計 NT$${total.toLocaleString("zh-TW")}。\n\n目前狀態：待對帳`
        );


        await loadPayments(
            MemberState.user.uid
        );


        renderPaymentCenter();


    } catch (error) {

        console.error(
            "付款申請送出失敗：",
            error
        );


        alert(
            "付款申請送出失敗，請稍後再試。"
        );


        if (confirmButton) {

            confirmButton.disabled = false;
            confirmButton.textContent =
                "確認本次付款";

        }

    }

}

/* ==========================================================
   HTML Escape
   ========================================================== */

function escapeHTML(text = "") {

    return String(text)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}
