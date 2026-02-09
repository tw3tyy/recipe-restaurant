// Authentication Manager
class AuthManager {
    constructor() {
        this.baseURL = 'http://127.0.0.1:5000/api';
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user')) || null;
        this.init();
    }

    init() {
        this.checkServerHealth();
        this.checkAuth();
        this.setupEventListeners();
    }

    async checkServerHealth(retries = 3) {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            if (!response.ok) throw new Error('Server returned ' + response.status);
            console.log('Server is healthy');

            // Remove any existing error notifications if successful
            const existingError = document.getElementById('notification');
            if (existingError && existingError.classList.contains('error')) {
                existingError.classList.remove('show');
            }
        } catch (error) {
            console.error(`Server health check failed (attempts left: ${retries}):`, error);
            if (retries > 0) {
                setTimeout(() => this.checkServerHealth(retries - 1), 2000); // Retry after 2 seconds
            } else {
                this.showNotification('⚠️ Backend Server is NOT reachable. Please run "npm start" in backend folder.', 'error');
            }
        }
    }

    checkAuth() {
        if (this.token && this.user) {
            this.updateNavbar(true);

            // Redirect from auth pages if already logged in
            if (window.location.pathname.includes('login.html') ||
                window.location.pathname.includes('register.html')) {
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 100);
            }
        } else {
            this.updateNavbar(false);

            // Redirect to login if trying to access protected pages
            if (window.location.pathname.includes('dashboard.html') ||
                window.location.pathname.includes('profile.html') ||
                window.location.pathname.includes('add-recipe.html') ||
                window.location.pathname.includes('admin.html')) {
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 100);
            }
        }
    }

    updateNavbar(isLoggedIn) {
        const navbar = document.querySelector('.nav-menu');
        if (!navbar) return;

        if (isLoggedIn) {
            const userName = this.user?.username || 'User';
            const userRole = this.user?.role || 'user';

            navbar.innerHTML = `
                <a href="index.html" class="nav-link">
                    <i class="fas fa-home"></i> Home
                </a>
                <a href="recipes.html" class="nav-link">
                    <i class="fas fa-book"></i> Recipes
                </a>
                <a href="dashboard.html" class="nav-link">
                    <i class="fas fa-tachometer-alt"></i> Dashboard
                </a>
                <a href="add-recipe.html" class="nav-link">
                    <i class="fas fa-plus"></i> Add Recipe
                </a>
                <div class="nav-dropdown">
                    <button class="nav-user" id="userMenuBtn">
                        <img src="${this.user?.profileImage || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userName) + '&background=ff6b6b&color=fff'}" 
                             alt="${userName}" class="user-avatar">
                        <span>${userName}</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="dropdown-menu" id="userMenu">
                        <a href="profile.html" class="dropdown-item">
                            <i class="fas fa-user"></i> Profile
                        </a>
                        ${userRole === 'admin' ? `
                        <a href="admin.html" class="dropdown-item">
                            <i class="fas fa-cog"></i> Admin Panel
                        </a>
                        ` : ''}
                        <hr>
                        <button class="dropdown-item" id="logoutBtn">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </div>
            `;
        } else {
            navbar.innerHTML = `
                <a href="index.html" class="nav-link">
                    <i class="fas fa-home"></i> Home
                </a>
                <a href="recipes.html" class="nav-link">
                    <i class="fas fa-book"></i> Recipes
                </a>
                <a href="dashboard.html" class="nav-link">
                    <i class="fas fa-tachometer-alt"></i> Dashboard
                </a>
                <div class="nav-auth">
                    <a href="login.html" class="btn btn-outline">Login</a>
                    <a href="register.html" class="btn btn-primary">Register</a>
                </div>
            `;
        }

        // Add event listeners for new elements
        this.setupNavbarListeners();
    }

    setupNavbarListeners() {
        // User dropdown
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userMenu = document.getElementById('userMenu');

        if (userMenuBtn && userMenu) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userMenu.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                userMenu.classList.remove('show');
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Mobile menu toggle
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.querySelector('.nav-menu');

        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                    navMenu.classList.remove('active');
                }
            });
        }
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    }

    async handleLogin(e) {
        e.preventDefault();

        const form = e.target;
        const email = form.email.value.trim();
        const password = form.password.value;

        // Clear previous errors
        this.clearErrors();

        // Validation
        let isValid = true;

        if (!this.validateEmail(email)) {
            this.showError('emailError', 'Please enter a valid email address');
            isValid = false;
        }

        if (password.length < 6) {
            this.showError('passwordError', 'Password must be at least 6 characters');
            isValid = false;
        }

        if (!isValid) return;

        // Disable submit button
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                this.token = data.token;
                this.user = data.user;

                this.showNotification(data.message || 'Login successful!', 'success');

                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                this.showNotification(data.message || 'Login failed. Please check your credentials.', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification(`Login failed: ${error.message}`, 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleRegister(e) {
        e.preventDefault();

        const form = e.target;
        const name = form.name.value.trim();
        const email = form.email.value.trim();
        const password = form.password.value;
        const confirmPassword = form.confirmPassword.value;
        const terms = form.terms?.checked || false;

        // Clear previous errors
        this.clearErrors();

        // Validation
        let isValid = true;

        if (name.length < 2) {
            this.showError('nameError', 'Name must be at least 2 characters');
            isValid = false;
        }

        if (!this.validateEmail(email)) {
            this.showError('emailError', 'Please enter a valid email address');
            isValid = false;
        }

        if (password.length < 6) {
            this.showError('passwordError', 'Password must be at least 6 characters');
            isValid = false;
        }

        if (password !== confirmPassword) {
            this.showError('confirmPasswordError', 'Passwords do not match');
            isValid = false;
        }

        if (!terms) {
            this.showError('termsError', 'You must agree to the terms and conditions');
            isValid = false;
        }

        if (!isValid) return;

        // Disable submit button
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: name, email, password })
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                this.token = data.token;
                this.user = data.user;

                this.showNotification(data.message || 'Registration successful!', 'success');

                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
            } else {
                this.showNotification(data.message || 'Registration failed. Please try again.', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification(`Registration failed: ${error.message}. Checked: ${this.baseURL}/auth/register`, 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.token = null;
        this.user = null;

        this.showNotification('Logged out successfully', 'success');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    clearErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
            element.classList.remove('show');
        });
    }

    showError(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.classList.add('show');
        }
    }

    showNotification(message, type = 'info') {
        // Check if notification element exists
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

    async checkToken() {
        if (!this.token) return false;

        try {
            // In a real app, you would verify the token with the server
            // const response = await fetch(`${this.baseURL}/users/profile`, {
            //     headers: { 'Authorization': `Bearer ${this.token}` }
            // });

            // For demo, just check if token exists
            return !!this.token;
        } catch (error) {
            console.error('Token check failed:', error);
            return false;
        }
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});
