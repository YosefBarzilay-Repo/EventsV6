function initializeCategoryManagement(app, translate) {
    const categoryManagerList = document.getElementById('categoryManagerList');
    const newCategoryInput = document.getElementById('newCategoryInput');
    const addCategoryBtn = document.getElementById('addCategoryBtn');

    const renderCategoryManager = () => {
        const categories = app.getCategories();
        categoryManagerList.innerHTML = '';
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
            categoryManagerList.appendChild(li);
        });

        categoryManagerList.querySelectorAll('.edit-cat-btn').forEach(btn => btn.addEventListener('click', editCategory));
        categoryManagerList.querySelectorAll('.delete-cat-btn').forEach(btn => btn.addEventListener('click', deleteCategory));
    };

    const addCategory = () => {
        const newCat = newCategoryInput.value.trim();
        const categories = app.getCategories();
        if (newCat && !categories.includes(newCat)) {
            const updatedCategories = [...categories, newCat];
            app.updateCategories(updatedCategories);
            renderCategoryManager();
            newCategoryInput.value = '';
        } else if (!newCat) {
            alert(translate('category_empty_alert'));
        } else {
            alert(translate('category_exists_alert', { cat: newCat }));
        }
    };

    const editCategory = (e) => {
        const oldCat = e.target.dataset.cat;
        const newCat = prompt(translate('rename_category_prompt', { cat: oldCat }), oldCat);
        const categories = app.getCategories();

        if (newCat && newCat.trim() !== '' && newCat !== oldCat) {
            if (categories.includes(newCat)) {
                alert(translate('category_exists_alert', { cat: newCat }));
                return;
            }
            const catIndex = categories.indexOf(oldCat);
            if (catIndex > -1) {
                const updatedCategories = [...categories];
                updatedCategories[catIndex] = newCat;
                app.updateCategories(updatedCategories, oldCat, newCat); // Pass old/new for task updates
                renderCategoryManager();
            }
        }
    };

    const deleteCategory = (e) => {
        const catToDelete = e.target.dataset.cat;
        const hasActiveTasks = app.getTasks().some(t => t.category === catToDelete && t.status !== 'Done' && !t.isArchived);

        if (hasActiveTasks) {
            alert(translate('delete_category_active_alert', { cat: catToDelete }));
            return;
        }

        if (confirm(translate('delete_category_confirm', { cat: catToDelete }))) {
            const updatedCategories = app.getCategories().filter(c => c !== catToDelete);
            app.updateCategories(updatedCategories, catToDelete, 'Other'); // Reassign tasks
            renderCategoryManager();
        }
    };

    addCategoryBtn.addEventListener('click', addCategory);
    renderCategoryManager();
}