/* =========================================================
   JUNGLE STAR COMMAND
   BUILD: 2026-10-01

   LAW:
   RECOVER → PRESERVE → ADD
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  "https://xfknuiuqzihtgodnybwv.supabase.co";


const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_GEtDFPOEv3WS2vo76wBd-g_7BgGEPQG";


const commandSupabase =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth:{
        persistSession:true,
        autoRefreshToken:true,
        detectSessionInUrl:true
      }
    }
  );


let authResolved =
  false;


/* =========================================================
   AUTH DISPLAY
========================================================= */

function showCommand(session){

  const user =
    session?.user;


  if(!user){
    return;
  }


  const metadata =
    user.user_metadata || {};


  const displayName =
    metadata.full_name ||
    metadata.name ||
    user.email ||
    "Command User";


  const email =
    user.email ||
    "Authenticated";


  const firstLetter =
    displayName
      .trim()
      .charAt(0)
      .toUpperCase() || "J";


  const nameElement =
    document.getElementById(
      "account-name"
    );


  const emailElement =
    document.getElementById(
      "account-email"
    );


  const avatarElement =
    document.getElementById(
      "account-avatar"
    );


  if(nameElement){

    nameElement.textContent =
      displayName;

  }


  if(emailElement){

    emailElement.textContent =
      email;

  }


  if(avatarElement){

    avatarElement.textContent =
      firstLetter;

  }


  authResolved =
    true;

}


/* =========================================================
   SEND TO LOGIN
========================================================= */

function sendToLogin(){

  if(authResolved){
    return;
  }


  window.location.replace(
    "/jungle-star-command/login/"
  );

}


/* =========================================================
   AUTH STARTUP
========================================================= */

async function initializeCommandAuth(){

  try{

    const {
      data,
      error
    } =
      await commandSupabase
        .auth
        .getSession();


    if(error){

      console.error(
        "Command session check failed:",
        error
      );

      sendToLogin();

      return;

    }


    const session =
      data?.session;


    if(session){

      showCommand(
        session
      );

    }else{

      sendToLogin();

    }

  }catch(error){

    console.error(
      "Command auth startup crashed:",
      error
    );


    sendToLogin();

  }

}


/* =========================================================
   AUTH CHANGE LISTENER
========================================================= */

commandSupabase.auth.onAuthStateChange(
  (
    event,
    session
  ) => {

    if(
      event === "SIGNED_OUT"
    ){

      window.location.replace(
        "/jungle-star-command/login/"
      );

      return;

    }


    if(
      session &&
      (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "INITIAL_SESSION"
      )
    ){

      showCommand(
        session
      );

    }

  }
);


/* =========================================================
   SIGN OUT
========================================================= */

async function signOutCommand(){

  try{

    const {
      error
    } =
      await commandSupabase
        .auth
        .signOut();


    if(error){

      console.error(
        "Command sign out failed:",
        error
      );


      alert(
        "Sign out failed. Please try again."
      );


      return;

    }


    window.location.replace(
      "/jungle-star-command/login/"
    );

  }catch(error){

    console.error(
      "Command sign out crashed:",
      error
    );


    alert(
      "Sign out failed. Please try again."
    );

  }

}


const signOutButton =
  document.getElementById(
    "command-sign-out"
  );


if(signOutButton){

  signOutButton.addEventListener(
    "click",
    signOutCommand
  );

}


/* =========================================================
   DEPARTMENT MENU
========================================================= */

const navGroups =
  document.querySelectorAll(
    ".nav-group"
  );


function closeAllMenus(){

  navGroups.forEach(
    group => {

      group.classList.remove(
        "open"
      );


      const button =
        group.querySelector(
          ".nav-group-button"
        );


      if(button){

        button.setAttribute(
          "aria-expanded",
          "false"
        );

      }

    }
  );

}


document
  .querySelectorAll(
    ".nav-group-button"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        event => {

          event.preventDefault();

          event.stopPropagation();


          const group =
            button.closest(
              ".nav-group"
            );


          if(!group){
            return;
          }


          const shouldOpen =
            !group.classList.contains(
              "open"
            );


          closeAllMenus();


          if(shouldOpen){

            group.classList.add(
              "open"
            );


            button.setAttribute(
              "aria-expanded",
              "true"
            );

          }

        }
      );

    }
  );


document.addEventListener(
  "click",
  event => {

    if(
      !event.target.closest(
        ".nav-group"
      )
    ){

      closeAllMenus();

    }

  }
);


/* =========================================================
   TIME
========================================================= */

function formatTime(value){

  const date =
    value instanceof Date
      ? value
      : new Date(value);


  return new Intl.DateTimeFormat(
    "en-US",
    {
      dateStyle:"medium",
      timeStyle:"short"
    }
  ).format(date);

}


const pageOpened =
  document.getElementById(
    "page-opened"
  );


if(pageOpened){

  pageOpened.textContent =
    "PAGE OPENED: " +
    formatTime(
      new Date()
    );

}


/* =========================================================
   TASK STORAGE
========================================================= */

const TASK_KEY =
  "jungle_star_command_master_tasks_v2";


const TASK_UPDATED_KEY =
  "jungle_star_command_master_tasks_updated_v2";


const STATUSES = [
  "today",
  "next",
  "later",
  "waiting",
  "done"
];


let activeProject =
  "";


/* =========================================================
   LOAD TASKS
========================================================= */

function loadTasks(){

  try{

    const raw =
      localStorage.getItem(
        TASK_KEY
      );


    if(!raw){

      return [];

    }


    const parsed =
      JSON.parse(
        raw
      );


    return Array.isArray(parsed)
      ? parsed
      : [];

  }catch(error){

    console.error(
      "Task load failed:",
      error
    );


    return [];

  }

}


/* =========================================================
   SAVE TASKS
========================================================= */

function saveTasks(tasks){

  try{

    localStorage.setItem(
      TASK_KEY,
      JSON.stringify(tasks)
    );


    const timestamp =
      new Date().toISOString();


    localStorage.setItem(
      TASK_UPDATED_KEY,
      timestamp
    );


    updateTaskTimestamp();

  }catch(error){

    console.error(
      "Task save failed:",
      error
    );


    alert(
      "Task save failed in this browser."
    );

  }

}


/* =========================================================
   TASK TIMESTAMP
========================================================= */

function updateTaskTimestamp(){

  const element =
    document.getElementById(
      "task-updated"
    );


  if(!element){
    return;
  }


  const value =
    localStorage.getItem(
      TASK_UPDATED_KEY
    );


  if(!value){

    element.textContent =
      "TASK DATA UPDATED: NO CHANGES YET";

    return;

  }


  element.textContent =
    "TASK DATA UPDATED: " +
    formatTime(
      value
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value){

  return String(
    value ?? ""
  )

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


/* =========================================================
   NEW ID
========================================================= */

function makeTaskId(){

  if(
    window.crypto &&
    typeof window.crypto.randomUUID === "function"
  ){

    return window.crypto.randomUUID();

  }


  return (
    "task-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(16)
      .slice(2)
  );

}


/* =========================================================
   ADD TASK
========================================================= */

function addTask(){

  const titleElement =
    document.getElementById(
      "task-title"
    );


  const statusElement =
    document.getElementById(
      "task-status"
    );


  const projectElement =
    document.getElementById(
      "task-project"
    );


  const categoryElement =
    document.getElementById(
      "task-category"
    );


  const ownerElement =
    document.getElementById(
      "task-owner"
    );


  const dueElement =
    document.getElementById(
      "task-due"
    );


  const notesElement =
    document.getElementById(
      "task-notes"
    );


  if(
    !titleElement ||
    !statusElement
  ){

    return;

  }


  const title =
    titleElement.value.trim();


  if(!title){

    alert(
      "Add a task title first."
    );

    titleElement.focus();

    return;

  }


  const now =
    new Date().toISOString();


  const task = {

    id:
      makeTaskId(),

    title,

    status:
      statusElement.value,

    project:
      projectElement
        ? projectElement.value.trim()
        : "",

    category:
      categoryElement
        ? categoryElement.value.trim()
        : "",

    owner:
      ownerElement
        ? ownerElement.value.trim()
        : "",

    due:
      dueElement
        ? dueElement.value
        : "",

    notes:
      notesElement
        ? notesElement.value.trim()
        : "",

    created_at:
      now,

    updated_at:
      now,

    completed_at:
      statusElement.value === "done"
        ? now
        : null

  };


  const tasks =
    loadTasks();


  tasks.unshift(
    task
  );


  saveTasks(
    tasks
  );


  clearTaskForm();

  renderTasks();

}


/* =========================================================
   CLEAR FORM
========================================================= */

function clearTaskForm(){

  const ids = [
    "task-title",
    "task-project",
    "task-category",
    "task-owner",
    "task-due",
    "task-notes"
  ];


  ids.forEach(
    id => {

      const element =
        document.getElementById(
          id
        );


      if(element){

        element.value =
          "";

      }

    }
  );


  const titleElement =
    document.getElementById(
      "task-title"
    );


  if(titleElement){

    titleElement.focus();

  }

}


/* =========================================================
   MOVE TASK
========================================================= */

function moveTask(
  id,
  status
){

  if(
    !STATUSES.includes(
      status
    )
  ){

    return;

  }


  const tasks =
    loadTasks();


  const task =
    tasks.find(
      item =>
        item.id === id
    );


  if(!task){
    return;
  }


  const now =
    new Date().toISOString();


  task.status =
    status;


  task.updated_at =
    now;


  task.completed_at =
    status === "done"
      ? now
      : null;


  saveTasks(
    tasks
  );


  renderTasks();

}


/* =========================================================
   DELETE TASK
========================================================= */

function deleteTask(id){

  const confirmed =
    window.confirm(
      "Delete this task?"
    );


  if(!confirmed){
    return;
  }


  const tasks =
    loadTasks()
      .filter(
        item =>
          item.id !== id
      );


  saveTasks(
    tasks
  );


  renderTasks();

}


/* =========================================================
   TASK HTML
========================================================= */

function taskHTML(task){

  const project =
    task.project
      ? `
        <span class="task-tag">
          ${escapeHTML(task.project)}
        </span>
      `
      : "";


  const category =
    task.category
      ? `
        <span class="task-tag">
          ${escapeHTML(task.category)}
        </span>
      `
      : "";


  const owner =
    task.owner
      ? `
        <span class="task-tag">
          ${escapeHTML(task.owner)}
        </span>
      `
      : "";


  const due =
    task.due
      ? `
        <span class="task-tag">
          Due ${escapeHTML(task.due)}
        </span>
      `
      : "";


  const notes =
    task.notes
      ? `
        <div class="task-notes">
          ${escapeHTML(task.notes)}
        </div>
      `
      : "";


  return `

  <article class="task-card">

    <div class="task-name">
      ${escapeHTML(task.title)}
    </div>

    <div class="task-meta">

      ${project}
      ${category}
      ${owner}
      ${due}

    </div>

    ${notes}

    <div class="task-actions">

      <button
        type="button"
        onclick="moveTask('${task.id}','today')"
      >
        Today
      </button>

      <button
        type="button"
        onclick="moveTask('${task.id}','next')"
      >
        Next
      </button>

      <button
        type="button"
        onclick="moveTask('${task.id}','later')"
      >
        Later
      </button>

      <button
        type="button"
        onclick="moveTask('${task.id}','waiting')"
      >
        Waiting
      </button>

      <button
        type="button"
        onclick="moveTask('${task.id}','done')"
      >
        Done
      </button>

      <button
        type="button"
        onclick="deleteTask('${task.id}')"
      >
        Delete
      </button>

    </div>

  </article>

  `;

}


/* =========================================================
   RENDER TASKS
========================================================= */

function renderTasks(){

  const allTasks =
    loadTasks();


  const visibleTasks =
    activeProject
      ? allTasks.filter(
          task =>
            String(
              task.project || ""
            )
            .trim()
            .toLowerCase() ===
            activeProject
              .trim()
              .toLowerCase()
        )
      : allTasks;


  STATUSES.forEach(
    status => {

      const list =
        document.getElementById(
          "list-" + status
        );


      const count =
        document.getElementById(
          "count-" + status
        );


      if(
        !list ||
        !count
      ){

        return;

      }


      const matching =
        visibleTasks.filter(
          task =>
            task.status === status
        );


      count.textContent =
        matching.length;


      if(!matching.length){

        list.innerHTML = `
          <div class="task-empty">
            Nothing here.
          </div>
        `;


        return;

      }


      list.innerHTML =
        matching
          .map(
            task =>
              taskHTML(
                task
              )
          )
          .join("");

    }
  );

}


/* =========================================================
   PROJECT FILTERS
========================================================= */

document
  .querySelectorAll(
    ".project-filter"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".project-filter"
            )
            .forEach(
              item => {

                item.classList.remove(
                  "active"
                );

              }
            );


          button.classList.add(
            "active"
          );


          activeProject =
            button.dataset.project || "";


          renderTasks();

        }
      );

    }
  );


/* =========================================================
   CSV CELL
========================================================= */

function csvCell(value){

  return (
    '"' +
    String(
      value ?? ""
    )
      .replaceAll(
        '"',
        '""'
      ) +
    '"'
  );

}


/* =========================================================
   CSV EXPORT
========================================================= */

function exportTasksCSV(){

  const tasks =
    loadTasks();


  const columns = [

    "id",
    "title",
    "status",
    "project",
    "category",
    "owner",
    "due",
    "notes",
    "created_at",
    "updated_at",
    "completed_at"

  ];


  const rows = [
    columns
  ];


  tasks.forEach(
    task => {

      rows.push(
        columns.map(
          column =>
            task[column] ?? ""
        )
      );

    }
  );


  const csv =
    rows
      .map(
        row =>
          row
            .map(
              csvCell
            )
            .join(",")
      )
      .join("\n");


  const blob =
    new Blob(
      [csv],
      {
        type:
          "text/csv;charset=utf-8"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      "a"
    );


  link.href =
    url;


  link.download =
    "jungle-star-command-master-tasks.csv";


  document.body.appendChild(
    link
  );


  link.click();


  link.remove();


  URL.revokeObjectURL(
    url
  );

}


/* =========================================================
   FULL CSV PARSER
========================================================= */

function parseCSV(text){

  const rows = [];

  let row = [];

  let field = "";

  let insideQuotes =
    false;


  for(
    let index = 0;
    index < text.length;
    index++
  ){

    const character =
      text[index];


    const nextCharacter =
      text[index + 1];


    if(
      character === '"' &&
      insideQuotes &&
      nextCharacter === '"'
    ){

      field += '"';

      index++;

      continue;

    }


    if(character === '"'){

      insideQuotes =
        !insideQuotes;

      continue;

    }


    if(
      character === "," &&
      !insideQuotes
    ){

      row.push(
        field
      );

      field =
        "";

      continue;

    }


    if(
      (
        character === "\n" ||
        character === "\r"
      ) &&
      !insideQuotes
    ){

      if(
        character === "\r" &&
        nextCharacter === "\n"
      ){

        index++;

      }


      row.push(
        field
      );


      field =
        "";


      if(
        row.some(
          value =>
            String(value).trim() !== ""
        )
      ){

        rows.push(
          row
        );

      }


      row =
        [];


      continue;

    }


    field +=
      character;

  }


  if(
    field !== "" ||
    row.length
  ){

    row.push(
      field
    );


    if(
      row.some(
        value =>
          String(value).trim() !== ""
      )
    ){

      rows.push(
        row
      );

    }

  }


  return rows;

}


/* =========================================================
   CSV IMPORT
========================================================= */

async function importTasksCSV(file){

  try{

    const text =
      await file.text();


    const rows =
      parseCSV(
        text
      );


    if(rows.length < 2){

      alert(
        "That CSV does not contain task rows."
      );

      return;

    }


    const headers =
      rows[0].map(
        value =>
          String(value).trim()
      );


    const imported =
      [];


    rows
      .slice(1)
      .forEach(
        values => {

          const row =
            {};


          headers.forEach(
            (
              header,
              index
            ) => {

              row[header] =
                values[index] ?? "";

            }
          );


          if(
            !String(
              row.title || ""
            ).trim()
          ){

            return;

          }


          const now =
            new Date().toISOString();


          imported.push({

            id:
              row.id ||
              makeTaskId(),

            title:
              row.title || "",

            status:
              STATUSES.includes(
                row.status
              )
                ? row.status
                : "later",

            project:
              row.project || "",

            category:
              row.category || "",

            owner:
              row.owner || "",

            due:
              row.due || "",

            notes:
              row.notes || "",

            created_at:
              row.created_at ||
              now,

            updated_at:
              row.updated_at ||
              now,

            completed_at:
              row.completed_at ||
              null

          });

        }
      );


    const current =
      loadTasks();


    saveTasks(
      [
        ...imported,
        ...current
      ]
    );


    renderTasks();


    alert(
      imported.length +
      " tasks imported."
    );

  }catch(error){

    console.error(
      "CSV import failed:",
      error
    );


    alert(
      "CSV import failed."
    );

  }

}


/* =========================================================
   AI HANDOFF
========================================================= */

function buildTaskHandoff(){

  const tasks =
    loadTasks();


  const output =
    [];


  output.push(
    "JUNGLE STAR COMMAND — MASTER TASK HANDOFF"
  );


  output.push(
    "Generated: " +
    formatTime(
      new Date()
    )
  );


  output.push("");


  STATUSES.forEach(
    status => {

      output.push(
        status.toUpperCase()
      );


      const matching =
        tasks.filter(
          task =>
            task.status === status
        );


      if(!matching.length){

        output.push(
          "- None"
        );

      }else{

        matching.forEach(
          task => {

            let line =
              "- " +
              task.title;


            if(task.project){

              line +=
                " | Project: " +
                task.project;

            }


            if(task.category){

              line +=
                " | Category: " +
                task.category;

            }


            if(task.owner){

              line +=
                " | Owner: " +
                task.owner;

            }


            if(task.due){

              line +=
                " | Due: " +
                task.due;

            }


            output.push(
              line
            );


            if(task.notes){

              output.push(
                "  Notes: " +
                task.notes
              );

            }

          }
        );

      }


      output.push("");

    }
  );


  return output.join(
    "\n"
  );

}


/* =========================================================
   COPY HANDOFF
========================================================= */

async function copyTasksForAI(){

  try{

    const text =
      buildTaskHandoff();


    if(
      navigator.clipboard &&
      navigator.clipboard.writeText
    ){

      await navigator
        .clipboard
        .writeText(
          text
        );


      alert(
        "Master task handoff copied."
      );


      return;

    }


    const textarea =
      document.createElement(
        "textarea"
      );


    textarea.value =
      text;


    document.body.appendChild(
      textarea
    );


    textarea.select();


    document.execCommand(
      "copy"
    );


    textarea.remove();


    alert(
      "Master task handoff copied."
    );

  }catch(error){

    console.error(
      "Copy failed:",
      error
    );


    alert(
      "Copy failed."
    );

  }

}


/* =========================================================
   BUTTONS
========================================================= */

const addTaskButton =
  document.getElementById(
    "add-task"
  );


if(addTaskButton){

  addTaskButton.addEventListener(
    "click",
    addTask
  );

}


const exportButton =
  document.getElementById(
    "export-csv"
  );


if(exportButton){

  exportButton.addEventListener(
    "click",
    exportTasksCSV
  );

}


const copyButton =
  document.getElementById(
    "copy-tasks"
  );


if(copyButton){

  copyButton.addEventListener(
    "click",
    copyTasksForAI
  );

}


const importInput =
  document.getElementById(
    "import-csv"
  );


if(importInput){

  importInput.addEventListener(
    "change",
    event => {

      const file =
        event.target.files?.[0];


      if(file){

        importTasksCSV(
          file
        );

      }


      event.target.value =
        "";

    }
  );

}


/* =========================================================
   ENTER ADDS TASK
========================================================= */

const taskTitle =
  document.getElementById(
    "task-title"
  );


if(taskTitle){

  taskTitle.addEventListener(
    "keydown",
    event => {

      if(
        event.key === "Enter"
      ){

        event.preventDefault();

        addTask();

      }

    }
  );

}


/* =========================================================
   MAKE INLINE TASK BUTTONS AVAILABLE
========================================================= */

window.moveTask =
  moveTask;


window.deleteTask =
  deleteTask;


/* =========================================================
   START
========================================================= */

updateTaskTimestamp();

renderTasks();

initializeCommandAuth();
