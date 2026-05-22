from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ── Auth ──

class LoginRequest(BaseModel):
    name: str

class UserOut(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}

class LoginResponse(BaseModel):
    token: str
    user: UserOut


# ── Characters ──

class CharacterCreate(BaseModel):
    name: str
    image_url: Optional[str] = None

class CharacterOut(BaseModel):
    id: int
    name: str
    image_url: Optional[str] = None
    model_config = {"from_attributes": True}

class CharacterStatOut(BaseModel):
    character_id: int
    carismatica: float
    sincera: float
    barraqueira: float
    sonsa: float
    lerdona: float
    elegancia: float
    fofoqueira: float
    mentirosa: float
    boa_energia: float
    total_votes: int
    model_config = {"from_attributes": True}


# ── Votes ──

ATTRIBUTES = ["carismatica", "sincera", "barraqueira", "sonsa", "lerdona", "elegancia", "fofoqueira", "mentirosa", "boa_energia"]

class VoteCreate(BaseModel):
    character_id: int
    carismatica: int = Field(ge=0, le=21)
    sincera: int = Field(ge=0, le=21)
    barraqueira: int = Field(ge=0, le=21)
    sonsa: int = Field(ge=0, le=21)
    lerdona: int = Field(ge=0, le=21)
    elegancia: int = Field(ge=0, le=21)
    fofoqueira: int = Field(ge=0, le=21)
    mentirosa: int = Field(ge=0, le=21)
    boa_energia: int = Field(ge=0, le=21)

class VoteOut(BaseModel):
    id: int
    user_id: int
    character_id: int
    carismatica: int
    sincera: int
    barraqueira: int
    sonsa: int
    lerdona: int
    elegancia: int
    fofoqueira: int
    mentirosa: int
    boa_energia: int
    model_config = {"from_attributes": True}

class VoteStatusCharacter(BaseModel):
    character_id: int
    character_name: str
    voted: bool

class VoteStatusOut(BaseModel):
    total_characters: int
    voted_count: int
    characters: list[VoteStatusCharacter]

class VoteSummaryItem(BaseModel):
    character_id: int
    character_name: str
    carismatica: float
    sincera: float
    barraqueira: float
    sonsa: float
    lerdona: float
    elegancia: float
    fofoqueira: float
    mentirosa: float
    boa_energia: float
    total_votes: int

class VoteSummaryOut(BaseModel):
    characters: list[VoteSummaryItem]


# ── Game ──

class GameCreate(BaseModel):
    pass

class GameOut(BaseModel):
    id: int
    status: str
    current_round: int
    chosen_attribute: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}

class GamePlayerOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    rounds_won: int
    model_config = {"from_attributes": True}

class GameCardOut(BaseModel):
    id: int
    character_id: int
    character_name: str
    carismatica: float
    sincera: float
    barraqueira: float
    sonsa: float
    lerdona: float
    elegancia: float
    fofoqueira: float
    mentirosa: float
    boa_energia: float
    played: bool
    model_config = {"from_attributes": True}

class GameDetailOut(BaseModel):
    id: int
    status: str
    current_round: int
    current_leader_id: Optional[int] = None
    chosen_attribute: Optional[str] = None
    players: list[GamePlayerOut]
    my_cards: list[GameCardOut]
    rounds_played: list["RoundPlayOut"]

class ChooseAttributeRequest(BaseModel):
    attribute: str

class PlayCardRequest(BaseModel):
    card_id: int

class RoundPlayOut(BaseModel):
    id: int
    round_number: int
    player_id: int
    player_name: str
    card_id: int
    character_name: str
    attribute: str
    value: float
    is_winner: bool
    model_config = {"from_attributes": True}

class GameListOut(BaseModel):
    id: int
    status: str
    player_count: int
    created_at: datetime