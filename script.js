// Utility function to format a Date object as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Global Variables and Data
let today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

// Events stored by date (e.g., "2025-03-12")
let events = JSON.parse(localStorage.getItem('events')) || {};
// Task lists stored as an object keyed by list id.
// Each list: { id, name, starred, items: [ {desc, date, done, starred} ] }
let taskLists = JSON.parse(localStorage.getItem('taskLists')) || {};

// View state
let currentView = 'calendar'; // 'calendar' or 'tasks'
let showStarredOnly = false;   // Toggle for filtering starred items

// DOM Elements
const navCalendarBtn = document.getElementById('nav-calendar');
const navTasksBtn = document.getElementById('nav-tasks');
const toggleStarredBtn = document.getElementById('toggle-starred');

const calendarViewEl = document.getElementById('calendar-view');
const tasksViewEl = document.getElementById('tasks-view');

const monthYearEl = document.getElementById('month-year');
const calendarGridEl = document.getElementById('calendar-grid');
const addEventBtn = document.getElementById('add-event-btn');

const listsContainerEl = document.getElementById('lists-container');
const addTaskBtn = document.getElementById('add-task-btn');
const addListBtn = document.getElementById('add-list-btn');

// MODALS
const eventModal = document.getElementById('event-modal');
const eventForm = document.getElementById('event-form');
const eventDateInput = document.getElementById('event-date');
const eventStartInput = document.getElementById('event-start');
const eventEndInput = document.getElementById('event-end');
const eventDescInput = document.getElementById('event-desc');

const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const taskListSelect = document.getElementById('task-list');
const taskDateInput = document.getElementById('task-date');
const taskDescInput = document.getElementById('task-desc');
const taskStarredInput = document.getElementById('task-starred');

const newListModal = document.getElementById('new-list-modal');
const newListForm = document.getElementById('new-list-form');
const listNameInput = document.getElementById('list-name');
const listStarredInput = document.getElementById('list-starred');

// Close modal buttons (using data-close attribute)
document.querySelectorAll('.close-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const modalId = btn.getAttribute('data-close');
    document.getElementById(modalId).style.display = 'none';
  });
});
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none';
  }
});

// Easter Egg: Click header title 5 times to show a hidden message
let headerClickCount = 0;
document.getElementById('app-header').addEventListener('click', () => {
  headerClickCount++;
  if (headerClickCount === 50) {
    alert("stop clicking. bro has negative aura. an actual aura deficit my guy");
    headerClickCount = 0;
  }
});

// CALENDAR VIEW FUNCTIONS
function renderCalendarView() {
  calendarGridEl.innerHTML = '';
  monthYearEl.textContent = `${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}`;
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  // Blank cells for first week
  for (let i = 0; i < firstDayIndex; i++) {
    const blankCell = document.createElement('div');
    blankCell.className = 'day-cell';
    calendarGridEl.appendChild(blankCell);
  }
  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = formatDate(date);
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    // Day header
    const header = document.createElement('div');
    header.className = 'day-header';
    header.textContent = day;
    cell.appendChild(header);
    // Content: events and tasks (filtered if starred only)
    const content = document.createElement('div');
    content.className = 'cell-content';
    // Events
    if (events[dateStr]) {
      events[dateStr]
        .sort((a, b) => a.start.localeCompare(b.start))
        .forEach(ev => {
          if (!showStarredOnly || (showStarredOnly && ev.starred)) {
            const evDiv = document.createElement('div');
            evDiv.className = 'event-item';
            evDiv.textContent = `${ev.start}-${ev.end}: ${ev.desc}`;
            content.appendChild(evDiv);
          }
        });
    }
    // Aggregate tasks from all lists with due date equal to dateStr
    Object.values(taskLists).forEach(list => {
      list.items
        .filter(task => task.date === dateStr && !task.done)
        .forEach(task => {
          if (!showStarredOnly || (showStarredOnly && task.starred)) {
            const taskDiv = document.createElement('div');
            taskDiv.className = 'task-item';
            taskDiv.textContent = `${task.desc} [${list.name}]`;
            content.appendChild(taskDiv);
          }
        });
    });
    cell.appendChild(content);
    calendarGridEl.appendChild(cell);
  }
}

// TASKS VIEW FUNCTIONS
function renderTaskLists() {
  // Populate task list select options in task modal
  taskListSelect.innerHTML = '';
  Object.values(taskLists).forEach(list => {
    const opt = document.createElement('option');
    opt.value = list.id;
    opt.textContent = list.name;
    taskListSelect.appendChild(opt);
  });
  // Render each list as a card (filter starred if toggle is active)
  listsContainerEl.innerHTML = '';
  Object.values(taskLists)
    .filter(list => !showStarredOnly || (showStarredOnly && list.starred))
    .forEach(list => {
      const card = document.createElement('div');
      card.className = 'list-card';
      const header = document.createElement('h3');
      header.innerHTML = `${list.name} ${list.starred ? '<span class="star">&#9733;</span>' : ''}`;
      // Add delete button for list
      const delListBtn = document.createElement('button');
      delListBtn.className = 'list-delete-btn';
      delListBtn.textContent = 'Delete List';
      delListBtn.addEventListener('click', () => {
        if (confirm(`Delete list "${list.name}"? This cannot be undone.`)) {
          delete taskLists[list.id];
          localStorage.setItem('taskLists', JSON.stringify(taskLists));
          renderTaskLists();
        }
      });
      header.appendChild(delListBtn);
      card.appendChild(header);
      // Active tasks group
      const activeGroup = document.createElement('div');
      activeGroup.className = 'task-group';
      const activeHeader = document.createElement('h4');
      activeHeader.textContent = 'Active Tasks';
      activeGroup.appendChild(activeHeader);
      const activeUl = document.createElement('ul');
      activeUl.className = 'task-list';
      list.items.filter(task => !task.done).forEach((task, idx) => {
        const li = document.createElement('li');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.index = idx;
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            li.classList.add('completed-animation');
            setTimeout(() => {
              task.done = true;
              localStorage.setItem('taskLists', JSON.stringify(taskLists));
              renderTaskLists();
            }, 500);
          }
        });
        li.appendChild(checkbox);
        const span = document.createElement('span');
        span.textContent = task.desc;
        li.appendChild(span);
        // Star toggle for task
        const starBtn = document.createElement('button');
        starBtn.className = 'star-btn';
        starBtn.textContent = task.starred ? '★' : '☆';
        starBtn.addEventListener('click', () => {
          task.starred = !task.starred;
          localStorage.setItem('taskLists', JSON.stringify(taskLists));
          renderTaskLists();
        });
        li.appendChild(starBtn);
        // Delete button for task
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.textContent = 'Delete';
        delBtn.addEventListener('click', () => {
          list.items.splice(idx, 1);
          localStorage.setItem('taskLists', JSON.stringify(taskLists));
          renderTaskLists();
        });
        li.appendChild(delBtn);
        activeUl.appendChild(li);
      });
      activeGroup.appendChild(activeUl);
      card.appendChild(activeGroup);
      // Completed tasks group
      const completedGroup = document.createElement('div');
      completedGroup.className = 'task-group';
      const completedHeader = document.createElement('h4');
      completedHeader.textContent = 'Completed Tasks';
      completedGroup.appendChild(completedHeader);
      const completedUl = document.createElement('ul');
      completedUl.className = 'task-list';
      list.items.filter(task => task.done).forEach((task, idx) => {
        const li = document.createElement('li');
        li.className = 'task-item completed';
        const span = document.createElement('span');
        span.textContent = task.desc;
        li.appendChild(span);
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.textContent = 'Delete';
        delBtn.addEventListener('click', () => {
          const index = list.items.findIndex(t => t === task);
          list.items.splice(index, 1);
          localStorage.setItem('taskLists', JSON.stringify(taskLists));
          renderTaskLists();
        });
        li.appendChild(delBtn);
        completedUl.appendChild(li);
      });
      completedGroup.appendChild(completedUl);
      card.appendChild(completedGroup);
      listsContainerEl.appendChild(card);
    });
}

// Modal Form Handling - 
// Event Form Submission
eventForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const date = eventDateInput.value;
  const start = eventStartInput.value;
  const end = eventEndInput.value;
  const desc = eventDescInput.value.trim();
  if (!date || !start || !end || !desc) {
    alert('Please fill in all fields.');
    return;
  }
  if (!events[date]) events[date] = [];
  // Optionally, you could add a starred property for events here.
  events[date].push({ start, end, desc, starred: false });
  localStorage.setItem('events', JSON.stringify(events));
  eventForm.reset();
  eventModal.style.display = 'none';
  renderCalendarView();
});

// Task Form Submission
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const listId = taskListSelect.value;
  const dueDate = taskDateInput.value;
  const desc = taskDescInput.value.trim();
  const starred = taskStarredInput.checked;
  if (!listId || !dueDate || !desc) {
    alert('Please fill in all fields.');
    return;
  }
  taskLists[listId].items.push({ desc, date: dueDate, done: false, starred });
  localStorage.setItem('taskLists', JSON.stringify(taskLists));
  taskForm.reset();
  taskModal.style.display = 'none';
  renderTaskLists();
});

// New List Form Submission
newListForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = listNameInput.value.trim();
  const starred = listStarredInput.checked;
  if (!name) {
    alert('Please provide a list name.');
    return;
  }
  const id = 'list-' + Date.now();
  taskLists[id] = { id, name, starred, items: [] };
  localStorage.setItem('taskLists', JSON.stringify(taskLists));
  newListForm.reset();
  newListModal.style.display = 'none';
  renderTaskLists();
});

// Navigation and Button Event Listeners
navCalendarBtn.addEventListener('click', () => {
  currentView = 'calendar';
  calendarViewEl.style.display = 'block';
  tasksViewEl.style.display = 'none';
  renderCalendarView();
});
navTasksBtn.addEventListener('click', () => {
  currentView = 'tasks';
  calendarViewEl.style.display = 'none';
  tasksViewEl.style.display = 'block';
  renderTaskLists();
});
document.getElementById('prev-month').addEventListener('click', () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendarView();
});
document.getElementById('next-month').addEventListener('click', () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendarView();
});
addEventBtn.addEventListener('click', () => {
  eventModal.style.display = 'block';
});
addTaskBtn.addEventListener('click', () => {
  if (Object.keys(taskLists).length === 0) {
    alert('Please add a task list first.');
    return;
  }
  taskModal.style.display = 'block';
});
addListBtn.addEventListener('click', () => {
  newListModal.style.display = 'block';
});
// Toggle starred filter (for both events and lists/tasks)
toggleStarredBtn.addEventListener('click', () => {
  showStarredOnly = !showStarredOnly;
  toggleStarredBtn.textContent = showStarredOnly ? 'Show All' : 'Show Starred';
  if (currentView === 'calendar') {
    renderCalendarView();
  } else {
    renderTaskLists();
  }
});

// Inital Render
if (currentView === 'calendar') {
  renderCalendarView();
} else {
  renderTaskLists();
}
