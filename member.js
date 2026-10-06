import { auth, db } from "./firebase.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* ==========================================================
   神燈精靈
   會員中心 V3
   會員帳務＋儲值金＋小額退款
   ========================================================== */


/* ==========================================================
   State
   ========================================================== */

const MemberState = {

    user: null,

    member: null,

    payments: [],

    selectedPayments: new Set()

};


/* ==========================================================
   Firebase Auth
   ========================================================== */

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        return;
    }

    MemberState.user = user;

    try {

        const memberSnap = await getDoc(
            doc(db, "members", user.uid)
        );

        if (memberSnap.exists()) {

            MemberState.member =
                memberSnap.data();

            renderMemberInfo();

        }

        await loadPayments(user.uid);

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
   讀取會員帳務
   ========================================================== */

async function loadPayments(uid) {

    MemberState.payments = [];

    MemberState.selectedPayments.clear();

    const paymentsRef =
        collection(db, "payments");

    const paymentQuery =
        query(
            paymentsRef,
            where("memberUid", "==", uid)
        );

    const snapshot =
        await getDocs(paymentQuery);

    snapshot.forEach((docSnap) => {

        const data =
            docSnap.data();

        /*
         * 會員中心只顯示：
         *
         * unpaid = 待付款
         * pending = 待對帳
         *
         * paid 不需要顯示
         */

        if (
            data.status !== "unpaid" &&
            data.status !== "pending"
        ) {
            return;
        }

        MemberState.payments.push({

            id:
                docSnap.id,

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
                data.createdAt || null,

            paymentRequestedAt:
                data.paymentRequestedAt || null,

            remittanceDate:
                data.remittanceDate || "",

            remittanceTime:
                data.remittanceTime || "",

            remittanceBank:
                data.remittanceBank || "",

            remittanceLast5:
                data.remittanceLast5 || "",

            remittanceNote:
                data.remittanceNote || "",

            remittanceTotal:
                Number(
                    data.remittanceTotal || 0
                ),

            remittanceBatchId:
                data.remittanceBatchId || ""

        });

    });

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
   取得會員餘額
   ========================================================== */

function getMemberBalance() {

    return {

        storedBalance:
            Number(
                MemberState.member?.storedBalance || 0
            ),

        refundBalance:
            Number(
                MemberState.member?.refundBalance || 0
            )

    };

}


/* ==========================================================
   Render 會員帳務中心
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
        MemberState.payments.filter(
            item =>
                item.status === "unpaid"
        );

    const pending =
        MemberState.payments.filter(
            item =>
                item.status === "pending"
        );

    const unpaidTotal =
        unpaid.reduce(
            (sum, item) =>
                sum + Number(item.amount || 0),
            0
        );

    const {
        storedBalance,
        refundBalance
    } = getMemberBalance();

    const availableBalance =
        storedBalance +
        refundBalance;

    container.innerHTML = `

        <div class="member-center">

            <!-- Header -->

            <div class="member-center-header">

                <div>

                    <div class="member-center-label">
                        💳 我的帳務
                    </div>

                    <h2>
                        付款中心
                    </h2>

                </div>

                <div class="member-unpaid-summary">

                    <span>
                        待付款 ${unpaid.length} 筆
                    </span>

                    <strong>
                        NT$${unpaidTotal.toLocaleString("zh-TW")}
                    </strong>

                </div>

            </div>


            <!-- Balance -->

            <div class="member-balance-summary">

                <div class="member-balance-title">
                    💰 我的餘額
                </div>

                <div class="member-balance-grid">

                    <div class="member-balance-card">

                        <div class="member-balance-icon">
                            💵
                        </div>

                        <div>

                            <div class="member-balance-label">
                                儲值金
                            </div>

                            <div class="member-balance-value">
                                NT$${storedBalance.toLocaleString("zh-TW")}
                            </div>

                        </div>

                    </div>


                    <div class="member-balance-card">

                        <div class="member-balance-icon">
                            💸
                        </div>

                        <div>

                            <div class="member-balance-label">
                                小額退款
                            </div>

                            <div class="member-balance-value">
                                NT$${refundBalance.toLocaleString("zh-TW")}
                            </div>

                        </div>

                    </div>


                    <div class="member-balance-card member-balance-total">

                        <div class="member-balance-icon">
                            🪙
                        </div>

                        <div>

                            <div class="member-balance-label">
                                可使用總額
                            </div>

                            <div class="member-balance-value">
                                NT$${availableBalance.toLocaleString("zh-TW")}
                            </div>

                        </div>

                    </div>

                </div>

            </div>


            <!-- Pending -->

            ${
                pending.length
                    ? createPendingSection(pending)
                    : ""
            }


            <!-- Unpaid -->

            <div class="member-payment-list">

                ${
                    unpaid.length
                        ? unpaid
                            .map(createPaymentCard)
                            .join("")
                        : createEmptyPayment()
                }

            </div>


            <!-- Footer -->

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
                NT$${Number(item.amount || 0).toLocaleString("zh-TW")}
            </div>

        </label>

    `;

}


/* ==========================================================
   Pending 匯款區
   ========================================================== */

function createPendingSection(pending) {

    const groups = {};

    pending.forEach(item => {

        const batchId =
            item.remittanceBatchId ||
            `single-${item.id}`;

        if (!groups[batchId]) {
            groups[batchId] = [];
        }

        groups[batchId].push(item);

    });

    const batches =
        Object.values(groups);

    /*
     * 顯示的是原本這批匯填的總金額。
     * 如果有使用儲值金／小額退款，
     * 會員端也不需要看到折抵細節。
     */

    const totalOriginal =
        batches.reduce(
            (sum, items) => {

                return sum +
                    items.reduce(
                        (itemSum, item) =>
                            itemSum +
                            Number(item.amount || 0),
                        0
                    );

            },
            0
        );

    return `

        <div class="member-pending-box">

            <div class="member-pending-title">
                ⏳ 待對帳
            </div>

            <div class="member-pending-summary">
                ${batches.length} 筆匯款・共
                NT$${totalOriginal.toLocaleString("zh-TW")}
            </div>

            <div class="member-pending-batch-list">

                ${
                    batches
                        .map(createPendingBatchCard)
                        .join("")
                }

            </div>

        </div>

    `;

}


/* ==========================================================
   Pending 批次卡片
   ★ 最簡潔版本
   ========================================================== */

function createPendingBatchCard(items) {

    const eventCount =
        items.length;

    const eventHTML =
        items
            .map(item => {

                return `

                    <div class="member-pending-event-simple">
                        📸 ${escapeHTML(item.event)}
                    </div>

                `;

            })
            .join("");

    const total =
        items.reduce(
            (sum, item) =>
                sum +
                Number(item.amount || 0),
            0
        );

    return `

        <div class="member-pending-batch-card">

            <div class="member-pending-batch-total">
                <strong>
                    ${eventCount > 0 ? "1" : "0"} 筆匯款・共
                    NT$${total.toLocaleString("zh-TW")}
                </strong>
            </div>

            <div class="member-pending-batch-subtitle">
                本次匯填
                <strong>
                    ${eventCount} 個場次
                </strong>
            </div>

            <div class="member-pending-event-list-simple">

                ${eventHTML}

            </div>

        </div>

    `;

}


/* ==========================================================
   Payment Footer
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
                我要付款
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
                item.status === "unpaid" &&
                MemberState.selectedPayments
                    .has(item.id)
        );

    const total =
        selected.reduce(
            (sum, item) =>
                sum +
                Number(item.amount || 0),
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
   Confirm Payment
   ========================================================== */

async function confirmPayment() {

    const selected =
        MemberState.payments.filter(
            item =>
                item.status === "unpaid" &&
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
                sum +
                Number(item.amount || 0),
            0
        );

    openPaymentMethodModal(
        selected,
        total
    );

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


/* ==========================================================
   付款方式
   ========================================================== */

function openPaymentMethodModal(
    selected,
    total
) {

    const {
        storedBalance,
        refundBalance
    } = getMemberBalance();

    let refundUsed = 0;
    let storedUsed = 0;

    const oldModal =
        document.getElementById(
            "member-payment-method-modal"
        );

    oldModal?.remove();

    const modal =
        document.createElement("div");

    modal.id =
        "member-payment-method-modal";

    modal.className =
        "member-payment-modal";

    modal.innerHTML = `

        <div class="member-payment-modal-backdrop">

            <div class="member-payment-modal-box">

                <div class="member-payment-modal-header">

                    <div>

                        <div class="member-payment-modal-label">
                            💳 付款
                        </div>

                        <h3>
                            選擇付款方式
                        </h3>

                    </div>

                    <button
                        type="button"
                        class="member-payment-modal-close"
                        id="close-payment-method-modal"
                    >
                        ✕
                    </button>

                </div>


                <!-- 本次付款 -->

                <div class="member-payment-modal-section">

                    <div class="member-payment-modal-section-title">
                        本次付款項目
                    </div>

                    <div class="member-payment-selected-list">

                        ${
                            selected
                                .map(
                                    item => `

                                        <div class="member-payment-selected-item">

                                            <div>

                                                <div class="member-payment-selected-event">
                                                    ${escapeHTML(item.event)}
                                                </div>

                                                <div class="member-payment-selected-member">
                                                    ${escapeHTML(item.member)}
                                                    × ${item.quantity}
                                                </div>

                                            </div>

                                            <strong>
                                                NT$${Number(item.amount || 0).toLocaleString("zh-TW")}
                                            </strong>

                                        </div>

                                    `
                                )
                                .join("")
                        }

                    </div>

                    <div class="member-payment-selected-total">

                        <span>
                            本次應付
                        </span>

                        <strong>
                            NT$${total.toLocaleString("zh-TW")}
                        </strong>

                    </div>

                </div>


                <!-- 餘額 -->

                <div class="member-payment-modal-section">

                    <div class="member-payment-modal-section-title">
                        💰 使用我的餘額
                    </div>


                    <label class="member-balance-option">

                        <div class="member-balance-option-left">

                            <input
                                type="checkbox"
                                id="use-refund-balance"
                                ${
                                    refundBalance > 0
                                        ? ""
                                        : "disabled"
                                }
                            >

                            <div>

                                <div class="member-balance-option-title">
                                    小額退款
                                </div>

                                <div class="member-balance-option-sub">
                                    可用 NT$${refundBalance.toLocaleString("zh-TW")}
                                </div>

                            </div>

                        </div>

                        <strong id="refund-balance-used">
                            NT$0
                        </strong>

                    </label>


                    <label class="member-balance-option">

                        <div class="member-balance-option-left">

                            <input
                                type="checkbox"
                                id="use-stored-balance"
                                ${
                                    storedBalance > 0
                                        ? ""
                                        : "disabled"
                                }
                            >

                            <div>

                                <div class="member-balance-option-title">
                                    儲值金
                                </div>

                                <div class="member-balance-option-sub">
                                    可用 NT$${storedBalance.toLocaleString("zh-TW")}
                                </div>

                            </div>

                        </div>

                        <strong id="stored-balance-used">
                            NT$0
                        </strong>

                    </label>

                </div>


                <!-- 計算 -->

                <div class="member-payment-calculation">

                    <div>

                        <span>
                            本次應付
                        </span>

                        <strong>
                            NT$${total.toLocaleString("zh-TW")}
                        </strong>

                    </div>

                    <div>

                        <span>
                            小額退款折抵
                        </span>

                        <strong id="calculation-refund">
                            NT$0
                        </strong>

                    </div>

                    <div>

                        <span>
                            儲值金折抵
                        </span>

                        <strong id="calculation-stored">
                            NT$0
                        </strong>

                    </div>

                    <div class="member-payment-calculation-total">

                        <span>
                            還需要付款
                        </span>

                        <strong id="calculation-remaining">
                            NT$${total.toLocaleString("zh-TW")}
                        </strong>

                    </div>

                </div>


                <div
                    id="payment-method-hint"
                    class="member-payment-method-hint"
                >
                    可以選擇要使用的餘額。
                    若餘額不足，剩餘金額再使用銀行匯款。
                </div>


                <div class="member-payment-modal-actions">

                    <button
                        type="button"
                        class="member-payment-modal-cancel"
                        id="cancel-payment-method"
                    >
                        返回
                    </button>

                    <button
                        type="button"
                        class="member-payment-modal-submit"
                        id="continue-payment-method"
                    >
                        下一步
                    </button>

                </div>

            </div>

        </div>

    `;

    document.body.appendChild(modal);


    const refundCheckbox =
        document.getElementById(
            "use-refund-balance"
        );

    const storedCheckbox =
        document.getElementById(
            "use-stored-balance"
        );

    const refundUsedElement =
        document.getElementById(
            "refund-balance-used"
        );

    const storedUsedElement =
        document.getElementById(
            "stored-balance-used"
        );

    const calculationRefund =
        document.getElementById(
            "calculation-refund"
        );

    const calculationStored =
        document.getElementById(
            "calculation-stored"
        );

    const calculationRemaining =
        document.getElementById(
            "calculation-remaining"
        );

    const hint =
        document.getElementById(
            "payment-method-hint"
        );


    function updateCalculation() {

        let remaining =
            total;

        refundUsed = 0;
        storedUsed = 0;


        if (
            refundCheckbox &&
            refundCheckbox.checked
        ) {

            refundUsed =
                Math.min(
                    refundBalance,
                    remaining
                );

            remaining -=
                refundUsed;

        }


        if (
            storedCheckbox &&
            storedCheckbox.checked
        ) {

            storedUsed =
                Math.min(
                    storedBalance,
                    remaining
                );

            remaining -=
                storedUsed;

        }


        if (refundUsedElement) {

            refundUsedElement.textContent =
                `NT$${refundUsed.toLocaleString("zh-TW")}`;

        }

        if (storedUsedElement) {

            storedUsedElement.textContent =
                `NT$${storedUsed.toLocaleString("zh-TW")}`;

        }

        if (calculationRefund) {

            calculationRefund.textContent =
                `NT$${refundUsed.toLocaleString("zh-TW")}`;

        }

        if (calculationStored) {

            calculationStored.textContent =
                `NT$${storedUsed.toLocaleString("zh-TW")}`;

        }

        if (calculationRemaining) {

            calculationRemaining.textContent =
                `NT$${remaining.toLocaleString("zh-TW")}`;

        }


        if (hint) {

            if (remaining === 0) {

                hint.textContent =
                    "🎉 餘額已足夠支付本次款項，下一步會直接完成付款。";

            } else if (
                refundUsed > 0 ||
                storedUsed > 0
            ) {

                hint.textContent =
                    `本次會先使用餘額折抵，剩餘 NT$${remaining.toLocaleString("zh-TW")} 再使用銀行匯款。`;

            } else {

                hint.textContent =
                    "可以選擇要使用的餘額。若不使用餘額，則會直接進入銀行匯款。";

            }

        }

    }


    refundCheckbox?.addEventListener(
        "change",
        updateCalculation
    );

    storedCheckbox?.addEventListener(
        "change",
        updateCalculation
    );


    const closeModal = () => {

        modal.remove();

    };


    document
        .getElementById(
            "close-payment-method-modal"
        )
        ?.addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById(
            "cancel-payment-method"
        )
        ?.addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById(
            "continue-payment-method"
        )
        ?.addEventListener(
            "click",
            async () => {

                const remaining =
                    total -
                    refundUsed -
                    storedUsed;

                closeModal();

                if (remaining <= 0) {

                    await completeBalancePayment(
                        selected,
                        total,
                        refundUsed,
                        storedUsed
                    );

                    return;

                }

                openBankInfoModal({

                    selected,

                    total,

                    refundUsed,

                    storedUsed,

                    remaining

                });

            }
        );


    updateCalculation();

}


/* ==========================================================
   完全使用餘額付款
   ========================================================== */

async function completeBalancePayment(
    selected,
    total,
    refundUsed,
    storedUsed
) {

    if (!MemberState.user) {

        alert(
            "會員資料尚未載入完成，請重新整理頁面後再試。"
        );

        return;

    }

    const uid =
        MemberState.user.uid;

    try {

        const memberRef =
            doc(
                db,
                "members",
                uid
            );

        const memberSnap =
            await getDoc(memberRef);

        if (!memberSnap.exists()) {

            throw new Error(
                "找不到會員資料"
            );

        }

        const latestMember =
            memberSnap.data();

        const latestRefund =
            Number(
                latestMember.refundBalance || 0
            );

        const latestStored =
            Number(
                latestMember.storedBalance || 0
            );


        let latestRemaining =
            total;

        const actualRefundUsed =
            Math.min(
                refundUsed,
                latestRefund,
                latestRemaining
            );

        latestRemaining -=
            actualRefundUsed;

        const actualStoredUsed =
            Math.min(
                storedUsed,
                latestStored,
                latestRemaining
            );

        latestRemaining -=
            actualStoredUsed;


        if (latestRemaining > 0) {

            alert(
                "目前餘額已不足以完成本次付款，請重新選擇付款方式。"
            );

            return;

        }


        await runTransaction(
            db,
            async (transaction) => {

                const freshMemberSnap =
                    await transaction.get(
                        memberRef
                    );

                if (!freshMemberSnap.exists()) {

                    throw new Error(
                        "找不到會員資料"
                    );

                }

                const freshMember =
                    freshMemberSnap.data();

                const currentRefund =
                    Number(
                        freshMember.refundBalance || 0
                    );

                const currentStored =
                    Number(
                        freshMember.storedBalance || 0
                    );

                if (
                    currentRefund <
                    actualRefundUsed
                ) {

                    throw new Error(
                        "小額退款餘額不足"
                    );

                }

                if (
                    currentStored <
                    actualStoredUsed
                ) {

                    throw new Error(
                        "儲值金餘額不足"
                    );

                }


                transaction.update(
                    memberRef,
                    {

                        refundBalance:
                            currentRefund -
                            actualRefundUsed,

                        storedBalance:
                            currentStored -
                            actualStoredUsed

                    }
                );


                selected.forEach(
                    item => {

                        const paymentRef =
                            doc(
                                db,
                                "payments",
                                item.id
                            );

                        transaction.update(
                            paymentRef,
                            {

                                status:
                                    "paid",

                                paymentMethod:
                                    "member_balance",

                                paymentTotal:
                                    Number(
                                        item.amount || 0
                                    ),

                                originalPaymentTotal:
                                    Number(
                                        item.amount || 0
                                    ),

                                refundBalanceUsed:
                                    actualRefundUsed,

                                storedBalanceUsed:
                                    actualStoredUsed,

                                paidAt:
                                    serverTimestamp()

                            }
                        );

                    }
                );

            }
        );


        MemberState.member = {

            ...MemberState.member,

            refundBalance:
                latestRefund -
                actualRefundUsed,

            storedBalance:
                latestStored -
                actualStoredUsed

        };


        MemberState.selectedPayments.clear();


        alert(
            `付款完成！\n\n` +
            `本次共 ${selected.length} 筆。\n` +
            `總計 NT$${total.toLocaleString("zh-TW")}\n\n` +
            `已使用：\n` +
            `小額退款 NT$${actualRefundUsed.toLocaleString("zh-TW")}\n` +
            `儲值金 NT$${actualStoredUsed.toLocaleString("zh-TW")}`
        );


        await loadPayments(
            MemberState.user.uid
        );

        renderMemberInfo();

        renderPaymentCenter();


    } catch (error) {

        console.error(
            "餘額付款失敗：",
            error
        );

        alert(
            `付款失敗：${error.message || "請稍後再試"}`
        );

    }

}


/* ==========================================================
   銀行資訊 Modal
   ========================================================== */

function openBankInfoModal({

    selected,

    total,

    refundUsed,

    storedUsed,

    remaining

}) {

    const oldModal =
        document.getElementById(
            "member-bank-info-modal"
        );

    oldModal?.remove();

    const modal =
        document.createElement("div");

    modal.id =
        "member-bank-info-modal";

    modal.className =
        "member-payment-modal";

    modal.innerHTML = `

        <div class="member-payment-modal-backdrop">

            <div class="member-payment-modal-box">

                <div class="member-payment-modal-header">

                    <div>

                        <div class="member-payment-modal-label">
                            🏦 銀行匯款
                        </div>

                        <h3>
                            請匯款剩餘金額
                        </h3>

                    </div>

                    <button
                        type="button"
                        class="member-payment-modal-close"
                        id="close-bank-info-modal"
                    >
                        ✕
                    </button>

                </div>


                <div class="member-bank-payment-summary">

                    <div class="member-bank-summary-label">
                        本次需要匯款
                    </div>

                    <div class="member-bank-summary-amount">
                        NT$${remaining.toLocaleString("zh-TW")}
                    </div>

                    <div class="member-bank-summary-detail">

                        <div>

                            <span>
                                原本應付
                            </span>

                            <strong>
                                NT$${total.toLocaleString("zh-TW")}
                            </strong>

                        </div>


                        ${
                            refundUsed > 0
                                ? `

                                    <div>

                                        <span>
                                            小額退款折抵
                                        </span>

                                        <strong>
                                            − NT$${refundUsed.toLocaleString("zh-TW")}
                                        </strong>

                                    </div>

                                `
                                : ""
                        }


                        ${
                            storedUsed > 0
                                ? `

                                    <div>

                                        <span>
                                            儲值金折抵
                                        </span>

                                        <strong>
                                            − NT$${storedUsed.toLocaleString("zh-TW")}
                                        </strong>

                                    </div>

                                `
                                : ""
                        }

                    </div>

                </div>


                <div class="member-payment-modal-section">

                    <div class="member-payment-modal-section-title">
                        🏦 匯款帳戶
                    </div>


                    <div class="member-bank-account">

                        <div class="member-bank-account-info">

                            <div class="member-bank-name">
                                (700) 中華郵政
                            </div>

                            <div class="member-bank-number">
                                24414050555742
                            </div>

                        </div>

                        <button
                            type="button"
                            class="member-bank-copy"
                            data-copy-account="24414050555742"
                        >
                            📋 複製
                        </button>

                    </div>


                    <div class="member-bank-account">

                        <div class="member-bank-account-info">

                            <div class="member-bank-name">
                                (807) 永豐銀行
                            </div>

                            <div class="member-bank-number">
                                20401800363832
                            </div>

                        </div>

                        <button
                            type="button"
                            class="member-bank-copy"
                            data-copy-account="20401800363832"
                        >
                            📋 複製
                        </button>

                    </div>


                    <div
                        id="bank-copy-message"
                        class="member-bank-copy-message"
                    ></div>

                </div>


                <div class="member-payment-method-hint">

                    💡 完成匯款後，下一步需要填寫匯款資料。
                    <br>
                    填寫後系統會將這次選擇的所有款項一起送出對帳。

                </div>


                <div class="member-payment-modal-actions">

                    <button
                        type="button"
                        class="member-payment-modal-cancel"
                        id="back-to-payment-method"
                    >
                        返回
                    </button>

                    <button
                        type="button"
                        class="member-payment-modal-submit"
                        id="open-remittance-form"
                    >
                        我已完成匯款
                    </button>

                </div>

            </div>

        </div>

    `;

    document.body.appendChild(modal);


    const closeModal = () => {

        modal.remove();

    };


    document
        .getElementById(
            "close-bank-info-modal"
        )
        ?.addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById(
            "back-to-payment-method"
        )
        ?.addEventListener(
            "click",
            closeModal
        );


    const copyButtons =
        modal.querySelectorAll(
            ".member-bank-copy"
        );


    copyButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                async () => {

                    const account =
                        button.dataset.copyAccount;

                    try {

                        await navigator.clipboard.writeText(
                            account
                        );

                        const message =
                            document.getElementById(
                                "bank-copy-message"
                            );

                        if (message) {

                            message.textContent =
                                `已複製帳號 ${account}`;

                        }

                        button.textContent =
                            "✓ 已複製";

                        setTimeout(
                            () => {

                                button.textContent =
                                    "📋 複製";

                            },
                            1500
                        );


                    } catch (error) {

                        console.error(
                            "複製帳號失敗：",
                            error
                        );

                        alert(
                            `請手動複製銀行帳號：${account}`
                        );

                    }

                }
            );

        }
    );


    document
        .getElementById(
            "open-remittance-form"
        )
        ?.addEventListener(
            "click",
            () => {

                closeModal();

                openRemittanceForm({

                    selected,

                    total,

                    refundUsed,

                    storedUsed,

                    remaining

                });

            }
        );

}


/* ==========================================================
   匯款資料表單
   ========================================================== */

function openRemittanceForm({

    selected,

    total,

    refundUsed,

    storedUsed,

    remaining

}) {

    const oldModal =
        document.getElementById(
            "member-remittance-modal"
        );

    oldModal?.remove();

    const modal =
        document.createElement("div");

    modal.id =
        "member-remittance-modal";

    modal.className =
        "member-payment-modal";

    modal.innerHTML = `

        <div class="member-payment-modal-backdrop">

            <div class="member-payment-modal-box">

                <div class="member-payment-modal-header">

                    <div>

                        <div class="member-payment-modal-label">
                            🧾 匯款資料
                        </div>

                        <h3>
                            填寫匯款資訊
                        </h3>

                    </div>

                    <button
                        type="button"
                        class="member-payment-modal-close"
                        id="close-remittance-modal"
                    >
                        ✕
                    </button>

                </div>


                <div class="member-remittance-amount-box">

                    <span>
                        本次實際匯款金額
                    </span>

                    <strong>
                        NT$${remaining.toLocaleString("zh-TW")}
                    </strong>

                </div>


                <div class="member-payment-modal-section">

                    <div class="member-payment-modal-section-title">
                        📦 本次付款項目
                    </div>

                    <div class="member-payment-selected-list">

                        ${
                            selected
                                .map(
                                    item => `

                                        <div class="member-payment-selected-item">

                                            <div>

                                                <div class="member-payment-selected-event">
                                                    ${escapeHTML(item.event)}
                                                </div>

                                                <div class="member-payment-selected-member">
                                                    ${escapeHTML(item.member)}
                                                    × ${item.quantity}
                                                </div>

                                            </div>

                                            <strong>
                                                NT$${Number(item.amount || 0).toLocaleString("zh-TW")}
                                            </strong>

                                        </div>

                                    `
                                )
                                .join("")
                        }

                    </div>

                </div>


                <div class="member-remittance-form">

                    <div class="member-form-field">

                        <label for="remittance-date">
                            匯款日期
                        </label>

                        <input
                            type="date"
                            id="remittance-date"
                        >

                    </div>


                    <div class="member-form-field">

                        <label for="remittance-time">
                            匯款時間
                        </label>

                        <input
                            type="time"
                            id="remittance-time"
                        >

                    </div>


                    <div class="member-form-field">

                        <label for="remittance-bank">
                            匯入銀行
                        </label>

                        <select
                            id="remittance-bank"
                        >

                            <option value="">
                                請選擇匯入銀行
                            </option>

                            <option value="700 中華郵政">
                                (700) 中華郵政
                            </option>

                            <option value="807 永豐銀行">
                                (807) 永豐銀行
                            </option>

                        </select>

                    </div>


                    <div class="member-form-field">

                        <label for="remittance-last5">
                            匯款帳號末 5 碼
                        </label>

                        <input
                            type="text"
                            id="remittance-last5"
                            inputmode="numeric"
                            maxlength="5"
                            placeholder="例如 12345"
                        >

                    </div>


                    <div class="member-form-field">

                        <label for="remittance-note">
                            備註（選填）
                        </label>

                        <textarea
                            id="remittance-note"
                            rows="3"
                            placeholder="有需要補充的資訊可以寫在這裡"
                        ></textarea>

                    </div>

                </div>


                ${
                    refundUsed > 0 ||
                    storedUsed > 0
                        ? `

                            <div class="member-remittance-balance-detail">

                                ${
                                    refundUsed > 0
                                        ? `

                                            <div>

                                                <span>
                                                    小額退款折抵
                                                </span>

                                                <strong>
                                                    NT$${refundUsed.toLocaleString("zh-TW")}
                                                </strong>

                                            </div>

                                        `
                                        : ""
                                }


                                ${
                                    storedUsed > 0
                                        ? `

                                            <div>

                                                <span>
                                                    儲值金折抵
                                                </span>

                                                <strong>
                                                    NT$${storedUsed.toLocaleString("zh-TW")}
                                                </strong>

                                            </div>

                                        `
                                        : ""
                                }

                            </div>

                        `
                        : ""
                }


                <div
                    id="remittance-form-error"
                    class="member-remittance-form-error"
                ></div>


                <div class="member-payment-method-hint">

                    📌 送出後，這次選擇的所有款項會一起進入「待對帳」。

                </div>


                <div class="member-payment-modal-actions">

                    <button
                        type="button"
                        class="member-payment-modal-cancel"
                        id="cancel-remittance"
                    >
                        返回
                    </button>

                    <button
                        type="button"
                        class="member-payment-modal-submit"
                        id="submit-remittance"
                    >
                        送出匯款資料
                    </button>

                </div>

            </div>

        </div>

    `;

    document.body.appendChild(modal);


    const closeModal = () => {

        modal.remove();

    };


    document
        .getElementById(
            "close-remittance-modal"
        )
        ?.addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById(
            "cancel-remittance"
        )
        ?.addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById(
            "submit-remittance"
        )
        ?.addEventListener(
            "click",
            async () => {

                const date =
                    document.getElementById(
                        "remittance-date"
                    )?.value.trim();

                const time =
                    document.getElementById(
                        "remittance-time"
                    )?.value.trim();

                const bank =
                    document.getElementById(
                        "remittance-bank"
                    )?.value.trim();

                const last5 =
                    document.getElementById(
                        "remittance-last5"
                    )?.value.trim();

                const note =
                    document.getElementById(
                        "remittance-note"
                    )?.value.trim();

                const errorElement =
                    document.getElementById(
                        "remittance-form-error"
                    );


                if (!date) {

                    if (errorElement) {

                        errorElement.textContent =
                            "請選擇匯款日期";

                    }

                    return;

                }


                if (!time) {

                    if (errorElement) {

                        errorElement.textContent =
                            "請填寫匯款時間";

                    }

                    return;

                }


                if (!bank) {

                    if (errorElement) {

                        errorElement.textContent =
                            "請選擇匯入銀行";

                    }

                    return;

                }


                if (!/^\d{5}$/.test(last5)) {

                    if (errorElement) {

                        errorElement.textContent =
                            "請填寫正確的 5 位數帳號末碼";

                    }

                    return;

                }


                const submitButton =
                    document.getElementById(
                        "submit-remittance"
                    );

                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.textContent =
                        "送出中...";

                }


                try {

                    await submitRemittance({

                        selected,

                        total,

                        refundUsed,

                        storedUsed,

                        remaining,

                        date,

                        time,

                        bank,

                        last5,

                        note

                    });

                    closeModal();

                } catch (error) {

                    console.error(
                        "匯款資料送出失敗：",
                        error
                    );

                    if (errorElement) {

                        errorElement.textContent =
                            error.message ||
                            "送出失敗，請稍後再試";

                    }

                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            "送出匯款資料";

                    }

                }

            }
        );

}


/* ==========================================================
   送出匯款資料
   ========================================================== */

async function submitRemittance({

    selected,

    total,

    refundUsed,

    storedUsed,

    remaining,

    date,

    time,

    bank,

    last5,

    note

}) {

    if (!MemberState.user) {

        throw new Error(
            "會員資料尚未載入完成"
        );

    }

    const uid =
        MemberState.user.uid;

    const memberRef =
        doc(
            db,
            "members",
            uid
        );


    /*
     * 每一次「我要付款」
     * 都建立一個獨立的匯款批次。
     */

    const batchId =
        crypto.randomUUID();

    const batchRef =
        doc(
            db,
            "remittanceBatches",
            batchId
        );


    try {

        await runTransaction(
            db,
            async (transaction) => {

                /* ==========================================
                   會員資料
                   ========================================== */

                const memberSnap =
                    await transaction.get(
                        memberRef
                    );

                if (!memberSnap.exists()) {

                    throw new Error(
                        "找不到會員資料"
                    );

                }

                const member =
                    memberSnap.data();

                const currentRefund =
                    Number(
                        member.refundBalance || 0
                    );

                const currentStored =
                    Number(
                        member.storedBalance || 0
                    );


                if (
                    currentRefund <
                    refundUsed
                ) {

                    throw new Error(
                        "小額退款餘額不足，請重新整理頁面後再試。"
                    );

                }


                if (
                    currentStored <
                    storedUsed
                ) {

                    throw new Error(
                        "儲值金餘額不足，請重新整理頁面後再試。"
                    );

                }


                /* ==========================================
                   付款項目
                   ========================================== */

                const paymentRefs =
                    selected.map(
                        item =>
                            doc(
                                db,
                                "payments",
                                item.id
                            )
                    );

                const paymentSnaps = [];


                for (
                    const paymentRef
                    of paymentRefs
                ) {

                    const paymentSnap =
                        await transaction.get(
                            paymentRef
                        );

                    if (!paymentSnap.exists()) {

                        throw new Error(
                            "其中一筆付款項目不存在，請重新整理頁面。"
                        );

                    }

                    paymentSnaps.push(
                        paymentSnap
                    );

                }


                paymentSnaps.forEach(
                    paymentSnap => {

                        const payment =
                            paymentSnap.data();

                        if (
                            payment.memberUid !==
                            uid
                        ) {

                            throw new Error(
                                "付款項目會員資料不符。"
                            );

                        }

                        if (
                            payment.status !==
                            "unpaid"
                        ) {

                            throw new Error(
                                "其中一筆款項已被處理，請重新整理頁面。"
                            );

                        }

                    }
                );


                /* ==========================================
                   扣除會員餘額
                   ========================================== */

                transaction.update(
                    memberRef,
                    {

                        refundBalance:
                            currentRefund -
                            refundUsed,

                        storedBalance:
                            currentStored -
                            storedUsed

                    }
                );


                /* ==========================================
                   建立匯款批次
                   ========================================== */

                transaction.set(
                    batchRef,
                    {

                        memberUid:
                            uid,

                        memberNickname:
                            member.nickname ||
                            "",

                        paymentIds:
                            selected.map(
                                item =>
                                    item.id
                            ),

                        paymentCount:
                            selected.length,

                        originalTotal:
                            total,

                        refundBalanceUsed:
                            refundUsed,

                        storedBalanceUsed:
                            storedUsed,

                        bankTransferAmount:
                            remaining,

                        remittanceDate:
                            date,

                        remittanceTime:
                            time,

                        remittanceBank:
                            bank,

                        remittanceLast5:
                            last5,

                        remittanceNote:
                            note || "",

                        status:
                            "pending",

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()

                    }
                );


                /* ==========================================
                   更新付款項目
                   ========================================== */

                selected.forEach(
                    item => {

                        const paymentRef =
                            doc(
                                db,
                                "payments",
                                item.id
                            );

                        transaction.update(
                            paymentRef,
                            {

                                status:
                                    "pending",

                                paymentRequestedAt:
                                    serverTimestamp(),

                                remittanceDate:
                                    date,

                                remittanceTime:
                                    time,

                                remittanceBank:
                                    bank,

                                remittanceLast5:
                                    last5,

                                remittanceNote:
                                    note || "",

                                remittanceTotal:
                                    remaining,

                                remittanceBatchId:
                                    batchId

                            }
                        );

                    }
                );

            }
        );


        /* ==========================================
           更新本地會員資料
           ========================================== */

        MemberState.member = {

            ...MemberState.member,

            refundBalance:
                Number(
                    MemberState.member
                        ?.refundBalance || 0
                ) -
                refundUsed,

            storedBalance:
                Number(
                    MemberState.member
                        ?.storedBalance || 0
                ) -
                storedUsed

        };


        MemberState.selectedPayments.clear();


        alert(
            `匯款資料已送出！\n\n` +
            `本次共 ${selected.length} 筆\n` +
            `原應付 NT$${total.toLocaleString("zh-TW")}\n` +
            `餘額折抵 NT$${(
                refundUsed +
                storedUsed
            ).toLocaleString("zh-TW")}\n` +
            `實際匯款 NT$${remaining.toLocaleString("zh-TW")}\n\n` +
            `目前狀態：待對帳`
        );


        await loadPayments(
            MemberState.user.uid
        );

        renderMemberInfo();

        renderPaymentCenter();


    } catch (error) {

        console.error(
            "submitRemittance 失敗：",
            error
        );

        throw error;

    }

}


/* ==========================================================
   額外 CSS
   ========================================================== */

function ensureMemberPaymentStyles() {

    if (
        document.getElementById(
            "member-payment-extra-styles"
        )
    ) {

        return;

    }

    const style =
        document.createElement("style");

    style.id =
        "member-payment-extra-styles";

    style.textContent = `

        /* ==================================================
           Balance
           ================================================== */

        .member-balance-summary {

            margin-bottom: 22px;

            padding: 18px;

            border-radius: 18px;

            background:
                linear-gradient(
                    135deg,
                    rgba(255,255,255,.95),
                    rgba(246,248,255,.95)
                );

            border:
                1px solid
                rgba(120,130,180,.12);

        }


        .member-balance-title {

            font-size: 15px;

            font-weight: 700;

            margin-bottom: 14px;

        }


        .member-balance-grid {

            display: grid;

            grid-template-columns:
                repeat(3, 1fr);

            gap: 12px;

        }


        .member-balance-card {

            display: flex;

            align-items: center;

            gap: 10px;

            padding: 13px;

            border-radius: 14px;

            background: #fff;

            border:
                1px solid
                rgba(120,130,180,.10);

        }


        .member-balance-total {

            background:
                linear-gradient(
                    135deg,
                    rgba(240,245,255,.95),
                    rgba(250,242,255,.95)
                );

        }


        .member-balance-icon {

            font-size: 23px;

        }


        .member-balance-label {

            font-size: 12px;

            color: #777;

            margin-bottom: 3px;

        }


        .member-balance-value {

            font-size: 16px;

            font-weight: 800;

        }


        /* ==================================================
           Pending
           ================================================== */

        .member-pending-box {

            margin-bottom: 20px;

            padding: 15px 17px;

            border-radius: 15px;

            background:
                rgba(255,248,230,.95);

            border:
                1px solid
                rgba(220,170,70,.18);

        }


        .member-pending-title {

            font-size: 15px;

            font-weight: 800;

            margin-bottom: 6px;

        }


        .member-pending-summary {

            font-size: 14px;

            font-weight: 700;

            color: #4f5364;

            margin-bottom: 5px;

        }


        .member-pending-batch-list {

            display: flex;

            flex-direction: column;

            gap: 8px;

            margin-top: 10px;

        }


        .member-pending-batch-card {

            padding: 12px 13px;

            border-radius: 12px;

            background:
                rgba(255,255,255,.8);

        }


        .member-pending-batch-total {

            font-size: 14px;

            color: #353a4a;

            margin-bottom: 5px;

        }


        .member-pending-batch-total strong {

            font-weight: 800;

        }


        .member-pending-batch-subtitle {

            font-size: 12px;

            color: #858a99;

            margin-bottom: 8px;

        }


        .member-pending-batch-subtitle strong {

            color: #6268c9;

        }


        .member-pending-event-list-simple {

            display: flex;

            flex-direction: column;

            gap: 4px;

        }


        .member-pending-event-simple {

            font-size: 13px;

            color: #555b6d;

            padding: 7px 9px;

            background: #f7f7fb;

            border-radius: 9px;

        }


        /* ==================================================
           Modal
           ================================================== */

        .member-payment-modal {

            position: fixed;

            inset: 0;

            z-index: 99999;

        }


        .member-payment-modal-backdrop {

            position: absolute;

            inset: 0;

            display: flex;

            align-items: center;

            justify-content: center;

            padding: 20px;

            background:
                rgba(20,25,45,.42);

            backdrop-filter:
                blur(5px);

            overflow-y: auto;

        }


        .member-payment-modal-box {

            width: min(
                560px,
                100%
            );

            max-height: 92vh;

            overflow-y: auto;

            padding: 22px;

            border-radius: 22px;

            background: #fff;

            box-shadow:
                0 20px 60px
                rgba(30,40,80,.22);

        }


        .member-payment-modal-header {

            display: flex;

            align-items: flex-start;

            justify-content: space-between;

            gap: 15px;

            margin-bottom: 20px;

        }


        .member-payment-modal-label {

            font-size: 12px;

            color: #7d82a4;

            font-weight: 700;

            margin-bottom: 4px;

        }


        .member-payment-modal-header h3 {

            margin: 0;

            font-size: 21px;

        }


        .member-payment-modal-close {

            border: 0;

            background: #f3f4f8;

            width: 34px;

            height: 34px;

            border-radius: 50%;

            cursor: pointer;

            font-size: 15px;

        }


        .member-payment-modal-section {

            margin-bottom: 18px;

        }


        .member-payment-modal-section-title {

            font-weight: 800;

            margin-bottom: 10px;

        }


        /* ==================================================
           Selected Items
           ================================================== */

        .member-payment-selected-list {

            display: flex;

            flex-direction: column;

            gap: 8px;

        }


        .member-payment-selected-item {

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 10px;

            padding: 11px 12px;

            border-radius: 12px;

            background: #f7f8fc;

        }


        .member-payment-selected-event {

            font-weight: 700;

            font-size: 14px;

        }


        .member-payment-selected-member {

            margin-top: 3px;

            font-size: 12px;

            color: #777;

        }


        .member-payment-selected-total {

            display: flex;

            justify-content: space-between;

            align-items: center;

            margin-top: 12px;

            padding-top: 12px;

            border-top:
                1px solid #eee;

        }


        .member-payment-selected-total strong {

            font-size: 19px;

        }


        /* ==================================================
           Balance Option
           ================================================== */

        .member-balance-option {

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 10px;

            padding: 13px;

            margin-bottom: 8px;

            border-radius: 13px;

            background: #f7f8fc;

            cursor: pointer;

        }


        .member-balance-option-left {

            display: flex;

            align-items: center;

            gap: 10px;

        }


        .member-balance-option input {

            width: 18px;

            height: 18px;

        }


        .member-balance-option-title {

            font-weight: 700;

            font-size: 14px;

        }


        .member-balance-option-sub {

            margin-top: 3px;

            font-size: 12px;

            color: #888;

        }


        .member-balance-option strong {

            font-size: 14px;

        }


        /* ==================================================
           Calculation
           ================================================== */

        .member-payment-calculation {

            padding: 15px;

            border-radius: 15px;

            background: #f7f8fc;

        }


        .member-payment-calculation > div {

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 10px;

            padding: 6px 0;

            font-size: 14px;

        }


        .member-payment-calculation-total {

            margin-top: 7px;

            padding-top: 12px !important;

            border-top:
                1px solid #ddd;

        }


        .member-payment-calculation-total strong {

            font-size: 20px;

        }


        /* ==================================================
           Hint
           ================================================== */

        .member-payment-method-hint {

            margin-top: 15px;

            padding: 12px 14px;

            border-radius: 12px;

            background: #f5f7ff;

            color: #666;

            font-size: 13px;

            line-height: 1.65;

        }


        /* ==================================================
           Buttons
           ================================================== */

        .member-payment-modal-actions {

            display: flex;

            gap: 10px;

            margin-top: 18px;

        }


        .member-payment-modal-actions button {

            flex: 1;

            min-height: 44px;

            border-radius: 12px;

            border: 0;

            font-size: 14px;

            font-weight: 700;

            cursor: pointer;

        }


        .member-payment-modal-cancel {

            background: #f1f2f6;

            color: #555;

        }


        .member-payment-modal-submit {

            background:
                linear-gradient(
                    135deg,
                    #6875e8,
                    #8a68d8
                );

            color: #fff;

        }


        .member-payment-modal-submit:disabled {

            opacity: .55;

            cursor: not-allowed;

        }


        /* ==================================================
           Bank
           ================================================== */

        .member-bank-payment-summary {

            margin-bottom: 18px;

            padding: 18px;

            border-radius: 16px;

            background:
                linear-gradient(
                    135deg,
                    #f4f6ff,
                    #faf5ff
                );

            text-align: center;

        }


        .member-bank-summary-label {

            font-size: 13px;

            color: #777;

        }


        .member-bank-summary-amount {

            margin-top: 5px;

            font-size: 30px;

            font-weight: 900;

        }


        .member-bank-summary-detail {

            margin-top: 12px;

            padding-top: 10px;

            border-top:
                1px solid rgba(0,0,0,.08);

        }


        .member-bank-summary-detail > div {

            display: flex;

            justify-content: space-between;

            gap: 10px;

            font-size: 13px;

            padding: 3px 0;

        }


        .member-bank-account {

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 10px;

            padding: 14px;

            margin-bottom: 9px;

            border-radius: 13px;

            background: #f7f8fc;

        }


        .member-bank-name {

            font-size: 13px;

            font-weight: 700;

        }


        .member-bank-number {

            margin-top: 4px;

            font-size: 17px;

            font-weight: 800;

            letter-spacing: .5px;

        }


        .member-bank-copy {

            flex-shrink: 0;

            padding: 8px 11px;

            border: 0;

            border-radius: 9px;

            background: #e9ecff;

            color: #5865c7;

            cursor: pointer;

            font-weight: 700;

        }


        .member-bank-copy-message {

            min-height: 18px;

            margin-top: 5px;

            font-size: 12px;

            color: #5d68c7;

        }


        /* ==================================================
           Remittance
           ================================================== */

        .member-remittance-amount-box {

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 10px;

            padding: 15px;

            margin-bottom: 18px;

            border-radius: 14px;

            background: #f5f7ff;

        }


        .member-remittance-amount-box strong {

            font-size: 22px;

        }


        .member-remittance-form {

            display: flex;

            flex-direction: column;

            gap: 13px;

        }


        .member-form-field {

            display: flex;

            flex-direction: column;

            gap: 6px;

        }


        .member-form-field label {

            font-size: 13px;

            font-weight: 700;

        }


        .member-form-field input,

        .member-form-field select,

        .member-form-field textarea {

            width: 100%;

            box-sizing: border-box;

            padding: 11px 12px;

            border:
                1px solid #ddd;

            border-radius: 10px;

            background: #fff;

            font-size: 14px;

            font-family: inherit;

            outline: none;

        }


        .member-form-field input:focus,

        .member-form-field select:focus,

        .member-form-field textarea:focus {

            border-color: #7c84dc;

        }


        .member-remittance-balance-detail {

            margin-top: 15px;

            padding: 12px 14px;

            border-radius: 12px;

            background: #f7f8fc;

        }


        .member-remittance-balance-detail > div {

            display: flex;

            justify-content: space-between;

            padding: 4px 0;

            font-size: 13px;

        }


        .member-remittance-form-error {

            margin-top: 12px;

            color: #d34f4f;

            font-size: 13px;

            min-height: 18px;

        }


        /* ==================================================
           Mobile
           ================================================== */

        @media (max-width: 680px) {

            .member-balance-grid {

                grid-template-columns: 1fr;

            }


            .member-payment-modal-backdrop {

                padding: 10px;

                align-items: flex-start;

            }


            .member-payment-modal-box {

                margin-top: 20px;

                padding: 17px;

                border-radius: 18px;

            }


            .member-bank-number {

                font-size: 15px;

            }


            .member-payment-modal-actions {

                flex-direction: column-reverse;

            }

        }

    `;

    document.head.appendChild(style);

}


/* ==========================================================
   啟用 CSS
   ========================================================== */

ensureMemberPaymentStyles();
