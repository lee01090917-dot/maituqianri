import {
    db
} from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ==========================================
// DOM
// ==========================================

const taskList =
    document.getElementById("taskList");

const taskModal =
    document.getElementById("taskModal");

const addTaskBtn =
    document.getElementById("addTask");

const closeTaskModal =
    document.getElementById("closeTaskModal");


// ==========================================
// 載入待辦
// ==========================================

async function loadTasks() {

    if (!taskList) return;

    taskList.innerHTML = "";

    try {

        const taskQuery = query(
            collection(db, "adminTasks"),
            orderBy("createdAt", "desc")
        );

        const snapshot =
            await getDocs(taskQuery);

        if (snapshot.empty) {

            renderEmpty();

            return;

        }

        snapshot.forEach(taskDoc => {

            const task =
                taskDoc.data();

            renderTask(
                taskDoc.id,
                task
            );

        });

    } catch (error) {

        console.error(
            "待辦載入失敗：",
            error
        );

        renderEmpty();

    }

}


// ==========================================
// 空白狀態
// ==========================================

function renderEmpty() {

    taskList.innerHTML = `

        <div class="task-empty">

            <span>✨</span>

            <div>

                <strong>
                    目前沒有待辦事項
                </strong>

                <p>
                    點右上角 ＋ 新增第一個待辦
                </p>

            </div>

        </div>

    `;

}


// ==========================================
// 顯示待辦
// ==========================================

function renderTask(id, task) {

    const item =
        document.createElement("div");

    item.className =
        "task-item";

    if (task.completed) {

        item.classList.add(
            "completed"
        );

    }


    const priorityClass =
        task.priority === "高"
            ? "high"
            : task.priority === "低"
                ? "low"
                : "medium";


    const assignee =
        task.assignee || "未指定";


    item.innerHTML = `

        <input
            type="checkbox"
            class="task-checkbox"
            ${task.completed ? "checked" : ""}
        >


        <div class="task-content">

            <div class="task-title">

                ${escapeHTML(
                    task.title || "-"
                )}

            </div>


            <div class="task-meta">

                <span class="task-priority ${priorityClass}">

                    ${escapeHTML(
                        task.priority || "中"
                    )}

                </span>


                ${
                    task.dueDate
                        ? `
                            <span>
                                📅 ${escapeHTML(
                                    task.dueDate
                                )}
                            </span>
                          `
                        : ""
                }


                <span class="task-assignee">

                    ${
                        assignee === "精靈"
                            ? "🧚"
                            : assignee === "神燈"
                                ? "🧞"
                                : "👤"
                    }

                    ${escapeHTML(assignee)}

                </span>

            </div>

        </div>


        <button
            type="button"
            class="task-delete"
            title="刪除待辦">

            🗑️

        </button>

    `;


    // ==========================================
    // 完成 / 取消完成
    // ==========================================

    const checkbox =
        item.querySelector(
            ".task-checkbox"
        );


    checkbox.addEventListener(
        "change",
        async () => {

            try {

                await updateDoc(
                    doc(
                        db,
                        "adminTasks",
                        id
                    ),
                    {

                        completed:
                            checkbox.checked,

                        updatedAt:
                            serverTimestamp()

                    }
                );


                item.classList.toggle(
                    "completed",
                    checkbox.checked
                );

            } catch (error) {

                console.error(
                    "更新待辦失敗：",
                    error
                );

                checkbox.checked =
                    !checkbox.checked;

            }

        }
    );


    // ==========================================
    // 刪除
    // ==========================================

    const deleteBtn =
        item.querySelector(
            ".task-delete"
        );


    deleteBtn.addEventListener(
        "click",
        async () => {

            const confirmed =
                confirm(
                    "確定要刪除這個待辦事項嗎？"
                );


            if (!confirmed) return;


            try {

                await deleteDoc(
                    doc(
                        db,
                        "adminTasks",
                        id
                    )
                );


                item.remove();


                if (
                    !taskList.querySelector(
                        ".task-item"
                    )
                ) {

                    renderEmpty();

                }

            } catch (error) {

                console.error(
                    "刪除待辦失敗：",
                    error
                );

                alert(
                    "刪除失敗，請稍後再試。"
                );

            }

        }
    );


    taskList.appendChild(item);

}


// ==========================================
// 開啟新增待辦
// ==========================================

addTaskBtn?.addEventListener(
    "click",
    () => {

        taskModal?.classList.remove(
            "hidden"
        );

        renderTaskForm();

    }
);


// ==========================================
// 關閉新增待辦
// ==========================================

closeTaskModal?.addEventListener(
    "click",
    () => {

        taskModal?.classList.add(
            "hidden"
        );

    }
);


// ==========================================
// 新增待辦表單
// ==========================================

function renderTaskForm() {

    const modalBody =
        taskModal?.querySelector(
            ".modal-body"
        );

    const modalFooter =
        taskModal?.querySelector(
            ".modal-footer"
        );


    if (!modalBody) return;


    modalBody.innerHTML = `

        <div class="task-form">


            <!-- 待辦內容 -->

            <label>

                待辦內容

                <input
                    id="taskTitleInput"
                    type="text"
                    placeholder="例如：確認 ATEEZ 飯拍圖款項"
                >

            </label>


            <!-- 優先程度 -->

            <label>

                優先程度

                <select
                    id="taskPriorityInput">

                    <option value="高">
                        🔴 高
                    </option>

                    <option
                        value="中"
                        selected>

                        🟡 中

                    </option>

                    <option value="低">

                        🟢 低

                    </option>

                </select>

            </label>


            <!-- 截止日期 -->

            <label>

                截止日期

                <input
                    id="taskDueDateInput"
                    type="date"
                >

            </label>


            <!-- 負責人 -->

            <label>

                負責人

                <select
                    id="taskAssigneeInput">

                    <option value="精靈">

                        🧚 精靈

                    </option>

                    <option value="神燈">

                        🧞 神燈

                    </option>

                </select>

            </label>


        </div>

    `;


    if (!modalFooter) return;


    modalFooter.innerHTML = `

        <button
            type="button"
            class="btn-secondary"
            id="cancelTaskBtn">

            取消

        </button>


        <button
            type="button"
            class="btn-primary"
            id="saveTaskBtn">

            新增

        </button>

    `;


    document
        .getElementById("cancelTaskBtn")
        ?.addEventListener(
            "click",
            () => {

                taskModal?.classList.add(
                    "hidden"
                );

            }
        );


    document
        .getElementById("saveTaskBtn")
        ?.addEventListener(
            "click",
            saveTask
        );


    document
        .getElementById("taskTitleInput")
        ?.focus();

}


// ==========================================
// 儲存待辦
// ==========================================

async function saveTask() {

    const titleInput =
        document.getElementById(
            "taskTitleInput"
        );

    const priorityInput =
        document.getElementById(
            "taskPriorityInput"
        );

    const dueDateInput =
        document.getElementById(
            "taskDueDateInput"
        );

    const assigneeInput =
        document.getElementById(
            "taskAssigneeInput"
        );


    const title =
        titleInput?.value.trim();


    if (!title) {

        alert(
            "請先輸入待辦內容。"
        );

        titleInput?.focus();

        return;

    }


    const saveBtn =
        document.getElementById(
            "saveTaskBtn"
        );


    if (saveBtn) {

        saveBtn.disabled =
            true;

        saveBtn.textContent =
            "儲存中…";

    }


    try {

        await addDoc(
            collection(
                db,
                "adminTasks"
            ),
            {

                title,

                priority:
                    priorityInput?.value ||
                    "中",

                dueDate:
                    dueDateInput?.value ||
                    "",

                assignee:
                    assigneeInput?.value ||
                    "精靈",

                completed:false,

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            }
        );


        taskModal?.classList.add(
            "hidden"
        );


        await loadTasks();


    } catch (error) {

        console.error(
            "新增待辦失敗：",
            error
        );

        alert(
            "新增失敗，請稍後再試。"
        );


    } finally {

        if (saveBtn) {

            saveBtn.disabled =
                false;

            saveBtn.textContent =
                "新增";

        }

    }

}


// ==========================================
// HTML 安全處理
// ==========================================

function escapeHTML(value) {

    return String(value ?? "")

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


// ==========================================
// 啟動
// ==========================================

loadTasks();

console.log(
    "admin2-task.js V2 已載入"
);
