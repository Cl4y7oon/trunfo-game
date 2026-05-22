import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('trunfo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types
export interface UserOut {
  id: number;
  name: string;
}

export interface LoginResponse {
  token: string;
  user: UserOut;
}

export interface CharacterOut {
  id: number;
  name: string;
  image_url: string | null;
}

export interface VoteStatusCharacter {
  character_id: number;
  character_name: string;
  voted: boolean;
}

export interface VoteStatusOut {
  total_characters: number;
  voted_count: number;
  characters: VoteStatusCharacter[];
}

export interface VoteCreate {
  character_id: number;
  carismatica: number;
  sincera: number;
  barraqueira: number;
  sonsa: number;
  lerdona: number;
  elegancia: number;
}

export interface VoteSummaryItem {
  character_id: number;
  character_name: string;
  carismatica: number;
  sincera: number;
  barraqueira: number;
  sonsa: number;
  lerdona: number;
  elegancia: number;
  total_votes: number;
}

export interface GameListOut {
  id: number;
  status: string;
  player_count: number;
  created_at: string;
}

export interface GamePlayerOut {
  id: number;
  user_id: number;
  user_name: string;
  rounds_won: number;
}

export interface GameCardOut {
  id: number;
  character_id: number;
  character_name: string;
  carismatica: number;
  sincera: number;
  barraqueira: number;
  sonsa: number;
  lerdona: number;
  elegancia: number;
  played: boolean;
}

export interface RoundPlayOut {
  id: number;
  round_number: number;
  player_id: number;
  card_id: number;
  attribute: string;
  is_winner: boolean;
}

export interface GameDetailOut {
  id: number;
  status: string;
  current_round: number;
  current_leader_id: number | null;
  chosen_attribute: string | null;
  players: GamePlayerOut[];
  my_cards: GameCardOut[];
  rounds_played: RoundPlayOut[];
}

export interface RoundResult {
  round_resolved: boolean;
  round_winner: {
    player_id: number;
    user_name: string;
    attribute: string;
    value: number;
  } | null;
  game_finished: boolean;
}

// API calls
export const loginUser = async (name: string): Promise<LoginResponse> => {
  const { data } = await api.post('/login', { name });
  return data;
};

export const getCharacters = async (): Promise<CharacterOut[]> => {
  const { data } = await api.get('/characters');
  return data;
};

export const getVoteStatus = async (): Promise<VoteStatusOut> => {
  const { data } = await api.get('/votes/status');
  return data;
};

export const submitVote = async (vote: VoteCreate) => {
  const { data } = await api.post('/votes', vote);
  return data;
};

export const getVoteSummary = async (): Promise<{ characters: VoteSummaryItem[] }> => {
  const { data } = await api.get('/votes/summary');
  return data;
};

export const createGame = async (): Promise<{ id: number; status: string }> => {
  const { data } = await api.post('/games');
  return data;
};

export const listGames = async (): Promise<GameListOut[]> => {
  const { data } = await api.get('/games');
  return data;
};

export const joinGame = async (gameId: number): Promise<GamePlayerOut> => {
  const { data } = await api.post(`/games/${gameId}/join`);
  return data;
};

export const startGame = async (gameId: number): Promise<GameDetailOut> => {
  const { data } = await api.post(`/games/${gameId}/start`);
  return data;
};

export const getGameState = async (gameId: number): Promise<GameDetailOut> => {
  const { data } = await api.get(`/games/${gameId}`);
  return data;
};

export const chooseAttribute = async (gameId: number, attribute: string) => {
  const { data } = await api.post(`/games/${gameId}/choose-attribute`, { attribute });
  return data;
};

export const playCard = async (gameId: number, cardId: number): Promise<RoundResult> => {
  const { data } = await api.post(`/games/${gameId}/play-card`, { card_id: cardId });
  return data;
};