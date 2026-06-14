from fastapi import FastAPI

app = FastAPI(title="EquiSplit API")

@app.get("/")
def read_root():
    return {"message": "Welcome to EquiSplit API"}
