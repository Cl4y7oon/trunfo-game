import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Character, CharacterStat
from app.schemas import CharacterOut, CharacterStatOut

router = APIRouter(tags=["characters"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


@router.get("/characters", response_model=list[CharacterOut])
def list_characters(db: Session = Depends(get_db)):
    return db.query(Character).all()


@router.post("/characters", response_model=CharacterOut, status_code=201)
def create_character(
    name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    ext = os.path.splitext(file.filename or ".jpg")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Extensao nao permitida: {ext}")

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(file.file.read())

    image_url = f"/uploads/{filename}"
    character = Character(name=name, image_url=image_url)
    db.add(character)
    db.commit()
    db.refresh(character)
    return character


@router.delete("/characters/{character_id}", status_code=204)
def delete_character(character_id: int, db: Session = Depends(get_db)):
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Personagem nao encontrado")

    if character.image_url:
        filename = character.image_url.replace("/uploads/", "")
        filepath = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(filepath):
            os.remove(filepath)

    db.delete(character)
    db.commit()


@router.get("/characters/{character_id}/stats", response_model=CharacterStatOut)
def get_character_stats(character_id: int, db: Session = Depends(get_db)):
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Personagem nao encontrado")

    stats = db.query(CharacterStat).filter(CharacterStat.character_id == character_id).first()
    if not stats:
        raise HTTPException(status_code=404, detail="Nenhuma votacao encontrada para este personagem")

    return stats