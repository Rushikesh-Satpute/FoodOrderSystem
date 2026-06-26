from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.admin import router as admin_router
from routes.customer import router as customer_router
from routes.search import router as search_router
from routes.auth import router as auth_router

app = FastAPI(title="Food Ordering System")

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_router)
app.include_router(customer_router)
app.include_router(search_router)
app.include_router(auth_router)


@app.get("/")
async def root():
    return {"message": "Food Ordering System API is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
