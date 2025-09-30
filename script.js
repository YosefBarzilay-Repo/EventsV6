document.addEventListener('DOMContentLoaded', () => {
    const newTaskBtn = document.getElementById('newTaskBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const manageEventsBtn = document.getElementById('manageEventsBtn');
    const eventManagerModal = document.getElementById('eventManagerModal');
    const modal = document.getElementById('taskModal');
    const settingsModal = document.getElementById('settingsModal');
    const closeModalBtn = document.querySelector('.close-button');
    const taskForm = document.getElementById('taskForm');
    const taskBoard = document.getElementById('task-board');
    const pageTitleEl = document.getElementById('pageTitle');
    const modalTitle = document.getElementById('modalTitle');
    const taskIdField = document.getElementById('taskId');
    const taskIdDisplay = document.getElementById('taskIdDisplay');
    const attachmentName = document.getElementById('attachment-name');
    const attachmentInput = document.getElementById('attachment');
    const totalBudgetInput = document.getElementById('totalBudget');
    const summaryTotalEl = document.getElementById('summaryTotal');
    const summarySpentEl = document.getElementById('summarySpent');
    const summaryRemainingEl = document.getElementById('summaryRemaining');
    const budgetProgressBar = document.getElementById('budgetProgressBar'); // Now in a widget
    const tasksProgressBar = document.getElementById('tasksProgressBar');
    const daysProgressBar = document.getElementById('daysProgressBar');
    const openTasksCountEl = document.getElementById('openTasksCount');
    const eventDaysLabelEl = document.getElementById('eventDaysLabel');
    const eventDaysCountEl = document.getElementById('eventDaysCount');
    const viewModeGroup = document.getElementById('viewModeGroup');
    const searchInput = document.getElementById('searchInput');
    const filterCategorySelect = document.getElementById('filterCategory');
    const collapseAllCategoriesBtn = document.getElementById('collapseAllCategoriesBtn');
    const filterOwnerInput = document.getElementById('filterOwner');
    const dateRangePickerEl = document.getElementById('dateRangePicker');
    const currencySelect = document.getElementById('currencySelect');
    const newCategoryInput = document.getElementById('newCategoryInput');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const newUserInput = document.getElementById('newUserInput');
    const addUserBtn = document.getElementById('addUserBtn');
    const newEventNameInput = document.getElementById('newEventNameInput');
    const addEventBtn = document.getElementById('addEventBtn');
    const eventDateDisplayPickerEl = document.getElementById('eventDateDisplayPicker');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');

    // --- Mock Data Control Flag ---
    // Set to 'true' to load mock data on first run (when localStorage is empty).
    // Set to 'false' to disable this feature.
    const useMockData = true;
    let filterStartDate = null;
    let filterEndDate = null;

    // --- Event-centric Data Model ---
    let appData = JSON.parse(localStorage.getItem('appData')) || {};
    let events = appData.events || [];
    let currentEventId = appData.currentEventId || null;

    const saveAppData = () => {
        appData = { events, currentEventId };
        localStorage.setItem('appData', JSON.stringify(appData));
    };

    // --- Data Migration for existing users ---
    const migrateOldData = () => {
        const oldTasks = JSON.parse(localStorage.getItem('tasks'));
        if (oldTasks) {
            const newEvent = {
                id: Date.now(),
                name: localStorage.getItem('pageTitle') || 'My First Event',
                tasks: oldTasks,
                totalBudget: parseFloat(localStorage.getItem('totalBudget')) || 0,
                categories: JSON.parse(localStorage.getItem('categories')) || ['Work', 'Personal', 'Shopping', 'Health', 'Other'],
                users: JSON.parse(localStorage.getItem('users')) || [],
                currency: localStorage.getItem('currency') || 'EUR',
                eventDates: { start: null, end: null },
                status: 'In Progress' // Default for migrated events
            };
            events = [newEvent];
            currentEventId = newEvent.id;
            saveAppData();

            // Clean up old localStorage items
            ['tasks', 'totalBudget', 'categories', 'users', 'currency', 'pageTitle', 'eventDates'].forEach(key => localStorage.removeItem(key));
            alert("Your data has been migrated to the new multi-event format!");
        }
    };
    migrateOldData();
    // --- End Migration ---

    if (events.length === 0 && useMockData && typeof mockTasks !== 'undefined') {
        const newEvent = {
            id: Date.now(),
            name: 'My First Conference',
            tasks: mockTasks,
            totalBudget: 50000,
            categories: [...new Set(mockTasks.map(t => t.category))],
            users: [...new Set(mockTasks.map(t => t.owner))].map(name => ({ name, isActive: true })),
            currency: 'USD',
            eventDates: { start: null, end: null },
            status: 'In Progress'
        };
        events.push(newEvent);
        currentEventId = newEvent.id;
        saveAppData();
    }

    const getCurrentEvent = () => events.find(e => e.id === currentEventId);

    const loadCurrentEvent = () => {
        const event = getCurrentEvent();
        if (!event) {
            pageTitleEl.textContent = "No Event Selected";
            // Disable most of the UI
            document.querySelectorAll('button, input, select').forEach(el => {
                if (el.id !== 'manageEventsBtn') el.disabled = true;
            });
            taskBoard.innerHTML = '<p>Please create or select an event from "Manage Events".</p>';
            return;
        }

        // Re-enable UI
        document.querySelectorAll('button, input, select').forEach(el => el.disabled = false);

        pageTitleEl.textContent = event.name;
        totalBudgetInput.value = event.totalBudget > 0 ? event.totalBudget.toFixed(2) : '';
        currencySelect.value = event.currency;

        if (event.eventDates.start && event.eventDates.end) {
            eventDatePicker.setStartDate(event.eventDates.start);
            eventDatePicker.setEndDate(event.eventDates.end);
        } else {
            eventDatePicker.clearSelection();
        }

        populateAllCategoryDropdowns();
        populateOwnerDropdown();
        renderTasks();
        updateEventDaysCounter();
        updateBudgetSummary();
    };

    let tasks, totalBudget, categories, users, currency;

    const syncDataFromCurrentEvent = () => {
        const event = getCurrentEvent();
        if (event) {
            tasks = event.tasks;
            totalBudget = event.totalBudget;
            categories = event.categories;
            users = event.users;
            currency = event.currency;
        } else {
            // Reset data if no event is selected
            tasks = []; totalBudget = 0; categories = []; users = []; currency = 'USD';
        }
    };

    const switchEvent = (eventId) => {
        currentEventId = eventId;
        saveAppData();
        syncDataFromCurrentEvent();
        loadCurrentEvent();
        closeEventManagerModal();
    };

    const addEvent = () => {
        const newEventName = newEventNameInput.value.trim();
        if (newEventName) {
            const newEvent = {
                id: Date.now(),
                name: newEventName,
                tasks: [],
                totalBudget: 0,
                categories: ['General', 'Planning', 'Execution'],
                users: [],
                currency: 'USD',
                eventDates: { start: null, end: null },
                status: 'Open'
            };
            events.push(newEvent);
            newEventNameInput.value = '';
            renderEventManager();
            switchEvent(newEvent.id);
        }
    };

    const formatEventListDate = (event) => {
        if (!event.eventDates || !event.eventDates.start) {
            return 'No date set';
        }
        const formatter = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const start = formatter(event.eventDates.start);
        const end = event.eventDates.end ? formatter(event.eventDates.end) : start;
        return start === end ? start : `${start} - ${end}`;
    };

    const handleEventStatusChange = (e) => {
        const eventId = parseInt(e.target.dataset.eventId, 10);
        const newStatus = e.target.value;
        const event = events.find(ev => ev.id === eventId);
        if (event) {
            event.status = newStatus;
            saveAppData();
            // No re-render needed, UI is already updated
        }
    };

    const renderEventManager = () => {
        const list = document.getElementById('eventManagerList');
        list.innerHTML = '';
        events.forEach(event => {
            const li = document.createElement('li');
            li.className = 'category-manager-item';
            if (event.id === currentEventId) {
                li.classList.add('active-event');
            }
            li.innerHTML = `
                <span class="event-list-name">${event.name}</span>
                <span class="event-list-date">${formatEventListDate(event)}</span>
                <select class="event-status-select filter-input" data-event-id="${event.id}">
                    <option value="Open" ${event.status === 'Open' ? 'selected' : ''}>Open</option>
                    <option value="In Progress" ${event.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Done" ${event.status === 'Done' ? 'selected' : ''}>Done</option>
                    <option value="Archived" ${event.status === 'Archived' ? 'selected' : ''}>Archived</option>
                </select>
            `;
            li.querySelector('.event-list-name').addEventListener('click', () => switchEvent(event.id));
            list.appendChild(li);
        });

        list.querySelectorAll('.event-status-select').forEach(select => select.addEventListener('change', handleEventStatusChange));
    };

    const openEventManagerModal = () => {
        renderEventManager();
        eventManagerModal.style.display = 'block';
    };

    const closeEventManagerModal = () => {
        eventManagerModal.style.display = 'none';
    };

    // --- End Event Management ---

    // Set initial value for total budget input
    totalBudgetInput.value = totalBudget > 0 ? totalBudget.toFixed(2) : '';
    currencySelect.value = currency;

    const openModal = () => {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dueDate').setAttribute('min', today);
        populateTaskOwnerDropdown();
        populateAllCategoryDropdowns();
        modal.style.display = 'block';
    };

    const closeModal = () => {
        if (quill) quill.setText(''); // Clear the editor
        modal.classList.remove('show-status');
        modal.style.display = 'none';
        taskForm.reset();
        modalTitle.textContent = 'Add New Task';
        taskIdField.value = '';
        taskIdDisplay.style.display = 'none';
        attachmentName.textContent = '';
    };

    const openSettingsModal = () => {
        renderUserManager();
        renderCategoryManager();
        settingsModal.style.display = 'block';
    };

    const closeSettingsModal = () => {
        settingsModal.style.display = 'none';
    };

    const saveTasks = () => {
        const event = getCurrentEvent();
        if (event) {
            event.tasks = tasks;
            saveAppData();
        }
        updateBudgetSummary();
    };

    const saveTotalBudget = () => {
        const event = getCurrentEvent();
        if (event) {
            event.totalBudget = totalBudget;
            saveAppData();
        }
        updateBudgetSummary();
    }

    const saveCurrency = () => {
        const event = getCurrentEvent();
        if (event) {
            event.currency = currency;
            saveAppData();
        }
        updateBudgetSummary();
    }

    const saveCategories = () => {
        const event = getCurrentEvent();
        if (event) {
            event.categories = categories;
            saveAppData();
        }
        populateAllCategoryDropdowns();
    }

    const saveUsers = () => {
        const event = getCurrentEvent();
        if (event) {
            event.users = users;
            saveAppData();
        }
        populateOwnerDropdown();
    }

    const updateBudgetSummary = () => {
        if (!getCurrentEvent()) return; // Don't update if no event is selected
        const spent = tasks.reduce((sum, task) => sum + (parseFloat(task.budget) || 0), 0);
        const remaining = totalBudget - spent;

        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        });

        summaryRemainingEl.textContent = formatter.format(remaining);

        // Change color if remaining is negative
        summaryRemainingEl.style.color = remaining < 0 ? '#de350b' : '#172b4d';

        // Update Progress Bar
        const spentPercentage = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;
        budgetProgressBar.style.width = `${Math.min(spentPercentage, 100)}%`;

        budgetProgressBar.classList.remove('progress-green', 'progress-yellow', 'progress-red');
        if (spentPercentage > 90) {
            budgetProgressBar.classList.add('progress-red');
        } else if (spentPercentage > 80) {
            budgetProgressBar.classList.add('progress-yellow');
        } else {
            budgetProgressBar.classList.add('progress-green');
        }

        // Update Open Tasks Widget
        const totalTasks = tasks.length;
        const notDoneTasks = tasks.filter(task => task.status !== 'Done').length;
        openTasksCountEl.textContent = notDoneTasks;

        const completionPercentage = totalTasks > 0 ? ((totalTasks - notDoneTasks) / totalTasks) * 100 : 0;
        tasksProgressBar.style.width = `${completionPercentage}%`;
        tasksProgressBar.classList.remove('progress-green', 'progress-yellow', 'progress-red');
        if (completionPercentage === 100) {
            tasksProgressBar.classList.add('progress-green');
        } else if (completionPercentage > 50) {
            tasksProgressBar.classList.add('progress-yellow');
        } else {
            tasksProgressBar.classList.add('progress-red');
        }

        updateEventDaysCounter();
    }

    const applyFilters = () => {
        if (!getCurrentEvent()) return [];
        const searchTerm = searchInput.value.toLowerCase();
        const category = filterCategorySelect.value;
        const owner = filterOwnerInput.value.toLowerCase();

        const showArchived = (localStorage.getItem('viewMode') === 'archive');

        return tasks.filter(task => {
            const isArchivedMatch = task.isArchived === showArchived;
            const taskDueDate = new Date(task.dueDate);
            // Correctly get the start and end date instances from the picker
            const start = filterStartDate ? filterStartDate.dateInstance : null;
            const end = filterEndDate ? filterEndDate.dateInstance : null;

            const searchMatch = !searchTerm || task.title.toLowerCase().includes(searchTerm) || task.id.toString().includes(searchTerm);
            const categoryMatch = !category || task.category === category;
            const ownerMatch = !owner || task.owner.toLowerCase().includes(owner);

            // Correctly compare the task's due date with the selected range
            const startDateMatch = !start || taskDueDate >= start;
            const endDateMatch = !end || taskDueDate <= end;

            return isArchivedMatch && searchMatch && categoryMatch && ownerMatch && startDateMatch && endDateMatch;
        });
    };

    const renderKanbanView = () => {
        const statuses = ["Open", "In Progress", "Block", "Done"];
        taskBoard.className = 'task-board'; // Reset to base class for Kanban view

        const filteredTasks = applyFilters();

        const tasksByStatus = filteredTasks.reduce((acc, task) => {
            (acc[task.status] = acc[task.status] || []).push(task);
            return acc;
        }, {});

        taskBoard.innerHTML = ''; // Clear board before rendering

        statuses.forEach(status => {
            const column = document.createElement('div');
            column.className = 'status-column';
            // Only allow dropping in Kanban view
            column.dataset.status = status;

            const taskList = document.createElement('div');
            taskList.className = 'task-list';


            const columnHeader = document.createElement('div');
            columnHeader.className = 'column-header';

            const statusTitle = document.createElement('h3');
            statusTitle.textContent = status;

            const taskCounter = document.createElement('span');
            taskCounter.className = 'task-counter';
            const tasksInStatus = tasksByStatus[status] || [];
            taskCounter.textContent = tasksInStatus.length;

            columnHeader.appendChild(statusTitle);
            columnHeader.appendChild(taskCounter);
            column.appendChild(columnHeader);
            column.appendChild(taskList);

            tasksInStatus.forEach(task => {
                const taskCard = document.createElement('div');
                taskCard.className = 'task-card';
                taskCard.dataset.id = task.id;
                taskCard.draggable = true;

                // Add classes for due date urgency
                const today = new Date();
                const dueDate = new Date(task.dueDate);
                today.setHours(0, 0, 0, 0); // Normalize today
                dueDate.setHours(0, 0, 0, 0); // Normalize due date

                const oneWeekFromNow = new Date(today);
                oneWeekFromNow.setDate(today.getDate() + 7);

                if (dueDate < today) {
                    taskCard.classList.add('due-overdue');
                } else if (dueDate <= oneWeekFromNow) {
                    taskCard.classList.add('due-soon');
                }

                // Helper to strip HTML for preview
                const stripHtml = (html) => {
                    const doc = new DOMParser().parseFromString(html, 'text/html');
                    return doc.body.textContent || "";
                };

                taskCard.innerHTML = `
                    <button class="archive-task-btn" title="Archive task">&times;</button>
                    <div class="task-card-header">
                        <span class="task-category">${task.category}</span>
                        <span class="task-id">#${task.id}</span>
                    </div>
                    <h4>${task.title}</h4>
                    <p class="task-description-preview">${stripHtml(task.description)}</p>
                    <div class="task-footer">
                        <span class="task-owner">${task.owner}</span>
                        <span class="task-due-date">Due: ${task.dueDate}</span>
                    </div>
                `;

                taskCard.addEventListener('click', (e) => {
                    editTask(task.id);
                });

                // Drag and Drop Event Listeners for Task Cards
                taskCard.addEventListener('dragstart', handleDragStart);
                taskCard.addEventListener('dragend', handleDragEnd);

                taskList.appendChild(taskCard);
            });

            taskBoard.appendChild(column);
        });
        // Only add drop listeners in Kanban view
        addDropListeners();
    };

    const renderCategoryView = () => {
        taskBoard.classList.add('category-view-active');
        const filteredTasks = applyFilters();

        const tasksByCategory = filteredTasks.reduce((acc, task) => {
            (acc[task.category] = acc[task.category] || []).push(task);
            return acc;
        }, {});

        const sortedCategories = Object.keys(tasksByCategory).sort();

        taskBoard.innerHTML = ''; // Clear board before rendering

        sortedCategories.forEach(category => {
            const categoryGroup = document.createElement('div');
            categoryGroup.className = 'category-group';

            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'category-group-header';
            const totalTasksInCategory = tasksByCategory[category].length;
            const notDoneTasks = tasksByCategory[category].filter(t => t.status !== 'Done').length;
            categoryHeader.innerHTML = `
                <div class="category-title-group">
                    <h3>${category}</h3><span class="category-task-counter">${notDoneTasks} / ${totalTasksInCategory}</span>
                </div>
                <span class="collapse-icon"></span>`;

            categoryHeader.addEventListener('click', () => {
                categoryGroup.classList.toggle('collapsed');
            });

            const taskContainer = document.createElement('div');
            taskContainer.className = 'category-task-container';

            tasksByCategory[category].forEach(task => {
                const taskCard = document.createElement('div');
                taskCard.className = 'task-card list-item';
                taskCard.dataset.id = task.id;
                // Dragging is disabled in category view
                taskCard.draggable = false;

                const today = new Date();
                const dueDate = new Date(task.dueDate);
                today.setHours(0, 0, 0, 0);
                dueDate.setHours(0, 0, 0, 0);
                const oneWeekFromNow = new Date(today);
                oneWeekFromNow.setDate(today.getDate() + 7);

                if (task.status === 'Done') {
                    taskCard.classList.add('task-completed');
                } else if (dueDate < today) {
                    taskCard.classList.add('due-overdue');
                }
                else if (dueDate <= oneWeekFromNow) taskCard.classList.add('due-soon');

                const stripHtml = (html) => new DOMParser().parseFromString(html, 'text/html').body.textContent || "";

                taskCard.innerHTML = `
                    <h4>${task.title}</h4>
                    <div class="task-footer">
                        <span class="task-status">${task.status}</span>
                        <span class="task-owner">${task.owner}</span>
                        <span class="task-due-date">Due: ${task.dueDate}</span>
                    </div>
                `;

                taskCard.addEventListener('click', (e) => {
                    if (e.target.classList.contains('archive-task-btn')) return;
                    editTask(task.id);
                });
                taskContainer.appendChild(taskCard);
            });
            categoryGroup.appendChild(categoryHeader);
            categoryGroup.appendChild(taskContainer);
            taskBoard.appendChild(categoryGroup);
        });
    };

    const renderArchiveView = () => {
        taskBoard.classList.add('category-view-active'); // Use list view for archived items
        const filteredTasks = applyFilters();

        taskBoard.innerHTML = ''; // Clear board before rendering

        if (filteredTasks.length === 0) {
            taskBoard.innerHTML = '<p>No archived tasks found.</p>';
            return;
        }

        const taskContainer = document.createElement('div');
        taskContainer.className = 'category-task-container';

        filteredTasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = 'task-card';
            taskCard.dataset.id = task.id;
            taskCard.draggable = false;

            const stripHtml = (html) => new DOMParser().parseFromString(html, 'text/html').body.textContent || "";

            taskCard.innerHTML = `
                <button class="archive-task-btn" title="Restore task">&#8634;</button>
                <div class="task-card-header">
                    <span class="task-category">${task.category}</span>
                    <span class="task-id">#${task.id}</span>
                </div>
                <h4>${task.title}</h4>
                <p class="task-description-preview">${stripHtml(task.description)}</p>
                <div class="task-footer">
                    <span class="task-owner">${task.owner}</span>
                    <span class="task-due-date">Due: ${task.dueDate}</span>
                </div>
            `;
            taskCard.querySelector('.archive-task-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                archiveTask(task.id);
            });
            taskContainer.appendChild(taskCard);
        });
        taskBoard.appendChild(taskContainer);
    };

    const renderBudgetView = () => {
        taskBoard.innerHTML = '';
        taskBoard.className = 'task-board budget-view-active'; // Set class for styling

        const budgetTasks = tasks.filter(task => parseFloat(task.budget) > 0 && !task.isArchived);

        if (budgetTasks.length === 0) {
            taskBoard.innerHTML = '<p>No tasks with an assigned budget found.</p>';
            return;
        }

        let totalCost = 0;
        const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: currency });

        const table = document.createElement('table');
        table.className = 'budget-table';

        table.innerHTML = `
            <thead>
                <tr>
                    <th>Task Title</th>
                    <th>Category</th>
                    <th>Owner</th>
                    <th>Cost</th>
                </tr>
            </thead>
        `;

        const tbody = document.createElement('tbody');
        budgetTasks.forEach(task => {
            const cost = parseFloat(task.budget) || 0;
            totalCost += cost;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${task.title}</td>
                <td>${task.category}</td>
                <td>${task.owner}</td>
                <td>${formatter.format(cost)}</td>
            `;
            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        const tfoot = document.createElement('tfoot');
        tfoot.innerHTML = `<tr><td colspan="3">Total Spent</td><td>${formatter.format(totalCost)}</td></tr>`;
        table.appendChild(tfoot);

        taskBoard.appendChild(table);
    };

    const renderTasks = () => {
        if (!getCurrentEvent()) {
            loadCurrentEvent(); // This will show the "No event" message
            return;
        }
        taskBoard.innerHTML = '';
        const viewMode = localStorage.getItem('viewMode') || 'kanban';
        if (viewMode === 'archive') {
            renderArchiveView();
        } else if (viewMode === 'budget') {
            renderBudgetView();
        } else if (viewMode === 'category') {
            renderCategoryView();
        } else {
            renderKanbanView();
        }

        // Show/hide the collapse all button based on view
        const isCategoryView = (localStorage.getItem('viewMode') === 'category');
        collapseAllCategoriesBtn.style.display = isCategoryView ? 'inline-block' : 'none';
    };

    const generateUniqueId = () => {
        let newId;
        do {
            newId = Math.floor(1000000 + Math.random() * 9000000).toString();
        } while (tasks.some(task => task.id.toString() === newId));
        return newId;
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();

        const id = taskIdField.value;
        const dueDateValue = document.getElementById('dueDate').value;
        const today = new Date();
        const selectedDate = new Date(dueDateValue);
        today.setHours(0, 0, 0, 0); // Normalize today's date to the beginning of the day
        selectedDate.setHours(0, 0, 0, 0); // Normalize selected date

        if (selectedDate < today) {
            alert("Due date cannot be in the past. Please select today or a future date.");
            return; // Stop form submission
        }

        const attachmentFile = attachmentInput.files[0];

        const taskData = {
            category: document.getElementById('category').value,
            title: document.getElementById('title').value,
            dueDate: document.getElementById('dueDate').value,
            owner: document.getElementById('owner').value,
            description: quill.root.innerHTML,
            budget: document.getElementById('budget').value,
            attachment: attachmentFile ? { name: attachmentFile.name, type: attachmentFile.type } : null,
        };

        // If status field is visible (i.e., editing in category view), add it to the data
        if (modal.classList.contains('show-status')) {
            taskData.status = document.getElementById('status').value;
        }

        if (id) {
            // Update existing task
            const taskIndex = tasks.findIndex(t => t.id == id);
            if (taskIndex > -1) {
                // Preserve original ID and attachment if not updated
                const existingTask = tasks[taskIndex];
                tasks[taskIndex] = { ...existingTask, ...taskData };
                if (!taskData.attachment) {
                    tasks[taskIndex].attachment = existingTask.attachment;
                }
            }
        } else {
            // Create new task
            taskData.id = generateUniqueId();
            taskData.isArchived = false;
            taskData.status = 'Open'; // New tasks always start as Open
            tasks.push(taskData);
        }

        saveTasks();
        renderTasks();
        closeModal();
    };

    const editTask = (id) => {
        const task = tasks.find(t => t.id == id);
        if (!task) return;

        if (localStorage.getItem('viewMode') === 'category') {
            modal.classList.add('show-status');
            document.getElementById('status').value = task.status;
        }

        modalTitle.textContent = 'Edit Task';
        taskIdDisplay.textContent = `Task ID: #${task.id}`;
        taskIdDisplay.style.display = 'block';

        taskIdField.value = task.id;
        document.getElementById('category').value = task.category;
        document.getElementById('title').value = task.title;
        document.getElementById('dueDate').value = task.dueDate;
        document.getElementById('owner').value = task.owner;
        quill.root.innerHTML = task.description || '';
        document.getElementById('budget').value = task.budget;

        if (task.attachment) {
            attachmentName.textContent = `Current file: ${task.attachment.name}`;
        } else {
            attachmentName.textContent = '';
        }

        openModal();
    };

    const archiveTask = (id) => {
        const task = tasks.find(t => t.id == id);
        if (task) {
            task.isArchived = !task.isArchived; // Toggle archive status
            saveTasks();
            renderTasks();
        }
    };

    // --- Drag and Drop Handlers ---
    const handleDragStart = (e) => {
        e.dataTransfer.setData('text/plain', e.target.dataset.id);
        setTimeout(() => {
            e.target.classList.add('dragging');
        }, 0);
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('dragging');
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('drag-over');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const taskId = e.dataTransfer.getData('text/plain');
        const newStatus = e.currentTarget.dataset.status;
        const task = tasks.find(t => t.id == taskId);
        if (task && task.status !== newStatus) {
            task.status = newStatus;
            saveTasks();
            renderTasks();
        }
    };

    // A simple way to handle file attachment display
    attachmentInput.addEventListener('change', () => {
        if (attachmentInput.files.length > 0) {
            attachmentName.textContent = `New file: ${attachmentInput.files[0].name}`;
        } else {
            // Check if we are editing and there was a file before
            const task = tasks.find(t => t.id == taskIdField.value);
            if (task && task.attachment) {
                attachmentName.textContent = `Current file: ${task.attachment.name}`;
            } else {
                attachmentName.textContent = '';
            }
        }
    });

    const populateFilterDropdowns = () => {
        populateAllCategoryDropdowns();
        populateOwnerDropdown();
    };

    const populateOwnerDropdown = () => {
        const activeUsers = users.filter(u => u.isActive);
        const ownerFilterSelect = document.getElementById('filterOwner');
        ownerFilterSelect.innerHTML = '<option value="">All Owners</option>';
        activeUsers.forEach(user => {
            ownerFilterSelect.innerHTML += `<option value="${user.name}">${user.name}</option>`;
        });
    };

    const populateTaskOwnerDropdown = () => {
        const ownerSelect = document.getElementById('owner');
        const activeUsers = users.filter(u => u.isActive);

        // Preserve current value if editing
        const currentValue = ownerSelect.value;

        ownerSelect.innerHTML = '<option value="">-- Select Owner --</option>';

        activeUsers.forEach(user => {
            ownerSelect.innerHTML += `<option value="${user.name}">${user.name}</option>`;
        });

        // If editing a task assigned to a now-inactive user, add them to the list temporarily
        if (currentValue && !activeUsers.some(u => u.name === currentValue)) {
            const inactiveUser = users.find(u => u.name === currentValue);
            if (inactiveUser) {
                ownerSelect.innerHTML += `<option value="${inactiveUser.name}">${inactiveUser.name} (Inactive)</option>`;
            }
        }
        ownerSelect.value = currentValue;
    };

    const populateAllCategoryDropdowns = () => {
        const dropdowns = [document.getElementById('category'), filterCategorySelect];
        dropdowns.forEach(dropdown => {
            const currentValue = dropdown.value;
            dropdown.innerHTML = dropdown.id === 'filterCategory' ? '<option value="">All Categories</option>' : '';
            categories.forEach(cat => {
                dropdown.innerHTML += `<option value="${cat}">${cat}</option>`;
            });
            dropdown.value = currentValue; // Preserve selection if possible
        });
    };

    const setupFilterListeners = () => {
        const filterControls = [searchInput, filterCategorySelect, filterOwnerInput, dateRangePickerEl];
        filterControls.forEach(control => {
            control.addEventListener('input', renderTasks); // 'input' is more responsive for text fields
        });
        clearFiltersBtn.addEventListener('click', () => {
            if (datePicker) datePicker.clearSelection();
            searchInput.value = '';
            filterCategorySelect.value = '';
            filterOwnerInput.value = '';
            renderTasks();
        });
    };

    const addDropListeners = () => {
        const columns = document.querySelectorAll('.status-column');
        columns.forEach(column => {
            column.addEventListener('dragover', handleDragOver);
            column.addEventListener('dragleave', handleDragLeave);
            column.addEventListener('drop', handleDrop);
        });
    };

    // Event Listeners
    newTaskBtn.addEventListener('click', () => {
        modalTitle.textContent = 'Add New Task';
        taskIdField.value = '';
        taskIdDisplay.style.display = 'none';
        taskForm.reset();
        attachmentName.textContent = '';
        openModal();
    });
    settingsBtn.addEventListener('click', openSettingsModal);
    manageEventsBtn.addEventListener('click', openEventManagerModal);
    settingsModal.querySelector('.close-button').addEventListener('click', closeSettingsModal);
    eventManagerModal.querySelector('.close-button').addEventListener('click', closeEventManagerModal);

    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
        if (e.target === settingsModal) {
            closeSettingsModal();
        }
        if (e.target === eventManagerModal) {
            closeEventManagerModal();
        }
    });

    totalBudgetInput.addEventListener('change', (e) => {
        totalBudget = parseFloat(e.target.value) || 0;
        saveTotalBudget();
    });

    currencySelect.addEventListener('change', (e) => {
        currency = e.target.value;
        saveCurrency();
    });

    // --- View Toggler ---
    collapseViewToggle.addEventListener('change', (e) => {
        const isCollapsed = e.target.checked;
        if (isCollapsed) {
            document.querySelector('.app-container').classList.add('collapsed-view');
        } else {
            document.querySelector('.app-container').classList.remove('collapsed-view');
        }
        localStorage.setItem('collapsedView', isCollapsed);
    });

        collapseAllCategoriesBtn.addEventListener('click', () => {
        const allCategoryGroups = taskBoard.querySelectorAll('.category-group');
        // Check if any group is NOT collapsed. If so, we collapse all. Otherwise, we expand all.
        const shouldCollapse = Array.from(allCategoryGroups).some(group => !group.classList.contains('collapsed'));

        allCategoryGroups.forEach(group => {
            if (shouldCollapse) {
                group.classList.add('collapsed');
            } else {
                group.classList.remove('collapsed');
            }
        });
        collapseAllCategoriesBtn.textContent = shouldCollapse ? 'Expand All' : 'Collapse All';
    });


    // --- View Mode Handler ---
    viewModeGroup.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const newViewMode = e.target.dataset.view;
            localStorage.setItem('viewMode', newViewMode);
            updateViewModeButtons(newViewMode);
            renderTasks();
        }
    });

    const updateViewModeButtons = (activeView) => {
        viewModeGroup.querySelectorAll('button').forEach(button => {
            button.classList.toggle('active', button.dataset.view === activeView);
        });
    };

    // --- Page Title Listeners ---
    pageTitleEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent adding a new line
            pageTitleEl.blur();   // Trigger the blur event to save
        }
    });

    pageTitleEl.addEventListener('blur', () => {
        const newTitle = pageTitleEl.textContent.trim();
        const event = getCurrentEvent();
        if (event && newTitle) {
            event.name = newTitle;
            saveAppData();
        } else if (event) {
            pageTitleEl.textContent = event.name; // Revert if empty
        }
    });

    taskForm.addEventListener('submit', handleFormSubmit);

    // --- User Management ---
    const renderUserManager = () => {
        const list = document.getElementById('userManagerList');
        list.innerHTML = '';
        users.forEach((user, index) => {
            const li = document.createElement('li');
            li.className = 'category-manager-item';
            li.innerHTML = `
                <span>${user.name}</span>
                <div class="category-manager-actions">
                    <div class="toggle-switch-container">
                        <input type="checkbox" id="user-active-${index}" class="toggle-switch user-active-toggle" data-user-name="${user.name}" ${user.isActive ? 'checked' : ''}>
                        <label for="user-active-${index}" class="slider"></label>
                    </div>
                    <button class="edit-user-btn" title="Edit" data-user-name="${user.name}">&#9998;</button>
                    <button class="delete-user-btn" title="Delete" data-user-name="${user.name}">&times;</button>
                </div>
            `;
            list.appendChild(li);
        });

        // Add event listeners
        list.querySelectorAll('.edit-user-btn').forEach(btn => btn.addEventListener('click', editUser));
        list.querySelectorAll('.delete-user-btn').forEach(btn => btn.addEventListener('click', deleteUser));
        list.querySelectorAll('.user-active-toggle').forEach(toggle => toggle.addEventListener('change', toggleUserActiveState));
    };

    const addUser = () => {
        const newUserName = newUserInput.value.trim();
        if (newUserName && !users.some(u => u.name === newUserName)) {
            users.push({ name: newUserName, isActive: true });
            saveUsers();
            renderUserManager();
            newUserInput.value = '';
        } else if (!newUserName) {
            alert("User name cannot be empty.");
        } else {
            alert(`User "${newUserName}" already exists.`);
        }
    };

    const editUser = (e) => {
        const oldUserName = e.target.dataset.userName;
        const newUserName = prompt(`Rename user "${oldUserName}":`, oldUserName);

        if (newUserName && newUserName.trim() !== '' && newUserName !== oldUserName) {
            if (users.some(u => u.name === newUserName)) {
                alert(`User "${newUserName}" already exists.`);
                return;
            }
            const user = users.find(u => u.name === oldUserName);
            if (user) {
                user.name = newUserName;
                tasks.forEach(task => {
                    if (task.owner === oldUserName) {
                        task.owner = newUserName;
                    }
                });
                saveTasks();
                saveUsers();
                renderUserManager();
                renderTasks();
            }
        }
    };

    const deleteUser = (e) => {
        const userToDelete = e.target.dataset.userName;
        const hasActiveTasks = tasks.some(t => t.owner === userToDelete && t.status !== 'Done' && !t.isArchived);

        if (hasActiveTasks) {
            alert(`Cannot delete user "${userToDelete}" because they are assigned to active tasks.`);
            return;
        }

        if (confirm(`Are you sure you want to delete the user "${userToDelete}"?`)) {
            users = users.filter(u => u.name !== userToDelete);
            saveUsers();
            renderUserManager();
        }
    };

    const toggleUserActiveState = (e) => {
        const userName = e.target.dataset.userName;
        const user = users.find(u => u.name === userName);
        if (user) {
            user.isActive = e.target.checked;
            saveUsers();
        }
    };

    // --- Category Management ---
    const renderCategoryManager = () => {
        const list = document.getElementById('categoryManagerList');
        list.innerHTML = '';
        categories.forEach(cat => {
            const li = document.createElement('li');
            li.className = 'category-manager-item';
            li.innerHTML = `
                <span>${cat}</span>
                <div class="category-manager-actions">
                    <button class="edit-cat-btn" title="Edit" data-cat="${cat}">&#9998;</button>
                    <button class="delete-cat-btn" title="Delete" data-cat="${cat}">&times;</button>
                </div>
            `;
            list.appendChild(li);
        });

        // Add event listeners
        list.querySelectorAll('.edit-cat-btn').forEach(btn => btn.addEventListener('click', editCategory));
        list.querySelectorAll('.delete-cat-btn').forEach(btn => btn.addEventListener('click', deleteCategory));
    };

    const addCategory = () => {
        const newCat = newCategoryInput.value.trim();
        if (newCat && !categories.includes(newCat)) {
            categories.push(newCat);
            saveCategories();
            renderCategoryManager();
            newCategoryInput.value = '';
        } else if (!newCat) {
            alert("Category name cannot be empty.");
        } else {
            alert(`Category "${newCat}" already exists.`);
        }
    };

    const editCategory = (e) => {
        const oldCat = e.target.dataset.cat;
        const newCat = prompt(`Rename category "${oldCat}":`, oldCat);

        if (newCat && newCat.trim() !== '' && newCat !== oldCat) {
            if (categories.includes(newCat)) {
                alert(`Category "${newCat}" already exists.`);
                return;
            }
            const catIndex = categories.indexOf(oldCat);
            if (catIndex > -1) {
                categories[catIndex] = newCat;
                // Update all tasks with the old category
                tasks.forEach(task => {
                    if (task.category === oldCat) {
                        task.category = newCat;
                    }
                });
                saveTasks();
                saveCategories();
                renderCategoryManager();
                renderTasks();
            }
        }
    };

    const deleteCategory = (e) => {
        const catToDelete = e.target.dataset.cat;
        const hasActiveTasks = tasks.some(t => t.category === catToDelete && t.status !== 'Done' && !t.isArchived);

        if (hasActiveTasks) {
            alert(`Cannot delete "${catToDelete}" because it contains active (not "Done") tasks.`);
            return;
        }

        if (confirm(`Are you sure you want to delete the category "${catToDelete}"? Any remaining "Done" tasks in this category will be reassigned to "Other".`)) {
            tasks.forEach(task => { if (task.category === catToDelete) task.category = 'Other'; });
            categories = categories.filter(c => c !== catToDelete);
            saveTasks();
            saveCategories();
            renderCategoryManager();
            renderTasks();
        }
    };

    const updateEventDaysCounter = (date1 = null, date2 = null) => {
        const event = getCurrentEvent();
        if (!event) return;

        // If dates are passed directly (from picker events), use them. Otherwise, try to get from picker.
        const start = date1 ? date1.dateInstance : (event.eventDates.start ? new Date(event.eventDates.start) : null);
        const end = date2 ? date2.dateInstance : (event.eventDates.end ? new Date(event.eventDates.end) : null);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start) {
            const startDateInstance = new Date(start);
            startDateInstance.setHours(0, 0, 0, 0);

            if (today < startDateInstance) {
                // Event is in the future
                eventDaysLabelEl.textContent = 'Days to Event';
                const diffTime = startDateInstance.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                eventDaysCountEl.textContent = diffDays;
                daysProgressBar.style.width = '0%'; // Event has not started
            } else if (end && today <= new Date(end)) {
                // Event is currently in progress
                eventDaysLabelEl.textContent = 'Event Status';
                eventDaysCountEl.textContent = 'In Progress';
                // The event has started, so progress to the event is 100%
                daysProgressBar.style.width = '100%';
            } else {
                // Event is finished
                eventDaysLabelEl.textContent = 'Event Status';
                eventDaysCountEl.textContent = 'Finished';
                // The event has started and finished, so progress to the event is 100%
                daysProgressBar.style.width = '100%';
            }
            daysProgressBar.classList.add('progress-green'); // Or other logic you prefer
        } else {
            // No date set
            eventDaysLabelEl.textContent = 'Event Days';
            eventDaysCountEl.textContent = 'N/A';
            daysProgressBar.style.width = '0%';
        }
    };

    // --- Initializations ---
    const initializeQuill = () => {
        quill = new Quill('#descriptionEditor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['clean']
                ]
            }
        });
    };

    const initializeDateRangePicker = () => {
        datePicker = new Litepicker({
            element: dateRangePickerEl,
            singleMode: false,
            format: 'MMM DD, YYYY',
            tooltipText: {
                one: 'day',
                other: 'days'
            },
            setup: (picker) => {
                picker.on('selected', (date1, date2) => {
                    filterStartDate = date1;
                    filterEndDate = date2;
                    renderTasks();
                });
            },
        });

        eventDatePicker = new Litepicker({
            element: eventDateDisplayPickerEl,
            singleMode: false,
            format: 'MMM DD, YYYY',
            minDate: new Date(),
            setup: (picker) => {
                picker.on('selected', (date1, date2) => {
                    const event = getCurrentEvent();
                    if (event) {
                        event.eventDates.start = date1.toJSDate().toISOString();
                        event.eventDates.end = date2.toJSDate().toISOString();
                        saveAppData();
                        updateEventDaysCounter(date1, date2);
                    }
                });
                picker.on('clear', () => {
                    const event = getCurrentEvent();
                    if (event) {
                        event.eventDates.start = null;
                        event.eventDates.end = null;
                        saveAppData();
                        updateEventDaysCounter(null, null);
                    }
                });
            },
        });
    };

    // Attach listeners now that all functions are defined
    addUserBtn.addEventListener('click', addUser);
    addCategoryBtn.addEventListener('click', addCategory);
    addEventBtn.addEventListener('click', addEvent);

    // Initial View Mode Setup
    const savedViewMode = localStorage.getItem('viewMode') || 'kanban';

    const savedCollapsedView = localStorage.getItem('collapsedView') === 'true';
    if (savedCollapsedView) {
        collapseViewToggle.checked = true;
        document.querySelector('.app-container').classList.add('collapsed-view');
    }

    initializeQuill();
    initializeDateRangePicker();
    syncDataFromCurrentEvent();
    loadCurrentEvent();
    updateViewModeButtons(savedViewMode);
});