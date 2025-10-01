document.addEventListener('DOMContentLoaded', () => {
    // Security Guard: Redirect if not an admin
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!loggedInUser || loggedInUser.role !== 'admin') {
        alert('Access Denied. You must be an administrator to view this page.');
        window.location.href = '../login/login.html';
        return;
    }

    // --- App Data Management ---
    let appData = JSON.parse(localStorage.getItem('appData')) || { events: [], allUsers: [], userGroups: [] };
    let allUsers = appData.allUsers || [];
    let userGroups = appData.userGroups || ['Default'];

    const saveAppData = () => {
        appData.allUsers = allUsers;
        appData.userGroups = userGroups;
        localStorage.setItem('appData', JSON.stringify(appData));
    };

    // --- Element References ---
    const newUsernameInput = document.getElementById('newUsernameInput');
    const newUserPasswordInput = document.getElementById('newUserPasswordInput');
    const newUserRoleSelect = document.getElementById('newUserRoleSelect');
    const newUserGroupSelect = document.getElementById('newUserGroupSelect');
    const addUserBtn = document.getElementById('addUserBtn');
    const usersTableBody = document.querySelector('#usersTable tbody');

    const newGroupInput = document.getElementById('newGroupInput');
    const addGroupBtn = document.getElementById('addGroupBtn');
    const groupManagerList = document.getElementById('groupManagerList');

    // --- Translation ---
    const currentLanguage = localStorage.getItem('language') || 'en';
    const translate = (key, replacements = {}) => {
        let text = (translations[currentLanguage] && translations[currentLanguage][key]) || key;
        for (const placeholder in replacements) {
            text = text.replace(`{${placeholder}}`, replacements[placeholder]);
        }
        return text;
    };

    const applyTranslations = () => {
        document.querySelectorAll('[data-translate-key]').forEach(el => {
            el.textContent = translate(el.dataset.translateKey);
        });
        document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
            el.placeholder = translate(el.dataset.translatePlaceholder);
        });
    };

    // --- User Management ---
    const renderUsers = () => {
        usersTableBody.innerHTML = '';
        allUsers.forEach((user, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>
                    <select class="user-role-select filter-input" data-username="${user.username}">
                        <option value="regular" ${user.role === 'regular' ? 'selected' : ''}>Regular</option>
                        <option value="beta" ${user.role === 'beta' ? 'selected' : ''}>Beta</option>
                        <option value="operations" ${user.role === 'operations' ? 'selected' : ''}>Operations Manager</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </td>
                <td>
                    <select class="user-group-select filter-input" data-username="${user.username}">
                        ${userGroups.map(g => `<option value="${g}" ${user.group === g ? 'selected' : ''}>${g}</option>`).join('')}
                    </select>
                </td>
                <td>
                    <div class="toggle-switch-container">
                        <input type="checkbox" id="user-active-${index}" class="toggle-switch user-active-toggle" data-username="${user.username}" ${user.isActive ? 'checked' : ''}>
                        <label for="user-active-${index}" class="slider"></label>
                    </div>
                </td>
                <td>
                    <button class="delete-user-btn" title="Delete" data-username="${user.username}">&times;</button>
                </td>
            `;
            usersTableBody.appendChild(row);
        });

        // Add event listeners
        usersTableBody.querySelectorAll('.delete-user-btn').forEach(btn => btn.addEventListener('click', deleteUser));
        usersTableBody.querySelectorAll('.user-active-toggle').forEach(toggle => toggle.addEventListener('change', toggleUserActiveState));
        usersTableBody.querySelectorAll('.user-role-select').forEach(select => select.addEventListener('change', changeUserRole));
        usersTableBody.querySelectorAll('.user-group-select').forEach(select => select.addEventListener('change', changeUserGroup));
    };

    const addUser = () => {
        const username = newUsernameInput.value.trim();
        const password = newUserPasswordInput.value.trim();
        const role = newUserRoleSelect.value;
        const group = newUserGroupSelect.value;

        if (!username || !password) {
            alert(translate('user_empty_alert'));
            return;
        }
        if (allUsers.some(u => u.username === username)) {
            alert(translate('user_exists_alert', { user: username }));
            return;
        }

        allUsers.push({ id: Date.now(), username, password, role, group, isActive: true });
        saveAppData();
        renderUsers();
        newUsernameInput.value = '';
        newUserPasswordInput.value = '';
    };

    const deleteUser = (e) => {
        const usernameToDelete = e.target.dataset.username;
        const admins = allUsers.filter(u => u.role === 'admin');
        if (admins.length === 1 && admins[0].username === usernameToDelete) {
            alert(translate('delete_last_admin_alert'));
            return;
        }
        if (confirm(translate('delete_user_confirm', { user: usernameToDelete }))) {
            allUsers = allUsers.filter(u => u.username !== usernameToDelete);
            saveAppData();
            renderUsers();
        }
    };

    const toggleUserActiveState = (e) => {
        const user = allUsers.find(u => u.username === e.target.dataset.username);
        if (user) {
            user.isActive = e.target.checked;
            saveAppData();
        }
    };

    const changeUserRole = (e) => {
        const username = e.target.dataset.username;
        const newRole = e.target.value;
        const user = allUsers.find(u => u.username === username);
        const admins = allUsers.filter(u => u.role === 'admin');

        if (user && user.role === 'admin' && admins.length === 1 && newRole !== 'admin') {
            alert(translate('remove_last_admin_role_alert'));
            e.target.value = 'admin'; // Revert change
            return;
        }
        if (user) {
            user.role = newRole;
            saveAppData();
        }
    };

    const changeUserGroup = (e) => {
        const user = allUsers.find(u => u.username === e.target.dataset.username);
        if (user) {
            user.group = e.target.value;
            saveAppData();
        }
    };

    // --- Group Management ---
    const renderGroups = () => {
        groupManagerList.innerHTML = '';
        userGroups.forEach(group => {
            if (group === 'Default') return; // Don't allow editing/deleting the default group
            const li = document.createElement('li');
            li.className = 'category-manager-item';
            li.innerHTML = `
                <span>${group}</span>
                <div class="category-manager-actions">
                    <button class="edit-group-btn" title="Edit" data-group="${group}">&#9998;</button>
                    <button class="delete-group-btn" title="Delete" data-group="${group}">&times;</button>
                </div>
            `;
            groupManagerList.appendChild(li);
        });

        // Populate dropdowns
        newUserGroupSelect.innerHTML = userGroups.map(g => `<option value="${g}">${g}</option>`).join('');

        // Add listeners
        groupManagerList.querySelectorAll('.edit-group-btn').forEach(btn => btn.addEventListener('click', editGroup));
        groupManagerList.querySelectorAll('.delete-group-btn').forEach(btn => btn.addEventListener('click', deleteGroup));
    };

    const addGroup = () => {
        const newGroup = newGroupInput.value.trim();
        if (newGroup && !userGroups.includes(newGroup)) {
            userGroups.push(newGroup);
            saveAppData();
            renderGroups();
            renderUsers(); // Re-render users to update their dropdowns
            newGroupInput.value = '';
        }
    };

    const editGroup = (e) => {
        const oldGroup = e.target.dataset.group;
        const newGroup = prompt(translate('rename_group_prompt', { group: oldGroup }), oldGroup);
        if (newGroup && newGroup.trim() !== '' && newGroup !== oldGroup && !userGroups.includes(newGroup)) {
            const index = userGroups.indexOf(oldGroup);
            userGroups[index] = newGroup;
            // Update users in the old group
            allUsers.forEach(u => { if (u.group === oldGroup) u.group = newGroup; });
            saveAppData();
            renderGroups();
            renderUsers();
        }
    };

    const deleteGroup = (e) => {
        const groupToDelete = e.target.dataset.group;
        if (confirm(translate('delete_group_confirm', { group: groupToDelete }))) {
            userGroups = userGroups.filter(g => g !== groupToDelete);
            // Reassign users from the deleted group to 'Default'
            allUsers.forEach(u => { if (u.group === groupToDelete) u.group = 'Default'; });
            saveAppData();
            renderGroups();
            renderUsers();
        }
    };

    // --- Initial Setup ---
    const initialize = () => {
        applyTranslations();
        renderGroups();
        renderUsers();
        addUserBtn.addEventListener('click', addUser);
        addGroupBtn.addEventListener('click', addGroup);
    };

    initialize();
});