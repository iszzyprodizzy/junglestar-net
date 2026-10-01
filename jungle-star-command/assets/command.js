/* =========================================================
   JUNGLE STAR COMMAND
   BUILD: 2026-10-01
   LAW: RECOVER → PRESERVE → ADD
========================================================= */


/* =========================================================
   SUPABASE AUTH
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


function sendToLogin(){

  if(authResolved){
    return;
  }

  authResolved = true;

  window.location.replace(
    "/jungle-star-command/login/"
  );

}


function showCommand(session){

  if(authResolved){
    return;
  }

  authResolved = true;


  const user =
    session.user;


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


  document.body.classList.add(
    "auth-ready"
  );

}


commandSupabase.auth.onAuthStateChange(
  (event,session) => {

    if(event === "SIGNED_OUT"){

      window.location.replace(
        "/jungle-star-command/login/"
      );

      return;

    }


    if(
      event === "INITIAL_SESSION" ||
      event === "SIGNED_IN" ||
      event === "TOKEN_REFRESHED"
    ){

      if(session){

        showCommand(session);

      }else{

        sendToLogin();

      }

    }

  }
);


async function signOutCommand(){

  const {
    error
  } =
    await commandSupabase
      .auth
      .signOut();


  if(error){

    alert(
      "Sign out failed. Please try again."
    );

    return;

  }


  window.location.replace(
    "/jungle-star-command/login/"
  );

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
   NAVIGATION
========================================================= */

document
  .querySelectorAll(
    ".nav-group-button"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();


          const group =
            button.closest(
              ".nav-group"
            );


          const alreadyOpen =
            group.classList.contains(
              "open"
            );


          document
            .querySelectorAll(
              ".nav-group"
            )
            .forEach(
              item => {

                item.classList.remove(
                  "open"
                );


                const itemButton =
                  item.querySelector(
                    ".nav-group-button"
                  );


                if(itemButton){

                  itemButton.setAttribute(
                    "aria-expanded",
                    "false"
                  );

                }

              }
            );


          if(!alreadyOpen){

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
  () => {

    document
      .querySelectorAll(
        ".nav-group"
      )
      .forEach(
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
   TASK DATABASE V1
   Browser-local now.
   Supabase later.
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
   HELPERS
========================================================= */

function loadTasks(){

  try{

    return JSON.parse(
      localStorage.getItem(
        TASK_KEY
      ) || "[]"
    );

  }catch(error){

    console.error(
      "Task load failed:",
      error
    );

    return [];

  }

}


function saveTasks(tasks){

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

}


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
    formatTime(value);

}


function escapeHTML(value){

  return String(value || "")

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
   ADD TASK
========================================================= */

function addTask(){

  const titleElement =
    document.getElementById(
      "task-title"
    );


  if(!titleElement){
    return;
  }


  const title =
    titleElement
      .value
      .trim();


  if(!title){

    alert(
      "Add a task title first."
    );

    return;

  }


  const task = {

    id:
      crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()),

    title,

    status:
      document
        .getElementById(
          "task-status"
        )
        .value,

    project:
      document
        .getElementById(
          "task-project"
        )
        .value
        .trim(),

    category:
      document
        .getElementById(
          "task-category"
        )
        .value
        .trim(),

    owner:
      document
        .getElementById(
          "task-owner"
        )
        .value
        .trim(),

    due:
      document
        .getElementById(
          "task-due"
        )
        .value,

    notes:
      document
        .getElementById(
          "task-notes"
        )
        .value
        .trim(),

    created_at:
      new Date().toISOString(),

    updated_at:
      new Date().toISOString(),

    completed_at:
      null

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


function clearTaskForm(){

  [
    "task-title",
    "task-project",
    "task-category",
    "task-owner",
    "task-due",
    "task-notes"
  ]
  .forEach(
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

}


/* =========================================================
   MOVE / DELETE
========================================================= */

function moveTask(
  id,
  status
){

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


  task.status =
    status;


  task.updated_at =
    new Date().toISOString();


  task.completed_at =
    status === "done"
      ? new Date().toISOString()
      : null;


  saveTasks(
    tasks
  );


  renderTasks();

}


function deleteTask(id){

  const confirmed =
    confirm(
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
   RENDER
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

    ${
      task.notes
        ? `
        <div class="task-notes">
          ${escapeHTML(task.notes)}
        </div>
        `
        : ""
    }

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
            .toLowerCase() ===
            activeProject.toLowerCase()
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

        list.innerHTML =
          `
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
              taskHTML(task)
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
              item =>
                item.classList.remove(
                  "active"
                )
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
   CSV EXPORT
========================================================= */

function csvCell(value){

  return (
    '"' +
    String(value ?? "")
      .replaceAll(
        '"',
        '""'
      ) +
    '"'
  );

}


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


  link.click();


  URL.revokeObjectURL(
    url
  );

}


/* =========================================================
   CSV IMPORT
========================================================= */

function parseCSVLine(line){

  const result = [];

  let current = "";

  let quoted = false;


  for(
    let index = 0;
    index < line.length;
    index++
  ){

    const character =
      line[index];


    if(character === '"'){

      if(
        quoted &&
        line[index + 1] === '"'
      ){

        current += '"';

        index++;

      }else{

        quoted =
          !quoted;

      }

    }else if(
      character === "," &&
      !quoted
    ){

      result.push(
        current
      );

      current = "";

    }else{

      current +=
        character;

    }

  }


  result.push(
    current
  );


  return result;

}


async function importTasksCSV(file){

  const text =
    await file.text();


  const lines =
    text
      .split(
        /\r?\n/
      )
      .filter(
        line =>
          line.trim()
      );


  if(lines.length < 2){

    alert(
      "That CSV does not contain task rows."
    );

    return;

  }


  const headers =
    parseCSVLine(
      lines[0]
    );


  const imported = [];


  lines
    .slice(1)
    .forEach(
      line => {

        const values =
          parseCSVLine(
            line
          );


        const row = {};


        headers.forEach(
          (
            header,
            index
          ) => {

            row[header] =
              values[index] || "";

          }
        );


        imported.push({
          id:
            row.id ||
            (
              crypto.randomUUID
                ? crypto.randomUUID()
                : String(
                    Date.now() +
                    Math.random()
                  )
            ),

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
            new Date().toISOString(),

          updated_at:
            row.updated_at ||
            new Date().toISOString(),

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
    `${imported.length} tasks imported.`
  );

}


/* =========================================================
   AI HANDOFF
========================================================= */

function buildTaskHandoff(){

  const tasks =
    loadTasks();


  const output = [];


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


async function copyTasksForAI(){

  await navigator
    .clipboard
    .writeText(
      buildTaskHandoff()
    );


  alert(
    "Master task handoff copied."
  );

}


/* =========================================================
   BUTTON WIRING
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
        event
          .target
          .files[0];


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
   START
========================================================= */

updateTaskTimestamp();

renderTasks();
