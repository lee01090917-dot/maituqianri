// ==================================================
// 神燈精靈
// 管理員｜儲值金／小額退款管理
// admin-balance.js V1
// ==================================================

import {
    auth,
    db
} from "./firebase.js";

import {
    collection,
    getDocs,
    getDoc,
    doc,
    query,
    orderBy,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// ==================================================
// State
// ==================================================

const BalanceState = {

    user: null,

    members: [],

    selectedMember: null,

    transactions: []

};


// ==================================================
// 初始化
// ==================================================

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            return;

        }

        BalanceState.user = user;

        await loadMembers();

    }
);


// ==================================================
// 載入會員
// ==================================================

async function loadMembers() {

    const container =
        document.getElementById(
            "admin-balance-center"
        );

    if (!container) {

        return;

    }


    try {

        container.innerHTML = `
            <div class="admin-balance-loading">
                💰 會員資料載入中...
            </div>
        `;


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "members"
                )
            );


        BalanceState.members =
            snapshot.docs
                .map(
                    item => ({
                        id: item.id,
                        ...item.data()
                    })
                )
                .sort(
                    (a, b) =>
                        String(
                            a.nickname || ""
                        ).localeCompare(
                            String(
                                b.nickname || ""
                            ),
                            "zh-TW"
                        )
                );


        renderBalanceCenter();

    }

    catch (error) {

        console.error(
            "載入儲值金會員失敗：",
            error
        );


        container.innerHTML = `
            <div class="admin-balance-error">
                ❌ 儲值金資料載入失敗
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

function renderBalanceCenter() {

    const container =
        document.getElementById(
            "admin-balance-center"
        );

    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="admin-balance-page">


            <!-- 標題 -->

            <div class="admin-balance-header">

                <div>

                    <h2>
                        💰 儲值金／小額退款
                    </h2>

                    <p>
                        管理會員餘額與退款紀錄
                    </p>

                </div>

            </div>


            <!-- 搜尋 -->

            <div class="admin-balance-search">

                <input
                    type="text"
                    id="admin-balance-search"
                    placeholder="搜尋會員暱稱／會員編號"
                >

            </div>


            <!-- 會員 -->

            <div
                class="admin-balance-layout"
            >


                <div
                    class="admin-balance-member-list"
                    id="admin-balance-member-list"
                >

                </div>


                <div
                    class="admin-balance-detail"
                    id="admin-balance-detail"
                >

                    <div class="admin-balance-empty">

                        👤

                        <h3>
                            請先選擇會員
                        </h3>

                        <p>
                            選擇左側會員後查看餘額
                        </p>

                    </div>

                </div>


            </div>

        </div>

    `;


    renderMemberList();


    document
        .getElementById(
            "admin-balance-search"
        )
        ?.addEventListener(
            "input",
            renderMemberList
        );

}


// ==================================================
// 會員列表
// ==================================================

function renderMemberList() {

    const list =
        document.getElementById(
            "admin-balance-member-list"
        );

    if (!list) {

        return;

    }


    const input =
        document.getElementById(
            "admin-balance-search"
        );


    const keyword =
        input?.value
            ?.trim()
            ?.toLowerCase() || "";


    const members =
        BalanceState.members.filter(
            member => {

                const nickname =
                    String(
                        member.nickname || ""
                    )
                    .toLowerCase();

                const memberNo =
                    String(
                        member.memberNo || ""
                    )
                    .toLowerCase();

                return (
                    !keyword ||
                    nickname.includes(keyword) ||
                    memberNo.includes(keyword)
                );

            }
        );


    if (!members.length) {

        list.innerHTML = `
            <div class="admin-balance-list-empty">
                找不到會員
            </div>
        `;

        return;

    }


    list.innerHTML =
        members
            .map(
                member => `

                    <button
                        type="button"
                        class="
                            admin-balance-member-item
                            ${
                                BalanceState.selectedMember?.id
                                === member.id
                                    ? "active"
                                    : ""
                            }
                        "
                        data-member-id="${escapeAttribute(
                            member.id
                        )}"
                    >

                        <div>

                            <strong>
                                ${escapeHTML(
                                    member.nickname ||
                                    "未命名會員"
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    member.memberNo ||
                                    "尚未編號"
                                )}
                            </small>

                        </div>

                        <span>
                            NT$${money(
                                member.storedBalance
                            )}
                        </span>

                    </button>

                `
            )
            .join("");


    list
        .querySelectorAll(
            ".admin-balance-member-item"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const memberId =
                            button.dataset.memberId;

                        await selectMember(
                            memberId
                        );

                    }
                );

            }
        );

}


// ==================================================
// 選擇會員
// ==================================================

async function selectMember(memberId) {

    const member =
        BalanceState.members.find(
            item =>
                item.id === memberId
        );

    if (!member) {

        return;

    }


    BalanceState.selectedMember =
        member;


    renderMemberList();

    await loadTransactions();

    renderBalanceDetail();

}


// ==================================================
// 載入異動紀錄
// ==================================================

async function loadTransactions() {

    BalanceState.transactions = [];


    const member =
        BalanceState.selectedMember;

    if (!member) {

        return;

    }


    try {

        const q =
            query(
                collection(
                    db,
                    "balanceTransactions"
                ),
                orderBy(
                    "createdAt",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(q);


        BalanceState.transactions =
            snapshot.docs
                .map(
                    item => ({
                        id: item.id,
                        ...item.data()
                    })
                )
                .filter(
                    item =>
                        item.memberUid
                        === member.id
                )
                .slice(
                    0,
                    30
                );

    }

    catch (error) {

        console.error(
            "載入餘額異動失敗：",
            error
        );

        BalanceState.transactions = [];

    }

}


// ==================================================
// 會員詳細資料
// ==================================================

function renderBalanceDetail() {

    const container =
        document.getElementById(
            "admin-balance-detail"
        );

    const member =
        BalanceState.selectedMember;


    if (!container || !member) {

        return;

    }


    const storedBalance =
        Number(
            member.storedBalance || 0
        );


    const refundBalance =
        Number(
            member.refundBalance || 0
        );


    container.innerHTML = `

        <div class="admin-balance-member-header">

            <div>

                <h2>
                    👤 ${escapeHTML(
                        member.nickname ||
                        "未命名會員"
                    )}
                </h2>

                <p>
                    ${escapeHTML(
                        member.memberNo ||
                        "尚未編號"
                    )}
                </p>

            </div>

        </div>


        <!-- 餘額 -->

        <div class="admin-balance-cards">


            <div class="admin-balance-card">

                <span>
                    💵 儲值金
                </span>

                <strong>
                    NT$${money(
                        storedBalance
                    )}
                </strong>

                <button
                    type="button"
                    data-balance-action="stored"
                >
                    ＋ 增加儲值金
                </button>

            </div>


            <div class="admin-balance-card">

                <span>
                    💸 小額退款
                </span>

                <strong>
                    NT$${money(
                        refundBalance
                    )}
                </strong>

                <button
                    type="button"
                    data-balance-action="refund"
                >
                    ＋ 增加小額退款
                </button>

            </div>


            <div class="
                admin-balance-card
                admin-balance-card-total
            ">

                <span>
                    💰 可使用總額
                </span>

                <strong>
                    NT$${money(
                        storedBalance +
                        refundBalance
                    )}
                </strong>

            </div>


        </div>


        <!-- 異動紀錄 -->

        <div class="admin-balance-history">

            <div class="admin-balance-history-header">

                <h3>
                    📋 餘額異動紀錄
                </h3>

            </div>


            <div
                id="admin-balance-history-list"
            >

                ${renderTransactionsHTML()}

            </div>

        </div>

    `;


    container
        .querySelectorAll(
            "[data-balance-action]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openAddBalanceModal(
                            button.dataset.balanceAction
                        );

                    }
                );

            }
        );

}


// ==================================================
// 異動紀錄 HTML
// ==================================================

function renderTransactionsHTML() {

    const transactions =
        BalanceState.transactions;


    if (!transactions.length) {

        return `
            <div class="admin-balance-history-empty">
                目前沒有餘額異動紀錄
            </div>
        `;

    }


    return transactions
        .map(
            item => {

                const typeText =
                    item.type === "refund"
                        ? "小額退款"
                        : "儲值金";


                const time =
                    formatDateTime(
                        item.createdAt
                    );


                return `

                    <div
                        class="admin-balance-history-item"
                    >

                        <div>

                            <strong>
                                ${typeText}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    item.reason ||
                                    "未填寫原因"
                                )}
                            </small>

                            <small>
                                ${escapeHTML(
                                    time
                                )}
                            </small>

                        </div>


                        <div>

                            <strong>
                                + NT$${money(
                                    item.amount
                                )}
                            </strong>

                            <small>
                                NT$${money(
                                    item.balanceBefore
                                )}
                                →
                                NT$${money(
                                    item.balanceAfter
                                )}
                            </small>

                        </div>

                    </div>

                `;

            }
        )
        .join("");

}


// ==================================================
// 新增餘額 Modal
// ==================================================

function openAddBalanceModal(type) {

    const member =
        BalanceState.selectedMember;

    if (!member) {

        return;

    }


    const typeText =
        type === "refund"
            ? "小額退款"
            : "儲值金";


    const modal =
        document.createElement(
            "div"
        );


    modal.className =
        "admin-balance-modal";


    modal.innerHTML = `

        <div class="admin-balance-modal-box">

            <div class="admin-balance-modal-header">

                <h3>
                    ${typeText}
                </h3>

                <button
                    type="button"
                    data-close-balance-modal
                >
                    ✕
                </button>

            </div>


            <div class="admin-balance-modal-body">

                <p>
                    會員：
                    <strong>
                        ${escapeHTML(
                            member.nickname ||
                            "未命名會員"
                        )}
                    </strong>
                </p>


                <label>

                    增加金額

                    <input
                        type="number"
                        id="balance-add-amount"
                        min="1"
                        step="1"
                        placeholder="例如 500"
                    >

                </label>


                <label>

                    原因

                    <textarea
                        id="balance-add-reason"
                        rows="3"
                        placeholder="例如：會員預存／2026 TMA 多收款"
                    ></textarea>

                </label>

            </div>


            <div class="admin-balance-modal-footer">

                <button
                    type="button"
                    data-close-balance-modal
                >
                    取消
                </button>

                <button
                    type="button"
                    id="confirm-add-balance"
                >
                    確認增加
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    modal
        .querySelectorAll(
            "[data-close-balance-modal]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        modal.remove();

                    }
                );

            }
        );


    modal
        .querySelector(
            "#confirm-add-balance"
        )
        ?.addEventListener(
            "click",
            async () => {

                const amount =
                    Number(
                        modal
                            .querySelector(
                                "#balance-add-amount"
                            )
                            ?.value
                    );


                const reason =
                    modal
                        .querySelector(
                            "#balance-add-reason"
                        )
                        ?.value
                        ?.trim();


                if (
                    !Number.isFinite(amount) ||
                    amount <= 0
                ) {

                    alert(
                        "請輸入正確的金額。"
                    );

                    return;

                }


                if (!reason) {

                    alert(
                        "請填寫原因。"
                    );

                    return;

                }


                const button =
                    modal.querySelector(
                        "#confirm-add-balance"
                    );


                button.disabled = true;
                button.textContent =
                    "處理中…";


                try {

                    await addBalance(
                        type,
                        amount,
                        reason
                    );


                    modal.remove();


                    alert(
                        `已增加${typeText} NT$${money(
                            amount
                        )}`
                    );


                    await loadMembers();


                    /*
                     * loadMembers 會重繪整個頁面，
                     * 所以重新選回原會員。
                     */

                    await selectMember(
                        member.id
                    );

                }

                catch (error) {

                    console.error(
                        "增加餘額失敗：",
                        error
                    );


                    alert(
                        "增加失敗：\n" +
                        error.message
                    );


                    button.disabled =
                        false;

                    button.textContent =
                        "確認增加";

                }

            }
        );


    modal
        .querySelector(
            "#balance-add-amount"
        )
        ?.focus();

}


// ==================================================
// 實際增加餘額
// ==================================================

async function addBalance(
    type,
    amount,
    reason
) {

    const member =
        BalanceState.selectedMember;

    const admin =
        BalanceState.user;


    if (!member || !admin) {

        throw new Error(
            "找不到會員或管理員登入資料。"
        );

    }


    const memberRef =
        doc(
            db,
            "members",
            member.id
        );


    const transactionRef =
        doc(
            collection(
                db,
                "balanceTransactions"
            )
        );


    const field =
        type === "refund"
            ? "refundBalance"
            : "storedBalance";


    await runTransaction(
        db,
        async transaction => {

            const memberSnap =
                await transaction.get(
                    memberRef
                );


            if (!memberSnap.exists()) {

                throw new Error(
                    "會員資料不存在。"
                );

            }


            const data =
                memberSnap.data();


            const before =
                Number(
                    data[field] || 0
                );


            const after =
                before + amount;


            transaction.update(
                memberRef,
                {

                    [field]:
                        after,

                    updatedAt:
                        serverTimestamp()

                }
            );


            transaction.set(
                transactionRef,
                {

                    memberUid:
                        member.id,

                    memberNickname:
                        member.nickname ||
                        "",

                    type,

                    amount,

                    balanceBefore:
                        before,

                    balanceAfter:
                        after,

                    reason,

                    createdBy:
                        admin.uid,

                    createdAt:
                        serverTimestamp()

                }
            );

        }
    );

}


// ==================================================
// 工具
// ==================================================

function money(value) {

    return Number(
        value || 0
    ).toLocaleString(
        "zh-TW"
    );

}


function formatDateTime(value) {

    if (!value) {

        return "";

    }


    try {

        if (
            typeof value.toDate ===
            "function"
        ) {

            return value
                .toDate()
                .toLocaleString(
                    "zh-TW"
                );

        }


        return new Date(value)
            .toLocaleString(
                "zh-TW"
            );

    }

    catch {

        return String(
            value
        );

    }

}


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


function escapeAttribute(value) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        );

}


console.log(
    "admin-balance.js V1 已載入"
);
