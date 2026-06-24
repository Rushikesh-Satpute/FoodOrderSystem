import asyncio
from ai_service import get_embedding
from database import db

items = [
    {"name": "Paneer Butter Masala", "price": 240, "description": "Rich and creamy curry made with paneer, spices, onions, tomatoes, cashews and butter.", "category": "Main Course", "dietary_tags": ["vegetarian", "mild"], "is_available": True, "image_url": "https://images.unsplash.com/photo-1631452180519-c014fe946bc0?w=500&q=80"},
    {"name": "Chicken Tikka Masala", "price": 320, "description": "Roasted marinated chicken chunks (tikka) in a spiced curry sauce.", "category": "Main Course", "dietary_tags": ["non-vegetarian", "spicy"], "is_available": True, "image_url": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&q=80"},
    {"name": "Garlic Naan", "price": 45, "description": "Soft and fluffy Indian flatbread topped with minced garlic and cilantro.", "category": "Breads", "dietary_tags": ["vegetarian"], "is_available": True, "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80"},
    {"name": "Samosa", "price": 80, "description": "Crispy pastry filled with spiced potatoes and peas.", "category": "Starters", "dietary_tags": ["vegetarian", "vegan"], "is_available": True, "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80"},
    {"name": "Masala Dosa", "price": 120, "description": "Thin crepe made from a fermented batter of rice and lentils, filled with potato curry.", "category": "Main Course", "dietary_tags": ["vegetarian", "vegan"], "is_available": True, "image_url": "https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=500&q=80"},
    {"name": "Mango Lassi", "price": 90, "description": "Refreshing yogurt-based drink with sweet mango pulp.", "category": "Beverages", "dietary_tags": ["vegetarian"], "is_available": True, "image_url": "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=500&q=80"},
    {"name": "Gulab Jamun", "price": 70, "description": "Soft, melt-in-your-mouth, fried dumplings traditionally made of thickened or reduced milk and soaked in rose-flavored sugar syrup.", "category": "Desserts", "dietary_tags": ["vegetarian"], "is_available": True, "image_url": "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&q=80"}
]

async def seed():
    print('Seeding database...')
    await db.menu_items.delete_many({})
    for item in items:
        text = f"{item['name']} {item['description']} {item['category']} {' '.join(item['dietary_tags'])}"
        try:
            emb = await get_embedding(text)
            print(f"  Got embedding for {item['name']} (dim={len(emb)})")
        except Exception as e:
            print(f"  Embedding failed for {item['name']}: {e}")
            emb = []
        item['embedding'] = emb
        await db.menu_items.insert_one(item)
        print(f"  Inserted {item['name']}")
    print('Seeding done!')

asyncio.run(seed())