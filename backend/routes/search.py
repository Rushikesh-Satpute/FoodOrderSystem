import re
import math
from fastapi import APIRouter

from database import db
from models import SearchQuery, MenuItemResponse
from ai_service import get_embedding

router = APIRouter(tags=["Search"])

# Exclusion patterns: "not X", "no X", "without X", "exclude X"
EXCLUSION_PATTERNS = re.compile(
    r'\b(?:not|no|without|exclude|avoid|skip|don\'t want)\s+(\w+)',
    re.IGNORECASE
)

# Map exclusion keywords to item attributes that should be filtered
EXCLUSION_KEYWORD_MAP = {
    "fried": {"keywords": ["fried", "samosa", "pakora", "vada", "crispy"], "fields": ["name", "description"]},
    "spicy": {"keywords": ["spicy"], "fields": ["dietary_tags"]},
    "meat": {"keywords": ["chicken", "mutton", "fish", "lamb", "prawn"], "fields": ["name", "description"]},
    "chicken": {"keywords": ["chicken"], "fields": ["name", "description"]},
    "sugar": {"keywords": ["sweet", "sugar", "syrup"], "fields": ["description"]},
    "dairy": {"keywords": ["butter", "cream", "cheese", "paneer", "yogurt", "lassi"], "fields": ["name", "description"]},
    "gluten": {"keywords": ["naan", "roti", "bread", "paratha"], "fields": ["name"]},
    "oil": {"keywords": ["fried", "samosa", "pakora", "vada"], "fields": ["name", "description"]},
}


def parse_exclusions(query: str) -> tuple[str, list[str]]:
    """Parse exclusion patterns from query. Returns cleaned query and list of exclusion keywords."""
    exclusions = []
    matches = EXCLUSION_PATTERNS.findall(query)
    for match in matches:
        word = match.lower()
        if word in EXCLUSION_KEYWORD_MAP:
            exclusions.append(word)
        # Also check if the word directly appears in any item attributes

    # Remove exclusion phrases from the query to get the "positive" intent
    cleaned = EXCLUSION_PATTERNS.sub("", query).strip()
    # Clean up double spaces
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()

    return cleaned, exclusions


def item_matches_exclusion(item: dict, exclusions: list[str]) -> bool:
    """Check if an item should be excluded based on exclusion keywords."""
    for excl in exclusions:
        if excl not in EXCLUSION_KEYWORD_MAP:
            continue
        rule = EXCLUSION_KEYWORD_MAP[excl]
        for field in rule["fields"]:
            text = ""
            if field == "name":
                text = item.get("name", "").lower()
            elif field == "description":
                text = item.get("description", "").lower()
            elif field == "dietary_tags":
                text = " ".join(item.get("dietary_tags", [])).lower()

            for kw in rule["keywords"]:
                if kw in text:
                    return True
    return False


# Keyword-to-concept mapping for text fallback
CONCEPT_MAP = {
    "light": ["dosa", "idli", "soup", "salad", "lassi", "buttermilk", "crepe", "fermented"],
    "healthy": ["dosa", "idli", "soup", "salad", "grilled", "tandoori", "steamed", "fermented"],
    "quick": ["samosa", "pakora", "naan", "roti", "wrap"],
    "meal": ["dosa", "biryani", "rice", "naan", "roti", "curry", "masala"],
    "spicy": ["tikka", "masala", "curry", "tandoori", "chilli", "pepper"],
    "mild": ["butter", "creamy", "korma", "makhani", "dal"],
    "sweet": ["gulab", "jalebi", "kheer", "halwa", "kulfi", "lassi", "mango", "syrup", "dessert"],
    "lunch": ["dosa", "biryani", "rice", "curry", "dal", "roti"],
    "dinner": ["biryani", "butter chicken", "paneer", "tikka", "curry", "naan", "tandoori"],
    "snack": ["samosa", "pakora", "vada", "chaat", "tikki"],
    "dessert": ["gulab jamun", "jalebi", "kheer", "halwa", "kulfi", "rasgulla"],
    "south indian": ["dosa", "idli", "vada", "sambar", "crepe", "fermented"],
    "drink": ["lassi", "chai", "coffee", "juice"],
    "cold": ["lassi", "kulfi", "mango"],
    "creamy": ["butter chicken", "korma", "makhani", "paneer butter masala", "butter"],
    "fried": ["samosa", "pakora", "vada"],
    "bread": ["naan", "roti", "paratha", "garlic naan"],
    "curry": ["butter chicken", "paneer butter masala", "tikka masala", "korma"],
    "vegetarian": ["paneer", "dosa", "idli", "samosa", "gulab jamun", "naan"],
}


def text_score(item: dict, query: str) -> float:
    """Score an item against a query using text matching + concept mapping."""
    score = 0.0
    q = query.lower().strip()
    name = item.get("name", "").lower()
    desc = item.get("description", "").lower()
    cat = item.get("category", "").lower()
    tags = " ".join(item.get("dietary_tags", [])).lower()
    all_text = f"{name} {desc} {cat} {tags}"

    # Exact phrase match
    if q in name: score += 10.0
    if q in desc: score += 6.0
    if q in tags: score += 8.0
    if q in cat: score += 7.0

    # Word-level match
    for word in q.split():
        if len(word) < 2: continue
        if word in name: score += 5.0
        if word in desc: score += 3.0
        if word in tags: score += 4.0
        if word in cat: score += 3.0

    # Concept mapping
    for word in q.split():
        if word in CONCEPT_MAP:
            for kw in CONCEPT_MAP[word]:
                if kw in name: score += 4.0; break
                if kw in desc: score += 2.5; break
                if kw in all_text: score += 1.5; break

    # Phrase concept mapping
    for phrase, kws in CONCEPT_MAP.items():
        if phrase in q:
            for kw in kws:
                if kw in name: score += 4.0; break
                if kw in all_text: score += 2.0; break

    return score


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    if len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(x * x for x in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def doc_to_menu_item(doc: dict, score: float = None) -> dict:
    """Convert MongoDB document to dict with optional score."""
    result = MenuItemResponse(
        id=str(doc["_id"]),
        name=doc["name"],
        description=doc.get("description", ""),
        category=doc.get("category", "Other"),
        price=doc["price"],
        dietary_tags=doc.get("dietary_tags", []),
        is_available=doc.get("is_available", True),
        image_url=doc.get("image_url", "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80"),
    ).model_dump()
    if score is not None:
        result["score"] = round(score, 4)
    return result


@router.post("/search")
async def search_menu(search: SearchQuery):
    """Search menu items using Gemini embeddings with exclusion-aware filtering."""
    query_text = search.query.strip()
    if not query_text:
        cursor = db.menu_items.find({"is_available": True}).limit(20)
        results = await cursor.to_list(length=20)
        return [doc_to_menu_item(doc) for doc in results]

    # Step 1: Parse exclusions from the query
    cleaned_query, exclusions = parse_exclusions(query_text)
    print(f"Search: '{query_text}' | Cleaned: '{cleaned_query}' | Exclusions: {exclusions}")

    # Step 2: Fetch all available items
    cursor = db.menu_items.find({"is_available": True})
    all_items = await cursor.to_list(length=500)

    # Step 3: Try embedding-based search with the cleaned (positive) query
    use_embeddings = False
    query_embedding = None
    try:
        # Use the cleaned query for embedding (without exclusion words)
        embed_text = cleaned_query if cleaned_query else query_text
        query_embedding = await get_embedding(embed_text)
        has_real_embeddings = any(
            item.get("embedding") and len(item.get("embedding", [])) > 0
            for item in all_items
        )
        if has_real_embeddings:
            use_embeddings = True
    except Exception as e:
        print(f"Embedding search unavailable: {e}")

    # Step 4: Score items
    scored = []
    for item in all_items:
        # Skip excluded items entirely
        if exclusions and item_matches_exclusion(item, exclusions):
            continue

        sim = 0.0

        if use_embeddings and query_embedding:
            item_emb = item.get("embedding", [])
            if item_emb and len(item_emb) > 0 and len(item_emb) == len(query_embedding):
                sim = cosine_similarity(query_embedding, item_emb)

        # Also compute text score and blend
        ts = text_score(item, cleaned_query if cleaned_query else query_text)

        # Combined score: embedding similarity weighted 70%, text score normalized weighted 30%
        if sim > 0:
            # Normalize text score to 0-1 range (max possible ~30)
            normalized_ts = min(ts / 20.0, 1.0)
            combined = sim * 0.7 + normalized_ts * 0.3
        else:
            # No embedding available, use text score only, normalized
            combined = min(ts / 15.0, 1.0)

        if combined > 0.35:
            scored.append((item, combined))

    # Step 5: Sort by score descending
    scored.sort(key=lambda x: x[1], reverse=True)

    # Step 6: Dynamic cutoff — only return items that are meaningfully relevant
    # If we have results, use a dynamic threshold based on the top score
    if scored:
        top_score = scored[0][1]
        # Only keep items within 85% of the top score AND above absolute minimum
        min_absolute = 0.40
        min_relative = top_score * 0.80
        final_threshold = max(min_absolute, min_relative)
        scored = [(item, score) for item, score in scored if score >= final_threshold]

    # Return top 10 at most
    return [doc_to_menu_item(item, score=score) for item, score in scored[:10]]
