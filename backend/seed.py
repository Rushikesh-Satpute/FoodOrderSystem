import asyncio
import json
from ai_service import get_embedding
from database import db

FILE_PATH = "food_ordering.menu_items.json"


async def seed():
    print("Seeding database from JSON file...")

    await db.menu_items.delete_many({})

    with open(FILE_PATH, "r", encoding="utf-8") as f:
        items = json.load(f)

    for item in items:

        item.pop("_id", None)

        embedding_text = f"""
        {item.get('name', '')}
        {item.get('description', '')}
        {item.get('category', '')}
        {' '.join(item.get('dietary_tags', []))}
        {' '.join(item.get('search_tags', []))}
        {item.get('meal_type', '')}
        {item.get('spice_level', '')}
        """

        try:
            item["embedding"] = await get_embedding(embedding_text)
            print(f" Embedding done → {item['name']}")
        except Exception as e:
            print(f" Embedding failed → {item['name']} | {e}")
            item["embedding"] = []

        item["is_available"] = item.get("is_available", True)

        await db.menu_items.insert_one(item)

        print(f" Inserted → {item['name']}")

    print("Seeding completed successfully 🚀")


asyncio.run(seed())