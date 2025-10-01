function initializeUserManagement(app, translate) {
    const userManagerList = document.getElementById('userManagerList');
    const newUsernameInput = document.getElementById('newUsernameInput');
    const newUserPasswordInput = document.getElementById('newUserPasswordInput');
    const newUserRoleSelect = document.getElementById('newUserRoleSelect');
    const addUserBtn = document.getElementById('addUserBtn');

    const renderUserManager = () => {
        userManagerList.innerHTML = '';
        app.getUsers().forEach((user, index) => {
            const li = document.createElement('li');
            li.className = 'category-manager-item';
            li.innerHTML = `
                <span class="user-list-name">${user.username}</span>
                <div class="category-manager-actions">
                    <select class="user-role-select filter-input" data-username="${user.username}">
                        <option value="regular" ${user.role === 'regular' ? 'selected' : ''}>Regular</option>
                        <option value="beta" ${user.role === 'beta' ? 'selected' : ''}>Beta</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                    <div class="toggle-switch-container">
                        <input type="checkbox" id="user-active-${index}" class="toggle-switch user-active-toggle" data-username="${user.username}" ${user.isActive ? 'checked' : ''}>
                        <label for="user-active-${index}" class="slider"></label>
                    </div>
                    <button class="delete-user-btn" title="Delete" data-username="${user.username}">&times;</button>
                </div>
            `;
            userManagerList.appendChild(li);
        });

        // Add event listeners
        userManagerList.querySelectorAll('.delete-user-btn').forEach(btn => btn.addEventListener('click', deleteUser));
        userManagerList.querySelectorAll('.user-active-toggle').forEach(toggle => toggle.addEventListener('change', toggleUserActiveState));
        userManagerList.querySelectorAll('.user-role-select').forEach(select => select.addEventListener('change', changeUserRole));
    };

    const addUser = () => {
        const username = newUsernameInput.value.trim();
        const password = newUserPasswordInput.value.trim();
        const role = newUserRoleSelect.value;

        if (!username || !password) {
            alert(translate('user_empty_alert'));
            return;
        }

        if (app.getUsers().some(u => u.username === username)) {
            alert(translate('user_exists_alert', { user: username }));
            return;
        }

        const newUser = {
            id: Date.now(),
            username,
            password, // In a real app, this would be hashed
            role,
            isActive: true
        };

        app.updateUsers([...app.getUsers(), newUser]);
        renderUserManager();
        newUsernameInput.value = '';
        newUserPasswordInput.value = '';
    };

    const deleteUser = (e) => {
        const usernameToDelete = e.target.dataset.username;
        
        // Prevent deleting the last admin
        const admins = app.getUsers().filter(u => u.role === 'admin');
        if (admins.length === 1 && admins[0].username === usernameToDelete) {
            alert(translate('delete_last_admin_alert')); // Assuming this key will be added
            return;
        }

        // You might want to add checks here to prevent deleting users with assigned tasks

        if (confirm(translate('delete_user_confirm', { user: usernameToDelete }))) {
            const updatedUsers = app.getUsers().filter(u => u.username !== usernameToDelete);
            app.updateUsers(updatedUsers);
            renderUserManager();
        }
    };

    const toggleUserActiveState = (e) => {
        const username = e.target.dataset.username;
        const users = app.getUsers();
        const user = users.find(u => u.username === username);
        if (user) {
            user.isActive = e.target.checked;
            app.updateUsers(users);
            // No re-render needed for a toggle
        }
    };

    const changeUserRole = (e) => {
        const username = e.target.dataset.username;
        const newRole = e.target.value;
        const users = app.getUsers();

        // Prevent removing the last admin role
        const admins = users.filter(u => u.role === 'admin');
        const user = users.find(u => u.username === username);

        if (user.role === 'admin' && admins.length === 1 && newRole !== 'admin') {
            alert(translate('remove_last_admin_role_alert')); // Assuming this key will be added
            e.target.value = 'admin'; // Revert change
            return;
        }

        if (user) {
            user.role = newRole;
            app.updateUsers(users);
        }
    };

    addUserBtn.addEventListener('click', addUser);

    renderUserManager();
}