from google import genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

VEG_KEYWORDS = [
    "paneer", "dal", "samosa", "dosa", "idli", "vada", "naan", "roti",
    "paratha", "poori", "poha", "upma", "uttapam", "chai", "lassi",
    "gulab", "jalebi", "kheer", "halwa", "kulfi", "rice", "biryani",
    "masala", "curry", "pakora", "chaat", "tikki", "butter", "makhani",
    "korma", "pulao", "papad", "khichdi", "raita", "salad", "soup",
    "sandwich", "pasta", "noodles", "pizza", "burger", "momos",
]

NON_VEG_KEYWORDS = [
    "chicken", "mutton", "fish", "prawn", "egg", "lamb", "beef", "kebab",
    "tandoori chicken", "tikka chicken", "butter chicken", "rogan josh",
]

CATEGORY_MAP = {
    "Starters": ["samosa", "pakora", "vada", "chaat", "tikki", "spring roll", "momos", "nachos", "fries", "papad", "kebab"],
    "Main Course": ["butter chicken", "paneer butter masala", "tikka masala", "biryani", "dosa", "idli", "curry", "dal", "korma", "pulao", "khichdi", "rice", "noodles", "pasta"],
    "Breads": ["naan", "roti", "paratha", "poori", "kulcha", "bhature", "chapati"],
    "Desserts": ["gulab jamun", "jalebi", "kheer", "halwa", "kulfi", "rasgulla", "barfi", "cake", "ice cream"],
    "Beverages": ["chai", "coffee", "lassi", "juice", "masala chai", "nimbu pani", "smoothie"],
    "Snacks": ["poha", "upma", "sandwich", "burger", "pizza", "fries", "nachos"],
}


def infer_dietary_tags(name: str) -> list[str]:
    name_lower = name.lower()
    tags = []

    is_non_veg = any(kw in name_lower for kw in NON_VEG_KEYWORDS)
    if is_non_veg:
        tags.append("non-vegetarian")
    else:
        tags.append("vegetarian")

    spicy_indicators = ["spicy", "masala", "tikka", "tandoori", "chilli", "pepper", "curry"]
    if any(kw in name_lower for kw in spicy_indicators):
        tags.append("spicy")
    return tags


def infer_category(name: str) -> str:
    name_lower = name.lower()
    for category, keywords in CATEGORY_MAP.items():
        for kw in keywords:
            if kw in name_lower:
                return category
    return "Main Course"


async def generate_menu_details(name: str, price: float) -> dict:
    try:
        prompt = f"""You are an expert food catalog and restaurant menu analyst.
Analyze the dish carefully using its name and price.

Dish Name: "{name}"
Price: ₹{price}

Generate structured metadata that will be used for:
- Food ordering
- Semantic AI search
- Recommendation systems
- Filtering
- Menu categorization

Rules:
1. Create a realistic and appetizing description (max 2 sentences).
2. Select the most appropriate category.
3. Infer dietary tags only when reasonably certain.
4. Generate search tags that customers may use while searching.
5. Estimate meal characteristics.
6. embedding_text: a space-separated string of all relevant search keywords for this dish (name, cuisine, style, taste, health, meal type). This will be embedded for vector search.
7. Return ONLY valid JSON.

Available Categories:
["Starters", "Main Course", "Desserts", "Beverages", "Snacks", "Breads"]

Available Dietary Tags:
["vegetarian", "non-vegetarian", "vegan", "spicy", "mild", "gluten-free", "dairy-free"]

Available Meal Types:
["breakfast", "lunch", "dinner", "snack"]

Available Spice Levels:
["low", "medium", "high"]

Return JSON:
{{
  "description": "...",
  "category": "...",
  "dietary_tags": [...],
  "search_tags": ["south indian", "crispy", "light", "vegetarian"],
  "meal_type": "...",
  "spice_level": "...",
  "is_light_meal": true,
  "is_healthy": false,
  "is_high_protein": false,
  "estimated_serving": "single",
  "embedding_text": "masala dosa south indian breakfast vegetarian light crispy snack"
}}"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        result = json.loads(text)

        result.setdefault("search_tags", [])
        result.setdefault("meal_type", "lunch")
        result.setdefault("spice_level", "medium")
        result.setdefault("is_light_meal", False)
        result.setdefault("is_healthy", False)
        result.setdefault("is_high_protein", False)
        result.setdefault("estimated_serving", "single")
        result.setdefault("embedding_text", f"{name} {result.get('category', '')} {' '.join(result.get('dietary_tags', []))} {' '.join(result.get('search_tags', []))}")
        return result
    except Exception as e:
        print(f"Warning: Gemini API failed ({e}). Using fallback.")
        cat = infer_category(name)
        tags = infer_dietary_tags(name)
        name_lower = name.lower()
        is_light = any(kw in name_lower for kw in ["salad", "soup", "idli", "dosa", "lassi", "juice", "fruit", "steamed", "grilled"])
        return {
            "description": f"A delicious {name} prepared with authentic Indian flavors and fresh ingredients.",
            "category": cat,
            "dietary_tags": tags,
            "search_tags": [name_lower.split()[0]] if name_lower.split() else [],
            "meal_type": "lunch",
            "spice_level": "medium",
            "is_light_meal": is_light,
            "is_healthy": is_light,
            "is_high_protein": False,
            "estimated_serving": "single",
            "embedding_text": f"{name} {cat} {' '.join(tags)}",
        }

async def get_embedding(text: str) -> list[float]:
    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text
    )
    return result.embeddings[0].values


async def parse_search_query(query: str) -> dict:
    try:
        prompt = f"""You are a food search query parser for an Indian restaurant menu.
Parse this user query into structured search filters.

Query: "{query}"

Return ONLY valid JSON (no markdown, no explanation):
{{
  "semantic_query": "core food type for search, stripped of all filter/price words",
  "min_price": null or number,
  "max_price": null or number,
  "is_light_meal": null or true or false,
  "is_healthy": null or true or false,
  "is_high_protein": null or true or false,
  "meal_type": [],
  "category": null or one of ["Starters", "Main Course", "Desserts", "Beverages", "Snacks", "Breads"],
  "dietary_tags": [],
  "exclude_tags": [],
  "spice_level": null or one of ["low", "medium", "high"]
}}

Rules:
- "under/below/less than/upto 100", "in 20 rupee", "80 rupee", "₹100" → max_price
- "above/over/more than 100" → min_price
- "between 50 and 200" → min_price and max_price
- "cheap/budget" → max_price: 150. "expensive/premium" → min_price: 300
- "light/light meal/low calorie" → is_light_meal: true
- "healthy/diet/nutritious" → is_healthy: true
- "protein/high protein" → is_high_protein: true
- "not X/without X/no X" → add X to exclude_tags
- "veg/vegetarian" → add "vegetarian" to dietary_tags
- "non-veg/chicken/mutton/fish" → add "non-vegetarian" to dietary_tags
- "spicy" → add "spicy" to dietary_tags AND spice_level: "high"
- "mild" → add "mild" to dietary_tags AND spice_level: "low"
- "breakfast/lunch/dinner/snack" → add to meal_type array
- meal_type must always be an array (e.g. ["lunch"] or ["breakfast", "lunch"])
- If no explicit price number, do NOT set price fields
- semantic_query should be the actual food type, stripped of all filter/price words
- Be smart about Indian food context"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        result = json.loads(text)

        return {
            "semantic_query": result.get("semantic_query", query),
            "min_price": result.get("min_price"),
            "max_price": result.get("max_price"),
            "is_light_meal": result.get("is_light_meal"),
            "is_healthy": result.get("is_healthy"),
            "is_high_protein": result.get("is_high_protein"),
            "meal_type": result.get("meal_type", []),
            "category": result.get("category"),
            "dietary_tags": result.get("dietary_tags", []),
            "exclude_tags": [t.lower() for t in result.get("exclude_tags", [])],
            "spice_level": result.get("spice_level"),
        }
    except Exception as e:
        print(f"AI query parsing failed ({e}). Using fallback.")
        import re
        max_price = None
        min_price = None
        meal_type = []

        m = re.search(r'\b(?:under|below|less than|upto|up to)\s*(\d+\.?\d*)', query, re.IGNORECASE)
        if m:
            max_price = float(m.group(1))
        else:
            m = re.search(r'\b(?:above|over|more than|at least)\s*(\d+\.?\d*)', query, re.IGNORECASE)
            if m:
                min_price = float(m.group(1))
            else:
                m = re.search(r'\b(?:in|within|for)\s*(\d+\.?\d*)\s*(?:₹|rs\.?|rupee)', query, re.IGNORECASE)
                if m:
                    max_price = float(m.group(1))
                else:
                    m = re.search(r'\b(\d+\.?\d*)\s*(?:₹|rs\.?|rupee)', query, re.IGNORECASE)
                    if m:
                        max_price = float(m.group(1))

        q_lower = query.lower()
        for mt in ["breakfast", "lunch", "dinner", "snack"]:
            if mt in q_lower:
                meal_type.append(mt)

        # check dietary tags
        dietary_tags = []
        if re.search(r'\bnon[- ]?veg\w*\b', q_lower) or any(kw in q_lower for kw in ["chicken", "mutton", "fish", "prawn", "egg", "lamb", "beef"]):
            dietary_tags.append("non-vegetarian")
        elif re.search(r'\b(?:vegan)\b', q_lower):
            dietary_tags.append("vegan")
        elif re.search(r'\b(?:veg|vegetarian)\b', q_lower):
            dietary_tags.append("vegetarian")

        search_text = re.sub(r'\b(?:under|below|less than|upto|up to|above|over|more than|at least|in|within|for)\s*\d+\.?\d*', '', query, flags=re.IGNORECASE)
        search_text = re.sub(r'\b\d+\.?\d*\s*(?:₹|rs\.?|inr|rupee?s?)\b', '', search_text, flags=re.IGNORECASE)
        search_text = re.sub(r'\s+', ' ', search_text).strip() or query

        return {
            "semantic_query": search_text,
            "min_price": min_price,
            "max_price": max_price,
            "is_light_meal": None,
            "is_healthy": None,
            "is_high_protein": None,
            "meal_type": meal_type,
            "category": None,
            "dietary_tags": dietary_tags,
            "exclude_tags": [],
            "spice_level": None,
        }
