document.addEventListener('DOMContentLoaded', () => {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

    // Security Guard: Redirect to login if not authenticated
    if (!loggedInUser) {
        window.location.href = 'login/login.html';
        return; // Stop further execution
    }

    const newTaskBtn = document.getElementById('newTaskBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const manageEventsBtn = document.getElementById('manageEventsBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const eventManagerModal = document.getElementById('eventManagerModal');
    const modal = document.getElementById('taskModal');
    const createEventModal = document.getElementById('createEventModal');
    const openCreateEventModalBtn = document.getElementById('openCreateEventModalBtn');
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
    const isBudgetedTaskCheckbox = document.getElementById('isBudgetedTask');
    const budgetedFieldsContainer = document.getElementById('budgeted-fields-container');
    const addPaymentBtn = document.getElementById('addPaymentBtn');
    const summaryTotalEl = document.getElementById('summaryTotal');
    const summarySpentEl = document.getElementById('summarySpent');
    const summaryRemainingEl = document.getElementById('summaryRemaining');
    const budgetProgressBar = document.getElementById('budgetProgressBar'); // Now in a widget
    const tasksProgressBar = document.getElementById('tasksProgressBar');
    const daysProgressBar = document.getElementById('daysProgressBar');
    const openTasksCountEl = document.getElementById('openTasksCount');
    const eventDaysLabelEl = document.getElementById('eventDaysLabel');
    const eventDaysCountEl = document.getElementById('eventDaysCount');
    const languageToggle = document.getElementById('languageToggle');
    const collapseViewToggle = document.getElementById('collapseViewToggle');
    const viewModeGroup = document.getElementById('viewModeGroup');
    const searchInput = document.getElementById('searchInput');
    const loadingOverlay = document.getElementById('loading-overlay');
    const filterCategorySelect = document.getElementById('filterCategory');
    const collapseAllCategoriesBtn = document.getElementById('collapseAllCategoriesBtn');
    const filterOwnerInput = document.getElementById('filterOwner');
    const dateRangePickerEl = document.getElementById('dateRangePicker');
    const currencySelect = document.getElementById('currencySelect');
    const viewArchiveBtn = document.getElementById('viewArchiveBtn');
    const newEventNameInput = document.getElementById('newEventNameInput');
    const newEventOwnerInput = document.getElementById('newEventOwnerInput');
    const newEventContactNumberInput = document.getElementById('newEventContactNumberInput');
    const newEventContactMailInput = document.getElementById('newEventContactMailInput');
    const addEventBtn = document.getElementById('addEventBtn');
    const editEventIdInput = document.getElementById('editEventId');
    const headerEventDateDisplay = document.getElementById('headerEventDateDisplay');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');

    // --- Mock Data Control Flag ---
    // Set to 'true' to load mock data on first run (when localStorage is empty).
    // Set to 'false' to disable this feature.
    const useMockData = true;
    let filterStartDate = null;
    let filterEndDate = null;

    // --- I18n & Language ---
    let currentLanguage = localStorage.getItem('language') || 'en';

    const translate = (key, replacements = {}) => {
        let text = translations[currentLanguage][key] || key;
        for (const placeholder in replacements) {
            text = text.replace(`{${placeholder}}`, replacements[placeholder]);
        }
        return text;
    };

    const applyTranslations = () => {
        document.querySelectorAll('[data-translate-key]').forEach(el => {
            const key = el.dataset.translateKey;
            el.textContent = translate(key);
        });
        document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
            el.placeholder = translate(el.dataset.translatePlaceholder);
        });
        document.querySelectorAll('[data-translate-title]').forEach(el => {
            el.title = translate(el.dataset.translateTitle);
        });

        // Special handling for select options
        document.querySelectorAll('#currencySelect option').forEach(option => {
            const key = `currency_${option.value.toLowerCase()}`;
            option.textContent = translate(key);
        });

    };

    const showLoader = () => {
        loadingOverlay.style.display = 'flex';
    };

    const hideLoader = () => {
        loadingOverlay.style.display = 'none';
    };

    // --- Event-centric Data Model ---
    let appData = JSON.parse(localStorage.getItem('appData')) || {};
    let events = appData.events || [];
    let allUsers = appData.allUsers || []; // Central user list
    let currentEventId = appData.currentEventId || null;

    const saveAppData = () => {
        appData = { events, currentEventId, allUsers }; // Now also saves the user list
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
                // Users are now global, not per-event
                currency: localStorage.getItem('currency') || 'EUR',
                eventDates: { start: null, end: null },
                owner: 'Admin',
                contactNumber: '',
                contactMail: ''
            };
            events = [newEvent];
            currentEventId = newEvent.id;
            saveAppData();

            // Clean up old localStorage items
            ['tasks', 'totalBudget', 'categories', 'currency', 'pageTitle', 'eventDates'].forEach(key => localStorage.removeItem(key));

            // Migrate old per-event users to global user list
            const oldUsers = JSON.parse(localStorage.getItem('users'));
            if (oldUsers && oldUsers.length > 0 && allUsers.length === 0) {
                allUsers = oldUsers.map(u => ({ ...u, password: 'password', role: 'regular' })); // Assign default password/role
            }
            // alert("Your data has been migrated to the new multi-event format!"); // Muted for better UX
        }
    };
    migrateOldData();
    // --- End Migration ---

    const initializeAppData = (usersToAssign) => {
        // Assign owners from the global user list to mock tasks
        const owners = usersToAssign.map(u => u.username);
        mockEvents.forEach(event => event.tasks.forEach((task, index) => {
            task.owner = owners[index % owners.length];
        }));
        events = mockEvents;
        currentEventId = events[0].id; // Set the first event as current
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

        // Initialize eventDatePicker with its handlers
        eventDatePicker = new Litepicker({
            element: document.getElementById('newEventDatePicker'),
            singleMode: false,
            format: 'MMM DD, YYYY',
            lang: currentLanguage,
            minDate: new Date(),
        });
    };

    const addEvent = () => {
        const newEventName = newEventNameInput.value.trim();
        const eventId = editEventIdInput.value;

        if (!newEventName) {
            alert("Event name cannot be empty.");
            return;
        }

        if (eventId) {
            // Editing an existing event
            const event = events.find(e => e.id == eventId);
            if (event) {
                event.name = newEventName;
                event.owner = newEventOwnerInput.value.trim();
                event.contactNumber = newEventContactNumberInput.value.trim();
                event.contactMail = newEventContactMailInput.value.trim();
                event.eventDates.start = eventDatePicker.getStartDate() ? eventDatePicker.getStartDate().toJSDate().toISOString() : null;
                event.eventDates.end = eventDatePicker.getEndDate() ? eventDatePicker.getEndDate().toJSDate().toISOString() : null;
            }
        } else {
            // Creating a new event
            const newEventOwner = newEventOwnerInput.value.trim() || 'Admin';
            const startDate = eventDatePicker.getStartDate() ? eventDatePicker.getStartDate().toJSDate().toISOString() : null;
            const endDate = eventDatePicker.getEndDate() ? eventDatePicker.getEndDate().toJSDate().toISOString() : null;

            const newEvent = {
                id: Date.now(),
                name: newEventName,
                owner: newEventOwner,
                contactNumber: newEventContactNumberInput.value.trim(),
                contactMail: newEventContactMailInput.value.trim(),
                tasks: [],
                totalBudget: 0,
                categories: ['General', 'Planning', 'Execution'],
                currency: 'USD',
                eventDates: { start: startDate, end: endDate }
            };
            events.push(newEvent);
            switchEvent(newEvent.id);
        }

        saveAppData();
    };

    function initializeAppUI() {
        initializeQuill();
        initializeDateRangePicker();
        addEventBtn.addEventListener('click', addEvent);
        syncDataFromCurrentEvent();
        loadCurrentEvent();
        updateViewModeButtons(savedViewMode);
        applyTranslations();
        setupFilterListeners();
    }

    // Load initial data
    (async () => {
        showLoader();
        if (allUsers.length === 0 && useMockData) {
            try {
                const response = await fetch('settings/usersAndRoles/UsersAndRoles.json');
                allUsers = await response.json();
            } catch (e) {
                console.error("Failed to load initial user data, creating default admin.", e);
                allUsers.push({ id: Date.now(), username: '1', password: '1', role: 'admin', isActive: true });
            }
        }

        if (events.length === 0 && useMockData && typeof mockEvents !== 'undefined') {
            initializeAppData(allUsers); // Pass users to assign owners
        }

        // Now that all data is loaded, initialize the app UI
        initializeAppUI();
        hideLoader();
    })();

    const getCurrentEvent = () => events.find(e => e.id === currentEventId);

    const loadCurrentEvent = () => {
        // If user is an operations manager, show the operations view instead.
        // The logic to hide/show header/widgets is now in renderTasks()

        const event = getCurrentEvent();

        if (!event) {
            pageTitleEl.textContent = translate('no_event_selected'); // Assuming this key exists
            // Disable most of the UI
            document.querySelectorAll('.main-content-wrapper button, .main-content-wrapper input, .main-content-wrapper select').forEach(el => {
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

        headerEventDateDisplay.textContent = formatEventListDate(event);

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
            currency = event.currency;
            // allUsers is global, but let's ensure it's not undefined
            allUsers = appData.allUsers || [];
        } else {
            // Reset data if no event is selected
            tasks = []; totalBudget = 0; categories = []; currency = 'USD';
            allUsers = appData.allUsers || [];
        }
    };

    const formatEventListDate = (event) => {
        if (!event.eventDates || !event.eventDates.start) {
            return translate('no_date_set');
        }
        const locale = currentLanguage === 'he' ? 'he-IL' : 'en-US';
        const formatter = (dateStr) => new Date(dateStr).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
        const start = formatter(event.eventDates.start);
        const end = event.eventDates.end ? formatter(event.eventDates.end) : start;
        return start === end ? start : `${start} - ${end}`;
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
                <span class="event-list-owner">${event.owner || ''}</span>
                <span class="event-list-contact">${event.contactNumber || ''}</span>
                <span class="event-list-date">${formatEventListDate(event)}</span>
                <div class="category-manager-actions">
                    <button class="edit-event-btn" title="Edit Event" data-event-id="${event.id}">&#9998;</button>
                </div>
            `;
            li.querySelector('.event-list-name').addEventListener('click', () => switchEvent(event.id));
            li.querySelector('.edit-event-btn').addEventListener('click', (e) => openEditEventModal(e.currentTarget.dataset.eventId));
            list.appendChild(li);
        });

    };

    const openEventManagerModal = () => {
        renderEventManager();
        document.body.classList.add('modal-open');
        eventManagerModal.style.display = 'block';
    };

    const closeEventManagerModal = () => {
        eventManagerModal.style.display = 'none';
    };

    const switchEvent = (eventId) => {
        currentEventId = eventId;
        saveAppData();
        syncDataFromCurrentEvent();
        loadCurrentEvent();
        closeEventManagerModal();
    };

    const openCreateEventModal = () => {
        createEventModal.querySelector('h2').textContent = translate('create_new_event');
        document.getElementById('createEventForm').reset();
        editEventIdInput.value = '';
        addEventBtn.textContent = translate('create_event');
        eventDatePicker.clearSelection();
        eventManagerModal.style.display = 'none'; // Close the manager modal
        document.body.classList.add('modal-open');
        createEventModal.style.display = 'block';
    };

    const openEditEventModal = (eventId) => {
        const event = events.find(e => e.id == eventId);
        if (!event) return;

        createEventModal.querySelector('h2').textContent = translate('edit_event'); // You'll need to add this translation key
        addEventBtn.textContent = translate('save_changes');
        editEventIdInput.value = event.id;
        newEventNameInput.value = event.name;
        newEventOwnerInput.value = event.owner || '';
        newEventContactNumberInput.value = event.contactNumber || '';
        newEventContactMailInput.value = event.contactMail || '';

        if (event.eventDates.start) {
            eventDatePicker.setStartDate(event.eventDates.start);
            if (event.eventDates.end) {
                eventDatePicker.setEndDate(event.eventDates.end);
            }
        } else {
            eventDatePicker.clearSelection();
        }

        eventManagerModal.style.display = 'none';
        document.body.classList.add('modal-open');
        createEventModal.style.display = 'block';
    };

    const closeCreateEventModal = () => {
        createEventModal.style.display = 'none';
        document.body.classList.remove('modal-open');
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

        document.body.classList.add('modal-open');
        modal.style.display = 'block';
    };

    const closeModal = () => {
        if (quill) quill.setText(''); // Clear the editor
        modal.classList.remove('show-status');
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        taskForm.reset();
        modalTitle.textContent = 'Add New Task';
        taskIdField.value = '';
        taskIdDisplay.style.display = 'none';
        document.getElementById('payments-container').innerHTML = '';
        attachmentName.textContent = '';
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
    const updateCategories = (newCategories, oldCat = null, newCat = null) => {
        categories = newCategories;
        if (oldCat && newCat) {
            tasks.forEach(task => { if (task.category === oldCat) task.category = newCat; });
            saveTasks();
        }
        saveCategories();
        renderTasks();
    }

    const saveUsers = () => {
        populateOwnerDropdown();
    }

    const updateBudgetSummary = () => {
        if (!getCurrentEvent()) return; // Don't update if no event is selected
        const spent = tasks.reduce((sum, task) => sum + (parseFloat(task.budget) || 0), 0);
        const remaining = totalBudget - spent;

        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency', // Intl will handle symbol placement
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

    const applyEventFilters = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const start = filterStartDate ? filterStartDate.dateInstance : null;
        const end = filterEndDate ? filterEndDate.dateInstance : null;

        return events.filter(event => {
            const searchMatch = !searchTerm || event.name.toLowerCase().includes(searchTerm);

            const eventStart = event.eventDates.start ? new Date(event.eventDates.start) : null;
            const eventEnd = event.eventDates.end ? new Date(event.eventDates.end) : eventStart;

            // Check if event range overlaps with filter range
            const dateMatch = !start || !eventStart || (eventStart <= end && eventEnd >= start);

            return searchMatch && dateMatch;
        });
    };

    const renderKanbanView = () => {
        const statuses = ["Open", "In Progress", "Block", "Done"];
        taskBoard.className = 'task-board'; // Reset to base class

        const filteredTasks = applyFilters();

        const tasksByStatus = filteredTasks.reduce((acc, task) => {
            // Always group by the original English status
            (acc[task.status] = acc[task.status] || []).push(task);
            return acc;
        }, {});

        taskBoard.innerHTML = ''; // Clear board before rendering

        if (filteredTasks.length === 0) {
            taskBoard.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h3>No tasks found</h3>
                    <p>Try adjusting your filters or create a new task.</p>
                </div>
            `;
            taskBoard.style.display = 'block'; // Ensure empty state is visible
            return;
        }

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
            statusTitle.textContent = translate(status.toLowerCase().replace(' ', '_')) || status;

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

        if (filteredTasks.length === 0) {
            taskBoard.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🗂️</div>
                    <h3>No tasks in this view</h3>
                    <p>Create a new task or check your filters.</p>
                </div>
            `;
            return;
        }

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
                        <span class="task-status">${translate(task.status.toLowerCase().replace(' ', '_')) || task.status}</span>
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
            taskBoard.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🗄️</div>
                    <h3>Archive is empty</h3>
                    <p>Archived tasks will appear here.</p>
                </div>
            `;
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

        // First, get all tasks that match the current filters.
        const filteredTasks = applyFilters();
        // Then, from that list, get only the ones that have a budget.
        const budgetTasks = filteredTasks.filter(task => parseFloat(task.budget) > 0);

        if (budgetTasks.length === 0) {
            taskBoard.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💰</div>
                    <h3>No budgeted tasks</h3>
                    <p>Add a cost to a task to see it here.</p>
                </div>
            `;
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
            row.dataset.id = task.id;
            row.style.cursor = 'pointer';
            row.innerHTML = `
                <td>${task.title}</td>
                <td>${task.category}</td>
                <td>${task.owner}</td>
                <td>${formatter.format(cost)}</td>
            `;
            row.addEventListener('click', () => {
                editTask(task.id);
            });
            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        const tfoot = document.createElement('tfoot');
        tfoot.innerHTML = `<tr><td colspan="3">Total Spent</td><td>${formatter.format(totalCost)}</td></tr>`;
        table.appendChild(tfoot);

        taskBoard.appendChild(table);
    };

    const renderOperationsView = () => {
        taskBoard.innerHTML = '';
        taskBoard.className = 'task-board operations-view-active'; // Set class for styling

        // Apply filters to the events list
        const filteredEvents = applyEventFilters();

        let grandTotalBudget = 0;
        const defaultCurrency = 'USD'; // Use a default for summing

        const table = document.createElement('table');
        table.className = 'budget-table'; // Reuse budget table styles

        table.innerHTML = `
            <thead>
                <tr>
                    <th>${translate('event_name')}</th>
                    <th>${translate('open_tasks')}</th>
                    <th>${translate('event_dates_label')}</th>
                    <th>${translate('total_budget')}</th>
                </tr>
            </thead>
        `;

        const tbody = document.createElement('tbody');
        filteredEvents.forEach(event => {
            const openTasks = event.tasks.filter(t => t.status !== 'Done' && !t.isArchived).length;
            const budget = parseFloat(event.totalBudget) || 0;
            grandTotalBudget += budget; // Note: This doesn't account for different currencies

            const formatter = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: event.currency || defaultCurrency,
            });

            const row = document.createElement('tr');
            row.dataset.eventId = event.id;
            row.style.cursor = 'pointer';
            row.title = `Click to view event: ${event.name}`;
            row.innerHTML = `
                <td>${event.name}</td>
                <td>${openTasks}</td>
                <td>${formatEventListDate(event)}</td>
                <td>${formatter.format(budget)}</td>
            `;
            row.addEventListener('click', () => {
                // Switch to the clicked event
                switchEvent(event.id);
                // Force the view to Kanban for the detailed view
                localStorage.setItem('viewMode', 'kanban');
                updateViewModeButtons('kanban');
            });
            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        const tfoot = document.createElement('tfoot');
        const totalFormatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: defaultCurrency,
        });
        tfoot.innerHTML = `
            <tr>
                <td colspan="3">${translate('grand_total_budget')}</td>
                <td>${totalFormatter.format(grandTotalBudget)}</td>
            </tr>`;
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

        // Centralized logic to control UI visibility based on view
        if (viewMode === 'operations') {
            document.getElementById('budget-summary').style.display = 'none';
            document.querySelector('.event-header').style.display = 'none';
        } else {
            document.getElementById('budget-summary').style.display = 'grid';
            document.querySelector('.event-header').style.display = 'block';
        }

        if (viewMode === 'archive') {
            renderArchiveView();
        } else if (viewMode === 'budget') {
            renderBudgetView();
        } else if (viewMode === 'category') {
            renderCategoryView();
        } else if (viewMode === 'operations') {
            renderOperationsView();
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

    const addPaymentRow = (amount = '', date = '') => {
        const paymentsContainer = document.getElementById('payments-container');
        const newRow = document.createElement('div');
        newRow.className = 'payment-row';
        newRow.innerHTML = `
            <input type="number" class="payment-amount filter-input" placeholder="Amount" value="${amount}" step="0.01" min="0">
            <input type="date" class="payment-date filter-input" value="${date}">
            <button type="button" class="btn remove-payment-btn">Remove</button>
        `;

        // Add event listener to remove button
        newRow.querySelector('.remove-payment-btn').addEventListener('click', () => {
            newRow.remove();
        });

        paymentsContainer.appendChild(newRow);
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
            alert(translate('past_due_date_alert'));
            return; // Stop form submission
        }

        const attachmentFile = attachmentInput.files[0];

        const taskData = {
            category: document.getElementById('category').value,
            title: document.getElementById('title').value,
            dueDate: document.getElementById('dueDate').value,
            owner: document.getElementById('owner').value,
            description: quill.root.innerHTML,
            attachment: attachmentFile ? { name: attachmentFile.name, type: attachmentFile.type } : null,
            isBudgeted: isBudgetedTaskCheckbox.checked,
            supplierName: '',
            supplierEmail: '',
            supplierPhone: '',
            payments: [],
            budget: 0
        };

        if (taskData.isBudgeted) {
            taskData.supplierName = document.getElementById('supplierName').value;
            taskData.supplierEmail = document.getElementById('supplierEmail').value;
            taskData.supplierPhone = document.getElementById('supplierPhone').value;

            const paymentRows = document.querySelectorAll('.payment-row');
            let totalBudgetFromPayments = 0;
            paymentRows.forEach(row => {
                const amount = parseFloat(row.querySelector('.payment-amount').value);
                const date = row.querySelector('.payment-date').value;
                if (!isNaN(amount) && amount > 0) {
                    taskData.payments.push({ amount, date });
                    totalBudgetFromPayments += amount;
                }
            });
            taskData.budget = totalBudgetFromPayments;
        }

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

        if (task.isBudgeted) {
            document.getElementById('supplierName').value = task.supplierName || '';
            isBudgetedTaskCheckbox.checked = true;
            budgetedFieldsContainer.style.display = 'block';
            document.getElementById('supplierEmail').value = task.supplierEmail || '';
            document.getElementById('supplierPhone').value = task.supplierPhone || '';

            const paymentsContainer = document.getElementById('payments-container');
            paymentsContainer.innerHTML = ''; // Clear existing
            if (task.payments && task.payments.length > 0) {
                task.payments.forEach(payment => addPaymentRow(payment.amount, payment.date));
            }
        } else {
            isBudgetedTaskCheckbox.checked = false;
            budgetedFieldsContainer.style.display = 'none';
        }


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
        const activeUsers = allUsers.filter(u => u.isActive);
        const ownerFilterSelect = document.getElementById('filterOwner');
        ownerFilterSelect.innerHTML = '<option value="">All Owners</option>';
        activeUsers.forEach(user => {
            ownerFilterSelect.innerHTML += `<option value="${user.username}">${user.username}</option>`;
        });
    };

    const populateTaskOwnerDropdown = () => {
        const ownerSelect = document.getElementById('owner');
        const activeUsers = allUsers.filter(u => u.isActive);

        // Preserve current value if editing
        const currentValue = ownerSelect.value;

        ownerSelect.innerHTML = '<option value="">-- Select Owner --</option>';

        activeUsers.forEach(user => {
            ownerSelect.innerHTML += `<option value="${user.username}">${user.username}</option>`;
        });

        // If editing a task assigned to a now-inactive user, add them to the list temporarily
        if (currentValue && !activeUsers.some(u => u.username === currentValue)) {
            const inactiveUser = allUsers.find(u => u.username === currentValue);
            if (inactiveUser) {
                ownerSelect.innerHTML += `<option value="${inactiveUser.username}">${inactiveUser.username} (${translate('inactive')})</option>`;
            }
        }
        ownerSelect.value = currentValue;
    };

    const populateAllCategoryDropdowns = () => {
        const dropdowns = [document.getElementById('category'), filterCategorySelect];
        dropdowns.forEach(dropdown => {
            const currentValue = dropdown.value;
            dropdown.innerHTML = dropdown.id === 'filterCategory' ? `<option value="">${translate('all_categories')}</option>` : '';
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
    manageEventsBtn.addEventListener('click', openEventManagerModal);
    openCreateEventModalBtn.addEventListener('click', openCreateEventModal);

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('loggedInUser');
        window.location.href = 'login/login.html';
    });

    totalBudgetInput.addEventListener('change', (e) => {
        totalBudget = parseFloat(e.target.value) || 0;
        saveTotalBudget();
    });

    currencySelect.addEventListener('change', (e) => {
        currency = e.target.value;
        saveCurrency();
    });

    isBudgetedTaskCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            budgetedFieldsContainer.style.display = 'block';
        } else {
            budgetedFieldsContainer.style.display = 'none';
        }
    });

    addPaymentBtn.addEventListener('click', () => {
        addPaymentRow('', '');
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

    languageToggle.addEventListener('change', (e) => {
        currentLanguage = e.target.checked ? 'he' : 'en';
        localStorage.setItem('language', currentLanguage);
        document.body.classList.toggle('rtl', e.target.checked);
        applyTranslations();
        eventDatePicker.setOptions({ lang: currentLanguage }); // Update picker language
        // Re-render everything to apply language changes to dynamic content
        populateFilterDropdowns();
        renderTasks();
        updateBudgetSummary();
        // Update button text that changes
        const shouldCollapse = Array.from(taskBoard.querySelectorAll('.category-group')).some(group => !group.classList.contains('collapsed'));
        collapseAllCategoriesBtn.textContent = shouldCollapse ? translate('expand_all') : translate('collapse_all');
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
        collapseAllCategoriesBtn.textContent = shouldCollapse ? translate('expand_all') : translate('collapse_all');
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

    viewArchiveBtn.addEventListener('click', (e) => {
        const newViewMode = e.target.dataset.view;
        localStorage.setItem('viewMode', newViewMode);
        updateViewModeButtons(newViewMode);
        renderTasks();
        closeSettingsModal();
    });
    const updateViewModeButtons = (activeView) => {
        viewModeGroup.querySelectorAll('button').forEach(button => {
            button.classList.toggle('active', button.dataset.view === activeView);
        });

        // Show/hide operations button based on role
        const opsButton = viewModeGroup.querySelector('[data-view="operations"]');
        if (opsButton) {
            opsButton.style.display = (loggedInUser.role === 'operations' || loggedInUser.role === 'admin') ? 'inline-block' : 'none';
        }

    };

    document.getElementById('createEventForm').addEventListener('submit', (e) => { e.preventDefault(); addEvent(); });

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
                eventDaysLabelEl.textContent = translate('days_to_event');
                const diffTime = startDateInstance.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                eventDaysCountEl.textContent = diffDays;
                daysProgressBar.style.width = '0%'; // Event has not started
            } else if (end && today <= new Date(end)) {
                // Event is currently in progress
                eventDaysLabelEl.textContent = translate('event_status');
                eventDaysCountEl.textContent = translate('in_progress');
                // The event has started, so progress to the event is 100%
                daysProgressBar.style.width = '100%';
            } else {
                // Event is finished
                eventDaysLabelEl.textContent = translate('event_status');
                eventDaysCountEl.textContent = translate('finished');
                // The event has started and finished, so progress to the event is 100%
                daysProgressBar.style.width = '100%';
            }
            daysProgressBar.classList.add('progress-green'); // Or other logic you prefer
        } else {
            // No date set
            eventDaysLabelEl.textContent = translate('event_days');
            eventDaysCountEl.textContent = 'N/A';
            daysProgressBar.style.width = '0%';
        }
    };


    // --- Settings Modal & Tabs ---
    const openSettingsModal = () => {
        // Show/hide users tab based on role
        const usersTab = document.getElementById('usersTab');
        if (loggedInUser.role === 'admin' || loggedInUser.role === 'operations') {
            usersTab.style.display = 'block';
        } else {
            usersTab.style.display = 'none';
        }
        document.body.classList.add('modal-open');
        settingsModal.style.display = 'block';
        openTab(null, 'general'); // Open general tab by default
    };

    const openTab = (evt, tabName) => {
        // Get all elements with class="tab-content" and hide them
        const tabcontent = settingsModal.getElementsByClassName("tab-content");
        for (let i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
            tabcontent[i].classList.remove("active");
        }

        // Get all elements with class="tab-link" and remove the class "active"
        const tablinks = settingsModal.getElementsByClassName("tab-link");
        for (let i = 0; i < tablinks.length; i++) {
            tablinks[i].classList.remove("active");
        }

        // Show the current tab, and add an "active" class to the button that opened the tab
        const currentTab = document.getElementById(tabName);
        currentTab.style.display = "block";
        currentTab.classList.add("active");
        if (evt) evt.currentTarget.classList.add("active");
        else settingsModal.querySelector(`[data-tab="${tabName}"]`).classList.add("active");

        // Load content for tabs dynamically, only if not already loaded
        if (tabName === 'users' && !currentTab.dataset.loaded) {
            fetch('settings/usersAndRoles/usersAndRoles.html')
                .then(response => response.text())
                .then(html => {
                    currentTab.innerHTML = html;
                    currentTab.dataset.loaded = 'true';
                    initializeUserManagement({ getUsers: () => allUsers, updateUsers: (newUsers) => { allUsers = newUsers; saveAppData(); } }, translate);
                });
        }
        if (tabName === 'categories' && !currentTab.dataset.loaded) {
            fetch('settings/categories.html')
                .then(response => response.text())
                .then(html => {
                    currentTab.innerHTML = html;
                    currentTab.dataset.loaded = 'true';
                    initializeCategoryManagement({ getCategories: () => categories, updateCategories, getTasks: () => tasks }, translate);
                });
        }
    };

    const closeSettingsModal = () => {
        settingsModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    };

    // Setup Modal Listeners
    settingsBtn.addEventListener('click', openSettingsModal);
    settingsModal.querySelectorAll('.tab-link').forEach(button => {
        button.addEventListener('click', (e) => openTab(e, e.target.dataset.tab));
    });

    // Centralized Modal Event Listeners
    settingsModal.querySelector('.close-button').addEventListener('click', closeSettingsModal);
    eventManagerModal.querySelector('.close-button').addEventListener('click', closeEventManagerModal);
    createEventModal.querySelector('.close-button').addEventListener('click', closeCreateEventModal);
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
        if (e.target === createEventModal) {
            closeCreateEventModal();
        }
    });

    taskForm.addEventListener('submit', handleFormSubmit);

    // Initial View Mode Setup
    let savedViewMode = localStorage.getItem('viewMode') || 'kanban';
    if (loggedInUser.role === 'operations') {
        savedViewMode = 'operations';
        localStorage.setItem('viewMode', 'operations');
    }

    const savedCollapsedView = localStorage.getItem('collapsedView') === 'true';
    if (savedCollapsedView) {
        collapseViewToggle.checked = true;
        document.querySelector('.app-container').classList.add('collapsed-view');
    }

    if (currentLanguage === 'he') {
        languageToggle.checked = true;
        document.body.classList.add('rtl');
    }
});