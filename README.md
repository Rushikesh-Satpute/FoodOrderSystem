# 🍽️ FoodOrder — AI-Powered Food Ordering System

A full-stack food ordering application with **AI-powered semantic search**, **auto-generated menu details**, and a complete **order management workflow**. Built with React, FastAPI, MongoDB, and Google Gemini AI.

> 📄 **Interview Report & PPT Guide:** See [`REPORT.md`](./REPORT.md) and [`REPORT-PART2.md`](./REPORT-PART2.md) for a complete project report with architecture details, AI implementation deep-dive, expected interview Q&A, and 5-slide PPT guide.

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?style=flat&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.0-4285F4?style=flat&logo=google&logoColor=white)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Environment Variables](#environment-variables)
  - [Database Seeding](#database-seeding)
- [API Endpoints](#-api-endpoints)
- [AI Features](#-ai-features)
- [Order Workflow](#-order-workflow)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🛒 Customer Side
- **AI-Powered Search** — Type natural language queries like *"something spicy"* or *"light lunch, not fried"* and get semantically relevant results ranked by match quality
- **Browse Menu by Category** — Items organized into Starters, Main Course, Breads, Desserts, Beverages, Snacks
- **Beautiful Food Cards** — Each item shows image, description, price (₹ INR), dietary tags (vegetarian/non-vegetarian indicators), and category
- **Smart Cart** — Add/remove items, adjust quantities, see real-time total — persisted in `localStorage` across sessions
- **Order Tracking** — Real-time status updates with visual progress bar (auto-refreshes every 5 seconds)
- **Order History** — View all past and current orders in the "My Orders" tab

### 🔧 Admin Side
- **Dashboard** — Today's revenue, total orders, active orders, order counts by status, top popular items
- **Menu Management (CRUD)** — Add, edit, delete menu items with a beautiful modal form
  - **AI Auto-Fill** — Toggle ON: just enter name + price, AI generates description, category, and dietary tags
  - **Manual Mode** — Toggle OFF: fill in description, category, dietary tags, and image URL manually
  - **Availability Toggle** — Toggle items on/off to show/hide from customers
- **Order Management** — View all orders grouped by status, advance order status, cancel orders at any time
- **Sorted Listings** — Active/available items shown first in the menu list

### 🤖 AI Capabilities
- **Semantic Vector Search** — Uses Google Gemini embeddings (`gemini-embedding-001`, 3072 dimensions) with local cosine similarity scoring
- **Smart Query Processing** — Parses exclusion patterns (`"not fried"`, `"no spice"`, `"without dairy"`) and filters results accordingly
- **Auto Menu Generation** — Gemini 2.0 Flash generates appetizing descriptions, categories, and dietary tags from just a dish name
- **Fallback System** — Keyword-based inference when AI API is unavailable, ensuring the app always works

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, React Router 7, Tailwind CSS 4, Lucide React, Axios |
| **Backend** | FastAPI (Python), Pydantic, Uvicorn |
| **Database** | MongoDB (via Motor async driver) |
| **AI/ML** | Google Gemini 2.0 Flash (text generation), Gemini Embedding 001 (vector search) |
| **Build Tool** | Vite 8 |
| **Language** | JavaScript (ES6+), Python 3.11+ |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│          React 19 + Vite + Tailwind              │
│                                                  │
│   ┌──────────────┐       ┌──────────────────┐   │
│   │ CustomerPage │       │    AdminPage      │   │
│   │  - AI Search │       │  - Dashboard      │   │
│   │  - Menu      │       │  - Menu CRUD      │   │
│   │  - Cart      │       │  - Orders         │   │
│   │  - Orders    │       │                   │   │
│   └──────┬───────┘       └────────┬──────────┘   │
│          │    Axios (proxy /api)  │               │
├──────────┼────────────────────────┼───────────────┤
│          ▼                        ▼               │
│   ┌──────────────────────────────────────────┐   │
│   │              FastAPI Backend              │   │
│   │          http://localhost:8000             │   │
│   │                                           │   │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│   │  │ Customer │ │  Admin   │ │  Search  │  │   │
│   │  │  Routes  │ │  Routes  │ │  Routes  │  │   │
│   │  └────┬─────┘ └────┬─────┘ └────┬─────┘  │   │
│   │       │             │            │         │   │
│   │  ┌────▼─────────────▼────┐ ┌─────▼─────┐  │   │
│   │  │    MongoDB (Motor)    │ │ AI Service│  │   │
│   │  │   menu_items, orders  │ │  Gemini   │  │   │
│   │  └───────────────────────┘ └───────────┘  │   │
│   └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
D:\KpiTech\
├── backend/
│   ├── .env                     # Environment variables
│   ├── ai_service.py            # Google Gemini AI integration
│   ├── database.py              # MongoDB connection (Motor)
│   ├── main.py                  # FastAPI entry point
│   ├── models.py                # Pydantic data models
│   ├── requirements.txt         # Python dependencies
│   ├── seed.py                  # Database seeder (7 Indian dishes)
│   └── routes/
│       ├── __init__.py
│       ├── admin.py             # Admin CRUD, orders, dashboard
│       ├── customer.py          # Customer menu, order placement
│       └── search.py            # AI semantic search engine
│
└── frontend/
    ├── index.html               # HTML entry point
    ├── package.json             # Node.js dependencies
    ├── vite.config.js           # Vite + React + Tailwind + API proxy
    ├── public/
    │   ├── favicon.svg
    │   └── icons.svg
    └── src/
        ├── api.js               # Axios instance (baseURL: /api)
        ├── App.jsx              # Router with navigation
        ├── index.css            # Tailwind CSS
        ├── main.jsx             # React entry point
        ├── assets/
        │   └── logo.avif
        └── pages/
            ├── AdminPage.jsx    # Admin dashboard + menu + orders
            └── CustomerPage.jsx # Customer search + menu + cart + orders
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **MongoDB** running locally on port `27017` (or a MongoDB Atlas connection string)
- **Google Gemini API Key** — Get one free at [Google AI Studio](https://ai.google.dev/)

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment (optional but recommended)
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# Install dependencies
python -m pip install -r requirements.txt

# Set up environment variables (see below)
cp .env.example .env
# Edit .env with your API keys

# Seed the database with sample items
python seed.py

# Start the backend server
python -m uvicorn main:app --reload
```

Backend runs at **http://localhost:8000**

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at **http://localhost:5173** and proxies API requests to the backend.

### Environment Variables

Create `backend/.env` with:

```env
# Google Gemini API Key (required for AI features)
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB connection
MONGO_URL=mongodb://localhost:27017
DB_NAME=food_ordering
```

### Database Seeding

The `seed.py` script populates the database with 7 pre-configured Indian dishes, each with Gemini-generated embeddings:

```bash
cd backend
python seed.py
```

**Seeded Items:**
| Dish | Price (₹) | Category | Tags |
|------|-----------|----------|------|
| Paneer Butter Masala | 240 | Main Course | vegetarian, spicy |
| Chicken Tikka Masala | 320 | Main Course | non-vegetarian, spicy |
| Garlic Naan | 45 | Breads | vegetarian |
| Samosa | 80 | Starters | vegetarian |
| Masala Dosa | 120 | Main Course | vegetarian |
| Mango Lassi | 90 | Beverages | vegetarian |
| Gulab Jamun | 70 | Desserts | vegetarian |

---

## 📡 API Endpoints

### Customer Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/menu` | Get all available menu items grouped by category |
| `POST` | `/orders` | Place a new order |
| `GET` | `/orders/{id}` | Get order details by ID |
| `POST` | `/search` | AI-powered semantic menu search |

### Admin Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/menu` | Get ALL menu items (including unavailable) |
| `POST` | `/admin/menu` | Create a new menu item |
| `PUT` | `/admin/menu/{id}` | Update a menu item |
| `DELETE` | `/admin/menu/{id}` | Delete a menu item |
| `GET` | `/admin/orders` | Get all orders (sorted by newest first) |
| `PATCH` | `/admin/orders/{id}/status` | Advance order to next status |
| `DELETE` | `/admin/orders/{id}` | Cancel/delete an order |
| `GET` | `/admin/dashboard` | Get dashboard stats (revenue, counts, top items) |

---

## 🤖 AI Features

### Semantic Search

The search engine combines **vector embeddings** with **text matching** for intelligent results:

1. **Query Processing** — Parses exclusion patterns (`"not fried"` → excludes fried items)
2. **Embedding Generation** — Converts the cleaned query to a 3072-dimensional vector via Gemini
3. **Cosine Similarity** — Compares query embedding against all menu item embeddings
4. **Score Blending** — 70% embedding similarity + 30% text matching for final ranking
5. **Dynamic Cutoff** — Only returns items scoring within 80% of the top result

**Example Queries:**
- `"light meal"` → Returns Masala Dosa, Mango Lassi
- `"something sweet"` → Returns Gulab Jamun, Mango Lassi
- `"cold drink"` → Returns Mango Lassi
- `"a light lunch that is not fried"` → Returns Masala Dosa, Mango Lassi (Samosa excluded)
- `"spicy food"` → Returns Chicken Tikka Masala, Samosa

### Auto Menu Generation

When adding a new item with AI enabled, Gemini 2.0 Flash generates:
- **Description** — Appetizing 2-3 sentence description
- **Category** — Starters, Main Course, Breads, Desserts, Beverages, or Snacks
- **Dietary Tags** — vegetarian, non-vegetarian, spicy, mild, vegan, gluten-free, dairy-free

**Fallback:** If the Gemini API is unavailable, keyword-based inference assigns correct tags using a curated Indian food database (40+ vegetarian keywords, category mappings).

---

## 📦 Order Workflow

Orders follow a strict sequential status flow:

```
┌─────────┐    ┌───────────┐    ┌───────────┐    ┌───────┐    ┌───────────┐
│  Placed  │───▶│ Confirmed │───▶│ Preparing │───▶│ Ready │───▶│ Picked Up │
└─────────┘    └───────────┘    └───────────┘    └───────┘    └───────────┘
```

- **Placed** → Order just created by customer
- **Confirmed** → Admin acknowledges the order
- **Preparing** → Kitchen is working on it
- **Ready** → Order is ready for pickup
- **Picked Up** → Customer has collected the order

**Admin Controls:**
- **Advance** — Move order to the next status (only forward, no skipping)
- **Cancel** — Delete the order at any time (with confirmation)

**Customer View:**
- Real-time progress bar updates every 5 seconds
- Order history persists across browser sessions via `localStorage`

---

## 📄 License

This project is for educational purposes.

---

## 🙏 Acknowledgements

- [Google Gemini API](https://ai.google.dev/) — AI text generation and embeddings
- [FastAPI](https://fastapi.tiangolo.com/) — Modern Python web framework
- [MongoDB](https://www.mongodb.com/) — NoSQL database
- [React](https://react.dev/) — Frontend UI library
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework
- [Vite](https://vite.dev/) — Next-generation frontend build tool
- [Lucide React](https://lucide.dev/) — Beautiful open-source icons
