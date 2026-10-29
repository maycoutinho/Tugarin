"""Serviço local de detecção YOLO para o protótipo Tugarin.

Instale as dependências e execute conforme README-YOLO.md.
O modelo só identifica as miniaturas depois de treinado com imagens anotadas.
"""
import base64
import os
from io import BytesIO

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO

app = FastAPI(title="Tugarin YOLO detector")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["POST", "GET"], allow_headers=["*"])
MODEL_PATH = os.getenv("TUGARIN_YOLO_MODEL", "runs/detect/tartarugas/weights/best.pt")
model = None
if os.path.isfile(MODEL_PATH):
    model = YOLO(MODEL_PATH)

class Frame(BaseModel):
    image: str

@app.get("/health")
def health():
    return {"ok": True, "model_loaded": model is not None, "model_path": MODEL_PATH}

@app.post("/detect")
def detect(frame: Frame):
    if not frame.image.startswith("data:image/") or "," not in frame.image:
        raise HTTPException(status_code=400, detail="Imagem inválida")
    raw = base64.b64decode(frame.image.split(",", 1)[1])
    image = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="Não foi possível ler a imagem")
    if model is None:
        return {"model_loaded": False, "detections": []}
    prediction = model.predict(image, conf=0.45, verbose=False)[0]
    detections = []
    for box in prediction.boxes:
        x1, y1, x2, y2 = [float(v) for v in box.xyxy[0].tolist()]
        cls_id = int(box.cls[0])
        detections.append({"x1": x1, "y1": y1, "x2": x2, "y2": y2, "label": model.names.get(cls_id, str(cls_id)), "confidence": float(box.conf[0])})
    return {"model_loaded": True, "detections": detections}
