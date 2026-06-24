from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime, timezone

from database import db
from models import (
    MenuItemCreate, MenuItemUpdate, MenuItemResponse,
    OrderResponse, OrderItemResponse, OrderStatus
)
from ai_service import generate_menu_details, get_embedding

router = APIRouter(prefix="/admin", tags=["Admin"])


def doc_to_menu_item(doc: dict) -> MenuItemResponse:
    """Convert MongoDB document to MenuItemResponse (no embedding in response)."""
    return MenuItemResponse(
        id=str(doc["_id"]),
        name=doc["name"],
        description=doc.get("description", ""),
        category=doc.get("category", "Other"),
        price=doc["price"],
        dietary_tags=doc.get("dietary_tags", []),
        is_available=doc.get("is_available", True),
        image_url=doc.get("image_url", f"https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80")
    )


def doc_to_order(doc: dict) -> OrderResponse:
    """Convert MongoDB document to OrderResponse."""
    return OrderResponse(
        id=str(doc["_id"]),
        items=[OrderItemResponse(**item) for item in doc["items"]],
        total_price=doc["total_price"],
        status=doc["status"],
        created_at=doc["created_at"],
    )


# --- Menu CRUD ---

@router.get("/menu", response_model=list[MenuItemResponse])
async def get_all_menu_items():
    """Fetch ALL menu items (including unavailable) for admin."""
    cursor = db.menu_items.find()
    items = await cursor.to_list(length=500)
    return [doc_to_menu_item(doc) for doc in items]


@router.post("/menu", response_model=MenuItemResponse)
async def create_menu_item(item: MenuItemCreate):
    # Check if we should use AI
    if not item.description or not item.category:
        details = await generate_menu_details(item.name, item.price)
        desc = item.description or details["description"]
        cat = item.category or details["category"]
        tags = item.dietary_tags or details["dietary_tags"]
    else:
        desc = item.description
        cat = item.category
        tags = item.dietary_tags or []

    # Build text for embedding
    text = f"{item.name} {desc} {cat} {' '.join(tags)}"
    try:
        embedding = await get_embedding(text)
    except Exception as e:
        print(f"Embedding failed for {item.name}: {e}")
        embedding = []

    doc = {
        "name": item.name,
        "description": desc,
        "category": cat,
        "price": item.price,
        "dietary_tags": tags,
        "is_available": True,
        "embedding": embedding,
        "image_url": item.image_url
    }

    result = await db.menu_items.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc_to_menu_item(doc)


@router.put("/menu/{id}", response_model=MenuItemResponse)
async def update_menu_item(id: str, updates: MenuItemUpdate):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID")

    existing = await db.menu_items.find_one({"_id": ObjectId(id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Menu item not found")

    update_data = updates.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Check if embedding-relevant fields changed
    embedding_fields = {"name", "description", "category", "dietary_tags"}
    if embedding_fields & set(update_data.keys()):
        # Merge with existing data
        merged = {**existing, **update_data}
        text = f"{merged['name']} {merged['description']} {merged['category']} {' '.join(merged['dietary_tags'])}"
        update_data["embedding"] = await get_embedding(text)

    await db.menu_items.update_one({"_id": ObjectId(id)}, {"$set": update_data})
    updated = await db.menu_items.find_one({"_id": ObjectId(id)})
    return doc_to_menu_item(updated)


@router.delete("/menu/{id}")
async def delete_menu_item(id: str):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID")

    result = await db.menu_items.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"message": "Deleted successfully"}

# --- Orders Management ---

@router.get("/orders", response_model=list[OrderResponse])
async def get_all_orders():
    cursor = db.orders.find().sort("created_at", -1)
    orders = await cursor.to_list(length=100)
    return [doc_to_order(o) for o in orders]


@router.patch("/orders/{id}/status")
async def update_order_status(id: str, body: dict):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID")

    new_status = body.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="status is required")

    # Validate it's a valid status
    valid_statuses = [s.value for s in OrderStatus]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    order = await db.orders.find_one({"_id": ObjectId(id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Validate transition order
    transitions = ["Placed", "Confirmed", "Preparing", "Ready", "Picked Up"]
    current_idx = transitions.index(order["status"])
    new_idx = transitions.index(new_status)

    if new_idx != current_idx + 1:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from '{order['status']}' to '{new_status}'. Next valid status: '{transitions[current_idx + 1]}'"
            if current_idx + 1 < len(transitions)
            else f"Order is already '{order['status']}' (final state)"
        )

    await db.orders.update_one({"_id": ObjectId(id)}, {"$set": {"status": new_status}})
    return {"message": f"Order status updated to {new_status}"}


@router.delete("/orders/{id}")
async def cancel_order(id: str):
    """Cancel/delete an order at any time."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID")

    result = await db.orders.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order cancelled successfully"}


# --- Dashboard ---

@router.get("/dashboard")
async def get_dashboard():
    # Count orders by status
    status_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_cursor = db.orders.aggregate(status_pipeline)
    status_counts = {doc["_id"]: doc["count"] async for doc in status_cursor}

    # Top 3 popular items by total quantity ordered
    popular_pipeline = [
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.menu_item_id", "name": {"$first": "$items.name"}, "total_qty": {"$sum": "$items.quantity"}}},
        {"$sort": {"total_qty": -1}},
        {"$limit": 3}
    ]
    popular_cursor = db.orders.aggregate(popular_pipeline)
    top_items = [{"menu_item_id": doc["_id"], "name": doc["name"], "total_qty": doc["total_qty"]} async for doc in popular_cursor]

    # Today's revenue
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    revenue_pipeline = [
        {"$match": {"created_at": {"$gte": today_start}}},
        {"$group": {"_id": None, "total_revenue": {"$sum": "$total_price"}}}
    ]
    revenue_cursor = db.orders.aggregate(revenue_pipeline)
    revenue_doc = await revenue_cursor.to_list(length=1)
    total_revenue = revenue_doc[0]["total_revenue"] if revenue_doc else 0

    return {
        "orders_by_status": status_counts,
        "top_items": top_items,
        "todays_revenue": total_revenue,
    }
