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
   會員中心 V4
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


/* ==========================================================
   Firebase Auth
   ========================================================== */

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
   讀取帳務
   ========================================================== */

async function loadPayments(uid) {

    MemberState.payments = [];

    MemberState.selectedPayments.clear();


    const paymentsRef =
        collection(db, "payments");


    /*
       讀取這位會員自己的所有付款資料。

       會員端只顯示：
       unpaid ＝ 待付款
       pending ＝ 待對帳

       paid 等其他狀態不顯示。
    */

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
                Number(data.remittanceTotal || 0),

            remittanceBatchId:
                data.remittanceBatchId || ""

        });

    });


    /* ---------- 排序 ---------- */

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


    const pendingTotal =
        pending.reduce(
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


            ${
                pending.length
                    ? `

                        <div class="member-pending-section">

                            <div class="member-pending-header">

                                <div>

                                    <div class="member-center-label">
                                        🕐 待對帳
                                    </div>

                                    <h3>
                                        已回報匯款
                                    </h3>

                                </div>


                                <div class="member-unpaid-summary">

                                    <span>
                                        ${pending.length} 筆
                                    </span>

                                    <strong>
                                        NT$${pendingTotal.toLocaleString("zh-TW")}
                                    </strong>

                                </div>

                            </div>


                            <div class="member-payment-list">

                                ${
                                    pending.map(
                                        createPendingPaymentCard
                                    ).join("")
                                }

                            </div>

                        </div>

                    `
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
   待對帳 Card
   ========================================================== */

function createPendingPaymentCard(item) {

    return `

        <div
            class="member-payment-card member-payment-pending"
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


                ${
                    item.remittanceDate
                        ? `

                            <div class="member-payment-remittance">

                                🏦
                                ${escapeHTML(
                                    item.remittanceBank ||
                                    "已回報匯款"
                                )}

                                ｜末五碼
                                ${escapeHTML(
                                    item.remittanceLast5 ||
                                    "—"
                                )}

                                <br>

                                📅
                                ${escapeHTML(
                                    item.remittanceDate
                                )}

                                ${
                                    item.remittanceTime
                                        ? ` ${escapeHTML(
                                            item.remittanceTime
                                        )}`
                                        : ""
                                }

                            </div>

                        `
                        : ""
                }

            </div>


            <div class="member-payment-price">

                NT$${item.amount.toLocaleString("zh-TW")}

                <div class="member-payment-status">
                    待對帳
                </div>

            </div>

        </div>

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
   Confirm Payment
   ========================================================== */

async function confirmPayment() {

    const selected =
        MemberState.payments.filter(
            item =>
                item.status === "unpaid" &&
                MemberState.selectedPayments.has(item.id)
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


    openBankInfoModal(
        selected,
        total
    );

}


/* ==========================================================
   收款帳戶視窗
   ========================================================== */

function openBankInfoModal(
    selected,
    total
) {

    const existing =
        document.getElementById(
            "member-payment-modal"
        );


    existing?.remove();


    const modal =
        document.createElement("div");


    modal.id =
        "member-payment-modal";


    modal.className =
        "member-payment-modal";


    modal.innerHTML = `

        <div
            class="member-payment-modal-backdrop"
        ></div>


        <div
            class="member-payment-modal-box"
        >

            <button
                type="button"
                class="member-payment-modal-close"
                id="member-bank-close"
            >
                ×
            </button>


            <div
                class="member-payment-modal-title"
            >
                💳 本次付款
            </div>


            <div
                class="member-payment-modal-subtitle"
            >
                請先確認以下付款內容，再進行匯款。
            </div>


            <!-- ==========================
                 本次付款項目
                 ========================== -->

            <div
                class="member-bank-summary"
            >

                ${
                    selected.map(
                        item => `

                            <div
                                class="member-bank-summary-row"
                            >

                                <span>

                                    ${escapeHTML(
                                        item.event
                                    )}

                                    ｜

                                    ${escapeHTML(
                                        item.member
                                    )}

                                    × ${item.quantity}

                                </span>


                                <strong>

                                    NT$${item.amount.toLocaleString(
                                        "zh-TW"
                                    )}

                                </strong>

                            </div>

                        `
                    ).join("")
                }


                <div
                    class="member-bank-total"
                >

                    <span>
                        本次總計
                    </span>


                    <strong>
                        NT$${total.toLocaleString(
                            "zh-TW"
                        )}
                    </strong>

                </div>

            </div>


            <!-- ==========================
                 收款帳戶
                 ========================== -->

            <div
                class="member-bank-title"
            >
                🏦 收款帳戶
            </div>


            <div
                class="member-bank-info"
            >


                <!-- 中華郵政 -->

                <div
                    class="member-bank-option"
                >

                    <div
                        class="member-bank-name-row"
                    >

                        <span>
                            中華郵政
                        </span>

                        <strong>
                            (700)
                        </strong>

                    </div>


                    <div
                        class="member-bank-account-row"
                    >

                        <div
                            class="member-bank-account"
                        >
                            24414050555742
                        </div>


                        <button
                            type="button"
                            class="member-copy-account"
                            data-account="24414050555742"
                        >
                            📋 複製
                        </button>

                    </div>

                </div>


                <!-- 永豐銀行 -->

                <div
                    class="member-bank-option"
                >

                    <div
                        class="member-bank-name-row"
                    >

                        <span>
                            永豐銀行
                        </span>

                        <strong>
                            (807)
                        </strong>

                    </div>


                    <div
                        class="member-bank-account-row"
                    >

                        <div
                            class="member-bank-account"
                        >
                            20401800363832
                        </div>


                        <button
                            type="button"
                            class="member-copy-account"
                            data-account="20401800363832"
                        >
                            📋 複製
                        </button>

                    </div>

                </div>


            </div>


            <div
                class="member-bank-hint"
            >
                💡 完成匯款後，請點擊下方「我已完成匯款」並填寫匯款資料。
            </div>


            <!-- ==========================
                 按鈕
                 ========================== -->

            <div
                class="member-payment-modal-actions"
            >

                <button
                    type="button"
                    class="member-modal-cancel"
                    id="member-bank-cancel"
                >
                    先不要
                </button>


                <button
                    type="button"
                    class="member-payment-confirm"
                    id="member-bank-next"
                >
                    我已完成匯款
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    /* ---------- 關閉 ---------- */

    const close =
        () => modal.remove();


    modal
        .querySelector(
            ".member-payment-modal-backdrop"
        )
        ?.addEventListener(
            "click",
            close
        );


    document
        .getElementById(
            "member-bank-close"
        )
        ?.addEventListener(
            "click",
            close
        );


    document
        .getElementById(
            "member-bank-cancel"
        )
        ?.addEventListener(
            "click",
            close
        );


    /* ======================================================
       複製銀行帳號
       ====================================================== */

    modal
        .querySelectorAll(
            ".member-copy-account"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const account =
                            button.dataset.account ||
                            "";


                        try {

                            await navigator
                                .clipboard
                                .writeText(
                                    account
                                );


                            const originalText =
                                button.textContent;


                            button.textContent =
                                "✓ 已複製";


                            button.classList.add(
                                "copied"
                            );


                            setTimeout(
                                () => {

                                    button.textContent =
                                        originalText;

                                    button.classList.remove(
                                        "copied"
                                    );

                                },
                                1500
                            );


                        } catch (error) {

                            console.error(
                                "複製帳號失敗：",
                                error
                            );


                            alert(
                                `請手動複製帳號：\n${account}`
                            );

                        }

                    }
                );

            }
        );


    /* ======================================================
       下一步 → 匯款回報
       ====================================================== */

    document
        .getElementById(
            "member-bank-next"
        )
        ?.addEventListener(
            "click",
            () => {

                close();


                openRemittanceForm(
                    selected,
                    total
                );

            }
        );

}


/* ==========================================================
   匯款回報表單
   ========================================================== */

function openRemittanceForm(
    selected,
    total
) {

    const existing =
        document.getElementById(
            "member-remittance-modal"
        );


    existing?.remove();


    const modal =
        document.createElement("div");


    modal.id =
        "member-remittance-modal";


    modal.className =
        "member-payment-modal";


    modal.innerHTML = `

        <div
            class="member-payment-modal-backdrop"
        ></div>


        <div
            class="member-payment-modal-box"
        >

            <button
                type="button"
                class="member-payment-modal-close"
                id="member-remittance-close"
            >
                ×
            </button>


            <div
                class="member-payment-modal-title"
            >
                🧾 回報匯款
            </div>


            <div
                class="member-payment-modal-subtitle"
            >

                本次回報金額：

                <strong>
                    NT$${total.toLocaleString(
                        "zh-TW"
                    )}
                </strong>

            </div>


            <div
                class="member-remittance-form"
            >


                <!-- 匯款日期 -->

                <label>

                    <span>
                        匯款日期
                    </span>


                    <input
                        type="date"
                        id="remittance-date"
                        required
                    >

                </label>


                <!-- 匯款時間 -->

                <label>

                    <span>
                        匯款時間
                    </span>


                    <input
                        type="time"
                        id="remittance-time"
                        required
                    >

                </label>


                <!-- 匯入哪個帳戶 -->

                <label>

                    <span>
                        匯入哪個帳戶
                    </span>


                    <select
                        id="remittance-bank"
                        required
                    >

                        <option value="">
                            請選擇收款帳戶
                        </option>


                        <option
                            value="700｜中華郵政｜24414050555742"
                        >
                            (700) 中華郵政
                        </option>


                        <option
                            value="807｜永豐銀行｜20401800363832"
                        >
                            (807) 永豐銀行
                        </option>

                    </select>

                </label>


                <!-- 匯款末五碼 -->

                <label>

                    <span>
                        匯款帳號末五碼
                    </span>


                    <input
                        type="text"
                        id="remittance-last5"
                        inputmode="numeric"
                        maxlength="5"
                        placeholder="請輸入末五碼"
                        required
                    >

                </label>


                <!-- 備註 -->

                <label>

                    <span>
                        備註（可不填）
                    </span>


                    <textarea
                        id="remittance-note"
                        rows="3"
                        maxlength="200"
                        placeholder="有其他需要告知的事項可以寫在這裡"
                    ></textarea>

                </label>


            </div>


            <div
                class="member-remittance-warning"
            >
                ⚠️ 請確認以上資料與實際匯款內容一致。
            </div>


            <div
                class="member-payment-modal-actions"
            >

                <button
                    type="button"
                    class="member-modal-cancel"
                    id="member-remittance-cancel"
                >
                    返回
                </button>


                <button
                    type="button"
                    class="member-payment-confirm"
                    id="member-remittance-submit"
                >
                    送出匯款回報
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    /* ---------- 關閉 ---------- */

    const close =
        () => modal.remove();


    modal
        .querySelector(
            ".member-payment-modal-backdrop"
        )
        ?.addEventListener(
            "click",
            close
        );


    document
        .getElementById(
            "member-remittance-close"
        )
        ?.addEventListener(
            "click",
            close
        );


    document
        .getElementById(
            "member-remittance-cancel"
        )
        ?.addEventListener(
            "click",
            close
        );


    /* ======================================================
       末五碼限制只能輸入數字
       ====================================================== */

    document
        .getElementById(
            "remittance-last5"
        )
        ?.addEventListener(
            "input",
            event => {

                event.target.value =
                    event.target.value
                        .replace(
                            /\D/g,
                            ""
                        )
                        .slice(
                            0,
                            5
                        );

            }
        );


    /* ======================================================
       送出匯款回報
       ====================================================== */

    document
        .getElementById(
            "member-remittance-submit"
        )
        ?.addEventListener(
            "click",
            async () => {

                const date =
                    document.getElementById(
                        "remittance-date"
                    )?.value || "";


                const time =
                    document.getElementById(
                        "remittance-time"
                    )?.value || "";


                const bank =
                    document.getElementById(
                        "remittance-bank"
                    )?.value || "";


                const last5 =
                    document.getElementById(
                        "remittance-last5"
                    )?.value.trim() || "";


                const note =
                    document.getElementById(
                        "remittance-note"
                    )?.value.trim() || "";


                /* ---------- 檢查 ---------- */

                if (
                    !date ||
                    !time ||
                    !bank
                ) {

                    alert(
                        "請完整填寫匯款日期、時間與收款帳戶。"
                    );

                    return;

                }


                if (
                    !/^\d{5}$/.test(
                        last5
                    )
                ) {

                    alert(
                        "請輸入正確的 5 碼匯款帳號末五碼。"
                    );

                    return;

                }


                const submitButton =
                    document.getElementById(
                        "member-remittance-submit"
                    );


                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.textContent =
                        "送出中...";

                }


                /* ==================================================
                   同一批匯款建立同一個 Batch ID
                   ================================================== */

                const batchId =
                    `B${Date.now()}_${MemberState.user.uid.slice(0, 6)}`;


                try {

                    const bankParts =
                        bank.split("｜");


                    const bankCode =
                        bankParts[0] || "";


                    const bankName =
                        bankParts[1] || "";


                    /* ==================================================
                       更新本次選取的所有款項
                       ================================================== */

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

                                        status:
                                            "pending",


                                        paymentRequestedAt:
                                            serverTimestamp(),


                                        remittanceDate:
                                            date,


                                        remittanceTime:
                                            time,


                                        remittanceBank:
                                            `${bankCode} ${bankName}`,


                                        remittanceLast5:
                                            last5,


                                        remittanceNote:
                                            note,


                                        remittanceTotal:
                                            total,


                                        remittanceBatchId:
                                            batchId

                                    }

                                )
                        )

                    );


                    /* ---------- 清除選取 ---------- */

                    MemberState
                        .selectedPayments
                        .clear();


                    close();


                    /* ---------- 提示 ---------- */

                    alert(
                        `匯款回報成功！\n\n共 ${selected.length} 筆，總計 NT$${total.toLocaleString("zh-TW")}。\n\n目前狀態：待對帳`
                    );


                    /* ---------- 重新載入 ---------- */

                    await loadPayments(
                        MemberState.user.uid
                    );


                    renderPaymentCenter();


                } catch (error) {

                    console.error(
                        "匯款回報失敗：",
                        error
                    );


                    alert(
                        "匯款回報失敗，請稍後再試。"
                    );


                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            "送出匯款回報";

                    }

                }

            }
        );

}

/* ==========================================================
   HTML Escape
   ========================================================== */

function escapeHTML(text = "") {

    return String(text)

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
   會員付款中心 V4
   Modal / Pending / Bank CSS
   ========================================================== */

function ensureMemberPaymentStyles() {

    if (
        document.getElementById(
            "member-payment-v4-style"
        )
    ) {
        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "member-payment-v4-style";


    style.textContent = `


        /* ==================================================
           待對帳區
           ================================================== */

        .member-pending-section {

            margin-top: 24px;

            padding-top: 24px;

            border-top:
                1px solid
                rgba(100, 110, 150, .12);

        }


        .member-pending-header {

            display: flex;

            align-items: center;

            justify-content:
                space-between;

            gap: 16px;

            margin-bottom: 14px;

        }


        .member-pending-header h3 {

            margin:
                4px 0 0;

        }


        .member-payment-pending {

            cursor: default;

            opacity: .92;

        }


        .member-payment-status {

            margin-top: 7px;

            font-size: 12px;

            font-weight: 700;

            color: #7b6b2d;

        }


        .member-payment-remittance {

            margin-top: 9px;

            font-size: 12px;

            line-height: 1.7;

            color: #777;

        }


        /* ==================================================
           Modal 外層
           ================================================== */

        .member-payment-modal {

            position: fixed;

            inset: 0;

            z-index: 9999;

            display: flex;

            align-items: center;

            justify-content: center;

            padding: 20px;

        }


        .member-payment-modal-backdrop {

            position: absolute;

            inset: 0;

            background:
                rgba(
                    25,
                    30,
                    50,
                    .42
                );

            backdrop-filter:
                blur(4px);

        }


        .member-payment-modal-box {

            position: relative;

            z-index: 1;

            width:
                min(
                    620px,
                    100%
                );

            max-height: 90vh;

            overflow-y: auto;

            padding: 24px;

            border-radius: 24px;

            background: #fff;

            box-shadow:
                0 20px 60px
                rgba(
                    30,
                    35,
                    70,
                    .20
                );

        }


        /* ==================================================
           Modal 關閉按鈕
           ================================================== */

        .member-payment-modal-close {

            position: absolute;

            top: 12px;

            right: 14px;

            width: 34px;

            height: 34px;

            border: 0;

            border-radius: 50%;

            background: #f1f3f8;

            font-size: 22px;

            line-height: 1;

            cursor: pointer;

        }


        /* ==================================================
           Modal 標題
           ================================================== */

        .member-payment-modal-title {

            font-size: 22px;

            font-weight: 800;

            margin-bottom: 5px;

        }


        .member-payment-modal-subtitle {

            color: #777;

            margin-bottom: 18px;

            line-height: 1.6;

        }


        /* ==================================================
           本次付款明細
           ================================================== */

        .member-bank-summary {

            padding: 14px;

            border-radius: 16px;

            background: #f7f8fc;

            margin-bottom: 20px;

        }


        .member-bank-summary-row {

            display: flex;

            justify-content:
                space-between;

            gap: 14px;

            padding: 7px 0;

            font-size: 14px;

        }


        .member-bank-summary-row span {

            color: #666;

        }


        .member-bank-summary-row strong {

            white-space: nowrap;

        }


        .member-bank-total {

            display: flex;

            justify-content:
                space-between;

            gap: 14px;

            margin-top: 8px;

            padding-top: 12px;

            border-top:
                1px solid
                rgba(
                    100,
                    110,
                    150,
                    .15
                );

            font-size: 16px;

            font-weight: 800;

        }


        /* ==================================================
           銀行帳戶
           ================================================== */

        .member-bank-title {

            margin-bottom: 10px;

            font-weight: 800;

        }


        .member-bank-option {

            padding: 14px 16px;

            border-radius: 15px;

            background: #f7f8fc;

            margin-bottom: 10px;

        }


        .member-bank-name-row {

            display: flex;

            justify-content:
                space-between;

            align-items: center;

            gap: 12px;

        }


        .member-bank-account-row {

            display: flex;

            align-items: center;

            gap: 10px;

            margin-top: 9px;

        }


        .member-bank-account {

            flex: 1;

            font-size: 19px;

            font-weight: 800;

            letter-spacing: .7px;

            word-break: break-all;

        }


        /* ==================================================
           複製帳號按鈕
           ================================================== */

        .member-copy-account {

            flex-shrink: 0;

            border: 0;

            border-radius: 10px;

            padding: 7px 11px;

            background: #e9eefc;

            color: #4d5fa8;

            font-size: 13px;

            font-weight: 700;

            cursor: pointer;

        }


        .member-copy-account:hover {

            filter: brightness(.97);

        }


        .member-copy-account.copied {

            background: #e8f7ed;

            color: #23824a;

        }


        /* ==================================================
           提醒
           ================================================== */

        .member-bank-hint,
        .member-remittance-warning {

            margin:
                12px 0 18px;

            padding:
                11px 13px;

            border-radius: 12px;

            background: #f6f8fc;

            color: #666;

            font-size: 13px;

            line-height: 1.6;

        }


        /* ==================================================
           匯款表單
           ================================================== */

        .member-remittance-form {

            display: grid;

            gap: 14px;

        }


        .member-remittance-form label {

            display: grid;

            gap: 7px;

        }


        .member-remittance-form label > span {

            font-size: 14px;

            font-weight: 700;

        }


        .member-remittance-form input,
        .member-remittance-form select,
        .member-remittance-form textarea {

            width: 100%;

            box-sizing: border-box;

            border:
                1px solid
                #dfe3ec;

            border-radius: 12px;

            padding:
                11px 12px;

            background: #fff;

            font: inherit;

            outline: none;

        }


        .member-remittance-form input:focus,
        .member-remittance-form select:focus,
        .member-remittance-form textarea:focus {

            border-color:
                #8d9be0;

            box-shadow:
                0 0 0 3px
                rgba(
                    141,
                    155,
                    224,
                    .12
                );

        }


        .member-remittance-form textarea {

            resize: vertical;

            min-height: 80px;

        }


        /* ==================================================
           Modal 按鈕
           ================================================== */

        .member-payment-modal-actions {

            display: flex;

            justify-content:
                flex-end;

            gap: 10px;

            margin-top: 20px;

        }


        .member-modal-cancel {

            border: 0;

            border-radius: 12px;

            padding:
                11px 16px;

            background: #f0f1f5;

            color: #555;

            font-weight: 700;

            cursor: pointer;

        }


        .member-modal-cancel:hover {

            filter: brightness(.97);

        }


        .member-payment-modal
        .member-payment-confirm {

            border: 0;

            border-radius: 12px;

            padding:
                11px 18px;

            font-weight: 800;

            cursor: pointer;

        }


        .member-payment-modal
        button:disabled {

            opacity: .55;

            cursor: not-allowed;

        }


        /* ==================================================
           手機版
           ================================================== */

        @media (max-width: 600px) {

            .member-payment-modal {

                padding: 12px;

            }


            .member-payment-modal-box {

                padding:
                    20px 16px;

                border-radius: 20px;

            }


            .member-bank-account {

                font-size: 16px;

            }


            .member-bank-summary-row {

                flex-direction: column;

                gap: 3px;

            }


            .member-payment-modal-actions {

                flex-direction:
                    column-reverse;

            }


            .member-payment-modal-actions button {

                width: 100%;

            }


            .member-pending-header {

                align-items:
                    flex-start;

            }

        }

    `;


    document.head.appendChild(
        style
    );

}


/* ==========================================================
   啟用會員付款中心樣式
   ========================================================== */

ensureMemberPaymentStyles();
