// Dashboard Manager
class DashboardManager {
    constructor() {
        this.baseURL = 'http://127.0.0.1:5000/api';
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user')) || null;
        this.init();
    }

    init() {
        if (!this.token || !this.user) {
            window.location.href = 'login.html';
            return;
        }

        this.loadDashboardData();
        this.setupEventListeners();
    }

    async loadDashboardData() {
        try {
            // Load user profile
            await this.loadUserProfile();

            // Load user recipes & stats
            await this.loadUserRecipes();

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Failed to load dashboard data', 'error');
        }
    }

    async loadUserProfile() {
        try {
            const response = await fetch(`${this.baseURL}/users/profile`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch profile');
            const userData = await response.json();
            this.updateUserProfile(userData);
        } catch (error) {
            console.error('Error loading profile:', error);
            // Fallback to local storage if API fails
            this.updateUserProfile(this.user);
        }
    }

    updateUserProfile(user) {
        // Update welcome message
        const welcomeEl = document.getElementById('welcomeMessage');
        if (welcomeEl) {
            welcomeEl.innerHTML = `
                <h1>Welcome back, ${user.username || user.name || 'User'}!</h1>
                <p>${user.bio || 'Share your favorite Asian recipes with the community.'}</p>
            `;
        }

        // Update profile info in navbar
        const userMenuBtn = document.querySelector('.nav-user');
        if (userMenuBtn) {
            const img = userMenuBtn.querySelector('img');
            const span = userMenuBtn.querySelector('span');

            if (img) img.src = user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=ff6b6b&color=fff`;
            if (span) span.textContent = user.username || user.name || 'User';
        }
    }

    async loadUserRecipes() {
        try {
            const response = await fetch(`${this.baseURL}/recipes`);
            const allRecipes = await response.json();

            // Filter recipes belonging to the current user
            const userRecipes = allRecipes.filter(r => r.author?._id === this.user.id || r.author === this.user.id);

            this.displayUserRecipes(userRecipes);

            // Calculate real stats
            const stats = {
                totalRecipes: userRecipes.length,
                totalViews: userRecipes.reduce((sum, r) => sum + (r.views || 0), 0),
                avgRating: userRecipes.length > 0
                    ? (userRecipes.reduce((sum, r) => sum + (r.rating || 0), 0) / userRecipes.length).toFixed(1)
                    : "0.0",
                favorites: userRecipes.reduce((sum, r) => sum + (r.likesCount || 0), 0)
            };

            this.updateStats(stats);
        } catch (error) {
            console.error('Error loading user recipes:', error);
            this.displayUserRecipes([]);
        }
    }

    displayUserRecipes(recipes) {
        const container = document.getElementById('userRecipes');
        if (!container) return;

        if (recipes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-utensils"></i>
                    <h3>No Recipes Yet</h3>
                    <p>Start by adding your first recipe!</p>
                    <a href="add-recipe.html" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Add Recipe
                    </a>
                </div>
            `;
            return;
        }

        container.innerHTML = recipes.map(recipe => `
            <div class="recipe-card glass">
                <img src="${recipe.image || 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80'}" alt="${recipe.title}" class="recipe-image">
                <div class="recipe-content">
                    <div class="recipe-header">
                        <span class="recipe-cuisine ${recipe.cuisineType.toLowerCase()}">
                            ${recipe.cuisineType}
                        </span>
                        <span class="status-badge published">
                            Published
                        </span>
                    </div>
                    
                    <h3 class="recipe-title">${recipe.title}</h3>
                    
                    <div class="recipe-meta">
                        <span><i class="fas fa-clock"></i> 30min</span>
                        <span><i class="fas fa-eye"></i> ${recipe.views || 0}</span>
                        <span><i class="fas fa-star"></i> ${recipe.rating || 0}</span>
                    </div>
                    
                    <div class="recipe-actions">
                        <a href="edit-recipe.html?id=${recipe._id}" class="btn btn-outline btn-sm">
                            <i class="fas fa-edit"></i> Edit
                        </a>
                        <button class="btn btn-danger btn-sm delete-recipe" data-id="${recipe._id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Add delete event listeners
        container.querySelectorAll('.delete-recipe').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const recipeId = e.currentTarget.dataset.id;
                this.deleteRecipe(recipeId);
            });
        });
    }

    async loadDashboardStats() {
        // Function removed - logic moved to loadUserRecipes for real-time updates
    }

    updateStats(stats) {
        // Animate stats counting
        Object.keys(stats).forEach(statId => {
            const element = document.getElementById(statId);
            if (element) {
                this.animateValue(element, 0, stats[statId], 1000, statId);
            }
        });
    }

    animateValue(element, start, end, duration, statId) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = statId === 'avgRating' ? value.toFixed(1) : value;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    async deleteRecipe(recipeId) {
        if (!confirm('Are you sure you want to delete this recipe?')) {
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/recipes/${recipeId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!response.ok) throw new Error('Failed to delete');

            this.showNotification('Recipe deleted successfully', 'success');

            // Reload recipes
            this.loadUserRecipes();
        } catch (error) {
            console.error('Error deleting recipe:', error);
            this.showNotification('Failed to delete recipe', 'error');
        }
    }

    setupEventListeners() {
        // Quick actions
        document.querySelectorAll('.action-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const href = card.getAttribute('href');
                if (href) {
                    window.location.href = href;
                }
            });
        });

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.showNotification('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }

    showNotification(message, type = 'info') {
        let notification = document.getElementById('notification');

        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            document.body.appendChild(notification);
        }

        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            info: 'info-circle'
        };

        notification.innerHTML = `
            <i class="fas fa-${icons[type] || 'info-circle'}"></i>
            <span>${message}</span>
        `;
        notification.className = `notification ${type} show`;

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname;
    if (currentPage.includes('dashboard.html') ||
        currentPage.includes('profile.html') ||
        currentPage.includes('add-recipe.html') ||
        currentPage.includes('edit-recipe.html')) {
        window.dashboardManager = new DashboardManager();
    }
});
