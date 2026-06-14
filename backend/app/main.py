from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, groups, expenses, settlements, import_csv

app = FastAPI(title="EquiSplit API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
# Note: These will raise AttributeErrors until APIRouter instances 
# are actually defined in each of the router files.
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(groups.router, prefix="/api/groups", tags=["groups"])
app.include_router(expenses.router, prefix="/api/expenses", tags=["expenses"])
app.include_router(settlements.router, prefix="/api/settlements", tags=["settlements"])
app.include_router(import_csv.router, prefix="/api/import", tags=["import"])

@app.get("/health", tags=["system"])
def health_check():
    return {"status": "ok"}
