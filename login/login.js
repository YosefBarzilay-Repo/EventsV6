document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    
    // If already logged in, redirect to the main app
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = '../index.html';
    }

    const getAppUsers = async () => {
        try {
            // First, try to get users from the main app's storage, as it may have updates.
            const appDataString = localStorage.getItem('appData');
            if (appDataString) {
                const appData = JSON.parse(appDataString);
                if (appData.allUsers && appData.allUsers.length > 0) {
                    return appData.allUsers;
                }
            }
            // If not in storage, fetch from the JSON file.
            const response = await fetch('../settings/usersAndRoles/UsersAndRoles.json');
            return await response.json();
        } catch (e) {
            console.error("Could not load user data:", e);
            return [{ username: '1', password: '1', role: 'admin', isActive: true }]; // Fallback
        }
    };

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = loginForm.username.value;
        const password = loginForm.password.value;
        const users = await getAppUsers();

        const user = users.find(u => u.username === username && u.password === password);

        if (user && user.isActive) {
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('loggedInUser', JSON.stringify({ username: user.username, role: user.role }));
            window.location.href = '../index.html'; // Redirect to the main app
        } else {
            errorMessage.textContent = user && !user.isActive ? 'This user account is inactive.' : 'Invalid username or password.';
        }
    });
});