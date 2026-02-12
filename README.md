# Asian Food Explorer 🍜

A full-stack web application for discovering and sharing authentic Asian recipes. Built with Node.js, Express, MongoDB, and modern frontend technologies.

## Project Overview

Asian Food Explorer is designed for food enthusiasts to explore various Asian cuisines, from Spicy Szechuan to Savory Sushi. Users can register to share their own culinary creations, manage their profile, and interact with a community of food lovers.

### Key Features
- **User Authentication**: Secure register and login with JWT and bcrypt.
- **Recipe Management**: Create, read, update, and delete (CRUD) recipes.
- **User Profiles**: Personalized profiles with bio and recipe history.
- **Search & Filter**: Find recipes by title, cuisine type, or ingredients.
- **Responsive Design**: Fully functional on desktop, tablet, and mobile.
- **RBAC**: Role-based access (User, Premium, Admin).
- **Email Integration**: Auto-welcome emails upon registration.

## 🌐 Live Demo
The application is deployed and available at:
� **[https://recipe-restaurant-1.onrender.com](https://recipe-restaurant-1.onrender.com)**

## �🛠️ Set up Instructions

### Prerequisites
- Node.js installed
- MongoDB Atlas account (for cloud database)
- SMTP service account

### Steps
1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd recipe-restaurant
   ```

2. **Install dependencies**:
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   # (No npm install needed as it uses vanilla JS and CSS)
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   MONGO_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_secret_key
   PORT=5000
   SMTP_HOST=your_smtp_host
   SMTP_PORT=587
   SMTP_EMAIL=your_email
   SMTP_PASSWORD=your_password
   FROM_NAME="Asian Food Explorer"
   FROM_EMAIL="noreply@asianfood.com"
   ```

4. **Run the application**:
   ```bash
   cd backend
   npm start
   ```
   The server will start on port 5001 and serve the frontend statically. Open `http://localhost:5001` in your browser.

## 📖 API Documentation

### Authentication (Public)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT |

### User Management (Private)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/users/profile` | Get current user's profile |
| PUT | `/api/users/profile` | Update current user's profile |

### Recipe Management (Private/Public)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/api/recipes` | Get all recipes | No |
| POST | `/api/recipes` | Create a new recipe | Yes |
| GET | `/api/recipes/:id` | Get recipe by ID | No |
| PUT | `/api/recipes/:id` | Update a recipe | Yes (Owner) |
| DELETE | `/api/recipes/:id` | Delete a recipe | Yes (Owner/Admin) |



## 📸 Screenshots

### 🏠 Landing Page
![Landing Page](screenshots/landing_page.png)
*Modern hero section with active search functionality.*

### 📚 Recipes Listing
![Recipes Page](screenshots/recipes_page.png)
*Browse and filter authentic Asian dishes by category.*

### 🔐 Authentication (Login & Register)

![Login Page](screenshots/login_page.png)
*Secure login flow.*

![Register Page](screenshots/register_page.png)
*User registration with validation.*
