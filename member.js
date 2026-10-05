import { auth, db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* ==========================================================
   會員中心 V1
   ========================================================== */


/* ----------------------------------------------------------
   測試用應付款資料
   ---------------------------------------------------------- */

const MOCK_PAYMENTS = [
    {
        id: "TMA-MK-01",
        event: "2026 TMA",
        member: "旼琦",
        quantity: 2,
        amount: 300,
        status: "unpaid"
    },
    {
        id: "ACON-JH-01",
        event: "2026 ACON",
        member: "鍾浩",
        quantity: 1,
        amount: 500,
        status: "unpaid"
    },
    {
        id: "AAA-MK-01",
        event: "2026 AAA",
        member: "旼琦",
        quantity: 3,
        amount: 600,
        status: "unpaid"
    },
    {
        id: "GDA-JH-01",
        event: "2026 GDA",
        member: "鍾浩",
        quantity: 1,
        amount: 400,
        status: "unpaid"
    }
];


/* ----------------------------------------------------------
   State
   ---------------------------------------------------------- */

const MemberState = {

    user: null,

    member: null,

    payments: [...MOCK_PAYMENTS],

    selectedPayments: new Set()

};


/* ----------------------------------------------------------
   Init
   ---------------------------------------------------------- */

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        return;
    }

    MemberState.user = user;

    try {

        const snap = await getDoc(
            doc(db, "members", user.uid)
        );

        if (snap.exists()) {

            MemberState.member = snap.data();

            renderMemberInfo();

        }

    } catch (error) {

        console.error(
            "會員資料讀取失敗：",
            error
        );

    }

    renderPaymentCenter();

});


/* ----------------------------------------------------------
   會員資料
   ---------------------------------------------------------- */

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


/* ----------------------------------------------------------
   會員中心
   ---------------------------------------------------------- */

function renderPaymentCenter() {

    const container =
        document.getElementById(
            "member-payment-center"
        );

    if (!container) {
        return;
    }


    const unpaid =
        MemberState.payments.filter(
            item => item.status === "unpaid"
        );


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

                ${unpaid.length
                    ? unpaid.map(
                        createPaymentCard
                    ).join("")
                    : createEmptyPayment()
                }

            </div>


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

        </div>

    `;


    bindPaymentEvents();

}


/* ----------------------------------------------------------
   Payment Card
   ---------------------------------------------------------- */

function createPaymentCard(item) {

    const checked =
        MemberState.selectedPayments.has(item.id)
            ? "checked"
            : "";


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
                ${checked}
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

                NT$${Number(item.amount).toLocaleString("zh-TW")}

            </div>

        </label>

    `;

}


/* ----------------------------------------------------------
   Empty
   ---------------------------------------------------------- */

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


/* ----------------------------------------------------------
   Events
   ---------------------------------------------------------- */

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

                        MemberState.selectedPayments.add(id);

                    } else {

                        MemberState.selectedPayments.delete(id);

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


/* ----------------------------------------------------------
   Summary
   ---------------------------------------------------------- */

function updatePaymentSummary() {

    const selected =
        MemberState.payments.filter(
            item =>
                MemberState.selectedPayments.has(
                    item.id
                )
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


/* ----------------------------------------------------------
   Confirm
   ---------------------------------------------------------- */

function confirmPayment() {

    const selected =
        MemberState.payments.filter(
            item =>
                MemberState.selectedPayments.has(
                    item.id
                )
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


    alert(
        `本次選擇 ${selected.length} 筆\n\n${text}\n\n總計：NT$${total.toLocaleString("zh-TW")}\n\n下一階段再接實際付款流程。`
    );

}


/* ----------------------------------------------------------
   HTML Escape
   ---------------------------------------------------------- */

function escapeHTML(text = "") {

    return String(text)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}
