from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Game, GamePlayer, GameCard, RoundPlay, CharacterStat
from app.auth import get_current_user
from app.schemas import (
    GameOut, GameDetailOut, GamePlayerOut, GameCardOut,
    ChooseAttributeRequest, PlayCardRequest, RoundPlayOut,
    GameListOut, ATTRIBUTES,
)
from app.services.game_engine import start_game, choose_attribute, play_card

router = APIRouter(tags=["game"])


def get_game_or_404(game_id: int, db: Session) -> Game:
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Jogo nao encontrado")
    return game


def build_game_detail(game: Game, user: User, db: Session) -> GameDetailOut:
    players = sorted(game.players, key=lambda p: p.id)
    player_outs = [
        GamePlayerOut(
            id=p.id,
            user_id=p.user_id,
            user_name=p.user.name,
            rounds_won=p.rounds_won,
        )
        for p in players
    ]

    # Cartas do jogador logado (não jogadas)
    my_cards = db.query(GameCard).filter(
        GameCard.game_id == game.id,
        GameCard.player_id != None,
    ).all()

    my_card_by_user = []
    for card in my_cards:
        gp = db.query(GamePlayer).filter(GamePlayer.id == card.player_id).first()
        if gp and gp.user_id == user.id and not card.played:
            stats = db.query(CharacterStat).filter(
                CharacterStat.character_id == card.character_id
            ).first()
            my_card_by_user.append(GameCardOut(
                id=card.id,
                character_id=card.character_id,
                character_name=card.character.name,
                carismatica=stats.carismatica if stats else 0,
                sincera=stats.sincera if stats else 0,
                barraqueira=stats.barraqueira if stats else 0,
                sonsa=stats.sonsa if stats else 0,
                lerdona=stats.lerdona if stats else 0,
                elegancia=stats.elegancia if stats else 0,
                played=card.played,
            ))

    round_plays = db.query(RoundPlay).filter(RoundPlay.game_id == game.id).all()
    round_outs = [
        RoundPlayOut(
            id=rp.id,
            round_number=rp.round_number,
            player_id=rp.player_id,
            card_id=rp.card_id,
            attribute=rp.attribute,
            is_winner=rp.is_winner,
        )
        for rp in round_plays
    ]

    return GameDetailOut(
        id=game.id,
        status=game.status,
        current_round=game.current_round,
        current_leader_id=game.current_leader_id,
        chosen_attribute=game.chosen_attribute,
        players=player_outs,
        my_cards=my_card_by_user,
        rounds_played=round_outs,
    )


@router.post("/games", response_model=GameOut, status_code=201)
def create_game(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = Game(status="waiting")
    db.add(game)
    db.commit()
    db.refresh(game)

    # Criador entra automaticamente
    player = GamePlayer(game_id=game.id, user_id=user.id)
    db.add(player)
    db.commit()
    db.refresh(game)
    return game


@router.get("/games", response_model=list[GameListOut])
def list_games(db: Session = Depends(get_db)):
    games = db.query(Game).filter(Game.status == "waiting").all()
    result = []
    for g in games:
        result.append(GameListOut(
            id=g.id,
            status=g.status,
            player_count=len(g.players),
            created_at=g.created_at,
        ))
    return result


@router.post("/games/{game_id}/join", response_model=GamePlayerOut)
def join_game(game_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = get_game_or_404(game_id, db)

    if game.status != "waiting":
        raise HTTPException(status_code=400, detail="Jogo nao esta aguardando jogadores")

    if len(game.players) >= 4:
        raise HTTPException(status_code=400, detail="Jogo cheio (max 4 jogadores)")

    existing = db.query(GamePlayer).filter(
        GamePlayer.game_id == game.id, GamePlayer.user_id == user.id
    ).first()
    if existing:
        # Retorna o jogador existente em vez de erro
        return GamePlayerOut(
            id=existing.id,
            user_id=existing.user_id,
            user_name=existing.user.name,
            rounds_won=existing.rounds_won,
        )

    player = GamePlayer(game_id=game.id, user_id=user.id)
    db.add(player)
    db.commit()
    db.refresh(player)

    return GamePlayerOut(
        id=player.id,
        user_id=player.id,
        user_name=player.user.name,
        rounds_won=0,
    )


@router.post("/games/{game_id}/start", response_model=GameDetailOut)
def start_game_endpoint(game_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = get_game_or_404(game_id, db)

    # Verificar se é jogador do jogo
    player = db.query(GamePlayer).filter(
        GamePlayer.game_id == game.id, GamePlayer.user_id == user.id
    ).first()
    if not player:
        raise HTTPException(status_code=403, detail="Voce nao esta neste jogo")

    try:
        game = start_game(game, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return build_game_detail(game, user, db)


@router.get("/games/{game_id}", response_model=GameDetailOut)
def get_game_state(game_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = get_game_or_404(game_id, db)

    player = db.query(GamePlayer).filter(
        GamePlayer.game_id == game.id, GamePlayer.user_id == user.id
    ).first()
    if not player:
        raise HTTPException(status_code=403, detail="Voce nao esta neste jogo")

    return build_game_detail(game, user, db)


@router.post("/games/{game_id}/choose-attribute")
def choose_attribute_endpoint(
    game_id: int,
    data: ChooseAttributeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    game = get_game_or_404(game_id, db)

    player = db.query(GamePlayer).filter(
        GamePlayer.game_id == game.id, GamePlayer.user_id == user.id
    ).first()
    if not player:
        raise HTTPException(status_code=403, detail="Voce nao esta neste jogo")

    try:
        game = choose_attribute(game, data.attribute, player.id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"message": f"Atributo '{data.attribute}' escolhido", "game_id": game.id}


@router.post("/games/{game_id}/play-card")
def play_card_endpoint(
    game_id: int,
    data: PlayCardRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    game = get_game_or_404(game_id, db)

    player = db.query(GamePlayer).filter(
        GamePlayer.game_id == game.id, GamePlayer.user_id == user.id
    ).first()
    if not player:
        raise HTTPException(status_code=403, detail="Voce nao esta neste jogo")

    try:
        result = play_card(game, data.card_id, player.id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return result