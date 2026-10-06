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

        /* --------------------------------------------------
           讀取會員資料
           -------------------------------------------------- */

        const memberSnap = await getDoc(
            doc(db, "members", user.uid)
        );


        if (memberSnap.exists()) {

            MemberState.member =
                memberSnap.data();

            renderMemberInfo();

        }


        /* --------------------------------------------------
           讀取帳務
           -------------------------------------------------- */

        await loadPayments(user.uid);


        /* --------------------------------------------------
           Render
           -------------------------------------------------- */

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


    /* --------------------------------------------------
       暱稱
       -------------------------------------------------- */

    if (userName) {

        userName.textContent =
            MemberState.member.nickname ||
            "會員";

    }


    /* --------------------------------------------------
       會員編號
       -------------------------------------------------- */

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
         * paid 不需要再顯示在待付款區
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


    /* --------------------------------------------------
       排序
       -------------------------------------------------- */

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


    /* --------------------------------------------------
       分類
       -------------------------------------------------- */

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


    /* --------------------------------------------------
       金額
       -------------------------------------------------- */

    const unpaidTotal =
        unpaid.reduce(
            (sum, item) =>
                sum + Number(item.amount || 0),
            0
        );


    const pendingTotal =
        pending.reduce(
            (sum, item) =>
                sum + Number(item.amount || 0),
            0
        );


    /* --------------------------------------------------
       會員餘額
       -------------------------------------------------- */

    const {
        storedBalance,
        refundBalance
    } = getMemberBalance();


    const availableBalance =
        storedBalance +
        refundBalance;


    /* --------------------------------------------------
       HTML
       -------------------------------------------------- */

    container.innerHTML = `

        <div class="member-center">


            <!-- ===============================
                 Header
                 =============================== -->

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


            <!-- ===============================
                 Balance
                 =============================== -->

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


            <!-- ===============================
                 Pending
                 =============================== -->

            ${
                pending.length
                    ? createPendingSection(pending)
                    : ""
            }


            <!-- ===============================
                 Unpaid List
                 =============================== -->

            <div class="member-payment-list">

                ${
                    unpaid.length
                        ? unpaid
                            .map(createPaymentCard)
                            .join("")
                        : createEmptyPayment()
                }

            </div>


            <!-- ===============================
                 Footer
                 =============================== -->

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
   Pending Payment Card
   ========================================================== */

function createPendingPaymentCard(item) {

    return `

        <div class="member-payment-card member-payment-pending">

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

                <div>
                    NT$${Number(item.amount || 0).toLocaleString("zh-TW")}
                </div>

                <div class="member-payment-status">
                    ⏳ 待對帳
                </div>

            </div>

        </div>

    `;

}


/* ==========================================================
   Pending 匯款批次
   同一次匯填的場次會合併顯示
   ========================================================== */

function createPendingSection(
    pending
) {

    /*
     * 同一次匯填會有相同的
     * remittanceBatchId
     *
     * 所以先按照 batch 分組。
     *
     * 沒有 batchId 的舊資料，
     * 就暫時各自當成一筆。
     */

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


    const batchList =
        Object.values(groups);


    /*
     * 所有待對帳付款的原始金額
     */

    const pendingTotal =
        pending.reduce(
            (sum, item) =>
                sum +
                Number(item.amount || 0),
            0
        );


    return `

        <div class="member-pending-box">


            <!-- ===============================
                 Header
                 =============================== -->

            <div class="member-pending-header">

                <div>

                    <div class="member-pending-title">
                        ⏳ 待對帳
                    </div>

                    <div class="member-pending-count">

                        ${batchList.length} 筆匯款
                        ・
                        共 NT$${pendingTotal.toLocaleString("zh-TW")}

                    </div>

                </div>

            </div>


            <!-- ===============================
                 匯款批次
                 =============================== -->

            <div class="member-pending-batch-list">

                ${
                    batchList
                        .map(createPendingBatchCard)
                        .join("")
                }

            </div>


            <div class="member-pending-hint">

                💡 已送出匯款資料，等待管理員確認入帳。

            </div>


        </div>

    `;

}


/* ==========================================================
   單筆匯款批次
   ========================================================== */

function createPendingBatchCard(
    items
) {

    const first =
        items[0];


    /*
     * 這次匯填包含的場次總額
     */

    const originalTotal =
        items.reduce(
            (sum, item) =>
                sum +
                Number(item.amount || 0),
            0
        );


    /*
     * remittanceTotal 是「實際匯款金額」。
     *
     * 同一個 batch 的每一筆 payment
     * 都會寫入相同的 remittanceTotal，
     * 所以只抓第一筆即可。
     */

    const remittanceTotal =
        Number(
            first.remittanceTotal || 0
        );


    /*
     * 餘額折抵
     *
     * 目前 payment 文件沒有各自儲存
     * refund / stored 的分配，
     * 這些資料是在 remittanceBatch 裡。
     *
     * 因此這裡不自行猜測，
     * 只顯示：
     *
     * 原應付
     * 實際匯款
     */

    const balanceUsed =
        Math.max(
            0,
            originalTotal -
            remittanceTotal
        );


    /* ======================================================
       場次列表
       ====================================================== */

    const eventList =
        items
            .map(item => {

                return `

                    <div
                        class="member-pending-event-row"
                    >

                        <div
                            class="member-pending-event-info"
                        >

                            <div
                                class="member-pending-event-name"
                            >

                                📸
                                ${escapeHTML(
                                    item.event
                                )}

                            </div>


                            <div
                                class="member-pending-event-detail"
                            >

                                👤
                                ${escapeHTML(
                                    item.member
                                )}

                                ・

                                📦
                                ${item.quantity} 張

                            </div>

                        </div>


                        <div
                            class="member-pending-event-price"
                        >

                            NT$${Number(
                                item.amount || 0
                            ).toLocaleString("zh-TW")}

                        </div>

                    </div>

                `;

            })
            .join("");


    /* ======================================================
       匯款資訊
       ====================================================== */

    const remittanceInfo = [];


    if (
        first.remittanceDate
    ) {

        remittanceInfo.push(
            `📅 ${escapeHTML(
                first.remittanceDate
            )}`
        );

    }


    if (
        first.remittanceTime
    ) {

        remittanceInfo.push(
            `🕐 ${escapeHTML(
                first.remittanceTime
            )}`
        );

    }


    if (
        first.remittanceBank
    ) {

        remittanceInfo.push(
            `🏦 ${escapeHTML(
                first.remittanceBank
            )}`
        );

    }


    if (
        first.remittanceLast5
    ) {

        remittanceInfo.push(
            `🔢 末5碼 ${escapeHTML(
                first.remittanceLast5
            )}`
        );

    }


    return `

        <div
            class="member-pending-batch-card"
        >


            <!-- ===============================
                 批次 Header
                 =============================== -->

            <div
                class="member-pending-batch-header"
            >

                <div>

                    <span
                        class="member-pending-batch-label"
                    >
                        本次匯填
                    </span>


                    <strong>

                        ${items.length}
                        個場次

                    </strong>

                </div>


                <div
                    class="member-pending-batch-total"
                >

                    NT$${remittanceTotal.toLocaleString("zh-TW")}

                </div>

            </div>


            <!-- ===============================
                 場次
                 =============================== -->

            <div
                class="member-pending-events"
            >

                ${eventList}

            </div>


            <!-- ===============================
                 金額摘要
                 =============================== -->

            <div
                class="member-pending-money"
            >

                <div>

                    <span>
                        原應付
                    </span>

                    <strong>
                        NT$${originalTotal.toLocaleString("zh-TW")}
                    </strong>

                </div>


                ${
                    balanceUsed > 0
                        ? `

                            <div>

                                <span>
                                    餘額折抵
                                </span>

                                <strong>
                                    − NT$${balanceUsed.toLocaleString("zh-TW")}
                                </strong>

                            </div>

                        `
                        : ""
                }


                <div
                    class="member-pending-money-total"
                >

                    <span>
                        實際匯款
                    </span>

                    <strong>
                        NT$${remittanceTotal.toLocaleString("zh-TW")}
                    </strong>

                </div>

            </div>


            <!-- ===============================
                 匯款資訊
                 =============================== -->

            ${
                remittanceInfo.length
                    ? `

                        <div
                            class="member-pending-remittance"
                        >

                            ${remittanceInfo.join("　")}

                        </div>

                    `
                    : ""
            }


            <!-- ===============================
                 備註
                 =============================== -->

            ${
                first.remittanceNote
                    ? `

                        <div
                            class="member-pending-remittance"
                        >

                            📝
                            ${escapeHTML(
                                first.remittanceNote
                            )}

                        </div>

                    `
                    : ""
            }


            <!-- ===============================
                 Status
                 =============================== -->

            <div
                class="member-pending-batch-footer"
            >

                <span
                    class="member-pending-badge"
                >
                    ⏳ 待對帳
                </span>

            </div>


        </div>

    `;

}


/* ==========================================================
   Payment Footer
   ========================================================== */

function createPaymentFooter() {

    return `

        <div class="member-payment-footer">

            <div>

                <span>
                    本次選擇
                </span>

                <strong
                    id="selected-payment-count"
                >
                    0 筆
                </strong>

            </div>


            <div>

                <span>
                    本次應付
                </span>

                <strong
                    id="selected-payment-total"
                >
                    NT$0
                </strong>

            </div>


            <button
                type="button"
                id="member-payment-confirm"
                class="member-payment-confirm"
                disabled
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

            <div class="member-payment-empty-icon">
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

        <div class="member-payment-empty">

            <div class="member-payment-empty-icon">
                ⚠️
            </div>


            <h3>
                帳務載入失敗
            </h3>


            <p>
                請重新整理頁面後再試。
            </p>

        </div>

    `;

}


/* ==========================================================
   綁定付款事件
   ========================================================== */

function bindPaymentEvents() {

    const checkboxes =
        document.querySelectorAll(
            ".member-payment-checkbox"
        );


    checkboxes.forEach(
        checkbox => {

            checkbox.checked =
                MemberState.selectedPayments
                    .has(
                        checkbox.dataset.paymentId
                    );


            checkbox.addEventListener(
                "change",
                () => {

                    const id =
                        checkbox.dataset.paymentId;


                    if (
                        checkbox.checked
                    ) {

                        MemberState
                            .selectedPayments
                            .add(id);

                    } else {

                        MemberState
                            .selectedPayments
                            .delete(id);

                    }


                    updatePaymentSummary();

                }
            );

        }
    );


    const confirmButton =
        document.getElementById(
            "member-payment-confirm"
        );


    confirmButton?.addEventListener(
        "click",
        confirmPayment
    );


    updatePaymentSummary();

}


/* ==========================================================
   更新選擇摘要
   ========================================================== */

function updatePaymentSummary() {

    const selected =
        MemberState.payments.filter(
            item =>
                item.status === "unpaid" &&
                MemberState
                    .selectedPayments
                    .has(item.id)
        );


    const countElement =
        document.getElementById(
            "selected-payment-count"
        );


    const totalElement =
        document.getElementById(
            "selected-payment-total"
        );


    const confirmButton =
        document.getElementById(
            "member-payment-confirm"
        );


    const total =
        selected.reduce(
            (sum, item) =>
                sum +
                Number(item.amount || 0),
            0
        );


    if (countElement) {

        countElement.textContent =
            `${selected.length} 筆`;

    }


    if (totalElement) {

        totalElement.textContent =
            `NT$${total.toLocaleString("zh-TW")}`;

    }


    if (confirmButton) {

        confirmButton.disabled =
            selected.length === 0;

    }

}

/* ==========================================================
   我要付款
   ========================================================== */

async function confirmPayment() {

    const selected =
        MemberState.payments.filter(
            item =>
                item.status === "unpaid" &&
                MemberState
                    .selectedPayments
                    .has(item.id)
        );


    if (!selected.length) {

        return;

    }


    const total =
        selected.reduce(
            (sum, item) =>
                sum +
                Number(item.amount || 0),
            0
        );


    openPaymentMethodModal({

        selected,

        total

    });

}


/* ==========================================================
   付款方式 Modal
   ========================================================== */

function openPaymentMethodModal({

    selected,

    total

}) {

    const oldModal =
        document.getElementById(
            "member-payment-method-modal"
        );


    oldModal?.remove();


    const {
        storedBalance,
        refundBalance
    } = getMemberBalance();


    const modal =
        document.createElement("div");


    modal.id =
        "member-payment-method-modal";

    modal.className =
        "member-payment-modal";


    modal.innerHTML = `

        <div class="member-payment-modal-backdrop">

            <div class="member-payment-modal-box">


                <!-- ===============================
                     Header
                     =============================== -->

                <div
                    class="member-payment-modal-header"
                >

                    <div>

                        <div
                            class="member-payment-modal-label"
                        >
                            💳 付款方式
                        </div>

                        <h3>
                            選擇本次付款方式
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


                <!-- ===============================
                     Selected Items
                     =============================== -->

                <div
                    class="member-payment-modal-section"
                >

                    <div
                        class="member-payment-modal-section-title"
                    >
                        📦 本次付款項目
                    </div>


                    <div
                        class="member-payment-selected-list"
                    >

                        ${
                            selected
                                .map(
                                    item => `

                                        <div
                                            class="member-payment-selected-item"
                                        >

                                            <div>

                                                <div
                                                    class="member-payment-selected-event"
                                                >
                                                    ${escapeHTML(
                                                        item.event
                                                    )}
                                                </div>

                                                <div
                                                    class="member-payment-selected-member"
                                                >
                                                    👤
                                                    ${escapeHTML(
                                                        item.member
                                                    )}

                                                    ・

                                                    📦
                                                    ${item.quantity}
                                                    張
                                                </div>

                                            </div>


                                            <strong>
                                                NT$${Number(
                                                    item.amount || 0
                                                ).toLocaleString("zh-TW")}
                                            </strong>

                                        </div>

                                    `
                                )
                                .join("")
                        }

                    </div>


                    <div
                        class="member-payment-selected-total"
                    >

                        <span>
                            原應付
                        </span>

                        <strong>
                            NT$${total.toLocaleString("zh-TW")}
                        </strong>

                    </div>

                </div>


                <!-- ===============================
                     Balance Options
                     =============================== -->

                <div
                    class="member-payment-modal-section"
                >

                    <div
                        class="member-payment-modal-section-title"
                    >
                        💰 使用帳戶餘額
                    </div>


                    <!-- 小額退款 -->

                    <label
                        class="member-balance-option"
                    >

                        <div
                            class="member-balance-option-left"
                        >

                            <input
                                type="checkbox"
                                id="use-refund-balance"
                                ${
                                    refundBalance <= 0
                                        ? "disabled"
                                        : ""
                                }
                            >


                            <div>

                                <div
                                    class="member-balance-option-title"
                                >
                                    💸 小額退款
                                </div>

                                <div
                                    class="member-balance-option-sub"
                                >
                                    可用
                                    NT$${refundBalance.toLocaleString("zh-TW")}
                                </div>

                            </div>

                        </div>


                        <strong>
                            ${
                                refundBalance > 0
                                    ? "可使用"
                                    : "無餘額"
                            }
                        </strong>

                    </label>


                    <!-- 儲值金 -->

                    <label
                        class="member-balance-option"
                    >

                        <div
                            class="member-balance-option-left"
                        >

                            <input
                                type="checkbox"
                                id="use-stored-balance"
                                ${
                                    storedBalance <= 0
                                        ? "disabled"
                                        : ""
                                }
                            >


                            <div>

                                <div
                                    class="member-balance-option-title"
                                >
                                    💵 儲值金
                                </div>

                                <div
                                    class="member-balance-option-sub"
                                >
                                    可用
                                    NT$${storedBalance.toLocaleString("zh-TW")}
                                </div>

                            </div>

                        </div>


                        <strong>
                            ${
                                storedBalance > 0
                                    ? "可使用"
                                    : "無餘額"
                            }
                        </strong>

                    </label>

                </div>


                <!-- ===============================
                     Calculation
                     =============================== -->

                <div
                    class="member-payment-calculation"
                    id="member-payment-calculation"
                >

                    <div>

                        <span>
                            原應付
                        </span>

                        <strong>
                            NT$${total.toLocaleString("zh-TW")}
                        </strong>

                    </div>


                    <div>

                        <span>
                            小額退款折抵
                        </span>

                        <strong
                            id="refund-used-preview"
                        >
                            NT$0
                        </strong>

                    </div>


                    <div>

                        <span>
                            儲值金折抵
                        </span>

                        <strong
                            id="stored-used-preview"
                        >
                            NT$0
                        </strong>

                    </div>


                    <div
                        class="member-payment-calculation-total"
                    >

                        <span>
                            尚需付款
                        </span>

                        <strong
                            id="remaining-payment-preview"
                        >
                            NT$${total.toLocaleString("zh-TW")}
                        </strong>

                    </div>

                </div>


                <!-- ===============================
                     Hint
                     =============================== -->

                <div
                    class="member-payment-method-hint"
                >

                    💡 系統會先依照你勾選的餘額折抵，
                    不足的部分再使用銀行匯款。

                </div>


                <!-- ===============================
                     Error
                     =============================== -->

                <div
                    id="payment-method-error"
                    class="member-remittance-form-error"
                ></div>


                <!-- ===============================
                     Actions
                     =============================== -->

                <div
                    class="member-payment-modal-actions"
                >

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


    document.body.appendChild(
        modal
    );


    /* ======================================================
       計算目前折抵
       ====================================================== */

    function calculateBalanceUsage() {

        const useRefund =
            document.getElementById(
                "use-refund-balance"
            )?.checked;


        const useStored =
            document.getElementById(
                "use-stored-balance"
            )?.checked;


        let remaining =
            total;


        let refundUsed =
            0;


        let storedUsed =
            0;


        /* --------------------------------------------------
           小額退款先折抵
           -------------------------------------------------- */

        if (useRefund) {

            refundUsed =
                Math.min(
                    refundBalance,
                    remaining
                );


            remaining -=
                refundUsed;

        }


        /* --------------------------------------------------
           儲值金再折抵
           -------------------------------------------------- */

        if (useStored) {

            storedUsed =
                Math.min(
                    storedBalance,
                    remaining
                );


            remaining -=
                storedUsed;

        }


        return {

            refundUsed,

            storedUsed,

            remaining

        };

    }


    /* ======================================================
       更新畫面
       ====================================================== */

    function updateBalancePreview() {

        const {

            refundUsed,

            storedUsed,

            remaining

        } =
            calculateBalanceUsage();


        const refundPreview =
            document.getElementById(
                "refund-used-preview"
            );


        const storedPreview =
            document.getElementById(
                "stored-used-preview"
            );


        const remainingPreview =
            document.getElementById(
                "remaining-payment-preview"
            );


        if (refundPreview) {

            refundPreview.textContent =
                `− NT$${refundUsed.toLocaleString("zh-TW")}`;

        }


        if (storedPreview) {

            storedPreview.textContent =
                `− NT$${storedUsed.toLocaleString("zh-TW")}`;

        }


        if (remainingPreview) {

            remainingPreview.textContent =
                `NT$${remaining.toLocaleString("zh-TW")}`;

        }

    }


    /* ======================================================
       關閉
       ====================================================== */

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


    /* ======================================================
       勾選餘額
       ====================================================== */

    document
        .getElementById(
            "use-refund-balance"
        )
        ?.addEventListener(
            "change",
            updateBalancePreview
        );


    document
        .getElementById(
            "use-stored-balance"
        )
        ?.addEventListener(
            "change",
            updateBalancePreview
        );


    updateBalancePreview();


    /* ======================================================
       下一步
       ====================================================== */

    document
        .getElementById(
            "continue-payment-method"
        )
        ?.addEventListener(
            "click",
            () => {

                const {

                    refundUsed,

                    storedUsed,

                    remaining

                } =
                    calculateBalanceUsage();


                closeModal();


                /* ------------------------------------------
                   完全由餘額支付
                   ------------------------------------------ */

                if (
                    remaining <= 0
                ) {

                    completeBalancePayment({

                        selected,

                        total,

                        refundUsed,

                        storedUsed

                    });


                    return;

                }


                /* ------------------------------------------
                   還需要銀行匯款
                   ------------------------------------------ */

                openBankInfoModal({

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
   完全使用餘額付款
   ========================================================== */

async function completeBalancePayment({

    selected,

    total,

    refundUsed,

    storedUsed

}) {

    if (!MemberState.user) {

        return;

    }


    const uid =
        MemberState.user.uid;


    const memberRef =
        doc(
            db,
            "members",
            uid
        );


    try {

        await runTransaction(
            db,
            async transaction => {

                /* ------------------------------------------
                   讀取會員
                   ------------------------------------------ */

                const memberSnap =
                    await transaction.get(
                        memberRef
                    );


                if (
                    !memberSnap.exists()
                ) {

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


                /* ------------------------------------------
                   檢查餘額
                   ------------------------------------------ */

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


                /* ------------------------------------------
                   先讀取所有 payment
                   ------------------------------------------ */

                const paymentSnaps = [];


                for (
                    const item
                    of selected
                ) {

                    const paymentRef =
                        doc(
                            db,
                            "payments",
                            item.id
                        );


                    const paymentSnap =
                        await transaction.get(
                            paymentRef
                        );


                    if (
                        !paymentSnap.exists()
                    ) {

                        throw new Error(
                            "找不到其中一筆付款項目"
                        );

                    }


                    const payment =
                        paymentSnap.data();


                    if (
                        payment.memberUid !==
                        uid
                    ) {

                        throw new Error(
                            "付款項目會員資料不符"
                        );

                    }


                    if (
                        payment.status !==
                        "unpaid"
                    ) {

                        throw new Error(
                            "其中一筆款項已經被處理"
                        );

                    }


                    paymentSnaps.push({

                        ref:
                            paymentRef,

                        snap:
                            paymentSnap

                    });

                }


                /* ------------------------------------------
                   扣餘額
                   ------------------------------------------ */

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


                /* ------------------------------------------
                   建立 payment → paid
                   ------------------------------------------ */

                paymentSnaps.forEach(
                    ({ ref }) => {

                        transaction.update(
                            ref,
                            {

                                status:
                                    "paid",

                                paidAt:
                                    serverTimestamp(),

                                paymentMethod:
                                    "member_balance",

                                paymentTotal:
                                    total,

                                refundBalanceUsed:
                                    refundUsed,

                                storedBalanceUsed:
                                    storedUsed

                            }
                        );

                    }
                );

            }
        );


        /* --------------------------------------------------
           更新本地
           -------------------------------------------------- */

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
            `付款完成！\n\n` +
            `本次共 ${selected.length} 筆\n` +
            `原應付 NT$${total.toLocaleString("zh-TW")}\n` +
            `小額退款折抵 NT$${refundUsed.toLocaleString("zh-TW")}\n` +
            `儲值金折抵 NT$${storedUsed.toLocaleString("zh-TW")}\n\n` +
            `目前狀態：已付款`
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
            `付款失敗：${
                error.message ||
                "請稍後再試"
            }`
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


                <!-- ===============================
                     Header
                     =============================== -->

                <div
                    class="member-payment-modal-header"
                >

                    <div>

                        <div
                            class="member-payment-modal-label"
                        >
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


                <!-- ===============================
                     Amount
                     =============================== -->

                <div
                    class="member-bank-payment-summary"
                >

                    <div
                        class="member-bank-summary-label"
                    >
                        本次需要匯款
                    </div>


                    <div
                        class="member-bank-summary-amount"
                    >
                        NT$${remaining.toLocaleString("zh-TW")}
                    </div>


                    <div
                        class="member-bank-summary-detail"
                    >

                        <div>

                            <span>
                                原應付
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


                <!-- ===============================
                     Bank Accounts
                     =============================== -->

                <div
                    class="member-payment-modal-section"
                >

                    <div
                        class="member-payment-modal-section-title"
                    >
                        🏦 匯款帳戶
                    </div>


                    <!-- 中華郵政 -->

                    <div
                        class="member-bank-account"
                    >

                        <div
                            class="member-bank-account-info"
                        >

                            <div
                                class="member-bank-name"
                            >
                                (700) 中華郵政
                            </div>


                            <div
                                class="member-bank-number"
                            >
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


                    <!-- 永豐銀行 -->

                    <div
                        class="member-bank-account"
                    >

                        <div
                            class="member-bank-account-info"
                        >

                            <div
                                class="member-bank-name"
                            >
                                (807) 永豐銀行
                            </div>


                            <div
                                class="member-bank-number"
                            >
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


                <!-- ===============================
                     Notice
                     =============================== -->

                <div
                    class="member-payment-method-hint"
                >

                    💡 完成匯款後，
                    請按「我已完成匯款」填寫匯款資料。

                </div>


                <!-- ===============================
                     Actions
                     =============================== -->

                <div
                    class="member-payment-modal-actions"
                >

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


    document.body.appendChild(
        modal
    );


    /* ======================================================
       關閉
       ====================================================== */

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


    /* ======================================================
       複製銀行帳號
       ====================================================== */

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
                                `✓ 已複製帳號 ${account}`;

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
                            "複製銀行帳號失敗：",
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


    /* ======================================================
       開啟匯款表單
       ====================================================== */

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


                <!-- ===============================
                     Header
                     =============================== -->

                <div
                    class="member-payment-modal-header"
                >

                    <div>

                        <div
                            class="member-payment-modal-label"
                        >
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


                <!-- ===============================
                     Amount
                     =============================== -->

                <div
                    class="member-remittance-amount-box"
                >

                    <span>
                        本次實際匯款
                    </span>

                    <strong>
                        NT$${remaining.toLocaleString("zh-TW")}
                    </strong>

                </div>


                <!-- ===============================
                     Selected Items
                     =============================== -->

                <div
                    class="member-payment-modal-section"
                >

                    <div
                        class="member-payment-modal-section-title"
                    >
                        📦 本次付款項目
                    </div>


                    <div
                        class="member-payment-selected-list"
                    >

                        ${
                            selected
                                .map(
                                    item => `

                                        <div
                                            class="member-payment-selected-item"
                                        >

                                            <div>

                                                <div
                                                    class="member-payment-selected-event"
                                                >
                                                    📸
                                                    ${escapeHTML(
                                                        item.event
                                                    )}
                                                </div>


                                                <div
                                                    class="member-payment-selected-member"
                                                >
                                                    👤
                                                    ${escapeHTML(
                                                        item.member
                                                    )}

                                                    ・

                                                    📦
                                                    ${item.quantity}
                                                    張
                                                </div>

                                            </div>


                                            <strong>
                                                NT$${Number(
                                                    item.amount || 0
                                                ).toLocaleString("zh-TW")}
                                            </strong>

                                        </div>

                                    `
                                )
                                .join("")
                        }

                    </div>

                </div>


                <!-- ===============================
                     Form
                     =============================== -->

                <div
                    class="member-remittance-form"
                >


                    <!-- 匯款日期 -->

                    <div
                        class="member-form-field"
                    >

                        <label
                            for="remittance-date"
                        >
                            📅 匯款日期
                        </label>


                        <input
                            type="date"
                            id="remittance-date"
                        >

                    </div>


                    <!-- 匯款時間 -->

                    <div
                        class="member-form-field"
                    >

                        <label
                            for="remittance-time"
                        >
                            🕐 匯款時間
                        </label>


                        <input
                            type="time"
                            id="remittance-time"
                        >

                    </div>


                    <!-- 匯入銀行 -->

                    <div
                        class="member-form-field"
                    >

                        <label
                            for="remittance-bank"
                        >
                            🏦 匯入銀行
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


                    <!-- 末五碼 -->

                    <div
                        class="member-form-field"
                    >

                        <label
                            for="remittance-last5"
                        >
                            🔢 匯款帳號末 5 碼
                        </label>


                        <input
                            type="text"
                            id="remittance-last5"
                            inputmode="numeric"
                            maxlength="5"
                            placeholder="例如 12345"
                        >

                    </div>


                    <!-- 備註 -->

                    <div
                        class="member-form-field"
                    >

                        <label
                            for="remittance-note"
                        >
                            📝 備註（選填）
                        </label>


                        <textarea
                            id="remittance-note"
                            rows="3"
                            placeholder="有需要補充的資訊可以寫在這裡"
                        ></textarea>

                    </div>


                </div>


                <!-- ===============================
                     Balance Detail
                     =============================== -->

                ${
                    refundUsed > 0 ||
                    storedUsed > 0
                        ? `

                            <div
                                class="member-remittance-balance-detail"
                            >

                                ${
                                    refundUsed > 0
                                        ? `

                                            <div>

                                                <span>
                                                    💸 小額退款折抵
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
                                                    💵 儲值金折抵
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


                <!-- ===============================
                     Error
                     =============================== -->

                <div
                    id="remittance-form-error"
                    class="member-remittance-form-error"
                ></div>


                <!-- ===============================
                     Hint
                     =============================== -->

                <div
                    class="member-payment-method-hint"
                >

                    📌 送出後，
                    這次選擇的所有場次會一起進入「待對帳」。

                </div>


                <!-- ===============================
                     Actions
                     =============================== -->

                <div
                    class="member-payment-modal-actions"
                >

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


    document.body.appendChild(
        modal
    );


    /* ======================================================
       關閉
       ====================================================== */

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


    /* ======================================================
       送出匯款資料
       ====================================================== */

    document
        .getElementById(
            "submit-remittance"
        )
        ?.addEventListener(
            "click",
            async () => {

                const date =
                    document
                        .getElementById(
                            "remittance-date"
                        )
                        ?.value
                        .trim();


                const time =
                    document
                        .getElementById(
                            "remittance-time"
                        )
                        ?.value
                        .trim();


                const bank =
                    document
                        .getElementById(
                            "remittance-bank"
                        )
                        ?.value
                        .trim();


                const last5 =
                    document
                        .getElementById(
                            "remittance-last5"
                        )
                        ?.value
                        .trim();


                const note =
                    document
                        .getElementById(
                            "remittance-note"
                        )
                        ?.value
                        .trim();


                const errorElement =
                    document.getElementById(
                        "remittance-form-error"
                    );


                /* ------------------------------------------
                   驗證
                   ------------------------------------------ */

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


                if (
                    !/^\d{5}$/.test(
                        last5
                    )
                ) {

                    if (errorElement) {

                        errorElement.textContent =
                            "請填寫正確的 5 位數帳號末 5 碼";

                    }

                    return;

                }


                /* ------------------------------------------
                   防止重複送出
                   ------------------------------------------ */

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

    if (!MemberState.currentUser) {

        throw new Error(
            "目前尚未登入會員帳號"
        );

    }


    const uid =
        MemberState.currentUser.uid;


    if (
        !Array.isArray(selected) ||
        selected.length === 0
    ) {

        throw new Error(
            "沒有選擇任何付款項目"
        );

    }


    const batchId =
        `RB_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}`;


    const now =
        new Date();


    const paymentRequestedAt =
        now.toLocaleString(
            "zh-TW",
            {
                hour12: false
            }
        );


    try {

        await runTransaction(
            db,
            async transaction => {

                /* ==================================================
                   1. 先讀取會員帳戶
                   ================================================== */

                const memberRef =
                    doc(
                        db,
                        "members",
                        uid
                    );


                const memberSnap =
                    await transaction.get(
                        memberRef
                    );


                if (!memberSnap.exists()) {

                    throw new Error(
                        "找不到會員資料"
                    );

                }


                const memberData =
                    memberSnap.data();


                const currentRefund =
                    Number(
                        memberData.refundBalance || 0
                    );


                const currentStored =
                    Number(
                        memberData.storedBalance || 0
                    );


                /* ==================================================
                   2. 再讀取所有付款項目
                   ================================================== */

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

                    const snap =
                        await transaction.get(
                            paymentRef
                        );


                    paymentSnaps.push(
                        snap
                    );

                }


                /* ==================================================
                   3. 確認所有付款項目仍然是 unpaid
                   ================================================== */

                paymentSnaps.forEach(
                    snap => {

                        if (!snap.exists()) {

                            throw new Error(
                                "其中一筆付款項目已不存在，請重新整理頁面"
                            );

                        }


                        const data =
                            snap.data();


                        if (
                            data.memberUid !== uid
                        ) {

                            throw new Error(
                                "付款項目會員資料不符"
                            );

                        }


                        if (
                            data.status !== "unpaid"
                        ) {

                            throw new Error(
                                "其中一筆付款項目狀態已變更，請重新整理頁面"
                            );

                        }

                    }
                );


                /* ==================================================
                   4. 再確認餘額
                   ================================================== */

                if (
                    refundUsed >
                    currentRefund
                ) {

                    throw new Error(
                        "小額退款餘額不足，請重新整理頁面"
                    );

                }


                if (
                    storedUsed >
                    currentStored
                ) {

                    throw new Error(
                        "儲值金餘額不足，請重新整理頁面"
                    );

                }


                const calculatedRemaining =
                    Math.max(
                        0,
                        Number(total || 0)
                        - Number(refundUsed || 0)
                        - Number(storedUsed || 0)
                    );


                if (
                    calculatedRemaining !==
                    Number(remaining || 0)
                ) {

                    throw new Error(
                        "付款金額資料異常，請重新整理頁面"
                    );

                }


                /* ==================================================
                   5. 計算新的會員餘額
                   ================================================== */

                const newRefundBalance =
                    currentRefund -
                    Number(refundUsed || 0);


                const newStoredBalance =
                    currentStored -
                    Number(storedUsed || 0);


                /* ==================================================
                   6. 更新會員餘額
                   ================================================== */

                if (
                    refundUsed > 0 ||
                    storedUsed > 0
                ) {

                    transaction.update(
                        memberRef,
                        {

                            refundBalance:
                                newRefundBalance,

                            storedBalance:
                                newStoredBalance

                        }
                    );

                }


                /* ==================================================
                   7. 建立匯款批次
                   ================================================== */

                const batchRef =
                    doc(
                        db,
                        "remittanceBatches",
                        batchId
                    );


                transaction.set(
                    batchRef,
                    {

                        batchId,

                        memberUid:
                            uid,

                        member:
                            MemberState.memberName ||
                            memberData.name ||
                            memberData.memberName ||
                            "",


                        paymentIds:
                            selected.map(
                                item => item.id
                            ),


                        events:
                            selected.map(
                                item => ({
                                    paymentId:
                                        item.id,

                                    event:
                                        item.event ||
                                        "",

                                    member:
                                        item.member ||
                                        "",

                                    quantity:
                                        Number(
                                            item.quantity || 0
                                        ),

                                    amount:
                                        Number(
                                            item.amount || 0
                                        )
                                })
                            ),


                        originalTotal:
                            Number(total || 0),


                        refundBalanceUsed:
                            Number(
                                refundUsed || 0
                            ),


                        storedBalanceUsed:
                            Number(
                                storedUsed || 0
                            ),


                        remittanceTotal:
                            Number(
                                remaining || 0
                            ),


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
                            paymentRequestedAt,

                        paymentRequestedAt

                    }
                );


                /* ==================================================
                   8. 更新每一筆付款項目
                   ================================================== */

                paymentRefs.forEach(
                    paymentRef => {

                        transaction.update(
                            paymentRef,
                            {

                                status:
                                    "pending",

                                paymentRequestedAt,

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
                                    Number(
                                        remaining || 0
                                    ),

                                remittanceBatchId:
                                    batchId

                            }
                        );

                    }
                );

            }
        );


        /* ======================================================
           交易成功
           ====================================================== */

        alert(
            "✓ 匯款資料已送出！\n\n" +
            "本次付款項目已進入「待對帳」。"
        );


        await loadPayments();


        renderPaymentCenter();


    } catch (error) {

        console.error(
            "submitRemittance error:",
            error
        );


        throw error;

    }

}


/* ==========================================================
   HTML Escape
   ========================================================== */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* ==========================================================
   Attribute Escape
   ========================================================== */

function escapeAttribute(value) {

    return escapeHTML(
        value
    );

}


/* ==========================================================
   會員帳務中心專用 CSS
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

        /* =====================================================
           Modal
           ===================================================== */

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
                rgba(20, 25, 45, .48);

            backdrop-filter:
                blur(8px);

            overflow-y: auto;

        }


        .member-payment-modal-box {

            width: min(
                680px,
                100%
            );

            max-height:
                calc(100vh - 40px);

            overflow-y: auto;

            background:
                #ffffff;

            border-radius:
                24px;

            box-shadow:
                0 24px 70px
                rgba(20, 30, 60, .25);

            padding:
                26px;

        }


        .member-payment-modal-header {

            display: flex;

            justify-content:
                space-between;

            align-items:
                flex-start;

            gap: 20px;

            margin-bottom:
                22px;

        }


        .member-payment-modal-label {

            color:
                #6b72d9;

            font-size:
                13px;

            font-weight:
                700;

            margin-bottom:
                4px;

        }


        .member-payment-modal-header h3 {

            margin:
                0;

            font-size:
                22px;

            color:
                #252a3a;

        }


        .member-payment-modal-close {

            border:
                0;

            background:
                #f3f4f8;

            width:
                36px;

            height:
                36px;

            border-radius:
                50%;

            cursor:
                pointer;

            font-size:
                16px;

        }


        .member-payment-modal-section {

            margin-top:
                20px;

        }


        .member-payment-modal-section-title {

            font-size:
                15px;

            font-weight:
                800;

            color:
                #34394a;

            margin-bottom:
                10px;

        }


        /* =====================================================
           Bank Amount
           ===================================================== */

        .member-bank-payment-summary {

            padding:
                20px;

            border-radius:
                18px;

            background:
                linear-gradient(
                    135deg,
                    #f4f3ff,
                    #eef7ff
                );

            text-align:
                center;

        }


        .member-bank-summary-label {

            font-size:
                13px;

            color:
                #777d91;

        }


        .member-bank-summary-amount {

            margin-top:
                5px;

            font-size:
                32px;

            font-weight:
                900;

            color:
                #5f65c8;

        }


        .member-bank-summary-detail {

            margin-top:
                12px;

            display:
                flex;

            flex-direction:
                column;

            gap:
                5px;

            font-size:
                13px;

            color:
                #73798a;

        }


        .member-bank-summary-detail > div {

            display:
                flex;

            justify-content:
                space-between;

            gap:
                20px;

        }


        /* =====================================================
           Bank Account
           ===================================================== */

        .member-bank-account {

            display:
                flex;

            align-items:
                center;

            justify-content:
                space-between;

            gap:
                15px;

            padding:
                15px 16px;

            border:
                1px solid #e7e8f0;

            border-radius:
                15px;

            margin-bottom:
                10px;

        }


        .member-bank-name {

            font-size:
                14px;

            font-weight:
                800;

            color:
                #353a4a;

        }


        .member-bank-number {

            margin-top:
                4px;

            font-size:
                18px;

            font-weight:
                800;

            letter-spacing:
                1px;

            color:
                #5d6380;

        }


        .member-bank-copy {

            border:
                0;

            background:
                #eef0ff;

            color:
                #5e64c7;

            border-radius:
                10px;

            padding:
                9px 13px;

            cursor:
                pointer;

            font-weight:
                700;

            white-space:
                nowrap;

        }


        .member-bank-copy:hover {

            background:
                #e2e5ff;

        }


        .member-bank-copy-message {

            min-height:
                20px;

            margin-top:
                6px;

            text-align:
                center;

            font-size:
                13px;

            color:
                #5d9b78;

        }


        /* =====================================================
           Remittance Amount
           ===================================================== */

        .member-remittance-amount-box {

            display:
                flex;

            justify-content:
                space-between;

            align-items:
                center;

            gap:
                15px;

            padding:
                16px 18px;

            border-radius:
                15px;

            background:
                #f5f6fb;

            color:
                #565c70;

        }


        .member-remittance-amount-box strong {

            font-size:
                24px;

            color:
                #5f65c8;

        }


        /* =====================================================
           Selected Payment Items
           ===================================================== */

        .member-payment-selected-list {

            display:
                flex;

            flex-direction:
                column;

            gap:
                8px;

        }


        .member-payment-selected-item {

            display:
                flex;

            align-items:
                center;

            justify-content:
                space-between;

            gap:
                15px;

            padding:
                12px 14px;

            background:
                #f8f8fb;

            border-radius:
                13px;

        }


        .member-payment-selected-event {

            font-size:
                14px;

            font-weight:
                800;

            color:
                #353a4b;

        }


        .member-payment-selected-member {

            margin-top:
                3px;

            font-size:
                12px;

            color:
                #7b8090;

        }


        .member-payment-selected-item strong {

            color:
                #555b77;

            white-space:
                nowrap;

        }


        /* =====================================================
           Form
           ===================================================== */

        .member-remittance-form {

            display:
                grid;

            grid-template-columns:
                1fr 1fr;

            gap:
                15px;

            margin-top:
                20px;

        }


        .member-form-field {

            display:
                flex;

            flex-direction:
                column;

            gap:
                7px;

        }


        .member-form-field:nth-child(3),
        .member-form-field:nth-child(5) {

            grid-column:
                1 / -1;

        }


        .member-form-field label {

            font-size:
                13px;

            font-weight:
                700;

            color:
                #555b6d;

        }


        .member-form-field input,
        .member-form-field select,
        .member-form-field textarea {

            width:
                100%;

            box-sizing:
                border-box;

            border:
                1px solid #dedfea;

            border-radius:
                11px;

            padding:
                11px 12px;

            font-size:
                14px;

            outline:
                none;

            background:
                #ffffff;

        }


        .member-form-field input:focus,
        .member-form-field select:focus,
        .member-form-field textarea:focus {

            border-color:
                #858be1;

            box-shadow:
                0 0 0 3px
                rgba(133, 139, 225, .12);

        }


        .member-form-field textarea {

            resize:
                vertical;

            min-height:
                80px;

        }


        .member-remittance-balance-detail {

            display:
                flex;

            flex-direction:
                column;

            gap:
                7px;

            margin-top:
                15px;

            padding:
                14px 16px;

            border-radius:
                14px;

            background:
                #fafaff;

            font-size:
                13px;

        }


        .member-remittance-balance-detail > div {

            display:
                flex;

            justify-content:
                space-between;

            gap:
                15px;

        }


        .member-remittance-form-error {

            min-height:
                20px;

            margin-top:
                12px;

            color:
                #d75b68;

            font-size:
                13px;

            font-weight:
                700;

        }


        /* =====================================================
           Modal Buttons
           ===================================================== */

        .member-payment-modal-actions {

            display:
                flex;

            justify-content:
                flex-end;

            gap:
                10px;

            margin-top:
                22px;

        }


        .member-payment-modal-cancel,
        .member-payment-modal-submit {

            border:
                0;

            border-radius:
                12px;

            padding:
                12px 20px;

            font-size:
                14px;

            font-weight:
                800;

            cursor:
                pointer;

        }


        .member-payment-modal-cancel {

            background:
                #f0f1f5;

            color:
                #666b7a;

        }


        .member-payment-modal-submit {

            background:
                linear-gradient(
                    135deg,
                    #7177d9,
                    #858bdc
                );

            color:
                white;

            box-shadow:
                0 7px 18px
                rgba(108, 116, 211, .2);

        }


        .member-payment-modal-submit:disabled {

            opacity:
                .55;

            cursor:
                not-allowed;

        }


        /* =====================================================
           Mobile
           ===================================================== */

        @media (max-width: 600px) {

            .member-payment-modal-backdrop {

                padding:
                    10px;

            }


            .member-payment-modal-box {

                padding:
                    20px;

                border-radius:
                    20px;

                max-height:
                    calc(100vh - 20px);

            }


            .member-payment-modal-header h3 {

                font-size:
                    19px;

            }


            .member-bank-account {

                align-items:
                    flex-start;

            }


            .member-bank-number {

                font-size:
                    15px;

            }


            .member-remittance-form {

                grid-template-columns:
                    1fr;

            }


            .member-form-field:nth-child(3),
            .member-form-field:nth-child(5) {

                grid-column:
                    auto;

            }


            .member-payment-modal-actions {

                flex-direction:
                    column-reverse;

            }


            .member-payment-modal-cancel,
            .member-payment-modal-submit {

                width:
                    100%;

            }

        }

    `;


    document.head.appendChild(
        style
    );

}


/* ==========================================================
   初始化會員帳務額外 CSS
   ========================================================== */

ensureMemberPaymentStyles();
