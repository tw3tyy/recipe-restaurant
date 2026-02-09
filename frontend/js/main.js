// Main Application Script
class App {
    constructor() {
        this.init();
    }

    init() {
        this.baseURL = 'http://127.0.0.1:5000/api';
        this.allRecipes = []; // Store recipes for search
        this.setupMobileMenu();
        this.loadRecipes();
        this.setupAnimations();
        this.setupEventListeners();
        this.setupSearch(); // Initialize search
    }

    async loadRecipes(filteredRecipes = null) {
        const recipeList = document.getElementById('recipe-list');
        if (!recipeList) return;

        try {
            let recipes;
            if (filteredRecipes) {
                recipes = filteredRecipes;
            } else {
                const response = await fetch(`${this.baseURL}/recipes`);
                this.allRecipes = await response.json();
                recipes = this.allRecipes;
            }

            if (recipes.length > 0) {
                recipeList.innerHTML = recipes.map(recipe => `
                    <div class="recipe-card glass">
                        <img src="${recipe.image || 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=1000'}" alt="${recipe.title}">
                        <div class="badge">${recipe.cuisineType}</div>
                        <h3>${recipe.title}</h3>
                        <p>${this.truncateText(recipe.description, 80)}</p>
                        <a href="recipe-detail.html?id=${recipe._id}" class="btn btn-primary" style="margin-top: 15px;">View Recipe</a>
                    </div>
                `).join('');
                this.setupAnimations(); // Re-run animations for new elements
            } else {
                recipeList.innerHTML = `
                    <div class="empty-state" style="text-align: center; grid-column: 1/-1; padding: 40px;">
                        <i class="fas fa-utensils" style="font-size: 3rem; color: var(--primary); margin-bottom: 20px;"></i>
                        <h3>No recipes shared yet</h3>
                        <p>Be the first to share an authentic Asian dish!</p>
                        <a href="register.html" class="btn btn-primary" style="margin-top: 20px;">Get Started</a>
                    </div>
                `;
            }

        } catch (error) {
            console.error('Error loading recipes:', error);
        }
    }


    setupMobileMenu() {
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.querySelector('.nav-menu');

        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.innerHTML = navMenu.classList.contains('active')
                    ? '<i class="fas fa-times"></i>'
                    : '<i class="fas fa-bars"></i>';
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                    navMenu.classList.remove('active');
                    navToggle.innerHTML = '<i class="fas fa-bars"></i>';
                }
            });

            // Close mobile menu when clicking a link
            navMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('active');
                    navToggle.innerHTML = '<i class="fas fa-bars"></i>';
                });
            });
        }
    }

    setupAnimations() {
        // Animate elements on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements to animate
        document.querySelectorAll('.feature-card, .recipe-card, .stat-card').forEach(el => {
            observer.observe(el);
        });

        // Add animation classes
        const style = document.createElement('style');
        style.textContent = `
            .feature-card,
            .recipe-card,
            .stat-card {
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 0.6s ease, transform 0.6s ease;
            }
            
            .animate-in {
                opacity: 1;
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Back to top button
        this.setupBackToTop();

        // Form validation
        this.setupFormValidation();

        // Image lazy loading
        this.setupLazyLoading();

        // Print recipe functionality
        this.setupPrintFunctionality();
    }

    setupSearch() {
        const searchInput = document.getElementById('homeSearch');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            if (!searchTerm) {
                this.loadRecipes(this.allRecipes);
                return;
            }

            const keywords = searchTerm.split(/\s+/);

            // Rank recipes based on matches
            const scored = this.allRecipes.map(recipe => {
                let score = 0;
                const title = (recipe.title || '').toLowerCase();
                const desc = (recipe.description || '').toLowerCase();
                const cuisine = (recipe.cuisineType || '').toLowerCase();
                const ingredients = (recipe.ingredients || []).map(i => i.toLowerCase()).join(' ');
                const allText = `${title} ${desc} ${cuisine} ${ingredients}`;

                keywords.forEach(word => {
                    if (title.includes(word)) score += 10;
                    if (cuisine.includes(word)) score += 5;
                    if (ingredients.includes(word)) score += 3;
                    if (desc.includes(word)) score += 1;
                });

                // Bonus for matching all keywords
                const matchesAll = keywords.every(word => allText.includes(word));
                if (matchesAll) score += 20;

                return { ...recipe, score };
            });

            // Filter out zero scores and sort by score
            const filtered = scored
                .filter(recipe => recipe.score > 0)
                .sort((a, b) => b.score - a.score);

            this.loadRecipes(filtered);

            // Re-run animations for the new grid layout
            setTimeout(() => this.setupAnimations(), 100);
        });
    }

    setupBackToTop() {
        const backToTop = document.createElement('button');
        backToTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
        backToTop.className = 'back-to-top';
        backToTop.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            z-index: 100;
            box-shadow: var(--shadow-lg);
            transition: var(--transition);
        `;

        document.body.appendChild(backToTop);

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTop.style.display = 'flex';
            } else {
                backToTop.style.display = 'none';
            }
        });
    }

    setupFormValidation() {
        // Add validation to forms
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', (e) => {
                const requiredFields = form.querySelectorAll('[required]');
                let isValid = true;

                requiredFields.forEach(field => {
                    if (!field.value.trim()) {
                        isValid = false;
                        field.style.borderColor = 'var(--danger)';

                        // Add error message
                        let errorMsg = field.nextElementSibling;
                        if (!errorMsg || !errorMsg.classList.contains('error-message')) {
                            errorMsg = document.createElement('div');
                            errorMsg.className = 'error-message';
                            field.parentNode.appendChild(errorMsg);
                        }
                        errorMsg.textContent = 'This field is required';
                        errorMsg.classList.add('show');

                        // Remove error on input
                        field.addEventListener('input', function () {
                            this.style.borderColor = '';
                            if (errorMsg) {
                                errorMsg.classList.remove('show');
                            }
                        }, { once: true });
                    }
                });

                if (!isValid) {
                    e.preventDefault();
                    this.showNotification('Please fill in all required fields', 'error');
                }
            });
        });
    }

    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const lazyImages = document.querySelectorAll('img[data-src]');

            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            });

            lazyImages.forEach(img => imageObserver.observe(img));
        }
    }

    setupPrintFunctionality() {
        // Add print button to recipe pages
        if (window.location.pathname.includes('recipe-detail')) {
            const printBtn = document.createElement('button');
            printBtn.innerHTML = '<i class="fas fa-print"></i> Print Recipe';
            printBtn.className = 'btn btn-outline';
            printBtn.style.margin = '1rem 0';

            printBtn.addEventListener('click', () => {
                window.print();
            });

            const recipeContent = document.querySelector('.recipe-content');
            if (recipeContent) {
                recipeContent.prepend(printBtn);
            }
        }
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

    // Utility function to get URL parameters
    getUrlParams() {
        const params = {};
        const queryString = window.location.search.slice(1);
        const pairs = queryString.split('&');

        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) {
                params[decodeURIComponent(key)] = decodeURIComponent(value || '');
            }
        });

        return params;
    }

    // Utility function to format date
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Utility function to truncate text
    truncateText(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();

    // Check if user is logged in for protected pages
    const protectedPages = ['dashboard.html', 'profile.html', 'add-recipe.html', 'admin.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (protectedPages.includes(currentPage)) {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        if (!token || !user) {
            window.location.href = 'login.html';
        }
    }

    // Add active class to current page in navigation
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPath.split('/').pop()) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

// Add some global helper functions
window.helpers = {
    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    },

    getCuisineColor(cuisine) {
        const colors = {
            'Chinese': '#e53935',
            'Japanese': '#d81b60',
            'Korean': '#3178c6',
            'Thai': '#ff9800',
            'Vietnamese': '#4caf50',
            'Indian': '#ff9933'
        };
        return colors[cuisine] || '#6c757d';
    },

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};
