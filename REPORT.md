# 📊 FoodOrder — Complete Project Report
## AI-Powered Food Ordering System

> **Prepared for:** Interview Presentation & PPT Slides  
> **Date:** June 2026  
> **Duration:** ~15-20 min presentation

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement & Motivation](#2-problem-statement--motivation)
3. [Architecture & System Design](#3-architecture--system-design)
4. [Technology Stack (In-Depth)](#4-technology-stack-in-depth)
5. [Database Design](#5-database-design)
6. [Features & Functionalities](#6-features--functionalities)
7. [Data Flow & API Design](#7-data-flow--api-design)
8. [AI/ML Implementation (Deep Dive)](#8-aiml-implementation-deep-dive)
9. [Programming Approaches & Methods](#9-programming-approaches--methods)
10. [How Operations Are Handled Programmatically](#10-how-operations-are-handled-programmatically)
11. [Code Architecture & Design Patterns](#11-code-architecture--design-patterns)
12. [Security & Error Handling](#12-security--error-handling)
13. [Expected Interviewer Questions & Answers](#13-expected-interviewer-questions--answers)
14. [Limitations](#14-limitations)
15. [Advantages & Disadvantages](#15-advantages--disadvantages)
16. [Future Scope & Improvements](#16-future-scope--improvements)
17. [PPT Slide Guide (4-5 Slides)](#17-ppt-slide-guide-4-5-slides)

---

## 1. Project Overview

**FoodOrder** is a full-stack, AI-powered food ordering platform that demonstrates modern web development practices combining:

- **React 19** frontend with responsive UI
- **FastAPI** backend with async Python
- **MongoDB** for flexible document storage
- **Google Gemini AI** for intelligent features

### What Makes This Project Unique

Unlike traditional food ordering apps, this project integrates **AI at its core**:
- Customers can search using **natural language** ("something spicy, not fried")
- Admin can **auto-generate** menu descriptions using AI
- The search uses **vector embeddings** (3072 dimensions) for semantic understanding

### Key Metrics
| Metric | Value |
|--------|-------|
| Frontend Components | 2 main pages + helpers |
| Backend Routes | 11 API endpoints |
| AI Models Used | 2 (Gemini Flash + Embedding) |
| Database Collections | 2 (menu_items, orders) |
| Total Lines of Code | ~3,000+ |

---

## 2. Problem Statement & Motivation

### Problem
Traditional food ordering apps have:
- **Keyword-only search** — searching "light meal" won't find "Masala Dosa"
- **Manual data entry** — admins must write every description, category, tag
- **No semantic understanding** — apps can't understand "not spicy" or "something healthy"

### Solution
This project solves these with AI:
- **Semantic vector search** understands meaning, not just keywords
- **AI auto-generation** creates descriptions and tags from just a dish name
- **Exclusion-aware queries** handle "not fried", "no dairy", "without gluten"

### Real-World Relevance
- Zomato, Swiggy, DoorDash all use similar AI search
- Menu auto-generation reduces restaurant onboarding time
- Semantic search improves customer satisfaction and order conversion

---

## 3. Architecture & System Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                         │
│                                                          │
│  ┌──────────────────┐          ┌───────────────────┐    │
│  │   Customer Page   │          │    Admin Page      │    │
│  │                   │          │                    │    │
│  │ • AI Search Bar   │          │ • Dashboard Stats  │    │
│  │ • Menu Browser    │          │ • Menu CRUD Modal  │    │
│  │ • Smart Cart      │          │ • Orders Manager   │    │
│  │ • Order Tracker   │          │ • Availability     │    │
│  │ • Order History   │          │   Toggle           │    │
│  └────────┬─────────┘          └─────────┬──────────┘    │
│           │         React 19 + Vite       │              │
│           │      Tailwind CSS 4 + Router  │              │
├───────────┼───────────────────────────────┼──────────────┤
│           ▼          PROXY LAYER          ▼              │
│    ┌──────────────────────────────────────────────┐      │
│    │  Vite Dev Proxy: /api → http://localhost:8000 │      │
│    └──────────────────────┬───────────────────────┘      │
├───────────────────────────┼──────────────────────────────┤
│                     SERVER LAYER                          │
│                           ▼                               │
│  ┌──────────────────────────────────────────────────┐    │
│  │              FastAPI Application                   │    │
│  │                                                   │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │    │
│  │  │  Customer    │ │   Admin     │ │   Search   │ │    │
│  │  │  Router      │ │   Router    │ │   Router   │ │    │
│  │  │  (3 routes)  │ │  (7 routes) │ │  (1 route) │ │    │
│  │  └──────┬──────┘ └──────┬──────┘ └─────┬──────┘ │    │
│  └─────────┼───────────────┼───────────────┼────────┘    │
│            │               │               │              │
├────────────┼───────────────┼───────────────┼──────────────┤
│            ▼               ▼               ▼              │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐    │
│  │   MongoDB    │  │   MongoDB   │  │ Google Gemini │    │
│  │  menu_items  │  │   orders    │  │   AI API      │    │
│  │  (with vecs) │  │             │  │               │    │
│  └─────────────┘  └─────────────┘  └───────────────┘    │
│                     DATA LAYER                            │
└─────────────────────────────────────────────────────────┘
```

### Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Backend Framework | FastAPI | Async support, auto-docs, Pydantic validation |
| Frontend Framework | React 19 | Component-based, hooks, large ecosystem |
| Database | MongoDB | Schema flexibility for varying menu items |
| ORM/Driver | Motor (async) | Non-blocking MongoDB access for FastAPI |
| AI Provider | Google Gemini | Free tier, fast inference, embedding support |
| CSS Framework | Tailwind CSS | Rapid prototyping, utility-first approach |
| Build Tool | Vite | Fast HMR, ESM-native, modern tooling |

---

## 4. Technology Stack (In-Depth)

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2 | Component-based UI with hooks (useState, useEffect, useRef) |
| **React Router** | 7.18 | Client-side routing (BrowserRouter, NavLink, Routes) |
| **Tailwind CSS** | 4.3 | Utility-first CSS with @tailwindcss/vite plugin |
| **Axios** | 1.18 | HTTP client with proxy support for API calls |
| **Lucide React** | 1.21 | 22+ icons (Search, ShoppingCart, Plus, Trash2, etc.) |
| **Vite** | 8.1 | Build tool with HMR, proxy config, React plugin |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.138 | Async web framework with OpenAPI auto-docs |
| **Pydantic** | 2.13 | Data validation & serialization for request/response |
| **Motor** | 3.7 | Async MongoDB driver (non-blocking I/O) |
| **Uvicorn** | 0.49 | ASGI server with hot-reload support |
| **python-dotenv** | 1.2 | Environment variable loading from .env files |
| **google-genai** | 2.10 | Google Gemini API client for AI features |

### AI/ML

| Model | Purpose | Dimensions |
|-------|---------|------------|
| **Gemini 2.0 Flash** | Text generation (descriptions, categories, tags) | N/A |
| **Gemini Embedding 001** | Vector embeddings for semantic search | 3072 |

### Database

| Component | Details |
|-----------|---------|
| **MongoDB** | NoSQL document database |
| **Motor** | Async Python driver for MongoDB |
| **Collections** | `menu_items`, `orders` |
| **Indexes** | `_id` (default), `is_available`, `status`, `created_at` |

---

## 5. Database Design

### Collection: `menu_items`

```javascript
{
  _id: ObjectId,              // Auto-generated MongoDB ID
  name: String,               // "Paneer Butter Masala"
  description: String,        // "Rich and creamy curry..."
  category: String,           // "Main Course"
  price: Number,              // 240.00
  dietary_tags: [String],     // ["vegetarian", "spicy"]
  is_available: Boolean,      // true / false
  image_url: String,          // "https://images.unsplash.com/..."
  embedding: [Float]          // [0.023, -0.015, ...] (3072 dims)
}
```

**Why `embedding` field?**  
Stores the vector representation of the item's text (name + description + category + tags). Used for cosine similarity during search.

### Collection: `orders`

```javascript
{
  _id: ObjectId,
  items: [{                   // Array of ordered items
    menu_item_id: String,     // Reference to menu_items._id
    name: String,             // "Paneer Butter Masala" (denormalized)
    quantity: Number,         // 2
    price: Number             // 240.00 (denormalized at order time)
  }],
  total_price: Number,        // 480.00
  status: String,             // "Placed" | "Confirmed" | "Preparing" | "Ready" | "Picked Up"
  created_at: DateTime        // ISO timestamp
}
```

**Design Decisions:**
- **Denormalized `name` and `price`** in order items — captures the price at order time, not current menu price
- **No user authentication** — simplified for demo; orders tracked via localStorage on client
- **Status is a string enum** — validated in Pydantic model, not enforced at DB level

### Why MongoDB?

1. **Flexible schema** — Menu items can have different fields (some with images, some without)
2. **Natural JSON** — Maps directly to Python dicts / Pydantic models
3. **Embedding storage** — Can store large float arrays directly in documents
4. **Aggregation pipeline** — Used for dashboard stats (group by status, sum revenue)
5. **No joins needed** — Orders embed item details directly

---

## 6. Features & Functionalities

### Customer Features

| Feature | Implementation | Details |
|---------|---------------|---------|
| **AI Semantic Search** | POST `/search` | Gemini embeddings + cosine similarity + text scoring |
| **Exclusion Queries** | Regex parsing | "not fried" → excludes fried items |
| **Menu Browsing** | GET `/menu` | Items grouped by category, sorted by availability |
| **Add to Cart** | localStorage | Cart persists across sessions |
| **Quantity Management** | React state | Increment/decrement/remove with cart total |
| **Place Order** | POST `/orders` | Validates items exist and are available |
| **Order Tracking** | Polling (5s) | Real-time status with visual progress bar |
| **Order History** | GET `/orders/{id}` | All past orders in "My Orders" tab |

### Admin Features

| Feature | Implementation | Details |
|---------|---------------|---------|
| **Dashboard** | GET `/admin/dashboard` | Revenue, order counts, top items |
| **Menu CRUD** | POST/PUT/DELETE | Full create, read, update, delete |
| **AI Auto-Fill** | Gemini Flash | Name + price → description, category, tags |
| **Manual Entry** | Form toggle | When AI is OFF, fill all fields manually |
| **Edit Items** | PUT `/admin/menu/{id}` | Pre-fills modal with existing data |
| **Availability Toggle** | PUT with `is_available` | Soft toggle (no deletion) |
| **Cancel Orders** | DELETE `/admin/orders/{id}` | Removes order from database |
| **Advance Status** | PATCH status | Sequential only: Placed→Confirmed→...→PickedUp |
| **Sorted Listings** | Frontend sort | Available items shown first |

### AI Features

| Feature | Model | How It Works |
|---------|-------|-------------|
| **Menu Auto-Generation** | Gemini 2.0 Flash | Prompt → JSON response with description, category, tags |
| **Vector Embeddings** | Gemini Embedding 001 | Text → 3072-dim vector for similarity search |
| **Semantic Search** | Both models | Embedding search (70%) + text scoring (30%) |
| **Exclusion Handling** | Regex + filtering | Parse "not X" → filter items matching X |
| **Keyword Fallback** | Custom inference | When API fails, keyword matching still works |

---

## 7. Data Flow & API Design

### Flow 1: Customer Places an Order

```
Customer                    Frontend                   Backend                  Database
   │                           │                         │                        │
   │  1. Add items to cart     │                         │                        │
   │──────────────────────────▶│ (localStorage)          │                        │
   │                           │                         │                        │
   │  2. Click "Place Order"   │                         │                        │
   │──────────────────────────▶│                         │                        │
   │                           │  3. POST /orders        │                        │
   │                           │  {items: [{id, qty}]}   │                        │
   │                           │────────────────────────▶│                        │
   │                           │                         │  4. Validate items     │
   │                           │                         │     exist & available  │
   │                           │                         │───────────────────────▶│
   │                           │                         │◀───────────────────────│
   │                           │                         │                        │
   │                           │                         │  5. Calculate total    │
   │                           │                         │     Insert order doc   │
   │                           │                         │───────────────────────▶│
   │                           │                         │◀───────────────────────│
   │                           │  6. Return OrderResponse│                        │
   │                           │◀────────────────────────│                        │
   │                           │                         │                        │
   │  7. Store order ID        │                         │                        │
   │  8. Show alert            │                         │                        │
   │  9. Start polling         │                         │                        │
   │◀──────────────────────────│                         │                        │
```

### Flow 2: AI-Powered Search

```
Customer              Frontend              Backend                Gemini API
   │                     │                     │                      │
   │ "light meal,        │                     │                      │
   │  not fried"         │                     │                      │
   │────────────────────▶│                     │                      │
   │                     │ POST /search        │                      │
   │                     │ {query: "..."}      │                      │
   │                     │────────────────────▶│                      │
   │                     │                     │                      │
   │                     │                     │ 1. Parse exclusions: │
   │                     │                     │    "not fried"       │
   │                     │                     │    → exclusions:     │
   │                     │                     │    ["fried"]         │
   │                     │                     │                      │
   │                     │                     │ 2. Clean query:      │
   │                     │                     │    "light meal"      │
   │                     │                     │                      │
   │                     │                     │ 3. Get embedding     │
   │                     │                     │    for "light meal"  │
   │                     │                     │─────────────────────▶│
   │                     │                     │◀─────────────────────│
   │                     │                     │    [0.023, -0.015,..]│
   │                     │                     │    (3072 dims)       │
   │                     │                     │                      │
   │                     │                     │ 4. Fetch all items   │
   │                     │                     │    with embeddings   │
   │                     │                     │──────────────────────│ MongoDB
   │                     │                     │◀─────────────────────│
   │                     │                     │                      │
   │                     │                     │ 5. For each item:    │
   │                     │                     │    - Skip if matches │
   │                     │                     │      exclusion       │
   │                     │                     │    - Compute cosine  │
   │                     │                     │      similarity      │
   │                     │                     │    - Blend scores    │
   │                     │                      │                      │
   │                     │                     │ 6. Dynamic cutoff    │
   │                     │                     │    (80% of top score)│
   │                     │                     │                      │
   │                     │  7. Return top       │                      │
   │                     │     matching items   │                      │
   │                     │◀────────────────────│                      │
   │  8. Show results     │                     │                      │
   │◀────────────────────│                     │                      │
```

### Flow 3: Admin Menu Management

```
Admin                Frontend              Backend              Gemini API      MongoDB
  │                     │                     │                     │              │
  │ Click "Add Item"    │                     │                     │              │
  │────────────────────▶│ Opens modal         │                     │              │
  │                     │                     │                     │              │
  │ Fill: Name, Price   │                     │                     │              │
  │ AI Toggle: ON       │                     │                     │              │
  │────────────────────▶│                     │                     │              │
  │                     │ POST /admin/menu    │                     │              │
  │                     │ {name, price}       │                     │              │
  │                     │────────────────────▶│                     │              │
  │                     │                     │ Call Gemini Flash   │              │
  │                     │                     │────────────────────▶│              │
  │                     │                     │◀────────────────────│              │
  │                     │                     │ {description,       │              │
  │                     │                     │  category, tags}    │              │
  │                     │                     │                     │              │
  │                     │                     │ Get embedding       │              │
  │                     │                     │────────────────────▶│              │
  │                     │                     │◀────────────────────│              │
  │                     │                     │ [3072-dim vector]   │              │
  │                     │                     │                     │              │
  │                     │                     │ Insert document     │              │
  │                     │                     │────────────────────────────────────▶│
  │                     │                     │◀───────────────────────────────────│
  │                     │  Return response    │                     │              │
  │                     │◀────────────────────│                     │              │
  │  Item appears!      │                     │                     │              │
  │◀────────────────────│                     │                     │              │
```

---

## 8. AI/ML Implementation (Deep Dive)

### 8.1 Vector Embedding Process

**What are embeddings?**  
Numbers that represent the *meaning* of text. Similar meanings have similar numbers.

**How we generate them:**

```
Input Text: "Paneer Butter Masala Rich and creamy curry Main Course vegetarian spicy"
     │
     ▼
Gemini Embedding 001 API
     │
     ▼
Output: [0.0234, -0.0156, 0.0891, ..., 0.0034]  (3072 numbers)
     │
     ▼
Stored in MongoDB document under "embedding" field
```

**Why 3072 dimensions?**  
Higher dimensions capture more nuance. Each dimension represents a different "feature" of meaning (e.g., one dimension might encode "spiciness", another "texture", another "cuisine type").

### 8.2 Search Algorithm

```python
# Step 1: Parse query for exclusions
query = "a light lunch that is not fried"
cleaned_query = "a light lunch that is"    # Removal of exclusion
exclusions = ["fried"]                      # Parsed exclusion keywords

# Step 2: Generate embedding for cleaned query
query_vector = gemini_embed(cleaned_query)  # 3072-dim vector

# Step 3: Score each menu item
for item in menu_items:
    # Skip excluded items (e.g., Samosa matches "fried")
    if item_matches_exclusion(item, exclusions):
        continue
    
    # Compute cosine similarity (embedding-based)
    cosine_sim = dot(item.embedding, query_vector) / (norm(item.embedding) * norm(query_vector))
    
    # Compute text score (keyword-based)
    text_score = keyword_match(item, cleaned_query)
    
    # Blend scores: 70% embedding + 30% text
    final_score = cosine_sim * 0.7 + normalize(text_score) * 0.3

# Step 4: Dynamic cutoff
top_score = max(final_scores)
threshold = max(top_score * 0.80, 0.40)  # At least 80% of top score
results = [item for item in scored if item.score >= threshold]
```

### 8.3 Cosine Similarity Explained

```
Vector A (query):    [0.02, -0.01, 0.08, ...]
Vector B (item):     [0.03, -0.02, 0.07, ...]

                    A · B
similarity = ─────────────────
              ||A|| × ||B||

Where:
  A · B = sum(a[i] * b[i]) for all i      (dot product)
  ||A|| = sqrt(sum(a[i]²))                 (magnitude)

Result: 0.63 (higher = more similar)
```

**Why cosine similarity?**  
- Measures *direction* not *magnitude* (text length doesn't matter)
- Range: -1 (opposite) to 1 (identical), 0 = unrelated
- Fast to compute even with 3072 dimensions

### 8.4 Exclusion Pattern Parsing

```python
# Regex pattern matches "not X", "no X", "without X", etc.
EXCLUSION_PATTERNS = r'\b(?:not|no|without|exclude|avoid|skip|don\'t want)\s+(\w+)'

# Example: "a light lunch that is not fried"
# Match: "not fried" → exclusion keyword: "fried"

# Exclusion mapping:
EXCLUSION_KEYWORD_MAP = {
    "fried":   {"keywords": ["fried", "samosa", "pakora", "vada"], "fields": ["name", "description"]},
    "spicy":   {"keywords": ["spicy"], "fields": ["dietary_tags"]},
    "dairy":   {"keywords": ["butter", "cream", "cheese", "paneer"], "fields": ["name", "description"]},
    ...
}

# Check: Does "Samosa" match exclusion "fried"?
# Samosa.description = "Crispy pastry filled with spiced potatoes"
# "fried" NOT in description, "samosa" in exclusion keywords → EXCLUDED
```

### 8.5 Fallback System (When API Fails)

```python
# If Gemini API is unavailable (quota, network, etc.)

# For menu generation:
VEG_KEYWORDS = ["paneer", "dal", "samosa", "dosa", "idli", ...]  # 40+ keywords
NON_VEG_KEYWORDS = ["chicken", "mutton", "fish", "prawn", ...]

CATEGORY_MAP = {
    "Starters": ["samosa", "pakora", "vada", ...],
    "Main Course": ["biryani", "dosa", "curry", ...],
    "Breads": ["naan", "roti", "paratha", ...],
    ...
}

def infer_dietary_tags(name):
    if any(kw in name.lower() for kw in NON_VEG_KEYWORDS):
        return ["non-vegetarian"]
    return ["vegetarian"]  # Default for Indian cuisine

def infer_category(name):
    for category, keywords in CATEGORY_MAP.items():
        if any(kw in name.lower() for kw in keywords):
            return category
    return "Main Course"  # Default
```

---

## 9. Programming Approaches & Methods

### 9.1 Frontend Approaches

| Approach | Where Used | Why |
|----------|-----------|-----|
| **Component-Based Architecture** | All UI | React components for reusability |
| **Custom Hooks (useState/useEffect)** | State management | React's built-in state management |
| **localStorage Persistence** | Cart, Orders | Survives page refresh without backend auth |
| **Optimistic UI Updates** | Cart operations | Instant feedback before server confirms |
| **Lazy Loading by Tab** | AdminPage | Data fetched only when tab is active |
| **Polling Pattern** | Order tracking | 5-second interval for real-time updates |
| **Proxy Pattern** | API calls | Vite proxy routes /api to backend |
| **Conditional Rendering** | All pages | Tabs, modals, loading states |

### 9.2 Backend Approaches

| Approach | Where Used | Why |
|----------|-----------|-----|
| **Async/Await (asyncio)** | All routes | Non-blocking I/O for MongoDB + AI calls |
| **Pydantic Validation** | Request/Response | Automatic type checking and serialization |
| **Router Separation** | 3 route files | Clean separation of concerns |
| **Middleware** | CORS | Allow cross-origin requests from frontend |
| **Pipeline Aggregation** | Dashboard stats | MongoDB aggregation for revenue, counts |
| **Graceful Degradation** | AI service | Fallback when API unavailable |
| **Document Denormalization** | Orders | Embed item details to avoid joins |
| **Error Boundary Pattern** | All routes | try/catch with proper HTTP status codes |

### 9.3 AI/ML Approaches

| Approach | Where Used | Why |
|----------|-----------|-----|
| **Embedding-Based Search** | Search route | Semantic understanding of queries |
| **Score Blending** | Search scoring | 70% embedding + 30% text for accuracy |
| **Dynamic Thresholding** | Search results | Adapts cutoff based on top result score |
| **Exclusion Parsing** | Query processing | Handles "not X" negation patterns |
| **Keyword Inference** | Fallback | Works without AI API for basic classification |
| **Prompt Engineering** | Menu generation | Structured JSON output from LLM |
| **Cosine Similarity** | Vector comparison | Standard metric for embedding comparison |

---

## 10. How Operations Are Handled Programmatically

### 10.1 Menu Item Creation (with AI)

```python
# admin.py → POST /admin/menu

async def create_menu_item(item: MenuItemCreate):
    # Step 1: Check if AI generation needed
    if not item.description or not item.category:
        details = await generate_menu_details(item.name, item.price)
        # AI returns: {"description": "...", "category": "...", "dietary_tags": [...]}
    
    # Step 2: Generate embedding for search
    text = f"{item.name} {desc} {cat} {' '.join(tags)}"
    embedding = await get_embedding(text)  # 3072-dim vector
    
    # Step 3: Build MongoDB document
    doc = {
        "name": item.name,
        "description": desc,
        "category": cat,
        "price": item.price,
        "dietary_tags": tags,
        "is_available": True,
        "embedding": embedding,
        "image_url": item.image_url,
    }
    
    # Step 4: Insert into database
    result = await db.menu_items.insert_one(doc)
    
    # Step 5: Return formatted response
    return doc_to_menu_item(doc)
```

### 10.2 Order Status Transition (Enforced Sequential Flow)

```python
# admin.py → PATCH /admin/orders/{id}/status

async def update_order_status(id, body):
    # Step 1: Validate status is valid
    valid_statuses = ["Placed", "Confirmed", "Preparing", "Ready", "Picked Up"]
    if new_status not in valid_statuses:
        raise HTTPException(400, "Invalid status")
    
    # Step 2: Get current order
    order = await db.orders.find_one({"_id": ObjectId(id)})
    
    # Step 3: Enforce sequential transition
    transitions = ["Placed", "Confirmed", "Preparing", "Ready", "Picked Up"]
    current_idx = transitions.index(order["status"])
    new_idx = transitions.index(new_status)
    
    # ONLY allow next step (no skipping!)
    if new_idx != current_idx + 1:
        raise HTTPException(400, 
            f"Cannot jump from '{order['status']}' to '{new_status}'"
        )
    
    # Step 4: Update status
    await db.orders.update_one(
        {"_id": ObjectId(id)}, 
        {"$set": {"status": new_status}}
    )
```

### 10.3 Search Query Processing

```python
# search.py → POST /search

async def search_menu(search: SearchQuery):
    # Step 1: Parse exclusions
    cleaned_query, exclusions = parse_exclusions(search.query)
    # "not fried" → cleaned: "", exclusions: ["fried"]
    
    # Step 2: Get all available items
    all_items = await db.menu_items.find({"is_available": True}).to_list(500)
    
    # Step 3: Get query embedding
    query_embedding = await get_embedding(cleaned_query)
    
    # Step 4: Score each item
    scored = []
    for item in all_items:
        # Skip excluded items
        if exclusions and item_matches_exclusion(item, exclusions):
            continue
        
        # Compute embedding similarity
        sim = cosine_similarity(query_embedding, item["embedding"])
        
        # Compute text score
        ts = text_score(item, cleaned_query)
        
        # Blend: 70% embedding + 30% text
        combined = sim * 0.7 + min(ts/20, 1.0) * 0.3
        scored.append((item, combined))
    
    # Step 5: Dynamic threshold
    scored.sort(key=lambda x: x[1], reverse=True)
    top_score = scored[0][1]
    threshold = max(top_score * 0.80, 0.40)
    results = [x for x in scored if x[1] >= threshold]
    
    return results[:10]
```

### 10.4 Dashboard Stats Aggregation

```python
# admin.py → GET /admin/dashboard

async def get_dashboard():
    # 1. Orders by status (MongoDB aggregation)
    status_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    # Result: {"Placed": 3, "Confirmed": 1, "Preparing": 2, ...}
    
    # 2. Top 3 popular items (unwind + group + sort)
    popular_pipeline = [
        {"$unwind": "$items"},                          # Flatten items array
        {"$group": {"_id": "$items.menu_item_id",      # Group by item
                     "name": {"$first": "$items.name"},
                     "total_qty": {"$sum": "$items.quantity"}}},
        {"$sort": {"total_qty": -1}},                   # Sort by quantity
        {"$limit": 3}                                   # Top 3
    ]
    
    # 3. Today's revenue (match + sum)
    today_start = datetime.now(timezone.utc).replace(hour=0, ...)
    revenue_pipeline = [
        {"$match": {"created_at": {"$gte": today_start}}},
        {"$group": {"_id": None, "total_revenue": {"$sum": "$total_price"}}}
    ]
    
    return {"orders_by_status": counts, "top_items": items, "todays_revenue": revenue}
```

---

## 11. Code Architecture & Design Patterns

### 11.1 Backend File Structure

```
backend/
├── main.py              # Entry point, middleware, router registration
├── models.py            # Pydantic schemas (request/response models)
├── database.py          # MongoDB connection (single client instance)
├── ai_service.py        # Gemini API wrapper with fallback logic
├── seed.py              # Database initialization script
└── routes/
    ├── __init__.py
    ├── admin.py          # Admin-specific endpoints (prefix: /admin)
    ├── customer.py       # Customer endpoints (no prefix)
    └── search.py         # Search endpoint with AI integration
```

### 11.2 Frontend Architecture

```
frontend/src/
├── main.jsx             # ReactDOM.createRoot, renders <App />
├── App.jsx              # BrowserRouter, nav bar, route definitions
├── api.js               # Axios instance (baseURL: '/api')
├── index.css            # Tailwind CSS imports
└── pages/
    ├── AdminPage.jsx     # Single-page admin with tab system
    │   ├── Dashboard Tab    → StatCard, orders by status, top items
    │   ├── Menu Tab         → Grid cards, Add/Edit modal, availability toggle
    │   └── Orders Tab       → Status groups, advance/cancel buttons
    └── CustomerPage.jsx # Single-page customer with tab system
        ├── Search Bar       → AI-powered search input
        ├── Menu Tab         → Category-grouped grid with cart controls
        ├── My Orders Tab    → Order history with status progress
        ├── Cart Panel       → Slide-out panel with quantities
        └── Active Tracker   → Real-time order progress bar
```

### 11.3 Design Patterns Used

| Pattern | Implementation |
|---------|---------------|
| **MVC-like** | Models (Pydantic), Views (React pages), Controllers (FastAPI routes) |
| **Repository Pattern** | Database layer abstracted in `database.py` |
| **Service Layer** | `ai_service.py` encapsulates all AI logic |
| **Component Composition** | React components composed hierarchically |
| **Container/Presentational** | Smart components (pages) vs dumb components (StatCard, Spinner) |
| **Observer Pattern** | useEffect hooks watching state changes |
| **Strategy Pattern** | AI vs manual item creation (toggle switch) |
| **Fallback Pattern** | AI API failure → keyword-based inference |
| **Proxy Pattern** | Vite dev proxy routes API calls to backend |

---

## 12. Security & Error Handling

### 12.1 Error Handling

| Layer | Approach |
|-------|----------|
| **Backend Routes** | try/except with HTTPException (400, 404, 500) |
| **AI Service** | try/except with fallback defaults (never crashes) |
| **Frontend API Calls** | try/catch with console.error + user-friendly alerts |
| **Form Validation** | Pydantic models auto-validate request bodies |
| **MongoDB Queries** | ObjectId validation before queries |

### 12.2 CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # Allow all origins (dev mode)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 12.3 Input Validation

```python
# Pydantic automatically validates:
class MenuItemCreate(BaseModel):
    name: str              # Required, must be string
    price: float           # Required, must be number
    description: Optional[str] = None
    category: Optional[str] = None
    dietary_tags: Optional[List[str]] = None
    image_url: Optional[str] = None

# Invalid requests get automatic 422 responses
```

---

## 13. Expected Interviewer Questions & Answers

### Q1: "Why did you choose MongoDB over PostgreSQL?"

**Answer:** MongoDB was chosen because:
1. **Schema flexibility** — Menu items can have optional fields (image_url, embedding)
2. **Natural fit** — JSON documents map directly to Pydantic models
3. **Embedding storage** — 3072-dim float arrays stored directly in documents
4. **Aggregation pipeline** — Powerful for dashboard stats without complex SQL JOINs
5. **No relational data** — Orders don't need complex relationships

### Q2: "How does the AI search work in detail?"

**Answer:** "The search combines two approaches:
1. **Vector search (70%)** — I generate a 3072-dimensional embedding for the user's query using Gemini Embedding 001, then compute cosine similarity against all menu item embeddings stored in MongoDB
2. **Text search (30%)** — I also do keyword matching against name, description, and tags
3. The scores are blended, and a dynamic threshold (80% of the top score) filters out irrelevant results
4. Exclusion patterns like 'not fried' are parsed with regex and items matching those keywords are excluded before scoring"

### Q3: "What happens if the AI API goes down?"

**Answer:** "The system has a multi-layer fallback:
1. **Menu generation** — Falls back to keyword-based inference (40+ vegetarian keywords, category mappings)
2. **Embeddings** — Falls back to text-based concept matching
3. **Search** — Still works using the concept mapping and text scoring
4. The app never crashes — all AI failures are caught and handled gracefully"

### Q4: "How would you add user authentication?"

**Answer:** "I would:
1. Add a `users` collection in MongoDB with bcrypt-hashed passwords
2. Implement JWT token authentication in FastAPI
3. Add a `user_id` field to orders for proper user-order association
4. Use React context to manage auth state
5. Add protected routes for admin vs customer"

### Q5: "How would you scale this for production?"

**Answer:** "Several approaches:
1. **Caching** — Redis for menu items (rarely change) and search results
2. **CDN** — Serve food images via CloudFront/Cloudflare
3. **Rate limiting** — Prevent AI API abuse
4. **Database indexing** — Add indexes on `is_available`, `status`, `created_at`
5. **Containerization** — Docker + docker-compose for consistent deployments
6. **Load balancing** — Multiple FastAPI instances behind nginx"
