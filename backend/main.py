from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import customers, freshdesk, gainsight, gong, rocketlane, salesforce

app = FastAPI(title="Customer Dashboard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(customers.router)
app.include_router(gainsight.router)
app.include_router(salesforce.router)
app.include_router(gong.router)
app.include_router(rocketlane.router)
app.include_router(freshdesk.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "mock_mode": settings.use_mock_data}
