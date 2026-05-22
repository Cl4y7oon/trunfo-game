from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)

    votes = relationship("Vote", back_populates="user")
    game_players = relationship("GamePlayer", back_populates="user")


class Character(Base):
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    image_url = Column(String, nullable=True)

    votes = relationship("Vote", back_populates="character")
    stats = relationship("CharacterStat", back_populates="character", uselist=False)
    game_cards = relationship("GameCard", back_populates="character")


class Vote(Base):
    __tablename__ = "votes"
    __table_args__ = (UniqueConstraint("user_id", "character_id"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=False)
    carismatica = Column(Integer, nullable=False)
    sincera = Column(Integer, nullable=False)
    barraqueira = Column(Integer, nullable=False)
    sonsa = Column(Integer, nullable=False)
    lerdona = Column(Integer, nullable=False)
    elegancia = Column(Integer, nullable=False)
    fofoqueira = Column(Integer, nullable=False)
    mentirosa = Column(Integer, nullable=False)
    boa_energia = Column(Integer, nullable=False)

    user = relationship("User", back_populates="votes")
    character = relationship("Character", back_populates="votes")


class CharacterStat(Base):
    __tablename__ = "character_stats"

    character_id = Column(Integer, ForeignKey("characters.id"), primary_key=True)
    carismatica = Column(Float, default=0)
    sincera = Column(Float, default=0)
    barraqueira = Column(Float, default=0)
    sonsa = Column(Float, default=0)
    lerdona = Column(Float, default=0)
    elegancia = Column(Float, default=0)
    fofoqueira = Column(Float, default=0)
    mentirosa = Column(Float, default=0)
    boa_energia = Column(Float, default=0)
    total_votes = Column(Integer, default=0)

    character = relationship("Character", back_populates="stats")


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="waiting")  # waiting, playing, finished
    current_round = Column(Integer, default=0)
    current_leader_id = Column(Integer, ForeignKey("game_players.id"), nullable=True)
    chosen_attribute = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    players = relationship("GamePlayer", back_populates="game", foreign_keys="GamePlayer.game_id")
    current_leader = relationship("GamePlayer", foreign_keys=[current_leader_id], post_update=True)
    cards = relationship("GameCard", back_populates="game")
    round_plays = relationship("RoundPlay", back_populates="game")


class GamePlayer(Base):
    __tablename__ = "game_players"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rounds_won = Column(Integer, default=0)

    game = relationship("Game", back_populates="players", foreign_keys=[game_id])
    user = relationship("User", back_populates="game_players")
    cards = relationship("GameCard", back_populates="player")
    round_plays = relationship("RoundPlay", back_populates="player")


class GameCard(Base):
    __tablename__ = "game_cards"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=False)
    player_id = Column(Integer, ForeignKey("game_players.id"), nullable=True)
    played = Column(Boolean, default=False)
    round_played = Column(Integer, nullable=True)

    game = relationship("Game", back_populates="cards")
    character = relationship("Character", back_populates="game_cards")
    player = relationship("GamePlayer", back_populates="cards")


class RoundPlay(Base):
    __tablename__ = "round_plays"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    round_number = Column(Integer, nullable=False)
    player_id = Column(Integer, ForeignKey("game_players.id"), nullable=False)
    card_id = Column(Integer, ForeignKey("game_cards.id"), nullable=False)
    attribute = Column(String, nullable=False)
    is_winner = Column(Boolean, default=False)

    game = relationship("Game", back_populates="round_plays")
    player = relationship("GamePlayer", back_populates="round_plays")
    card = relationship("GameCard")