import math
from fastapi import APIRouter

from database import db
from models import SearchQuery, MenuItemResponse
from ai_service import get_embedding, parse_search_query

router = APIRouter(tags=["Search"])


def cosine_similarity(a: list[float], b: list[float]) -> float:
    if len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(x * x for x in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def doc_to_menu_item(doc: dict, score: float = None) -> dict:
    mt = doc.get("meal_type")
    if isinstance(mt, list):
        mt = mt[0] if mt else None

    result = MenuItemResponse(
        id=str(doc["_id"]),
        name=doc["name"],
        description=doc.get("description", ""),
        category=doc.get("category", "Other"),
        price=doc["price"],
        dietary_tags=doc.get("dietary_tags", []),
        is_available=doc.get("is_available", True),
        image_url=doc.get("image_url", "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80"),
        search_tags=doc.get("search_tags", []),
        meal_type=mt,
        spice_level=doc.get("spice_level"),
        is_light_meal=doc.get("is_light_meal"),
        is_healthy=doc.get("is_healthy"),
        is_high_protein=doc.get("is_high_protein"),
    ).model_dump()
    if score is not None:
        result["score"] = round(score, 4)
    return result


@router.post("/search")
async def search_menu(search: SearchQuery):
    # Search menu items
    query_text = search.query.strip()
    if not query_text:
        cursor = db.menu_items.find({"is_available": True}).limit(20)
        results = await cursor.to_list(length=20)
        return [doc_to_menu_item(doc) for doc in results]

    parsed = await parse_search_query(query_text)
    semantic_query = parsed.get("semantic_query") or query_text
    print(f"Search: '{query_text}' | Parsed: {parsed}")

    mongo_query = {"is_available": True}
    if parsed.get("max_price") is not None:
        mongo_query["price"] = {"$lte": parsed["max_price"]}
    if parsed.get("min_price") is not None:
        mongo_query.setdefault("price", {})["$gte"] = parsed["min_price"]
    if parsed.get("is_light_meal") is True:
        mongo_query["is_light_meal"] = True
    if parsed.get("is_healthy") is True:
        mongo_query["is_healthy"] = True
    if parsed.get("is_high_protein") is True:
        mongo_query["is_high_protein"] = True
    if parsed.get("meal_type"):
        mongo_query["meal_type"] = {"$in": parsed["meal_type"]}
    if parsed.get("category"):
        mongo_query["category"] = parsed["category"]
    if parsed.get("dietary_tags"):
        mongo_query["dietary_tags"] = {"$all": parsed["dietary_tags"]}
    if parsed.get("spice_level"):
        mongo_query["spice_level"] = parsed["spice_level"]

    cursor = db.menu_items.find(mongo_query)
    all_items = await cursor.to_list(length=500)

    # if filters returned nothing, keep only price filter
    if not all_items:
        relaxed = {"is_available": True}
        if parsed.get("max_price") is not None:
            relaxed["price"] = {"$lte": parsed["max_price"]}
        if parsed.get("min_price") is not None:
            relaxed.setdefault("price", {})["$gte"] = parsed["min_price"]
        cursor = db.menu_items.find(relaxed)
        all_items = await cursor.to_list(length=500)

    exclude_tags = parsed.get("exclude_tags", [])
    if exclude_tags:
        all_items = [
            item for item in all_items
            if not any(
                tag in " ".join(item.get("dietary_tags", [])).lower()
                or tag in item.get("name", "").lower()
                or tag in item.get("description", "").lower()
                or tag in " ".join(item.get("search_tags", [])).lower()
                for tag in exclude_tags
            )
        ]

    if not all_items:
        return []

    query_embedding = None
    try:
        query_embedding = await get_embedding(semantic_query)
    except Exception as e:
        print(f"Embedding unavailable: {e}")

    scored = []
    want_meal_type = parsed.get("meal_type", [])
    for item in all_items:
        sim = 0.0
        if query_embedding:
            item_emb = item.get("embedding", [])
            if item_emb and len(item_emb) == len(query_embedding):
                sim = cosine_similarity(query_embedding, item_emb)

        # boost score if meal_type matches
        if want_meal_type and sim > 0:
            item_mt = item.get("meal_type")
            if isinstance(item_mt, list):
                if any(mt in item_mt for mt in want_meal_type):
                    sim += 0.10
            elif isinstance(item_mt, str) and item_mt in want_meal_type:
                sim += 0.10

        if sim > 0.15:
            scored.append((item, sim))

    scored.sort(key=lambda x: x[1], reverse=True)
    return [doc_to_menu_item(item, score=s) for item, s in scored[:10]]
