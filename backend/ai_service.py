from google import genai
from google.genai import types
import os
import json
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Common Indian vegetarian dish keywords for fallback
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

# Category assignment keywords
CATEGORY_MAP = {
    "Starters": ["samosa", "pakora", "vada", "chaat", "tikki", "spring roll", "momos", "nachos", "fries", "papad", "kebab"],
    "Main Course": ["butter chicken", "paneer butter masala", "tikka masala", "biryani", "dosa", "idli", "curry", "dal", "korma", "pulao", "khichdi", "rice", "noodles", "pasta"],
    "Breads": ["naan", "roti", "paratha", "poori", "kulcha", "bhature", "chapati"],
    "Desserts": ["gulab jamun", "jalebi", "kheer", "halwa", "kulfi", "rasgulla", "barfi", "cake", "ice cream"],
    "Beverages": ["chai", "coffee", "lassi", "juice", "masala chai", "nimbu pani", "smoothie"],
    "Snacks": ["poha", "upma", "sandwich", "burger", "pizza", "fries", "nachos"],
}


def infer_dietary_tags(name: str) -> list[str]:
    """Infer dietary tags from dish name."""
    name_lower = name.lower()
    tags = []

    # Check non-veg first
    is_non_veg = any(kw in name_lower for kw in NON_VEG_KEYWORDS)
    if is_non_veg:
        tags.append("non-vegetarian")
    else:
        tags.append("vegetarian")

    # Check common spice indicators
    spicy_indicators = ["spicy", "masala", "tikka", "tandoori", "chilli", "pepper", "curry"]
    if any(kw in name_lower for kw in spicy_indicators):
        tags.append("spicy")

    return tags


def infer_category(name: str) -> str:
    """Infer category from dish name."""
    name_lower = name.lower()
    for category, keywords in CATEGORY_MAP.items():
        for kw in keywords:
            if kw in name_lower:
                return category
    return "Main Course"


async def generate_menu_details(name: str, price: float) -> dict:
    """Use gemini-2.0-flash to generate description, category, dietary_tags.
    Returns dict with keys: description, category, dietary_tags"""
    try:
        prompt = f"""You are a food menu expert. For a dish called \"{name}\" priced at ₹{price}, generate:
1. An appetizing description (2-3 sentences max)
2. A category (one of: Starters, Main Course, Desserts, Beverages, Snacks, Breads)
3. Dietary tags (array from: vegetarian, non-vegetarian, vegan, spicy, mild, gluten-free, dairy-free)

Respond ONLY with valid JSON:
{{"description": "...", "category": "...", "dietary_tags": [...]}}"""

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        # Parse JSON from response
        text = response.text.strip()
        # Remove markdown code fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        return json.loads(text)
    except Exception as e:
        # Smart fallback using keyword-based inference
        print(f"Warning: Gemini API failed ({e}). Using keyword-based fallback.")
        return {
            "description": f"A delicious {name} prepared with authentic Indian flavors and fresh ingredients.",
            "category": infer_category(name),
            "dietary_tags": infer_dietary_tags(name),
        }


async def get_embedding(text: str) -> list[float]:
    """Generate embedding using gemini-embedding-001"""
    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text
    )
    return result.embeddings[0].values
