"""Lógica do jogo de trunfo: distribuição de cartas, rodadas, vencedor."""
import random
from sqlalchemy.orm import Session
from app.models import (
    Character, CharacterStat, Game, GamePlayer, GameCard, RoundPlay,
)
from app.schemas import ATTRIBUTES


def deal_cards(game: Game, db: Session) -> None:
    """Distribui cartas aleatoriamente entre os jogadores."""
    characters = db.query(Character).join(CharacterStat).all()
    if not characters:
        return

    char_ids = [c.id for c in characters]
    random.shuffle(char_ids)

    players = sorted(game.players, key=lambda p: p.id)
    n_players = len(players)
    n_chars = len(char_ids)

    # Distribuir uniformemente
    for i, char_id in enumerate(char_ids):
        player_idx = i % n_players
        card = GameCard(
            game_id=game.id,
            character_id=char_id,
            player_id=players[player_idx].id,
            played=False,
        )
        db.add(card)

    db.commit()


def start_game(game: Game, db: Session) -> Game:
    """Inicia o jogo: valida, distribui cartas, define líder."""
    if game.status != "waiting":
        raise ValueError("Jogo nao esta aguardando jogadores")

    players = game.players
    if len(players) < 2:
        raise ValueError("Precisa de pelo menos 2 jogadores")

    # Verificar se todos os personagens tem stats
    characters = db.query(Character).all()
    for c in characters:
        stats = db.query(CharacterStat).filter(CharacterStat.character_id == c.id).first()
        if not stats or stats.total_votes == 0:
            raise ValueError(f"Personagem '{c.name}' nao tem votacoes suficientes")

    deal_cards(game, db)

    # Primeiro líder = primeiro jogador que entrou
    game.current_leader_id = players[0].id
    game.status = "playing"
    game.current_round = 1
    game.chosen_attribute = None
    db.commit()
    db.refresh(game)
    return game


def choose_attribute(game: Game, attribute: str, player_id: int, db: Session) -> Game:
    """Líder escolhe o atributo para a rodada atual."""
    if game.status != "playing":
        raise ValueError("Jogo nao esta em andamento")
    if game.current_leader_id != player_id:
        raise ValueError("Voce nao e o lider desta rodada")
    if game.chosen_attribute is not None:
        raise ValueError("Atributo ja foi escolhido para esta rodada")
    if attribute not in ATTRIBUTES:
        raise ValueError(f"Atributo invalido. Use: {', '.join(ATTRIBUTES)}")

    game.chosen_attribute = attribute
    db.commit()
    db.refresh(game)
    return game


def play_card(game: Game, card_id: int, player_id: int, db: Session) -> dict:
    """Jogador joga uma carta na rodada atual. Resolve rodada se todos jogaram."""
    if game.status != "playing":
        raise ValueError("Jogo nao esta em andamento")
    if game.chosen_attribute is None:
        raise ValueError("Atributo ainda nao foi escolhido para esta rodada")

    card = db.query(GameCard).filter(GameCard.id == card_id, GameCard.game_id == game.id).first()
    if not card:
        raise ValueError("Carta nao encontrada neste jogo")
    if card.player_id != player_id:
        raise ValueError("Esta carta nao pertence a voce")
    if card.played:
        raise ValueError("Esta carta ja foi jogada")

    # Verificar se jogador já jogou nesta rodada
    existing_play = db.query(RoundPlay).filter(
        RoundPlay.game_id == game.id,
        RoundPlay.round_number == game.current_round,
        RoundPlay.player_id == player_id,
    ).first()
    if existing_play:
        raise ValueError("Voce ja jogou nesta rodada")

    # Registrar jogada
    card.played = True
    card.round_played = game.current_round
    play = RoundPlay(
        game_id=game.id,
        round_number=game.current_round,
        player_id=player_id,
        card_id=card.id,
        attribute=game.chosen_attribute,
        is_winner=False,
    )
    db.add(play)
    db.commit()
    db.refresh(play)

    # Verificar se todos os jogadores com cartas jogaram
    players = sorted(game.players, key=lambda p: p.id)
    round_plays = db.query(RoundPlay).filter(
        RoundPlay.game_id == game.id,
        RoundPlay.round_number == game.current_round,
    ).all()
    players_with_cards = [
        p for p in players
        if db.query(GameCard).filter(
            GameCard.player_id == p.id,
            GameCard.played == False,
        ).first() is not None or any(rp.player_id == p.id for rp in round_plays)
    ]

    # Jogadores que ainda tem cartas E ainda não jogaram nesta rodada
    active_not_played = []
    for p in players:
        has_unplayed = db.query(GameCard).filter(
            GameCard.player_id == p.id,
            GameCard.played == False,
        ).first() is not None
        already_played = any(rp.player_id == p.id for rp in round_plays)
        if has_unplayed and not already_played:
            active_not_played.append(p)

    result = {"round_resolved": False, "round_winner": None, "game_finished": False}

    if len(active_not_played) == 0:
        # Todos jogaram - resolver rodada
        result = resolve_round(game, db)

    return result


def resolve_round(game: Game, db: Session) -> dict:
    """Compara cartas jogadas na rodada e determina vencedor."""
    round_plays = db.query(RoundPlay).filter(
        RoundPlay.game_id == game.id,
        RoundPlay.round_number == game.current_round,
    ).all()

    if not round_plays:
        raise ValueError("Nenhuma jogada nesta rodada")

    attr = game.chosen_attribute
    best_value = -1
    winner_player_id = None

    for play in round_plays:
        card = db.query(GameCard).filter(GameCard.id == play.card_id).first()
        stats = db.query(CharacterStat).filter(CharacterStat.character_id == card.character_id).first()
        value = getattr(stats, attr)
        if value > best_value:
            best_value = value
            winner_player_id = play.player_id

    # Marcar vencedor
    for play in round_plays:
        play.is_winner = (play.player_id == winner_player_id)

    # Incrementar rounds_won
    winner_player = db.query(GamePlayer).filter(GamePlayer.id == winner_player_id).first()
    winner_player.rounds_won += 1

    # Preparar próxima rodada
    game.current_round += 1
    game.current_leader_id = winner_player_id
    game.chosen_attribute = None

    # Verificar se jogo acabou
    players = sorted(game.players, key=lambda p: p.id)
    any_has_cards = any(
        db.query(GameCard).filter(
            GameCard.player_id == p.id,
            GameCard.played == False,
        ).first() is not None
        for p in players
    )

    game_finished = not any_has_cards
    if game_finished:
        game.status = "finished"

    db.commit()
    db.refresh(game)

    winner_user = db.query(GamePlayer).filter(GamePlayer.id == winner_player_id).first()

    # Build round plays with values for reveal screen
    round_plays_data = []
    for play in round_plays:
        card = db.query(GameCard).filter(GameCard.id == play.card_id).first()
        stats = db.query(CharacterStat).filter(CharacterStat.character_id == card.character_id).first()
        value = getattr(stats, attr)
        round_plays_data.append({
            "player_id": play.player_id,
            "player_name": play.player.user.name,
            "card_id": play.card_id,
            "character_name": card.character.name,
            "attribute": attr,
            "value": value,
            "is_winner": play.is_winner,
        })

    return {
        "round_resolved": True,
        "round_winner": {
            "player_id": winner_player_id,
            "user_name": winner_user.user.name,
            "attribute": attr,
            "value": best_value,
        },
        "round_plays": round_plays_data,
        "game_finished": game_finished,
    }