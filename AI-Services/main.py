"""
Food Calorie Estimation API
============================
Upload a food image → YOLO detects foods → returns calories & nutrition breakdown.

Swagger UI  : http://localhost:8000/docs
ReDoc        : http://localhost:8000/redoc
Health check : http://localhost:8000/health
"""

from __future__ import annotations

import csv
import io
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel, Field
from ultralytics import YOLO

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).parent
MODEL_PATH = BASE_DIR / "bestfinale1.pt"
CSV_INGR   = BASE_DIR / "nutrition5k_dataset_metadata_ingredients_metadata.csv"
CSV_CAFE1  = BASE_DIR / "nutrition5k_dataset_metadata_dish_metadata_cafe1.csv"
CSV_CAFE2  = BASE_DIR / "nutrition5k_dataset_metadata_dish_metadata_cafe2.csv"

# ── Global state ───────────────────────────────────────────────────────────────
model:        Optional[YOLO] = None
nutrition_db: Dict[str, dict] = {}

# ── Nutrition DB ───────────────────────────────────────────────────────────────

def _load_ingredients_csv() -> Dict[str, dict]:
    db: Dict[str, dict] = {}
    with open(CSV_INGR, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            name = row["ingr"].lower().strip()
            try:
                db[name] = {
                    "calories": round(float(row["cal/g"])      * 100, 1),
                    "fat":      round(float(row["fat(g)"])     * 100, 1),
                    "carbs":    round(float(row["carb(g)"])    * 100, 1),
                    "protein":  round(float(row["protein(g)"]) * 100, 1),
                }
            except (ValueError, KeyError):
                continue
    return db


def _load_dish_csv(filepath: Path, db: Dict[str, dict]) -> None:
    """
    Headerless dish_metadata CSV.
    Columns: dish_id, total_cal, total_mass, total_fat, total_carb, total_protein,
             [ingr_id, ingr_name, mass_g, cal, fat, carb, prot] × N
    """
    with open(filepath, encoding="utf-8") as f:
        for row in csv.reader(f):
            i = 6
            while i + 7 <= len(row):
                name = row[i + 1].strip().lower()
                try:
                    mass = float(row[i + 2])
                    cal  = float(row[i + 3])
                    fat  = float(row[i + 4])
                    carb = float(row[i + 5])
                    prot = float(row[i + 6])
                except (ValueError, IndexError):
                    break
                if mass > 0 and name and name != "none" and name not in db:
                    ratio = 100.0 / mass
                    db[name] = {
                        "calories": round(cal  * ratio, 1),
                        "fat":      round(fat  * ratio, 1),
                        "carbs":    round(carb * ratio, 1),
                        "protein":  round(prot * ratio, 1),
                    }
                i += 7


def build_nutrition_db() -> Dict[str, dict]:
    db = _load_ingredients_csv()
    _load_dish_csv(CSV_CAFE1, db)
    _load_dish_csv(CSV_CAFE2, db)
    return db


# ── Nutrition lookup ───────────────────────────────────────────────────────────

# Maps YOLO class names → DB keys (None = skip)
CLASS_ALIASES: Dict[str, Optional[str]] = {
    "french fries":          "french fries",
    "cheese butter":         "butter",
    "chicken duck":          "chicken",
    "fried meat":            "pork",
    "cilantro mint":         "parsley",
    "spring onion":          "spring onions",
    "white radish":          "radish",
    "celery stick":          "celery",
    "snow peas":             "peas",
    "French beans":          "green beans",
    "shiitake":              "mushroom",
    "white button mushroom": "mushroom",
    "rape":                  "broccoli",
    "other ingredients":     None,   # skip
}

# Per-100g fallback values for classes not in the Nutrition5k DB
FALLBACK_NUTRITION: Dict[str, dict] = {
    "french fries":          {"calories": 312, "fat": 15.0, "carbs": 41.0, "protein":  3.4},
    "chocolate":             {"calories": 546, "fat": 31.0, "carbs": 60.0, "protein":  5.0},
    "biscuit":               {"calories": 418, "fat": 14.0, "carbs": 68.0, "protein":  6.0},
    "ice cream":             {"calories": 207, "fat": 11.0, "carbs": 24.0, "protein":  3.5},
    "cheese butter":         {"calories": 717, "fat": 81.0, "carbs":  0.1, "protein":  0.9},
    "cake":                  {"calories": 347, "fat": 15.0, "carbs": 50.0, "protein":  4.0},
    "wine":                  {"calories":  83, "fat":  0.0, "carbs":  2.6, "protein":  0.1},
    "milkshake":             {"calories": 112, "fat":  3.0, "carbs": 18.0, "protein":  3.8},
    "coffee":                {"calories":   2, "fat":  0.0, "carbs":  0.0, "protein":  0.3},
    "juice":                 {"calories":  45, "fat":  0.1, "carbs": 10.0, "protein":  0.7},
    "milk":                  {"calories":  61, "fat":  3.3, "carbs":  4.8, "protein":  3.2},
    "almond":                {"calories": 579, "fat": 50.0, "carbs": 22.0, "protein": 21.0},
    "soy":                   {"calories": 446, "fat": 20.0, "carbs": 30.0, "protein": 36.0},
    "walnut":                {"calories": 654, "fat": 65.0, "carbs": 14.0, "protein": 15.0},
    "egg":                   {"calories": 155, "fat": 11.0, "carbs":  1.1, "protein": 13.0},
    "apple":                 {"calories":  52, "fat":  0.2, "carbs": 14.0, "protein":  0.3},
    "avocado":               {"calories": 160, "fat": 15.0, "carbs":  9.0, "protein":  2.0},
    "banana":                {"calories":  89, "fat":  0.3, "carbs": 23.0, "protein":  1.1},
    "strawberry":            {"calories":  32, "fat":  0.3, "carbs":  7.7, "protein":  0.7},
    "cherry":                {"calories":  50, "fat":  0.3, "carbs": 12.0, "protein":  1.0},
    "blueberry":             {"calories":  57, "fat":  0.3, "carbs": 14.0, "protein":  0.7},
    "raspberry":             {"calories":  52, "fat":  0.7, "carbs": 12.0, "protein":  1.2},
    "mango":                 {"calories":  60, "fat":  0.4, "carbs": 15.0, "protein":  0.8},
    "olives":                {"calories": 115, "fat": 11.0, "carbs":  6.3, "protein":  0.8},
    "peach":                 {"calories":  39, "fat":  0.3, "carbs": 10.0, "protein":  0.9},
    "lemon":                 {"calories":  29, "fat":  0.3, "carbs":  9.3, "protein":  1.1},
    "pineapple":             {"calories":  50, "fat":  0.1, "carbs": 13.0, "protein":  0.5},
    "grape":                 {"calories":  67, "fat":  0.4, "carbs": 17.0, "protein":  0.6},
    "kiwi":                  {"calories":  61, "fat":  0.5, "carbs": 15.0, "protein":  1.1},
    "orange":                {"calories":  47, "fat":  0.1, "carbs": 12.0, "protein":  0.9},
    "steak":                 {"calories": 271, "fat": 19.0, "carbs":  0.0, "protein": 26.0},
    "pork":                  {"calories": 242, "fat": 14.0, "carbs":  0.0, "protein": 27.0},
    "chicken duck":          {"calories": 239, "fat": 14.0, "carbs":  0.0, "protein": 27.0},
    "sausage":               {"calories": 301, "fat": 26.0, "carbs":  1.5, "protein": 14.0},
    "fried meat":            {"calories": 280, "fat": 18.0, "carbs":  5.0, "protein": 24.0},
    "lamb":                  {"calories": 294, "fat": 21.0, "carbs":  0.0, "protein": 25.0},
    "sauce":                 {"calories":  80, "fat":  4.0, "carbs": 10.0, "protein":  1.5},
    "fish":                  {"calories": 206, "fat": 12.0, "carbs":  0.0, "protein": 22.0},
    "shrimp":                {"calories":  99, "fat":  0.3, "carbs":  0.2, "protein": 24.0},
    "soup":                  {"calories":  40, "fat":  1.5, "carbs":  5.0, "protein":  2.5},
    "bread":                 {"calories": 265, "fat":  3.2, "carbs": 49.0, "protein":  9.0},
    "corn":                  {"calories":  86, "fat":  1.4, "carbs": 19.0, "protein":  3.3},
    "pizza":                 {"calories": 266, "fat": 10.0, "carbs": 33.0, "protein": 11.0},
    "pasta":                 {"calories": 131, "fat":  1.1, "carbs": 25.0, "protein":  5.0},
    "noodles":               {"calories": 138, "fat":  2.1, "carbs": 25.0, "protein":  4.5},
    "rice":                  {"calories": 130, "fat":  0.3, "carbs": 28.0, "protein":  2.7},
    "pie":                   {"calories": 260, "fat": 13.0, "carbs": 33.0, "protein":  4.0},
    "tofu":                  {"calories":  76, "fat":  4.8, "carbs":  1.9, "protein":  8.1},
    "potato":                {"calories":  77, "fat":  0.1, "carbs": 17.0, "protein":  2.0},
    "garlic":                {"calories": 149, "fat":  0.5, "carbs": 33.0, "protein":  6.4},
    "cauliflower":           {"calories":  25, "fat":  0.3, "carbs":  5.0, "protein":  1.9},
    "tomato":                {"calories":  18, "fat":  0.2, "carbs":  3.9, "protein":  0.9},
    "spring onion":          {"calories":  32, "fat":  0.2, "carbs":  7.3, "protein":  1.8},
    "rape":                  {"calories":  25, "fat":  0.4, "carbs":  3.7, "protein":  2.1},
    "lettuce":               {"calories":  15, "fat":  0.2, "carbs":  2.9, "protein":  1.4},
    "pumpkin":               {"calories":  26, "fat":  0.1, "carbs":  6.5, "protein":  1.0},
    "cucumber":              {"calories":  16, "fat":  0.1, "carbs":  3.6, "protein":  0.7},
    "white radish":          {"calories":  16, "fat":  0.1, "carbs":  3.4, "protein":  0.7},
    "carrot":                {"calories":  41, "fat":  0.2, "carbs": 10.0, "protein":  0.9},
    "asparagus":             {"calories":  20, "fat":  0.1, "carbs":  3.9, "protein":  2.2},
    "broccoli":              {"calories":  34, "fat":  0.4, "carbs":  7.0, "protein":  2.8},
    "celery stick":          {"calories":  16, "fat":  0.2, "carbs":  3.0, "protein":  0.7},
    "cilantro mint":         {"calories":  23, "fat":  0.5, "carbs":  3.7, "protein":  2.1},
    "snow peas":             {"calories":  42, "fat":  0.2, "carbs":  7.6, "protein":  2.8},
    "cabbage":               {"calories":  25, "fat":  0.1, "carbs":  5.8, "protein":  1.3},
    "onion":                 {"calories":  40, "fat":  0.1, "carbs":  9.3, "protein":  1.1},
    "pepper":                {"calories":  31, "fat":  0.3, "carbs":  6.0, "protein":  1.0},
    "green beans":           {"calories":  31, "fat":  0.2, "carbs":  7.0, "protein":  1.8},
    "French beans":          {"calories":  31, "fat":  0.2, "carbs":  7.0, "protein":  1.8},
    "shiitake":              {"calories":  34, "fat":  0.5, "carbs":  6.8, "protein":  2.2},
    "white button mushroom": {"calories":  22, "fat":  0.3, "carbs":  3.3, "protein":  3.1},
}

# Typical serving weights (grams) per YOLO class
SERVING_WEIGHTS: Dict[str, float] = {
    "french fries": 150, "chocolate": 30,   "biscuit": 15,    "ice cream": 100,
    "cheese butter": 20, "cake": 100,        "wine": 150,      "milkshake": 300,
    "coffee": 250,       "juice": 250,       "milk": 250,      "almond": 30,
    "soy": 100,          "walnut": 30,       "egg": 55,        "apple": 180,
    "avocado": 150,      "banana": 120,      "strawberry": 15, "cherry": 10,
    "blueberry": 10,     "raspberry": 10,    "mango": 200,     "olives": 20,
    "peach": 150,        "lemon": 80,        "pineapple": 200, "grape": 10,
    "kiwi": 70,          "orange": 180,      "steak": 200,     "pork": 150,
    "chicken duck": 150, "sausage": 80,      "fried meat": 150,"lamb": 150,
    "sauce": 30,         "fish": 150,        "shrimp": 100,    "soup": 250,
    "bread": 30,         "corn": 150,        "pizza": 250,     "pasta": 180,
    "noodles": 180,      "rice": 200,        "pie": 150,       "tofu": 100,
    "potato": 170,       "garlic": 5,        "cauliflower": 150,"tomato": 120,
    "spring onion": 15,  "rape": 100,        "lettuce": 100,   "pumpkin": 150,
    "cucumber": 150,     "white radish": 100,"carrot": 80,     "asparagus": 100,
    "broccoli": 150,     "celery stick": 80, "cilantro mint": 10,"snow peas": 80,
    "cabbage": 150,      "onion": 100,       "pepper": 150,    "green beans": 100,
    "French beans": 100, "shiitake": 80,     "white button mushroom": 80,
    "other ingredients": 50,
}


def lookup_nutrition(class_name: str) -> Optional[dict]:
    """Return per-100g nutrition for a YOLO class. Returns None to skip the class."""
    # Explicitly skipped classes (e.g. 'other ingredients')
    if class_name in CLASS_ALIASES and CLASS_ALIASES[class_name] is None:
        return None

    lookup_name = CLASS_ALIASES.get(class_name, class_name)
    if lookup_name is None:
        return None
    lookup_name = lookup_name.lower().strip()

    # 1. Exact match in Nutrition5k DB
    if lookup_name in nutrition_db:
        return {**nutrition_db[lookup_name], "source": "nutrition5k"}

    # 2. Substring match in Nutrition5k DB
    for key in nutrition_db:
        if lookup_name in key or key in lookup_name:
            return {**nutrition_db[key], "source": "nutrition5k"}

    # 3. Curated fallback table
    if class_name in FALLBACK_NUTRITION:
        return {**FALLBACK_NUTRITION[class_name], "source": "fallback"}

    # 4. Generic default
    return {"calories": 100, "fat": 5.0, "carbs": 15.0, "protein": 3.0, "source": "default"}


# ── Pydantic models ────────────────────────────────────────────────────────────

class FoodItem(BaseModel):
    name:       str   = Field(..., example="banana")
    confidence: float = Field(..., example=0.979)
    weight_g:   float = Field(..., example=120.0)
    calories:   float = Field(..., example=106.8)
    fat_g:      float = Field(..., example=0.36)
    carbs_g:    float = Field(..., example=27.6)
    protein_g:  float = Field(..., example=1.32)
    source:     str   = Field(..., example="nutrition5k")


class PredictResponse(BaseModel):
    success:         bool           = Field(..., example=True)
    image_size:      List[int]      = Field(..., example=[512, 341])
    items_detected:  int            = Field(..., example=2)
    total_calories:  float          = Field(..., example=320.5)
    total_fat_g:     float          = Field(..., example=4.2)
    total_carbs_g:   float          = Field(..., example=68.1)
    total_protein_g: float          = Field(..., example=5.8)
    foods:           List[FoodItem]
    nutrition_source: str = Field(
        default="Nutrition5k Dataset (Google Research) + curated fallback",
        example="Nutrition5k Dataset (Google Research) + curated fallback",
    )


class HealthResponse(BaseModel):
    status:            str  = Field(..., example="ok")
    model_loaded:      bool = Field(..., example=True)
    nutrition_db_size: int  = Field(..., example=552)
    model_classes:     int  = Field(..., example=72)


class ClassesResponse(BaseModel):
    total:   int            = Field(..., example=72)
    classes: List[str]


# ── Lifespan ───────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, nutrition_db

    print("⏳ Loading nutrition database...")
    nutrition_db = build_nutrition_db()
    print(f"   ✅ {len(nutrition_db)} foods loaded")

    print("⏳ Loading YOLO model...")
    model = YOLO(str(MODEL_PATH))
    print(f"   ✅ Model ready — {len(model.names)} classes")

    print("⏳ Warming up model (first inference)...")
    import numpy as np
    dummy = Image.fromarray(np.zeros((64, 64, 3), dtype=np.uint8))
    model(dummy, conf=0.25, verbose=False)
    print("   ✅ Model warm — API ready")

    yield

    print("🛑 Shutting down.")


# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="🍽️ Food Calorie Estimation API",
    description="""
## Food Detection & Nutrition Analysis

Upload any food image and get:
- **Detected food items** with confidence scores
- **Calorie estimation** per item and total
- **Full macro breakdown** — fat, carbs, protein
- **Serving weight** per food item

### Data Sources
- **Nutrition5k Dataset** (Google Research) — primary source
- **Curated fallback table** — covers all 72 YOLO classes

### Model
- Custom-trained **YOLOv8** on 72 food categories
- Confidence threshold: **0.25**

### Quick Test
Use the `/predict` endpoint below — click **Try it out**, upload an image, and hit **Execute**.
""",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# In production set ALLOWED_ORIGINS env var, e.g. "https://yourapp.netlify.app"
_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    tags=["System"],
)
def health():
    """Returns API status, model load state, and DB size."""
    return HealthResponse(
        status="ok" if model is not None else "loading",
        model_loaded=model is not None,
        nutrition_db_size=len(nutrition_db),
        model_classes=len(model.names) if model else 0,
    )


@app.get(
    "/classes",
    response_model=ClassesResponse,
    summary="List Detectable Food Classes",
    tags=["System"],
)
def list_classes():
    """Returns all 72 food classes the YOLO model can detect."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet.")
    names = list(model.names.values())
    return ClassesResponse(total=len(names), classes=names)


@app.post(
    "/predict",
    response_model=PredictResponse,
    summary="Detect Foods & Estimate Calories",
    tags=["Prediction"],
    responses={
        200: {
            "description": "Successful prediction",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "image_size": [512, 341],
                        "items_detected": 2,
                        "total_calories": 320.5,
                        "total_fat_g": 4.2,
                        "total_carbs_g": 68.1,
                        "total_protein_g": 5.8,
                        "foods": [
                            {
                                "name": "banana",
                                "confidence": 0.979,
                                "weight_g": 120.0,
                                "calories": 106.8,
                                "fat_g": 0.36,
                                "carbs_g": 27.6,
                                "protein_g": 1.32,
                                "source": "nutrition5k",
                            }
                        ],
                        "nutrition_source": "Nutrition5k Dataset (Google Research) + curated fallback",
                    }
                }
            },
        },
        400: {"description": "Invalid or unreadable image file"},
        503: {"description": "Model not loaded yet"},
    },
)
async def predict(
    image: UploadFile = File(
        ...,
        description="Food image to analyse (JPEG, PNG, WEBP, BMP). Max recommended: 10 MB.",
    )
):
    """
    **Upload a food image** to detect items and get a full nutrition breakdown.

    - Accepts: JPEG, PNG, WEBP, BMP
    - Returns detected foods with calories, fat, carbs, protein
    - Uses YOLOv8 with confidence threshold 0.25
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet.")

    raw = await image.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    try:
        pil_img = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or unreadable image file.")

    img_w, img_h = pil_img.size

    results = model(pil_img, conf=0.25, verbose=False)
    boxes   = results[0].boxes

    if boxes is None or len(boxes) == 0:
        return PredictResponse(
            success=True,
            image_size=[img_w, img_h],
            items_detected=0,
            total_calories=0.0,
            total_fat_g=0.0,
            total_carbs_g=0.0,
            total_protein_g=0.0,
            foods=[],
        )

    foods: List[FoodItem] = []
    total_cal = total_fat = total_carbs = total_prot = 0.0

    for cls_id, conf in zip(boxes.cls, boxes.conf):
        class_name = model.names[int(cls_id)]
        conf_val   = round(float(conf), 4)

        nutrition = lookup_nutrition(class_name)
        if nutrition is None:
            continue

        weight = SERVING_WEIGHTS.get(class_name, 100.0)
        ratio  = weight / 100.0

        cal   = round(nutrition["calories"] * ratio, 2)
        fat   = round(nutrition["fat"]      * ratio, 2)
        carbs = round(nutrition["carbs"]    * ratio, 2)
        prot  = round(nutrition["protein"]  * ratio, 2)

        total_cal   += cal
        total_fat   += fat
        total_carbs += carbs
        total_prot  += prot

        foods.append(FoodItem(
            name=class_name,
            confidence=conf_val,
            weight_g=weight,
            calories=cal,
            fat_g=fat,
            carbs_g=carbs,
            protein_g=prot,
            source=nutrition.get("source", "nutrition5k"),
        ))

    return PredictResponse(
        success=True,
        image_size=[img_w, img_h],
        items_detected=len(foods),
        total_calories=round(total_cal, 1),
        total_fat_g=round(total_fat, 1),
        total_carbs_g=round(total_carbs, 1),
        total_protein_g=round(total_prot, 1),
        foods=foods,
    )
