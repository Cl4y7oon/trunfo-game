from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Character, CharacterStat
from app.schemas import CharacterCreate, CharacterOut, CharacterStatOut

router = APIRouter(tags=["characters"])


@router.get("/characters", response_model=list[CharacterOut])
def list_characters(db: Session = Depends(get_db)):
    return db.query(Character).all()


@router.post("/characters", response_model=CharacterOut, status_code=201)
def create_character(data: CharacterCreate, db: Session = Depends(get_db)):
    character = Character(name=data.name, image_url=data.image_url)
    db.add(character)
    db.commit()
    db.refresh(character)
    return character


@router.get("/characters/{character_id}/stats", response_model=CharacterStatOut)
def get_character_stats(character_id: int, db: Session = Depends(get_db)):
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Personagem nao encontrado")

    stats = db.query(CharacterStat).filter(CharacterStat.character_id == character_id).first()
    if not stats:
        raise HTTPException(status_code=404, detail="Nenhuma votacao encontrada para este personagem")

    return stats