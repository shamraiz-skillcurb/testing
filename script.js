// Task Data
let tasks = [];

// Load tasks from localStorage
function loadTasks() {
  const storedTasks = localStorage.getItem('tasks');
  if (storedTasks) {
    tasks = JSON.parse(storedTasks);
  }
  renderTasks();
}

// Save tasks to localStorage
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  // Re-render calendar whenever tasks are saved to reflect changes in highlighting
  // Ensure currentCalendarDate is accessible and renderCalendar is defined
  if (typeof renderCalendar === 'function' && typeof currentCalendarDate !== 'undefined') {
    renderCalendar(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
  }
}

// Render Task List
function renderTasks() {
  const taskList = document.getElementById('taskList');
  taskList.innerHTML = ''; // Clear existing tasks

  tasks.forEach(task => {
    const listItem = document.createElement('li');

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => {
      task.completed = checkbox.checked;
      if (task.completed) {
        listItem.classList.add('task-item-completed');
      } else {
        listItem.classList.remove('task-item-completed');
      }
      saveTasks();
      // Re-render is heavy for just a class change; strikethrough is handled by renderTasks.
      // If renderTasks is not called, ensure strikethrough logic is duplicated or handled via CSS.
      // For now, renderTasks will re-apply everything, including the class, which is fine.
      renderTasks(); 
    });
    listItem.appendChild(checkbox);

    // Task text
    const taskText = document.createElement('span');
    taskText.textContent = task.text;
    // Apply strikethrough to listItem if completed, so it covers the date too
    // Also add/remove task-item-completed class based on initial state
    if (task.completed) {
      listItem.style.textDecoration = 'line-through';
      listItem.classList.add('task-item-completed');
    } else {
      listItem.style.textDecoration = 'none'; // Ensure it's removed if un-checked
      listItem.classList.remove('task-item-completed');
    }
    listItem.appendChild(taskText);

    // Due Date Display
    if (task.dueDate) {
      const dueDateSpan = document.createElement('span');
      dueDateSpan.textContent = ` (Due: ${task.dueDate})`;
      dueDateSpan.style.fontSize = '0.9em'; // Slightly smaller text
      dueDateSpan.style.marginLeft = '8px'; // Space it out
      listItem.appendChild(dueDateSpan);
    }

    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
      listItem.classList.add('task-item-exit-active');
      listItem.addEventListener('animationend', () => {
        // Ensure this task object is the one we want to remove.
        // It's captured by the closure of the forEach loop.
        tasks = tasks.filter(t => t.id !== task.id);
        saveTasks(); // This will re-render calendar, which is fine.
        listItem.remove(); // Remove the specific list item from DOM
        // No full renderTasks() here to preserve animation for other items.
      }, { once: true });
    });
    listItem.appendChild(deleteButton);

    // Note: Enter animation for existing tasks on full render is not applied here.
    // This is typically desired, as only newly added tasks should animate in.
    taskList.appendChild(listItem);
  });
}

// Function to create a task list item (used by both renderTasks and addTask)
// This reduces code duplication for creating the LI structure and its event listeners.
function createTaskListItem(task) {
  const listItem = document.createElement('li');

  // Checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.completed;
  checkbox.addEventListener('change', () => {
    task.completed = checkbox.checked;
    if (task.completed) {
      listItem.classList.add('task-item-completed');
      listItem.style.textDecoration = 'line-through';
    } else {
      listItem.classList.remove('task-item-completed');
      listItem.style.textDecoration = 'none';
    }
    // Update the task in the main tasks array (important if task object is a copy)
    const taskInArray = tasks.find(t => t.id === task.id);
    if (taskInArray) taskInArray.completed = task.completed;
    
    saveTasks(); // This will re-render calendar and potentially full task list if not careful.
                 // For now, we assume saveTasks() + subsequent renders are handled.
                 // If renderTasks() is called by saveTasks() or an event, it might negate item-specific updates.
                 // The ideal here is that saveTasks only saves and re-renders calendar.
                 // The list item style is updated directly.
  });
  listItem.appendChild(checkbox);

  // Task text
  const taskTextSpan = document.createElement('span');
  taskTextSpan.textContent = task.text;
  listItem.appendChild(taskTextSpan);

  // Due Date Display
  if (task.dueDate) {
    const dueDateSpan = document.createElement('span');
    dueDateSpan.textContent = ` (Due: ${task.dueDate})`;
    dueDateSpan.style.fontSize = '0.9em';
    dueDateSpan.style.marginLeft = '8px';
    listItem.appendChild(dueDateSpan);
  }

  // Apply initial completed state styling
  if (task.completed) {
    listItem.classList.add('task-item-completed');
    listItem.style.textDecoration = 'line-through';
  } else {
    listItem.style.textDecoration = 'none';
  }

  // Delete button
  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Delete';
  deleteButton.addEventListener('click', () => {
    listItem.classList.add('task-item-exit-active');
    listItem.addEventListener('animationend', () => {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      listItem.remove();
    }, { once: true });
  });
  listItem.appendChild(deleteButton);

  return listItem;
}

// Re-write renderTasks to use createTaskListItem
function renderTasks() {
  const taskList = document.getElementById('taskList');
  taskList.innerHTML = ''; // Clear existing tasks
  tasks.forEach(task => {
    const listItem = createTaskListItem(task); // Use the helper
    taskList.appendChild(listItem);
  });
}


// Add Task
document.addEventListener('DOMContentLoaded', () => {
  const taskInput = document.getElementById('taskInput');
  const taskDateInput = document.getElementById('taskDateInput');
  const addTaskBtn = document.getElementById('addTaskBtn');

  addTaskBtn.addEventListener('click', () => {
    const text = taskInput.value.trim();
    const dueDate = taskDateInput.value;
    if (text) {
      const newTask = {
        id: Date.now(),
        text: text,
        completed: false,
        dueDate: dueDate
      };
      tasks.push(newTask);
      saveTasks(); // Save data (this also updates calendar)

      // Create and animate the new list item
      const listItem = createTaskListItem(newTask); // Use the helper
      listItem.classList.add('task-item-enter-active'); // Add animation class
      
      const taskList = document.getElementById('taskList');
      taskList.appendChild(listItem); // Add to DOM

      listItem.addEventListener('animationend', () => {
        listItem.classList.remove('task-item-enter-active'); // Clean up class
      }, { once: true });

      taskInput.value = '';
      taskDateInput.value = '';
      taskInput.focus(); // Focus management
    }
  });

  loadTasks(); // Load tasks and render them on initial load (uses updated renderTasks)

  // Calendar State
  let currentCalendarDate = new Date();

  renderCalendar(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
});

// --- Calendar Functionality ---

function renderCalendar(year, month) {
  const calendarView = document.getElementById('calendarView');
  calendarView.innerHTML = ''; // Clear previous calendar

  const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Header: Month Year and Navigation
  const header = document.createElement('div');
  header.className = 'calendar-header';

  const prevMonthBtn = document.createElement('button');
  prevMonthBtn.textContent = '< Prev';
  prevMonthBtn.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
  });
  header.appendChild(prevMonthBtn);

  const monthYearTitle = document.createElement('h3');
  monthYearTitle.textContent = `${monthNames[month]} ${year}`;
  header.appendChild(monthYearTitle);

  const nextMonthBtn = document.createElement('button');
  nextMonthBtn.textContent = 'Next >';
  nextMonthBtn.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
  });
  header.appendChild(nextMonthBtn);
  calendarView.appendChild(header);

  // Days of the Week Row
  const daysRow = document.createElement('div');
  daysRow.className = 'calendar-days-row';
  daysOfWeek.forEach(day => {
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day-label';
    dayCell.textContent = day;
    daysRow.appendChild(dayCell);
  });
  calendarView.appendChild(daysRow);

  // Calendar Grid
  const calendarGrid = document.createElement('div');
  calendarGrid.className = 'calendar-grid';

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Add empty cells for days before the first of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-day-cell empty';
    calendarGrid.appendChild(emptyCell);
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day-cell';
    dayCell.textContent = day;

    const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Task Highlighting: Mark days with *incomplete* tasks
    const tasksOnThisDay = tasks.filter(task => task.dueDate === currentDateStr && !task.completed);
    if (tasksOnThisDay.length > 0) {
      dayCell.classList.add('has-tasks'); // Add a class for basic styling if needed
      // Add a simple visual indicator (e.g., a dot)
      const dotIndicator = document.createElement('span');
      dotIndicator.textContent = ' ●'; // Using a text character as a dot
      dotIndicator.style.color = 'red'; // Example color
      dotIndicator.style.fontSize = '0.7em'; // Make it small
      dayCell.appendChild(dotIndicator); // Append to the day number
    }

    dayCell.addEventListener('click', () => {
      displayTasksForDate(currentDateStr);
    });

    calendarGrid.appendChild(dayCell);
  }
  calendarView.appendChild(calendarGrid);
}

function displayTasksForDate(dateStr) {
  // Placeholder for displaying tasks for a selected date
  // Implementation will be added in subsequent steps
  console.log(`Tasks for ${dateStr}:`);
  const tasksOnDate = tasks.filter(task => task.dueDate === dateStr);
  const tasksForDateDiv = document.getElementById('tasksForDate');
  tasksForDateDiv.innerHTML = `<h4>Tasks for ${dateStr}:</h4>`;
  if (tasksOnDate.length === 0) {
    tasksForDateDiv.innerHTML += '<p>No tasks due on this day.</p>';
    return;
  }
  const ul = document.createElement('ul');
  tasksOnDate.forEach(task => {
    const li = document.createElement('li');
    li.textContent = task.text + (task.completed ? " (Completed)" : "");
    ul.appendChild(li);
  });
  tasksForDateDiv.appendChild(ul);
}
