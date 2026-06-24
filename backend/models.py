from pydantic import BaseModel
from typing import List, Optional
from enum import Enum
from datetime import datetime


# --- Menu Item Models ---

class MenuItemCreate(BaseModel):
    name: str
    price: float
    description: Optional[str] = None
    category: Optional[str] = None
    dietary_tags: Optional[List[str]] = None
    image_url: Optional[str] = None


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    dietary_tags: Optional[List[str]] = None
    is_available: Optional[bool] = None
    image_url: Optional[str] = None


class MenuItemResponse(BaseModel):
    id: str
    name: str
    description: str
    category: str
    price: float
    dietary_tags: List[str]
    is_available: bool
    image_url: Optional[str] = None


# --- Order Models ---

class OrderStatus(str, Enum):
    Placed = "Placed"
    Confirmed = "Confirmed"
    Preparing = "Preparing"
    Ready = "Ready"
    PickedUp = "Picked Up"


class OrderItemIn(BaseModel):
    menu_item_id: str
    quantity: int


class OrderCreate(BaseModel):
    items: List[OrderItemIn]


class OrderItemResponse(BaseModel):
    menu_item_id: str
    name: str
    quantity: int
    price: float


class OrderResponse(BaseModel):
    id: str
    items: List[OrderItemResponse]
    total_price: float
    status: str
    created_at: datetime


# --- Search Models ---

class SearchQuery(BaseModel):
    query: str
