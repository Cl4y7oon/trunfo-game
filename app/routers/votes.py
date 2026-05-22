from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Character, Vote, CharacterStat
from app.auth import get_current_user
from app.schemas import (
    VoteCreate, VoteOut, VoteStatusOut, VoteStatusCharacter,
    VoteSummaryOut, VoteSummaryItem, ATTRIBUTES,
)

router = APIRouter(tags=["votes"])


def recalculate_stats(character_id: int, db: Session):
    """Recalcula as medias de atributos para um personagem."""
    votes = db.query(Vote).filter(Vote.character_id == character_id).all()
    stats = db.query(CharacterStat).filter(CharacterStat.character_id == character_id).first()

    if not stats:
        stats = CharacterStat(character_id=character_id)
        db.add(stats)

    if not votes:
        stats.carismatica = 0
        stats.sincera = 0
        stats.barraqueira = 0
        stats.sonsa = 0
        stats.lerdona = 0
        stats.elegancia = 0
        stats.fofoqueira = 0
        stats.mentirosa = 0
        stats.boa_energia = 0
        stats.total_votes = 0
    else:
        n = len(votes)
        stats.carismatica = sum(v.carismatica for v in votes) / n
        stats.sincera = sum(v.sincera for v in votes) / n
        stats.barraqueira = sum(v.barraqueira for v in votes) / n
        stats.sonsa = sum(v.sonsa for v in votes) / n
        stats.lerdona = sum(v.lerdona for v in votes) / n
        stats.elegancia = sum(v.elegancia for v in votes) / n
        stats.fofoqueira = sum(v.fofoqueira for v in votes) / n
        stats.mentirosa = sum(v.mentirosa for v in votes) / n
        stats.boa_energia = sum(v.boa_energia for v in votes) / n
        stats.total_votes = n

    db.commit()
    db.refresh(stats)
    return stats


@router.get("/votes/status", response_model=VoteStatusOut)
def vote_status(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    characters = db.query(Character).all()
    voted_ids = set(
        v.character_id for v in db.query(Vote).filter(Vote.user_id == user.id).all()
    )

    char_list = []
    for c in characters:
        char_list.append(VoteStatusCharacter(
            character_id=c.id,
            character_name=c.name,
            voted=c.id in voted_ids,
        ))

    return VoteStatusOut(
        total_characters=len(characters),
        voted_count=len(voted_ids),
        characters=char_list,
    )


@router.post("/votes", response_model=VoteOut, status_code=201)
def submit_vote(data: VoteCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    character = db.query(Character).filter(Character.id == data.character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Personagem nao encontrado")

    existing = db.query(Vote).filter(
        Vote.user_id == user.id, Vote.character_id == data.character_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Voce ja votou neste personagem")

    vote = Vote(
        user_id=user.id,
        character_id=data.character_id,
        carismatica=data.carismatica,
        sincera=data.sincera,
        barraqueira=data.barraqueira,
        sonsa=data.sonsa,
        lerdona=data.lerdona,
        elegancia=data.elegancia,
        fofoqueira=data.fofoqueira,
        mentirosa=data.mentirosa,
        boa_energia=data.boa_energia,
    )
    db.add(vote)
    db.commit()
    db.refresh(vote)

    recalculate_stats(data.character_id, db)

    return vote


@router.get("/votes/summary", response_model=VoteSummaryOut)
def vote_summary(db: Session = Depends(get_db)):
    characters = db.query(Character).all()
    items = []
    for c in characters:
        stats = db.query(CharacterStat).filter(CharacterStat.character_id == c.id).first()
        if stats:
            items.append(VoteSummaryItem(
                character_id=c.id,
                character_name=c.name,
                carismatica=round(stats.carismatica, 2),
                sincera=round(stats.sincera, 2),
                barraqueira=round(stats.barraqueira, 2),
                sonsa=round(stats.sonsa, 2),
                lerdona=round(stats.lerdona, 2),
                elegancia=round(stats.elegancia, 2),
                fofoqueira=round(stats.fofoqueira, 2),
                mentirosa=round(stats.mentirosa, 2),
                boa_energia=round(stats.boa_energia, 2),
                total_votes=stats.total_votes,
            ))
    return VoteSummaryOut(characters=items)