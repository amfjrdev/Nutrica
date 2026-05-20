import os
import csv
import json
import numpy as np
from collections import defaultdict
from ultralytics import YOLO

BASE_DIR = r"F:\python pfe\nutrition_calories"
os.chdir(BASE_DIR)

BEST_PT = os.path.join(BASE_DIR, "best.pt")
TEST_IMAGE = os.path.join(BASE_DIR, "test.jpg")

CAFE1 = os.path.join(BASE_DIR, "nutrition5k_dataset_metadata_dish_metadata_cafe1.csv")
CAFE2 = os.path.join(BASE_DIR, "nutrition5k_dataset_metadata_dish_metadata_cafe2.csv")
INGREDIENTS = os.path.join(BASE_DIR, "nutrition5k_dataset_metadata_ingredients_metadata.csv")

print("=" * 60)
print("CALORIES - NUTRITION5K")
print("=" * 60)

for f in [BEST_PT, TEST_IMAGE, CAFE1, CAFE2, INGREDIENTS]:
    status = "✅" if os.path.exists(f) else "❌ MANQUANT"
    print(f"{status} {os.path.basename(f)}")


print("\n⏳ Chargement de Nutrition5k...")

nutrition_db = {}

print("\n📖 Méthode 1 : ingredients_metadata.csv")
with open(INGREDIENTS, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    count = 0
    for row in reader:
        name = row['ingr'].lower().strip()
        cal_per_g = float(row['cal/g'])
        fat_per_g = float(row['fat(g)'])
        carb_per_g = float(row['carb(g)'])
        prot_per_g = float(row['protein(g)'])

        # Convertir en calories par 100g
        nutrition_db[name] = {
            "calories": round(cal_per_g * 100, 1),
            "fat": round(fat_per_g * 100, 1),
            "carbs": round(carb_per_g * 100, 1),
            "protein": round(prot_per_g * 100, 1)
        }
        count += 1
    print(f"   ✅ {count} ingrédients chargés")

# ─── MÉTHODE 2 : dish_metadata (sans en-têtes, structure plate) ───
print("\n📖 Méthode 2 : dish_metadata (backup)")


def parse_dish_no_header(filepath):
    """Parse CSV sans en-tête : structure répétée ID,nom,poids,cal,fat,carb,prot"""
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        count = 0
        for row in reader:
            # Parcourir par blocs de 6 colonnes (après les 6 premières = totals)
            # Structure : dish_id, total_cal, total_mass, total_fat, total_carb, total_protein,
            #             ingr_id, ingr_name, mass, cal, fat, carb, prot,
            #             ingr_id, ingr_name, mass, cal, fat, carb, prot, ...

            i = 6  # Skip les 6 premières colonnes (totaux)
            while i + 6 <= len(row):
                ingr_id = row[i].strip()
                name = row[i + 1].strip().lower()

                try:
                    mass = float(row[i + 2])
                    cal = float(row[i + 3])
                    fat = float(row[i + 4])
                    carb = float(row[i + 5])
                    prot = float(row[i + 6])
                except:
                    break

                if mass > 0 and name and name != 'none':
                    # Calculer par 100g
                    ratio = 100.0 / mass
                    if name not in nutrition_db:
                        nutrition_db[name] = {"calories": [], "fat": [], "carbs": [], "protein": []}
                        nutrition_db[name]["calories"].append(cal * ratio)
                        nutrition_db[name]["fat"].append(fat * ratio)
                        nutrition_db[name]["carbs"].append(carb * ratio)
                        nutrition_db[name]["protein"].append(prot * ratio)
                        count += 1

                i += 6  # Passer au bloc suivant

    print(f"   ✅ {count} ingrédients extraits de {os.path.basename(filepath)}")


parse_dish_no_header(CAFE1)
parse_dish_no_header(CAFE2)

# ─── FINALISER LA BASE ───
# Si on a des listes (méthode 2), calculer les moyennes
final_db = {}
for name, vals in nutrition_db.items():
    if isinstance(vals, dict) and "calories" in vals:
        if isinstance(vals["calories"], list):
            # Moyenne des valeurs
            final_db[name] = {
                "calories": round(sum(vals["calories"]) / len(vals["calories"]), 1),
                "fat": round(sum(vals["fat"]) / len(vals["fat"]), 1),
                "carbs": round(sum(vals["carbs"]) / len(vals["carbs"]), 1),
                "protein": round(sum(vals["protein"]) / len(vals["protein"]), 1)
            }
        else:
            final_db[name] = vals
    else:
        final_db[name] = vals

print(f"\n📊 Base finale : {len(final_db)} aliments uniques")

# Sauvegarder
with open("nutrition5k_db.json", "w") as f:
    json.dump(final_db, f, indent=2)
print("✅ Base sauvegardée : nutrition5k_db.json")


# ─── FONCTION DE RECHERCHE ───
def find_nutrition(food_name):
    name = food_name.lower().strip().replace("_", " ")

    # 1. Match exact
    if name in final_db:
        return name, final_db[name]

    # 2. Contenu
    for ing in final_db:
        if name in ing or ing in name:
            return ing, final_db[ing]

    # 3. Mapping manuel
    manual = {
        "strawberry": "strawberries",
        "soy_sauce": "soy sauce",
        "hot_dog": "hot dog",
        "curry": "chicken curry",
        "porridge": "oat porridge",
        "spring_roll": "spring roll",
        "croquette": "potato croquette",
        "egg": "scrambled eggs", "chicken": "chicken breast", "beef": "beef steak",
        "salmon": "salmon fillet", "pork": "pork chop", "bread": "bread slice",
        "rice": "white rice", "pasta": "spaghetti", "potato": "mashed potatoes",
        "lettuce": "green salad", "pepper": "bell pepper", "oil": "olive oil",
        "yogurt": "greek yogurt", "cheese": "cheddar cheese", "butter": "salted butter",
        "milk": "whole milk", "sugar": "white sugar", "flour": "all purpose flour",
        "nuts": "mixed nuts", "cream": "heavy cream", "jam": "strawberry jam",
        "soup": "chicken soup", "salad": "green salad", "burger": "hamburger",
        "fries": "french fries", "pizza": "cheese pizza", "sandwich": "club sandwich",
        "bacon": "bacon strip", "sausage": "pork sausage", "ham": "ham slice",
        "toast": "bread toast", "croissant": "butter croissant", "muffin": "blueberry muffin",
        "donut": "glazed donut", "noodles": "egg noodles", "sushi": "sushi roll",
        "taco": "beef taco", "hot dog": "hot dog", "steak": "beef steak",
        "meatball": "meatball", "curry": "chicken curry", "porridge": "oat porridge",
        "cereal": "corn flakes", "smoothie": "fruit smoothie", "milkshake": "vanilla milkshake",
        "pie": "apple pie", "pudding": "vanilla pudding", "brownie": "chocolate brownie",
        "cupcake": "vanilla cupcake", "cheesecake": "cheesecake", "crepe": "french crepe",
        "dumpling": "pork dumpling", "spring roll": "spring roll", "samosa": "vegetable samosa",
        "nachos": "cheese nachos", "popcorn": "buttered popcorn", "pretzel": "soft pretzel",
        "cracker": "wheat cracker", "biscuit": "buttermilk biscuit", "croquette": "potato croquette",
        "falafel": "falafel ball", "hummus": "chickpea hummus", "guacamole": "avocado guacamole",
        "salsa": "tomato salsa", "pesto": "basil pesto", "coleslaw": "creamy coleslaw",
        "pickle": "dill pickle", "raisin": "dried raisin", "prune": "dried prune",
        "apricot": "dried apricot", "banana": "banana", "apple": "apple",
        "orange": "orange", "grape": "grape",
        "cucumber": "cucumber", "mushroom": "mushroom", "corn": "corn",
        "peas": "peas", "beans": "beans", "tuna": "tuna", "shrimp": "shrimp",
        "turkey": "turkey", "spinach": "spinach", "cabbage": "cabbage",
        "cauliflower": "cauliflower", "eggplant": "eggplant", "zucchini": "zucchini",
        "avocado": "avocado", "almonds": "almonds", "honey": "honey",
        "chocolate": "chocolate", "cake": "cake", "cookie": "cookie",
        "wine": "wine", "beer": "beer", "coffee": "coffee", "tea": "tea",
        "juice": "juice", "water": "water",
    }

    mapped = manual.get(food_name)
    if mapped and mapped in final_db:
        return mapped, final_db[mapped]

    return None, {"calories": 100, "fat": 5, "carbs": 15, "protein": 3, "default": True}


# ─── POIDS MOYENS RÉELS ───
AVERAGE_WEIGHTS = {
    "banana": 120, "apple": 180, "bread": 30, "egg": 50,
    "chicken": 150, "beef": 150, "salmon": 150, "pork": 150,
    "rice": 200, "pasta": 180, "potato": 170, "tomato": 150,
    "carrot": 80, "broccoli": 150, "lettuce": 100, "onion": 100,
    "butter": 15, "oil": 15, "sugar": 20, "yogurt": 150,
    "orange": 180, "grape": 150, "strawberry": 15, "cucumber": 150,
    "mushroom": 100, "corn": 150, "peas": 100, "beans": 150,
    "tuna": 120, "shrimp": 100, "turkey": 150, "spinach": 100,
    "cabbage": 500, "cauliflower": 400, "pepper": 150, "eggplant": 250,
    "zucchini": 200, "avocado": 150, "nuts": 30, "almonds": 30,
    "honey": 20, "chocolate": 30, "cake": 100, "cookie": 15,
    "pizza": 250, "burger": 250, "fries": 150, "sandwich": 200,
    "soup": 250, "salad": 150, "bacon": 30, "sausage": 80,
    "ham": 50, "ice_cream": 100, "cream": 30, "jam": 20,
    "ketchup": 20, "mayonnaise": 20, "vinegar": 15, "soy_sauce": 15,
    "wine": 150, "beer": 330, "coffee": 250, "tea": 250,
    "juice": 250, "water": 250, "milk": 250, "cheese": 30,
    "flour": 125, "oats": 40, "cereal": 40, "toast": 30,
    "croissant": 60, "muffin": 80, "donut": 60, "noodles": 180,
    "sushi": 30, "taco": 150, "hot_dog": 150, "steak": 200,
    "meatball": 50, "curry": 250, "porridge": 250, "smoothie": 300,
    "milkshake": 300, "pie": 150, "pudding": 150, "brownie": 60,
    "cupcake": 60, "cheesecake": 120, "crepe": 80, "dumpling": 30,
    "spring_roll": 50, "samosa": 50, "nachos": 150, "popcorn": 50,
    "pretzel": 80, "cracker": 15, "biscuit": 15, "croquette": 50,
    "falafel": 50, "hummus": 50, "guacamole": 50, "salsa": 30,
    "pesto": 30, "coleslaw": 100, "pickle": 30, "raisin": 30,
    "prune": 30, "apricot": 30,
}


def estimate_weight(food_name, confidence):
    name = food_name.lower().strip()
    if name in AVERAGE_WEIGHTS:
        base = AVERAGE_WEIGHTS[name]
        variation = (confidence - 0.5) * 0.2
        return base * (1 + variation)
    return 100


# ─── CHARGER YOLO ───
print("\n" + "=" * 60)
print("CHARGEMENT YOLO")
print("=" * 60)

model = YOLO(BEST_PT)
print(f"✅ Modèle chargé ({len(model.names)} classes)")

# ─── ANALYSER ───
print("\n" + "=" * 60)
print("ANALYSE DE L'IMAGE")
print("=" * 60)

results = model(TEST_IMAGE, conf=0.25)
result = results[0]

if result.masks is None or result.boxes is None:
    print("❌ Aucun aliment détecté")
else:
    total_cal = 0
    total_fat = 0
    total_carbs = 0
    total_prot = 0
    foods = []

    print(f"\n{'Aliment':<18} {'Conf':>5} {'Poids(g)':>9} {'Kcal':>7} {'Source':>12}")
    print("-" * 60)

    for cls_id, conf in zip(result.boxes.cls, result.boxes.conf):
        name = model.names[int(cls_id)]
        conf_val = float(conf)

        weight = estimate_weight(name, conf_val)

        matched, info = find_nutrition(name)
        cal = (weight / 100.0) * info["calories"]
        fat = (weight / 100.0) * info["fat"]
        carbs = (weight / 100.0) * info["carbs"]
        prot = (weight / 100.0) * info["protein"]

        total_cal += cal
        total_fat += fat
        total_carbs += carbs
        total_prot += prot

        src = "Nutrition5k" if matched else "Défaut"
        print(f"{name:<18} {conf_val:>4.0%} {weight:>8.1f} {cal:>6.1f} {src:>12}")

        foods.append({
            "name": name,
            "weight_g": round(weight, 1),
            "calories": round(cal, 1),
            "fat": round(fat, 1),
            "carbs": round(carbs, 1),
            "protein": round(prot, 1),
            "source": "nutrition5k" if matched else "default"
        })

    print("-" * 60)
    print(f"{'TOTAL':<18} {'':>5} {'':>8} {total_cal:>6.1f}")

    output = {
        "success": True,
        "total_calories": round(total_cal, 1),
        "total_fat": round(total_fat, 1),
        "total_carbs": round(total_carbs, 1),
        "total_protein": round(total_prot, 1),
        "num_items": len(foods),
        "nutrition_source": "Nutrition5k Dataset (Google Research)",
        "foods": foods
    }

    with open("result_nutrition5k.json", "w", encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Résultat : result_nutrition5k.json")
    print(f"🍽️  Calories totales : {total_cal:.1f} kcal")
    print(f"   Protéines : {total_prot:.1f}g")
    print(f"   Glucides : {total_carbs:.1f}g")
    print(f"   Lipides : {total_fat:.1f}g")

print("\n" + "=" * 60)
print("FIN")
print("=" * 60)