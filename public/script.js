document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  const addBtn = document.getElementById("addBtn");
  const darkBtn = document.getElementById("darkModeBtn");
  const spinner = document.getElementById("spinner");
  const toast = document.getElementById("toast");
  const todoList = document.getElementById("todoList");

  const confirmModal = document.getElementById("confirmModal");
  const confirmYes = document.getElementById("confirmYes");
  const confirmNo = document.getElementById("confirmNo");
  let deleteId = null;

  if (!darkBtn) return;

  darkBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
      darkBtn.innerText = "🌙 Dark Mode";
    } else {
      darkBtn.innerText = "☀️ Light Mode";
    }
  });

  addBtn.addEventListener("click", addTodo);
  if (darkBtn) {
    darkBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark");
    });
  }
  todoList.addEventListener("click", handleTodoActions);

  getTodos();

  function showToast(msg) {
    toast.innerText = msg;
    toast.style.display = "block";
    setTimeout(() => (toast.style.display = "none"), 2000);
  }

  async function addTodo() {
    const title = document.getElementById("todotitle").value.trim();
    const desc = document.getElementById("tododescription").value.trim();

    if (!title || !desc) {
      showToast("Fill all fields");
      return;
    }

    const res = await fetch("/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: "Bearer " + token, // <-- add "Bearer "
      },
      body: JSON.stringify({ title, desc, isDone: false }),
    });

    if (res.status === 401 || res.status === 400) {
      localStorage.removeItem("token");
      window.location.href = "/login.html";
      return;
    }

    showToast("Todo Added");
    document.getElementById("todotitle").value = "";
    document.getElementById("tododescription").value = "";
    getTodos();
  }

  async function getTodos() {
    spinner.style.display = "block";

    const res = await fetch("/todos", {
      headers: {
        "Content-Type": "application/json",
        authorization: "Bearer " + token,
      },
    });

    if (res.status === 401 || res.status === 400) {
      localStorage.removeItem("token");
      window.location.href = "/login.html";
      return;
    }

    const todos = await res.json();

    spinner.style.display = "none";
    todoList.innerHTML = "";

    if (!todos.length) {
      todoList.innerHTML = `<h3 style="margin-top:20px;text-align:center">No Todos To Display</h3>`;
      return;
    }

    todos.forEach((todo) => {
      const div = document.createElement("div");
      div.className = "todo-item";
      div.dataset.id = todo._id;
      div.dataset.status = todo.isDone;

      div.innerHTML = `
        <div class="todo-heading" style="color:blue;padding:4px;font-size:15px;padding-left:3px">TITLE:</div>
        <div class="todo-title" style="padding-left:3px;font-size:15px">${todo.title}</div>

        <div class="todo-heading" style="color:blue;padding:3px;font-size:15px">DESCRIPTION:</div>
        <div class="todo-desc" style="padding-left:3px">${todo.desc}</div>

        <div class="status ${todo.isDone ? "completed" : "pending"}" style="padding:3px">
          Status: ${todo.isDone ? "Completed" : "Pending"}
        </div>

        <div class="todo-actions">
          <button class="delete-btn">Delete</button>
          <button class="update-btn">${todo.isDone ? "Mark Pending" : "Mark Completed"}</button>
          <button class="edit-btn">Edit</button>
        </div>
      `;

      todoList.appendChild(div);
    });
  }

  async function handleTodoActions(e) {
    const item = e.target.closest(".todo-item");
    if (!item) return;

    const id = item.dataset.id;
    const currentStatus = item.dataset.status === "true";

    if (e.target.classList.contains("delete-btn")) {
      deleteId = id;
      confirmModal.style.display = "flex";
    }

    if (e.target.classList.contains("update-btn")) {
      await fetch(`/update/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          authorization: "Bearer " + token, // <-- add "Bearer "
        },
        body: JSON.stringify({ isDone: !currentStatus }),
      });
      showToast("Status Updated");
      getTodos();
    }

    if (e.target.classList.contains("edit-btn")) {
      enableEdit(item);
    }

    if (e.target.classList.contains("save-btn")) {
      const newTitle = item.querySelector(".edit-title").value.trim();
      const newDesc = item.querySelector(".edit-desc").value.trim();

      if (!newTitle || !newDesc) {
        showToast("Fields empty");
        return;
      }

      await fetch(`/update/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          authorization: token,
        },
        body: JSON.stringify({ title: newTitle, desc: newDesc }),
      });

      showToast("Updated");
      getTodos();
    }

    if (e.target.classList.contains("cancel-btn")) {
      getTodos();
    }
  }
  confirmYes.addEventListener("click", async () => {
    if (!deleteId) return;

    await fetch(`/delete/${deleteId}`, {
      method: "DELETE",
      headers: {
        authorization: "Bearer " + token, // <-- add "Bearer "
      },
    });

    confirmModal.style.display = "none";
    deleteId = null;
    showToast("Deleted");
    getTodos();
  });

  confirmNo.addEventListener("click", () => {
    confirmModal.style.display = "none";
    deleteId = null;
  });

  function enableEdit(item) {
    const title = item.querySelector(".todo-title").innerText;
    const desc = item.querySelector(".todo-desc").innerText;
    const status = item.querySelector(".status").innerText;

    item.innerHTML = `
      <input type="text" class="edit-title" value="${title}">
      <input type="text" class="edit-desc" value="${desc}">
      <div class="status">${status}</div>

      <div class="todo-actions">
        <button class="save-btn">Save</button>
        <button class="cancel-btn">Cancel</button>
      </div>
    `;
  }
});
