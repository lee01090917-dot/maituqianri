// ==================================================
// 匯款對帳中心
// admin-payment.js V1
// ==================================================

import { auth, db } from "./firebase.js";

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// ==================================================
// 狀態
// ==================================================

const AdminPaymentState = {

    user: null,

    batches: []

};


// ==================================================
// HTML 安全處理
// ==================================================

function escapeHTML(value) {

    return String(value ?? "")

        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ==================================================
// 日期
// ==================================================

function formatDateTime(value) {

    if (!value) {

        return "";

    }

    try {

        if (
            typeof value.toDate === "function"
        ) {

            return value
                .toDate()
                .toLocaleString("zh-TW");

        }

        return new Date(value)
            .toLocaleString("zh-TW");

    } catch {

        return String(value);

    }

}


// ==================================================
// 金額
// ==================================================

function money(value) {

    return Number(value || 0)
        .toLocaleString("zh-TW");

}


// ==================================================
// 初始化
// ==================================================

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            console.log(
                "尚未登入，無法載入匯款對帳"
            );

            return;

        }

        AdminPaymentState.user = user;

        await loadAdminPayments();

    }
);


// ==================================================
// 載入待對帳匯款
// ==================================================

async function loadAdminPayments() {

    const container =
        document.getElementById(
            "admin-payment-center"
        );

    if (!container) {

        return;

    }


    container.innerHTML = `
        <div class="admin-payment-loading">
            💳 匯款資料載入中...
        </div>
    `;


    try {

        const batchesRef =
            collection(
                db,
                "remittanceBatches"
            );


        const q =
            query(
                batchesRef,
                where(
                    "status",
                    "==",
                    "pending"
                )
            );


        const snapshot =
            await getDocs(q);


        AdminPaymentState.batches =
            snapshot.docs
                .map(
                    item => ({
                        id: item.id,
                        ...item.data()
                    })
                )
                .sort(
                    (a, b) => {

                        const aTime =
                            a.createdAt?.toMillis?.() || 0;

                        const bTime =
                            b.createdAt?.toMillis?.() || 0;

                        return bTime - aTime;

                    }
                );


        renderAdminPaymentCenter();

    } catch (error) {

        console.error(
            "載入匯款資料失敗",
            error
        );


        container.innerHTML = `
            <div class="admin-payment-error">
                ❌ 匯款資料載入失敗
                <br>
                <small>
                    ${escapeHTML(
                        error.message
                    )}
                </small>
            </div>
        `;

    }

}


// ==================================================
// 主畫面
// ==================================================

function renderAdminPaymentCenter() {

    const container =
        document.getElementById(
            "admin-payment-center"
        );

    if (!container) {

        return;

    }


    const batches =
        AdminPaymentState.batches;


    if (!batches.length) {

        container.innerHTML = `

            <div class="admin-payment-page">

                <div class="admin-payment-header">

                    <div>

                        <h2>
                            🧾 匯款對帳中心
                        </h2>

                        <p>
                            查看會員已送出的匯款資料
                        </p>

                    </div>

                    <div class="admin-payment-count">
                        目前待對帳
                        <strong>0</strong>
                        筆
                    </div>

                </div>


                <div class="admin-payment-empty">

                    🎉 目前沒有待對帳匯款

                </div>

            </div>

        `;

        return;

    }


    container.innerHTML = `

        <div class="admin-payment-page">

            <div class="admin-payment-header">

                <div>

                    <h2>
                        🧾 匯款對帳中心
                    </h2>

                    <p>
                        查看會員已送出的匯款資料
                    </p>

                </div>


                <div class="admin-payment-count">

                    目前待對帳

                    <strong>
                        ${batches.length}
                    </strong>

                    筆

                </div>

            </div>


            <div class="admin-payment-list">

                ${batches
                    .map(
                        batch =>
                            createBatchCard(batch)
                    )
                    .join("")}

            </div>

        </div>

    `;


    bindConfirmButtons();

}


// ==================================================
// 匯款卡片
// ==================================================

function createBatchCard(batch) {

    const originalTotal =
        Number(
            batch.originalTotal || 0
        );


    const refundUsed =
        Number(
            batch.refundBalanceUsed || 0
        );


    const storedUsed =
        Number(
            batch.storedBalanceUsed || 0
        );


    const bankAmount =
        Number(
            batch.bankTransferAmount || 0
        );


    const paymentIds =
        Array.isArray(
            batch.paymentIds
        )
            ? batch.paymentIds
            : [];


    return `

        <div
            class="admin-payment-card"
            data-batch-id="${escapeHTML(
                batch.id
            )}"
        >

            <!-- 標題 -->

            <div class="admin-payment-card-header">

                <div>

                    <div class="admin-payment-member">

                        👤

                        <strong>
                            ${escapeHTML(
                                batch.memberNickname ||
                                "未命名會員"
                            )}
                        </strong>

                    </div>

                    <div class="admin-payment-time">

                        ${escapeHTML(
                            formatDateTime(
                                batch.createdAt
                            )
                        )}

                    </div>

                </div>


                <div class="admin-payment-status">

                    ⏳ 待對帳

                </div>

            </div>


            <!-- 金額 -->

            <div class="admin-payment-money">

                <div>

                    <span>
                        原始應付
                    </span>

                    <strong>
                        NT$${money(
                            originalTotal
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        儲值金
                    </span>

                    <strong>
                        NT$${money(
                            storedUsed
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        小額退款
                    </span>

                    <strong>
                        NT$${money(
                            refundUsed
                        )}
                    </strong>

                </div>


                <div class="admin-payment-bank-total">

                    <span>
                        實際匯款
                    </span>

                    <strong>
                        NT$${money(
                            bankAmount
                        )}
                    </strong>

                </div>

            </div>


            <!-- 匯款資訊 -->

            <div class="admin-payment-info-grid">

                <div>

                    <small>
                        📅 匯款日期
                    </small>

                    <strong>
                        ${escapeHTML(
                            batch.remittanceDate ||
                            "-"
                        )}
                    </strong>

                </div>


                <div>

                    <small>
                        🕐 匯款時間
                    </small>

                    <strong>
                        ${escapeHTML(
                            batch.remittanceTime ||
                            "-"
                        )}
                    </strong>

                </div>


                <div>

                    <small>
                        🏦 匯款銀行
                    </small>

                    <strong>
                        ${escapeHTML(
                            batch.remittanceBank ||
                            "-"
                        )}
                    </strong>

                </div>


                <div>

                    <small>
                        🔢 後五碼
                    </small>

                    <strong>
                        ${escapeHTML(
                            batch.remittanceLast5 ||
                            "-"
                        )}
                    </strong>

                </div>

            </div>


            <!-- 備註 -->

            ${
                batch.remittanceNote
                    ? `
                        <div class="admin-payment-note">

                            📝

                            <span>
                                ${escapeHTML(
                                    batch.remittanceNote
                                )}
                            </span>

                        </div>
                    `
                    : ""
            }


            <!-- 場次 -->

            <div class="admin-payment-scenes">

                <div class="admin-payment-scenes-title">

                    📸 本次付款內容

                </div>


                <div
                    class="admin-payment-scenes-list"
                    data-scenes-for="${escapeHTML(
                        batch.id
                    )}"
                >

                    <div class="admin-payment-scenes-loading">

                        載入場次中...

                    </div>

                </div>

            </div>


            <!-- 操作 -->

            <div class="admin-payment-card-footer">

                <div class="admin-payment-item-count">

                    ${paymentIds.length}
                    個付款項目

                </div>


                <button
                    type="button"
                    class="admin-payment-confirm-btn"
                    data-confirm-batch="${escapeHTML(
                        batch.id
                    )}"
                >

                    ✓ 確認已收款

                </button>

            </div>

        </div>

    `;

}


// ==================================================
// 綁定按鈕
// ==================================================

function bindConfirmButtons() {

    document
        .querySelectorAll(
            "[data-confirm-batch]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const batchId =
                            button.dataset.confirmBatch;


                        await confirmBatch(
                            batchId,
                            button
                        );

                    }
                );

            }
        );


    loadAllBatchScenes();

}


// ==================================================
// 載入每筆匯款的場次
// ==================================================

async function loadAllBatchScenes() {

    for (
        const batch
        of AdminPaymentState.batches
    ) {

        await loadBatchScenes(
            batch
        );

    }

}


// ==================================================
// 場次
// ==================================================

async function loadBatchScenes(batch) {

    const box =
        document.querySelector(
            `[data-scenes-for="${batch.id}"]`
        );

    if (!box) {

        return;

    }


    const paymentIds =
        Array.isArray(
            batch.paymentIds
        )
            ? batch.paymentIds
            : [];


    if (!paymentIds.length) {

        box.innerHTML = `
            <div class="admin-payment-scenes-empty">
                無付款項目
            </div>
        `;

        return;

    }


    try {

        const paymentDocs = [];


        for (
            const paymentId
            of paymentIds
        ) {

            const paymentSnap =
                await getDoc(
                    doc(
                        db,
                        "payments",
                        paymentId
                    )
                );


            if (
                paymentSnap.exists()
            ) {

                paymentDocs.push({
                    id: paymentSnap.id,
                    ...paymentSnap.data()
                });

            }

        }


        if (!paymentDocs.length) {

            box.innerHTML = `
                <div class="admin-payment-scenes-empty">
                    找不到付款項目
                </div>
            `;

            return;

        }


        box.innerHTML =
            paymentDocs
                .map(
                    payment => `

                        <div class="admin-payment-scene">

                            <div>

                                📸

                                <strong>
                                    ${escapeHTML(
                                        payment.event ||
                                        "未命名場次"
                                    )}
                                </strong>

                            </div>


                            <div>

                                ${escapeHTML(
                                    payment.member ||
                                    ""
                                )}

                                ・

                                ${escapeHTML(
                                    payment.quantity ||
                                    0
                                )}
                                P

                                ・

                                NT$${money(
                                    payment.amount
                                )}

                            </div>

                        </div>

                    `
                )
                .join("");


    } catch (error) {

        console.error(
            "載入付款場次失敗",
            error
        );


        box.innerHTML = `
            <div class="admin-payment-scenes-error">
                ⚠️ 場次載入失敗
            </div>
        `;

    }

}


// ==================================================
// 確認收款
// ==================================================

async function confirmBatch(
    batchId,
    button
) {

    const batch =
        AdminPaymentState.batches
            .find(
                item =>
                    item.id === batchId
            );


    if (!batch) {

        alert(
            "找不到這筆匯款資料"
        );

        return;

    }


    const ok =
        confirm(
            `確定已收到 ${batch.memberNickname || "此會員"} 的匯款嗎？\n\n` +
            `實際匯款：NT$${money(
                batch.bankTransferAmount
            )}\n\n` +
            `確認後會將本次所有付款項目改為「已付款」。`
        );


    if (!ok) {

        return;

    }


    button.disabled = true;

    button.textContent =
        "處理中...";


    try {

        const adminUid =
            AdminPaymentState.user.uid;


        await runTransaction(
            db,
            async transaction => {

                const batchRef =
                    doc(
                        db,
                        "remittanceBatches",
                        batchId
                    );


                const batchSnap =
                    await transaction.get(
                        batchRef
                    );


                if (
                    !batchSnap.exists()
                ) {

                    throw new Error(
                        "匯款資料不存在"
                    );

                }


                const currentBatch =
                    batchSnap.data();


                if (
                    currentBatch.status !==
                    "pending"
                ) {

                    throw new Error(
                        "這筆匯款已經處理過了"
                    );

                }


                const paymentIds =
                    Array.isArray(
                        currentBatch.paymentIds
                    )
                        ? currentBatch.paymentIds
                        : [];


                const paymentRefs =
                    paymentIds.map(
                        paymentId =>
                            doc(
                                db,
                                "payments",
                                paymentId
                            )
                    );


                const paymentSnaps = [];


                for (
                    const paymentRef
                    of paymentRefs
                ) {

                    paymentSnaps.push(
                        await transaction.get(
                            paymentRef
                        )
                    );

                }


                for (
                    let i = 0;
                    i < paymentSnaps.length;
                    i++
                ) {

                    const paymentSnap =
                        paymentSnaps[i];


                    if (
                        !paymentSnap.exists()
                    ) {

                        throw new Error(
                            "其中一筆付款資料不存在"
                        );

                    }


                    const paymentData =
                        paymentSnap.data();


                    if (
                        paymentData.status !==
                        "pending"
                    ) {

                        throw new Error(
                            `付款項目「${
                                paymentData.event ||
                                "未知場次"
                            }」目前不是待對帳狀態`
                        );

                    }


                    transaction.update(
                        paymentRefs[i],
                        {

                            status: "paid",

                            paidAt:
                                serverTimestamp(),

                            paymentMethod:
                                "bank_transfer",

                            confirmedBy:
                                adminUid,

                            confirmedAt:
                                serverTimestamp()

                        }
                    );

                }


                transaction.update(
                    batchRef,
                    {

                        status: "paid",

                        confirmedBy:
                            adminUid,

                        confirmedAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()

                    }
                );

            }
        );


        alert(
            "✅ 已確認收款！"
        );


        await loadAdminPayments();


    } catch (error) {

        console.error(
            "確認收款失敗",
            error
        );


        alert(
            "❌ 確認收款失敗\n\n" +
            error.message
        );


        button.disabled = false;

        button.textContent =
            "✓ 確認已收款";

    }

}


// ==================================================
// CSS
// ==================================================

function ensureAdminPaymentStyles() {

    if (
        document.getElementById(
            "admin-payment-styles"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "admin-payment-styles";


    style.textContent = `

        .admin-payment-page {

            padding: 10px 0 30px;

        }


        .admin-payment-header {

            display: flex;

            justify-content: space-between;

            align-items: center;

            gap: 20px;

            margin-bottom: 24px;

        }


        .admin-payment-header h2 {

            margin: 0 0 6px;

            font-size: 24px;

        }


        .admin-payment-header p {

            margin: 0;

            color: #777;

        }


        .admin-payment-count {

            background: #f3f5ff;

            padding: 12px 18px;

            border-radius: 14px;

            white-space: nowrap;

        }


        .admin-payment-count strong {

            font-size: 22px;

            margin: 0 4px;

        }


        .admin-payment-list {

            display: flex;

            flex-direction: column;

            gap: 18px;

        }


        .admin-payment-card {

            background: #fff;

            border: 1px solid #e8e8ef;

            border-radius: 20px;

            padding: 22px;

            box-shadow: 0 8px 25px rgba(60,60,100,.06);

        }


        .admin-payment-card-header {

            display: flex;

            justify-content: space-between;

            align-items: flex-start;

            gap: 15px;

            margin-bottom: 20px;

        }


        .admin-payment-member {

            font-size: 18px;

        }


        .admin-payment-time {

            color: #999;

            font-size: 13px;

            margin-top: 5px;

        }


        .admin-payment-status {

            background: #fff4d6;

            color: #a66b00;

            padding: 7px 12px;

            border-radius: 999px;

            font-size: 13px;

            font-weight: 600;

        }


        .admin-payment-money {

            display: grid;

            grid-template-columns:
                repeat(4, 1fr);

            gap: 12px;

            margin-bottom: 20px;

        }


        .admin-payment-money > div {

            background: #f8f8fb;

            border-radius: 14px;

            padding: 14px;

        }


        .admin-payment-money span {

            display: block;

            color: #888;

            font-size: 13px;

            margin-bottom: 6px;

        }


        .admin-payment-money strong {

            font-size: 18px;

        }


        .admin-payment-bank-total {

            background: #eef8f3 !important;

        }


        .admin-payment-info-grid {

            display: grid;

            grid-template-columns:
                repeat(4, 1fr);

            gap: 12px;

            margin-bottom: 15px;

        }


        .admin-payment-info-grid > div {

            border: 1px solid #eee;

            border-radius: 12px;

            padding: 12px;

        }


        .admin-payment-info-grid small {

            display: block;

            color: #999;

            margin-bottom: 5px;

        }


        .admin-payment-info-grid strong {

            word-break: break-all;

        }


        .admin-payment-note {

            padding: 12px 14px;

            background: #fafafa;

            border-radius: 12px;

            margin-bottom: 18px;

        }


        .admin-payment-scenes {

            border-top: 1px solid #eee;

            padding-top: 18px;

        }


        .admin-payment-scenes-title {

            font-weight: 700;

            margin-bottom: 10px;

        }


        .admin-payment-scenes-list {

            display: flex;

            flex-direction: column;

            gap: 8px;

        }


        .admin-payment-scene {

            display: flex;

            justify-content: space-between;

            gap: 15px;

            padding: 11px 13px;

            background: #f8f8fb;

            border-radius: 10px;

        }


        .admin-payment-scene > div:last-child {

            color: #777;

            white-space: nowrap;

        }


        .admin-payment-card-footer {

            display: flex;

            justify-content: space-between;

            align-items: center;

            gap: 15px;

            margin-top: 20px;

            padding-top: 18px;

            border-top: 1px solid #eee;

        }


        .admin-payment-item-count {

            color: #888;

            font-size: 14px;

        }


        .admin-payment-confirm-btn {

            border: 0;

            border-radius: 12px;

            padding: 11px 18px;

            cursor: pointer;

            font-size: 15px;

            font-weight: 700;

            background: #667eea;

            color: white;

        }


        .admin-payment-confirm-btn:hover {

            opacity: .9;

        }


        .admin-payment-confirm-btn:disabled {

            opacity: .6;

            cursor: wait;

        }


        .admin-payment-empty {

            background: #fff;

            border: 1px solid #eee;

            border-radius: 18px;

            padding: 50px 20px;

            text-align: center;

            color: #888;

        }


        .admin-payment-loading {

            padding: 40px;

            text-align: center;

            color: #888;

        }


        .admin-payment-error {

            background: #fff1f1;

            color: #b33;

            border-radius: 14px;

            padding: 20px;

        }


        .admin-payment-scenes-loading,

        .admin-payment-scenes-empty,

        .admin-payment-scenes-error {

            color: #999;

            padding: 8px;

        }


        @media (max-width: 800px) {

            .admin-payment-money {

                grid-template-columns:
                    repeat(2, 1fr);

            }


            .admin-payment-info-grid {

                grid-template-columns:
                    repeat(2, 1fr);

            }

        }


        @media (max-width: 600px) {

            .admin-payment-header {

                flex-direction: column;

                align-items: flex-start;

            }


            .admin-payment-money,

            .admin-payment-info-grid {

                grid-template-columns: 1fr;

            }


            .admin-payment-scene {

                flex-direction: column;

                gap: 5px;

            }


            .admin-payment-scene > div:last-child {

                white-space: normal;

            }


            .admin-payment-card-footer {

                flex-direction: column;

                align-items: stretch;

            }


            .admin-payment-confirm-btn {

                width: 100%;

            }

        }

    `;


    document.head.appendChild(
        style
    );

}


// ==================================================
// 啟用 CSS
// ==================================================

ensureAdminPaymentStyles();


console.log(
    "admin-payment.js V1 已載入"
);
