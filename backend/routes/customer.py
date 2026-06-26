from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime, timezone
from collections import defaultdict

from database import db
from models import (
    MenuItemResponse, OrderCreate, OrderResponse, OrderItemResponse
)

router = APIRouter(tags=["Customer"])


def doc_to_menu_item(doc: dict) -> MenuItemResponse:
    # meal_type can be a list from AI, just grab the first one
    mt = doc.get("meal_type")
    if isinstance(mt, list):
        mt = mt[0] if mt else None

    return MenuItemResponse(
        id=str(doc["_id"]),
        name=doc["name"],
        description=doc.get("description", ""),
        category=doc.get("category", "Other"),
        price=doc["price"],
        dietary_tags=doc.get("dietary_tags", []),
        is_available=doc.get("is_available", True),
        image_url=doc.get("image_url", f"https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80"),
        search_tags=doc.get("search_tags", []),
        meal_type=mt,
        spice_level=doc.get("spice_level"),
        is_light_meal=doc.get("is_light_meal"),
        is_healthy=doc.get("is_healthy"),
        is_high_protein=doc.get("is_high_protein"),
    )


@router.get("/menu")
async def get_menu():
    cursor = db.menu_items.find({"is_available": True})
    items = await cursor.to_list(length=200)

    grouped = defaultdict(list)
    for doc in items:
        item = doc_to_menu_item(doc)
        grouped[item.category].append(item.model_dump())

    return dict(grouped)


@router.post("/orders", response_model=OrderResponse)
async def create_order(order: OrderCreate):
    if not order.items:
        raise HTTPException(status_code=400, detail="Order must have at least one item")

    order_items = []
    total_price = 0.0

    for item_in in order.items:
        if not ObjectId.is_valid(item_in.menu_item_id):
            raise HTTPException(status_code=400, detail=f"Invalid menu item ID: {item_in.menu_item_id}")

        menu_item = await db.menu_items.find_one({"_id": ObjectId(item_in.menu_item_id)})
        if not menu_item:
            raise HTTPException(status_code=404, detail=f"Menu item not found: {item_in.menu_item_id}")
        if not menu_item.get("is_available", True):
            raise HTTPException(status_code=400, detail=f"Menu item not available: {menu_item['name']}")

        item_total = menu_item["price"] * item_in.quantity
        total_price += item_total

        order_items.append({
            "menu_item_id": item_in.menu_item_id,
            "name": menu_item["name"],
            "quantity": item_in.quantity,
            "price": menu_item["price"],
        })

    doc = {
        "items": order_items,
        "total_price": round(total_price, 2),
        "status": "Placed",
        "created_at": datetime.now(timezone.utc),
    }

    result = await db.orders.insert_one(doc)
    doc["_id"] = result.inserted_id

    return OrderResponse(
        id=str(doc["_id"]),
        items=[OrderItemResponse(**i) for i in doc["items"]],
        total_price=doc["total_price"],
        status=doc["status"],
        created_at=doc["created_at"],
    )


@router.get("/orders/{id}", response_model=OrderResponse)
async def get_order(id: str):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID")

    order = await db.orders.find_one({"_id": ObjectId(id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return OrderResponse(
        id=str(order["_id"]),
        items=[OrderItemResponse(**i) for i in order["items"]],
        total_price=order["total_price"],
        status=order["status"],
        created_at=order["created_at"],
    )
