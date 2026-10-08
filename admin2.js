import {
    auth,
    db
} from "./firebase.js";

import {
    collection,
    getDocs,
    getDoc,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// ==================================================
// DOM
// ==================================================

const memberList =
    document.querySelector(".member-list");

const profileCard =
    document.querySelector(".profile-card");

const recentMembers =
    document.getElementById("recentMembers");

const memberCount =
    document.getElementById("memberCount");

const pendingCount =
    document.getElementById("pendingCount");

const lineCount =
    document.getElementById("lineCount");

const todayCount =
    document.getElementById("todayCount");

const memberSearch =
    document.getElementById("memberSearch");

const pendingStatCard =
    document.getElementById(
        "pendingStatCard"
    );


// ==================================================
// ATEEZ 成員
// ==================================================

const ateezMembers = [
    "星化",
    "弘中",
    "潤浩",
    "呂尚",
    "傘尼",
    "旼琦",
    "友榮",
    "鍾浩"
];


// ==================================================
// 全域資料
// ==================================================

let members = [];

let currentMember = null;

let editingMember = false;


// ==================================================
// 權限檢查
// ==================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        location.href = "login.html";

        return;

    }

    try {

        const memberRef =
            doc(
                db,
                "members",
                user.uid
            );

        const memberSnap =
            await getDoc(
                memberRef
            );


        if (!memberSnap.exists()) {

            alert("找不到會員資料");

            location.href = "app.html";

            return;

        }


        if (
            memberSnap.data().role !== "管理員"
        ) {

            alert("沒有權限");

            location.href = "app.html";

            return;

        }


        await loadMembers();


    } catch (error) {

        console.error(
            "權限檢查失敗：",
            error
        );

    }

});


// ==================================================
// 載入會員
// ==================================================

async function loadMembers() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "members"
                )
            );


        members = [];


        snapshot.forEach(memberDoc => {

            members.push({

                id: memberDoc.id,

                ...memberDoc.data()

            });

        });


        renderDashboard();

        renderMemberList();

        renderRecentMembers();


    } catch (error) {

        console.error(
            "會員資料載入失敗：",
            error
        );

    }

}


// ==================================================
// Dashboard 統計
// ==================================================

function renderDashboard() {

    const total =
        members.length;

    let pending = 0;

    let line = 0;

    let today = 0;


    const todayString =
        new Date()
            .toLocaleDateString(
                "sv-SE"
            );


    members.forEach(member => {


        if (
            member.status !== "已通過"
        ) {

            pending++;

        }


        if (
            member.officialLine
        ) {

            line++;

        }


        if (
            member.joinDate
        ) {

            let joinDate = "";


            if (
                member.joinDate &&
                typeof member.joinDate.toDate === "function"
            ) {

                joinDate =
                    member.joinDate
                        .toDate()
                        .toLocaleDateString(
                            "sv-SE"
                        );

            } else {

                joinDate =
                    String(
                        member.joinDate
                    )
                        .slice(
                            0,
                            10
                        );

            }


            if (
                joinDate === todayString
            ) {

                today++;

            }

        }

    });


    if (memberCount) {

        memberCount.textContent =
            total;

    }


    if (pendingCount) {

        pendingCount.textContent =
            pending;

    }


    if (lineCount) {

        lineCount.textContent =
            line;

    }


    if (todayCount) {

        todayCount.textContent =
            today;

    }

}


// ==================================================
// 左側會員列表
// ==================================================

function renderMemberList(
    keyword = "",
    status = "",
    favorite = ""
) {

    if (!memberList) return;


    memberList.innerHTML = "";


    const searchKeyword =
        String(keyword)
            .trim()
            .toLowerCase();


    const list =
        members.filter(member => {


            // ==============================
            // 搜尋
            // ==============================

            const text = [

                member.memberNo || "",

                member.nickname || "",

                member.socialPlatform || "",

                member.socialAccount || "",

                member.favoriteMember || "",

                member.email || ""

            ]
                .join(" ")
                .toLowerCase();


            const matchSearch =
                !searchKeyword ||
                text.includes(searchKeyword);


            // ==============================
            // 會員狀態
            // ==============================

            const matchStatus =
                !status ||
                member.status === status;


            // ==============================
            // 主擔
            // ==============================

            const matchFavorite =
                !favorite ||
                member.favoriteMember === favorite;


            return (
                matchSearch &&
                matchStatus &&
                matchFavorite
            );

        });


    // ==============================
    // 沒有符合會員
    // ==============================

    if (list.length === 0) {

        memberList.innerHTML = `

            <div class="empty">

                找不到符合條件的會員

            </div>

        `;

        return;

    }


    // ==============================
    // 產生會員卡片
    // ==============================

    list.forEach(member => {


        const card =
            document.createElement("div");


        card.className =
            "member-card";


        card.dataset.id =
            member.id;


        // ==============================
        // 狀態樣式
        // ==============================

        let statusClass =
            "pending";


        if (
            member.status === "已通過"
        ) {

            statusClass =
                "approved";

        } else if (
            member.status === "已拒絕"
        ) {

            statusClass =
                "rejected";

        } else if (
            member.status === "暫停"
        ) {

            statusClass =
                "hold";

        }


        card.innerHTML = `

            <div class="member-top">

                <strong>

                    ${escapeHTML(
                        member.memberNo ||
                        "待發號"
                    )}

                </strong>


                <span
                    class="status ${statusClass}">

                    ${escapeHTML(
                        member.status ||
                        "-"
                    )}

                </span>

            </div>


            <div class="member-name">

                ${escapeHTML(
                    member.nickname ||
                    "-"
                )}

            </div>


            <div class="member-info">

                ❤️ ${escapeHTML(
                    member.favoriteMember ||
                    "-"
                )}

            </div>


            <div class="member-info">

                ${escapeHTML(
                    member.socialPlatform ||
                    "-"
                )}

            </div>

        `;


        memberList.appendChild(
            card
        );

    });


    bindMemberClick();

}


// ==================================================
// 會員點擊
// ==================================================

function bindMemberClick() {

    const cards =
        document.querySelectorAll(
            ".member-card"
        );


    cards.forEach(card => {

        card.onclick = () => {


            cards.forEach(item => {

                item.classList.remove(
                    "active"
                );

            });


            card.classList.add(
                "active"
            );


            currentMember =
                members.find(
                    member =>
                        member.id ===
                        card.dataset.id
                );


            editingMember = false;


            renderProfile();

        };

    });


    if (
        cards.length > 0 &&
        !currentMember
    ) {

        cards[0].click();

    }

}


// ==================================================
// 會員資料
// ==================================================

function renderProfile() {

    if (!profileCard) return;


    if (!currentMember) {

        profileCard.innerHTML = `

            <div class="empty">

                請先選擇一位會員

            </div>

        `;

        return;

    }


    if (editingMember) {

        renderEditProfile();

        return;

    }


    // ==================================================
    // 副擔
    // ==================================================

    let subFavorites = "-";


    if (
        Array.isArray(
            currentMember.subFavoriteMembers
        )
    ) {

        subFavorites =
            currentMember
                .subFavoriteMembers
                .join("、") || "-";

    }


    // ==================================================
    // 推薦人
    // ==================================================

    let referrerDisplay = "-";


    if (
        currentMember.referrerMemberNo
    ) {

        referrerDisplay =
            currentMember.referrerMemberNo;

    }
    else if (
        currentMember.referrerAccount
    ) {

        referrerDisplay =
            currentMember.referrerAccount;

    }


    // ==================================================
    // 加入來源
    // ==================================================

    let joinSourceDisplay =
        currentMember.joinSource || "-";


    // ==================================================
    // 會員狀態
    // ==================================================

    let statusClass = "status-default";

  if (
    currentMember.status ===
    "已通過"
) {
    statusClass =
        "status-active";
}
else if (
    currentMember.status ===
    "待審核"
) {
    statusClass =
        "status-pending";
}
else if (
    currentMember.status ===
    "暫停"
) {
    statusClass =
        "status-disabled";
}
else if (
    currentMember.status ===
    "已拒絕"
) {
    statusClass =
        "status-blacklist";
}


    profileCard.innerHTML = `

        <!-- ==========================================
             會員標題
        ========================================== -->

        <div class="profile-header">

            <div class="profile-person">

                <div class="profile-avatar">

                    👤

                </div>


                <div class="profile-title">

                    <h2>

                        ${escapeHTML(
                            currentMember.nickname ||
                            "-"
                        )}

                    </h2>


                    <p>

                        ${escapeHTML(
                            currentMember.memberNo ||
                            "待發號"
                        )}

                    </p>

                </div>

            </div>


            <div class="profile-actions">

                <button
                    id="editMember"
                    type="button">

                    ✏️ 編輯

                </button>

            </div>

        </div>


        <!-- ==========================================
             基本資料
        ========================================== -->

        <div class="profile-section-title">

            👤 基本資料

        </div>


        <div class="profile-grid">


            <div class="profile-box">

                <small>
                    🆔 會員編號
                </small>

                <strong>

                    ${escapeHTML(
                        currentMember.memberNo ||
                        "待發號"
                    )}

                </strong>

            </div>


            <div class="profile-box">

                <small>
                    📧 Email
                </small>

                <strong>

                    ${escapeHTML(
                        currentMember.email ||
                        "-"
                    )}

                </strong>

            </div>


        </div>


        <!-- ==========================================
             社群資料
        ========================================== -->

        <div class="profile-section-title">

            🔗 社群資料

        </div>


        <div class="profile-grid">


            <div class="profile-box">

                <small>
                    📱 社群平台
                </small>

                <strong>

                    ${escapeHTML(
                        currentMember.socialPlatform ||
                        "-"
                    )}

                </strong>

            </div>


            <div class="profile-box">

                <small>
                    🔗 社群帳號
                </small>

                <strong>

                    ${escapeHTML(
                        currentMember.socialAccount ||
                        "-"
                    )}

                </strong>

            </div>


        </div>


        <!-- ==========================================
             ATEEZ
        ========================================== -->

        <div class="profile-section-title">

            ❤️ ATEEZ 喜好

        </div>


        <div class="profile-grid">


            <div class="profile-box">

                <small>
                    ❤️ 主擔
                </small>

                <strong>

                    ${escapeHTML(
                        currentMember.favoriteMember ||
                        "-"
                    )}

                </strong>

            </div>


            <div class="profile-box">

                <small>
                    💛 副擔
                </small>

                <strong>

                    ${escapeHTML(
                        subFavorites
                    )}

                </strong>

            </div>


        </div>


        <!-- ==========================================

                     會員資料
        ========================================== -->

        <div class="profile-section-title">

            📋 會員資訊

        </div>


        <div class="profile-grid">


            <div class="profile-box">

                <small>
                    📅 加入日期
                </small>

                <strong>

                    ${escapeHTML(
                        getDateValue(
                            currentMember.joinDate
                        ) || "-"
                    )}

                </strong>

            </div>


            <div class="profile-box">

                <small>
                    📣 加入來源
                </small>

                <strong>

                    ${escapeHTML(
                        joinSourceDisplay
                    )}

                </strong>

            </div>


            <div class="profile-box">

                <small>
                    👤 推薦人
                </small>

                <strong>

                    ${escapeHTML(
                        referrerDisplay
                    )}

                </strong>

            </div>


            <div class="profile-box">

                <small>
                    📌 會員狀態
                </small>

                <strong
                    class="${statusClass}">

                    ${escapeHTML(
                        currentMember.status ||
                        "-"
                    )}

                </strong>

            </div>


        </div>


        <!-- ==========================================
             官方 LINE
        ========================================== -->

        <div class="profile-section-title">

            💬 官方 LINE

        </div>


        <div class="profile-line-box">

            <span>

                ${
                    currentMember.officialLine
                        ? "✅ 已加入官方 LINE"
                        : "❌ 尚未加入官方 LINE"
                }

            </span>

        </div>


        <!-- ==========================================
             管理備註
        ========================================== -->

        <div class="profile-section-title">

            📝 管理備註

        </div>


        <div class="profile-note">

            ${escapeHTML(
                currentMember.adminNote ||
                "目前沒有備註"
            )}

        </div>


        <!-- ==========================================
             快速操作
        ========================================== -->

        <div class="profile-section-title">

            ⚡ 快速操作

        </div>


        <div class="profile-quick-actions">

            <button
                id="quickEditStatus"
                type="button">

                🔄 修改狀態

            </button>

        </div>


    `;


    // ==================================================
    // 編輯會員
    // ==================================================

    document
        .getElementById(
            "editMember"
        )
        ?.addEventListener(
            "click",
            () => {

                editingMember = true;

                renderProfile();

            }
        );


    // ==================================================
    // 快速修改狀態
    // ==================================================

    document
        .getElementById(
            "quickEditStatus"
        )
        ?.addEventListener(
            "click",
            async () => {

                if (!currentMember) return;


                const currentStatus =
                    currentMember.status ||
                    "待審核";


                const newStatus =
                    prompt(
                        "請輸入新的會員狀態：",
                        currentStatus
                    );


                if (
                    newStatus === null
                ) {

                    return;

                }


                try {

                    await updateDoc(

                        doc(
                            db,
                            "members",
                            currentMember.id
                        ),

                        {
                            status:
                                newStatus.trim()
                        }

                    );


                    currentMember.status =
                        newStatus.trim();


                    showToast(
                        "會員狀態已更新！"
                    );


                    renderProfile();


                }
                catch (error) {

                    console.error(
                        "更新會員狀態失敗：",
                        error
                    );


                    alert(
                        "會員狀態更新失敗，請稍後再試。"
                    );

                }

            }
        );

}


// ==================================================
// 編輯會員
// ==================================================

function renderEditProfile() {

    if (!profileCard) return;

    if (!currentMember) return;


    profileCard.innerHTML = `

        <!-- ==========================================
             編輯標題
        ========================================== -->

        <div class="profile-header">

            <div class="profile-person">

                <div class="profile-avatar">

                    ✏️

                </div>


                <div class="profile-title">

                    <h2>

                        編輯會員資料

                    </h2>


                    <p>

                        ${escapeHTML(
                            currentMember.memberNo ||
                            "待發號"
                        )}

                    </p>

                </div>

            </div>


            <div class="profile-actions">

                <button
                    id="cancelEditMember"
                    type="button">

                    ✕ 取消

                </button>

            </div>

        </div>


        <!-- ==========================================
             基本資料
        ========================================== -->

        <div class="profile-section-title">

            👤 基本資料

        </div>


        <div class="edit-grid">


            <div class="edit-field">

                <label>

                    會員編號

                </label>


                <input
                    id="editMemberNo"
                    type="text"
                    value="${escapeAttribute(
                        currentMember.memberNo ||
                        ""
                    )}"
                >

            </div>


            <div class="edit-field">

                <label>

                    暱稱

                </label>


                <input
                    id="editNickname"
                    type="text"
                    value="${escapeAttribute(
                        currentMember.nickname ||
                        ""
                    )}"
                >

            </div>


            <div class="edit-field">

                <label>

                    Email

                </label>


                <input
                    id="editEmail"
                    type="email"
                    value="${escapeAttribute(
                        currentMember.email ||
                        ""
                    )}"
                >

            </div>


            <div class="edit-field">

                <label>

                    社群帳號

                </label>


                <input
                    id="editSocialAccount"
                    type="text"
                    value="${escapeAttribute(
                        currentMember.socialAccount ||
                        ""
                    )}"
                >

            </div>


        </div>


        <!-- ==========================================
             社群平台
        ========================================== -->

        <div class="profile-section-title">

            🔗 社群平台

        </div>


        <div class="platform-options">


            <label class="platform-option">

                <input
                    type="radio"
                    name="editSocialPlatform"
                    value="Instagram"
                    ${
                        currentMember.socialPlatform ===
                        "Instagram"
                            ? "checked"
                            : ""
                    }
                >

                <span>

                    Instagram

                </span>

            </label>


            <label class="platform-option">

                <input
                    type="radio"
                    name="editSocialPlatform"
                    value="X"
                    ${
                        currentMember.socialPlatform ===
                        "X"
                            ? "checked"
                            : ""
                    }
                >

                <span>

                    X

                </span>

            </label>


            <label class="platform-option">

                <input
                    type="radio"
                    name="editSocialPlatform"
                    value="Facebook"
                    ${
                        currentMember.socialPlatform ===
                        "Facebook"
                            ? "checked"
                            : ""
                    }
                >

                <span>

                    Facebook

                </span>

            </label>


            <label class="platform-option">

                <input
                    type="radio"
                    name="editSocialPlatform"
                    value="Threads"
                    ${
                        currentMember.socialPlatform ===
                        "Threads"
                            ? "checked"
                            : ""
                    }
                >

                <span>

                    Threads

                </span>

            </label>


            <label class="platform-option">

                <input
                    type="radio"
                    name="editSocialPlatform"
                    value="其他"
                    ${
                        currentMember.socialPlatform ===
                        "其他"
                            ? "checked"
                            : ""
                    }
                >

                <span>

                    其他

                </span>

            </label>


        </div>


        <!-- ==========================================
             ATEEZ 喜好
        ========================================== -->

        <div class="profile-section-title">

            ❤️ ATEEZ 喜好

        </div>


        <div class="edit-grid">


            <div class="edit-field">

                <label>

                    主擔

                </label>


                <select id="editFavoriteMember">

                    <option value="">

                        未設定

                    </option>


                    ${ateezMembers
                        .map(member => `

                            <option
                                value="${escapeAttribute(
                                    member
                                )}"
                                ${
                                    currentMember.favoriteMember ===
                                    member
                                        ? "selected"
                                        : ""
                                }
                            >

                                ${escapeHTML(
                                    member
                                )}

                            </option>

                        `)
                        .join("")}

                </select>

            </div>


            <div class="edit-field">

                <label>

                    副擔

                </label>


                <div
                    class="sub-favorite-wrapper">

                    <button
                        type="button"
                        id="subFavoriteToggle"
                        class="sub-favorite-toggle">

                        選擇副擔 ▾

                    </button>


                    <div
                        id="subFavoriteMenu"
                        class="sub-favorite-menu">

                        ${ateezMembers
                            .map(member => `

                                <label>

                                    <input
                                        type="checkbox"
                                        value="${escapeAttribute(
                                            member
                                        )}"
                                        ${
                                            Array.isArray(
                                                currentMember.subFavoriteMembers
                                            ) &&
                                            currentMember.subFavoriteMembers.includes(
                                                member
                                            )
                                                ? "checked"
                                                : ""
                                        }
                                    >

                                    <span>

                                        ${escapeHTML(
                                            member
                                        )}

                                    </span>

                                </label>

                            `)
                            .join("")}

                    </div>

                </div>

            </div>


        </div>


        <!-- ==========================================
             官方 LINE
        ========================================== -->

        <div class="profile-section-title">

            💬 官方 LINE

        </div>


        <label
            class="edit-checkbox">

            <input
                id="editOfficialLine"
                type="checkbox"
                ${
                    currentMember.officialLine
                        ? "checked"
                        : ""
                }
            >

            <span>

                已加入官方 LINE

            </span>

        </label>


        <!-- ==========================================
             加入來源
        ========================================== -->

        <div class="profile-section-title">

            📣 加入來源

        </div>


        <div class="source-options">


            ${[
                "朋友介紹",
                "社群",
                "IG",
                "Threads",
                "X",
                "其他"
            ]
                .map(source => `

                    <label
                        class="platform-option">

                        <input
                            type="radio"
                            name="editJoinSource"
                            value="${escapeAttribute(
                                source
                            )}"
                            ${
                                currentMember.joinSource ===
                                source
                                    ? "checked"
                                    : ""
                            }
                        >

                        <span>

                            ${escapeHTML(
                                source
                            )}

                        </span>

                    </label>

                `)
                .join("")}


        </div>


        <div class="edit-grid">


            <div class="edit-field">

                <label>

                    推薦人

                </label>


                <input
                    id="referrerInput"
                    type="text"
                    placeholder="輸入會員編號或暱稱"
                    value="${escapeAttribute(
                        currentMember.referrerNickname ||
                        currentMember.referrerMemberNo ||
                        ""
                    )}"
                >


                <select
                    id="referrerSelect">

                    <option value="">

                        不指定推薦人

                    </option>

                </select>

            </div>


            <div class="edit-field">

                <label>

                    其他加入來源

                </label>


                <input
                    id="editJoinSourceOther"
                    type="text"
                    value="${escapeAttribute(
                        currentMember.joinSourceOther ||
                        ""
                    )}"
                >

            </div>


        </div>


        <!-- ==========================================
             會員狀態
        ========================================== -->

        <div class="profile-section-title">

            📌 會員狀態

        </div>


        <div class="edit-grid">


            <div class="edit-field">

                <label>

                    狀態

                </label>


                <select id="editStatus">

                    <option value="待審核">

                        待審核

                    </option>


                    <option value="已通過">

                        已通過

                    </option>


                    <option value="暫停">

                        暫停

                    </option>


                    <option value="已拒絕">

                        已拒絕

                    </option>


                </select>

            </div>


            <div class="edit-field">

                <label>

                    管理備註

                </label>


                <textarea
                    id="editAdminNote"
                    rows="4"
                >${escapeHTML(
                    currentMember.adminNote ||
                    ""
                )}</textarea>

            </div>


        </div>


        <!-- ==========================================
             儲存
        ========================================== -->

        <div class="profile-edit-footer">

            <button
                id="saveMember"
                type="button"
                class="btn-primary">

                💾 儲存會員資料

            </button>

        </div>

    `;


    // ==================================================
    // 預設狀態
    // ==================================================

    const statusSelect =
        document.getElementById(
            "editStatus"
        );


    if (statusSelect) {

        statusSelect.value =
            currentMember.status ||
            "待審核";

    }


    // ==================================================
    // 取消
    // ==================================================

    document
        .getElementById(
            "cancelEditMember"
        )
        ?.addEventListener(
            "click",
            () => {

                editingMember = false;

                renderProfile();

            }
        );


    // ==================================================
    // 副擔選單
    // ==================================================

    const subFavoriteToggle =
        document.getElementById(
            "subFavoriteToggle"
        );

    const subFavoriteMenu =
        document.getElementById(
            "subFavoriteMenu"
        );


    subFavoriteToggle
        ?.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                subFavoriteMenu
                    ?.classList.toggle(
                        "show"
                    );

            }
        );


    subFavoriteMenu
        ?.addEventListener(
            "click",
            event => {

                event.stopPropagation();

            }
        );


    document.addEventListener(
        "click",
        () => {

            subFavoriteMenu
                ?.classList.remove(
                    "show"
                );

        },
        {
            once: true
        }
    );


    // ==================================================
    // 儲存
    // ==================================================

    document
        .getElementById(
            "saveMember"
        )
        ?.addEventListener(
            "click",
            saveMember
        );

}

// ==================================================
// 儲存會員
// ==================================================

async function saveMember() {

    if (!currentMember) return;


    const saveButton =
        document.getElementById(
            "saveMember"
        );


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "儲存中…";

    }


    try {

        // ==========================================
        // 基本資料
        // ==========================================

        const memberNo =
            document
                .getElementById(
                    "editMemberNo"
                )
                ?.value
                .trim() || "";


        const nickname =
            document
                .getElementById(
                    "editNickname"
                )
                ?.value
                .trim() || "";


        const socialPlatform =
            document.querySelector(
                'input[name="editSocialPlatform"]:checked'
            )?.value || "";


        const socialAccount =
            document
                .getElementById(
                    "editSocialAccount"
                )
                ?.value
                .trim() || "";


        const email =
            document
                .getElementById(
                    "editEmail"
                )
                ?.value
                .trim() || "";


        // ==========================================
        // 主擔
        // ==========================================

        const favoriteMember =
            document
                .getElementById(
                    "editFavoriteMember"
                )
                ?.value || "";


        // ==========================================
        // 副擔
        // ==========================================

        const subFavoriteMembers = [
            ...document.querySelectorAll(
                "#subFavoriteMenu input[type='checkbox']:checked"
            )
        ].map(
            checkbox =>
                checkbox.value
        );


        // ==========================================
        // 官方 LINE
        // ==========================================

        const officialLine =
            document
                .getElementById(
                    "editOfficialLine"
                )
                ?.checked || false;


        // ==========================================
        // 加入來源
        // ==========================================

        let joinSource =
            document.querySelector(
                'input[name="editJoinSource"]:checked'
            )?.value || "";


        const joinSourceOther =
            document
                .getElementById(
                    "editJoinSourceOther"
                )
                ?.value
                .trim() || "";


        if (
            joinSource === "其他" &&
            joinSourceOther
        ) {

            joinSource =
                joinSourceOther;

        }


        // ==========================================
        // 推薦人
        // ==========================================

        const referrerSelect =
            document.getElementById(
                "referrerSelect"
            );


        const referrerId =
            referrerSelect?.value || "";


        const referrer =
            members.find(
                member =>
                    member.id ===
                    referrerId
            );


        const referrerMemberId =
            referrer?.id || "";


        const referrerMemberNo =
            referrer?.memberNo || "";


        const referrerNickname =
            referrer?.nickname || "";


        // ==========================================
        // 狀態
        // ==========================================

        const status =
            document
                .getElementById(
                    "editStatus"
                )
                ?.value ||
            "待審核";


        // ==========================================
        // 管理備註
        // ==========================================

        const adminNote =
            document
                .getElementById(
                    "editAdminNote"
                )
                ?.value
                .trim() || "";


        // ==========================================
        // 更新 Firebase
        // ==========================================

        await updateDoc(

            doc(
                db,
                "members",
                currentMember.id
            ),

            {

                memberNo,

                nickname,

                email,

                socialPlatform,

                socialAccount,

                favoriteMember,

                subFavoriteMembers,

                officialLine,

                joinSource,

                joinSourceOther,

                referrerMemberId,

                referrerMemberNo,

                referrerNickname,

                status,

                adminNote,

                updatedAt:
                    new Date()

            }

        );


        // ==========================================
        // 更新本地資料
        // ==========================================

        currentMember = {

            ...currentMember,

            memberNo,

            nickname,

            email,

            socialPlatform,

            socialAccount,

            favoriteMember,

            subFavoriteMembers,

            officialLine,

            joinSource,

            joinSourceOther,

            referrerMemberId,

            referrerMemberNo,

            referrerNickname,

            status,

            adminNote

        };


        const index =
            members.findIndex(
                member =>
                    member.id ===
                    currentMember.id
            );


        if (
            index !== -1
        ) {

            members[index] =
                currentMember;

        }


        // ==========================================
        // 結束編輯
        // ==========================================

        editingMember = false;


        renderDashboard();

        renderMemberList();

        renderRecentMembers();

        renderProfile();


        setTimeout(() => {

            const selectedCard =
                document.querySelector(
                    `.member-card[data-id="${currentMember.id}"]`
                );


            if (
                selectedCard
            ) {

                selectedCard.classList.add(
                    "active"
                );

            }

        }, 0);


        showToast(
            "會員資料已儲存！"
        );


    }
    catch (error) {

        console.error(
            "會員資料儲存失敗：",
            error
        );


        alert(
            "儲存失敗，請稍後再試。"
        );

    }
    finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "💾 儲存會員資料";

        }

    }

}


// ==================================================
// 最近加入會員
// ==================================================

function renderRecentMembers() {

    if (!recentMembers) return;


    recentMembers.innerHTML = "";


    if (
        members.length === 0
    ) {

        recentMembers.innerHTML = `

            <div class="recent-empty">

                目前尚無會員資料

            </div>

        `;

        return;

    }


    const sortedMembers =
        [...members]
            .sort(
                (a, b) => {

                    const dateA =
                        getDateValue(
                            a.joinDate
                        );


                    const dateB =
                        getDateValue(
                            b.joinDate
                        );


                    return dateB - dateA;

                }
            )
            .slice(
                0,
                3
            );


    sortedMembers.forEach(
        member => {


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "recent-member-card";


            card.innerHTML = `

                <div class="recent-member-avatar">

                    👤

                </div>


                <div class="recent-member-info">

                    <strong>

                        ${escapeHTML(
                            member.nickname ||
                            "待發號"
                        )}

                    </strong>


                    <span>

                        ${
                            member.memberNo
                                ? escapeHTML(
                                    member.memberNo
                                )
                                : "尚未發號"
                        }

                        ·

                        ${
                            member.socialPlatform
                                ? escapeHTML(
                                    member.socialPlatform
                                )
                                : "尚未填寫平台"
                        }

                    </span>

                </div>

            `;


            card.addEventListener(
                "click",
                () => {

                    currentMember =
                        member;


                    editingMember =
                        false;


                    renderProfile();


                    const target =
                        document.querySelector(
                            `.member-card[data-id="${member.id}"]`
                        );


                    if (target) {

                        document
                            .querySelectorAll(
                                ".member-card"
                            )
                            .forEach(
                                item => {

                                    item.classList.remove(
                                        "active"
                                    );

                                }
                            );


                        target.classList.add(
                            "active"
                        );

                    }

                }
            );


            recentMembers.appendChild(
                card
            );

        }
    );

}


// ==================================================
// 日期轉換
// ==================================================

function getDateValue(value) {

    if (!value) {

        return 0;

    }


    if (
        value &&
        typeof value.toDate ===
        "function"
    ) {

        return value
            .toDate()
            .getTime();

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return 0;

    }


    return date.getTime();

}


// ==================================================
// Toast
// ==================================================

function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) {

        alert(message);

        return;

    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(() => {

        toast.classList.remove(
            "show"
        );

    }, 2200);

}


// ==================================================
// 搜尋＋會員篩選
// ==================================================

const memberStatusFilter =
    document.getElementById(
        "memberStatusFilter"
    );


const memberFavoriteFilter =
    document.getElementById(
        "memberFavoriteFilter"
    );


function applyMemberFilters() {

    currentMember =
        null;

    editingMember =
        false;


    const keyword =
        memberSearch
            ?.value
            ?.trim() || "";


    const status =
        memberStatusFilter
            ?.value || "";


    const favorite =
        memberFavoriteFilter
            ?.value || "";


    renderMemberList(
        keyword,
        status,
        favorite
    );

}


// ==================================================
// 搜尋
// ==================================================

if (memberSearch) {

    memberSearch.addEventListener(
        "input",
        applyMemberFilters
    );

}


// ==================================================
// 狀態篩選
// ==================================================

if (memberStatusFilter) {

    memberStatusFilter.addEventListener(
        "change",
        applyMemberFilters
    );

}


// ==================================================
// 主擔篩選
// ==================================================

if (memberFavoriteFilter) {

    memberFavoriteFilter.addEventListener(
        "change",
        applyMemberFilters
    );

}


// ==================================================
// 點擊「待審核」快速查看
// ==================================================

if (pendingStatCard) {

    pendingStatCard.addEventListener(
        "click",
        () => {

            if (memberSearch) {

                memberSearch.value =
                    "";

            }


            if (
                memberFavoriteFilter
            ) {

                memberFavoriteFilter.value =
                    "";

            }


            if (
                memberStatusFilter
            ) {

                memberStatusFilter.value =
                    "待審核";

            }


            applyMemberFilters();


            document
                .querySelector(
                    ".workspace"
                )
                ?.scrollIntoView({
                    behavior:
                        "smooth"
                });

        }
    );

}

// ==================================================
// Modal
// ==================================================

const memberModal =
    document.getElementById(
        "memberModal"
    );


const taskModal =
    document.getElementById(
        "taskModal"
    );


const addMemberBtn =
    document.getElementById(
        "addMember"
    );


const addTaskBtn =
    document.getElementById(
        "addTask"
    );


const closeMemberModal =
    document.getElementById(
        "closeMemberModal"
    );


const closeTaskModal =
    document.getElementById(
        "closeTaskModal"
    );


// ==================================================
// 新增會員
// ==================================================

addMemberBtn?.addEventListener(
    "click",
    () => {

        memberModal?.classList.remove(
            "hidden"
        );

    }
);


// ==================================================
// 關閉會員 Modal
// ==================================================

closeMemberModal?.addEventListener(
    "click",
    () => {

        memberModal?.classList.add(
            "hidden"
        );

    }
);


// ==================================================
// 新增待辦
// ==================================================

addTaskBtn?.addEventListener(
    "click",
    () => {

        taskModal?.classList.remove(
            "hidden"
        );

    }
);


// ==================================================
// 關閉新增待辦
// ==================================================

closeTaskModal?.addEventListener(
    "click",
    () => {

        taskModal?.classList.add(
            "hidden"
        );

    }
);


// ==================================================
// HTML 安全處理
// ==================================================

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


// ==================================================
// 後台頁面切換
// ==================================================

const pageItems =
    document.querySelectorAll(
        ".menu li"
    );


const pageSections =
    document.querySelectorAll(
        ".page-section"
    );


function showPage(pageName) {

    pageSections.forEach(
        section => {

            if (
                section.dataset.pageContent ===
                pageName
            ) {

                section.style.display =
                    "";

            }
            else {

                section.style.display =
                    "none";

            }

        }
    );


    pageItems.forEach(
        item => {

            item.classList.toggle(
                "active",
                item.dataset.page ===
                pageName
            );

        }
    );

}


// ==================================================
// 左側選單點擊
// ==================================================

pageItems.forEach(
    item => {

        item.addEventListener(
            "click",
            () => {

                const page =
                    item.dataset.page;


                if (
                    page === "dashboard" ||
                    page === "members" ||
                    page === "tasks" ||
                    page === "payments" ||
                    page === "deposit"
                ) {

                    showPage(
                        page
                    );

                }

            }
        );

    }
);


// ==================================================
// 預設顯示 Dashboard
// ==================================================

showPage(
    "dashboard"
);


console.log(
    "admin2.js V10 已載入"
);
