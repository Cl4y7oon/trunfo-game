import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import {
  getGameState, startGame, chooseAttribute, playCard,
  type GameDetailOut, type RoundPlayOut,
} from '../api/client';
import { ConfettiBurst } from '../components/ProgressBar';
import { Crown, Play, Swords, Trophy, RefreshCw, Sparkles } from 'lucide-react';

const ATTR_META: Record<string, { label: string; color: string; icon: string }> = {
  carismatica: { label: 'Carismática', color: '#FF2D6B', icon: '✨' },
  sincera: { label: 'Sincera', color: '#4ECDC4', icon: '💎' },
  barraqueira: { label: 'Barraqueira', color: '#FF6B35', icon: '🔥' },
  sonsa: { label: 'Sonsa', color: '#C44DFF', icon: '😏' },
  lerdona: { label: 'Lerdona', color: '#5DADE2', icon: '🦥' },
  elegancia: { label: 'Elegância', color: '#FFD700', icon: '👑' },
  fofoqueira: { label: 'Fofoqueira', color: '#FF69B4', icon: '🗣️' },
  mentirosa: { label: 'Mentiroso', color: '#9B59B6', icon: '🎭' },
  boa_energia: { label: 'Boa Energia', color: '#2ECC71', icon: '🌟' },
};

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const gameId = Number(id);
  const [game, setGame] = useState<GameDetailOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [roundResult, setRoundResult] = useState<{
    winner: string;
    attribute: string;
    value: number;
    plays: RoundPlayOut[];
    roundResolved?: boolean;
    gameFinished?: boolean;
  } | null>(null);
  const [showReveal, setShowReveal] = useState(false);
  const [error, setError] = useState('');

  const loadGame = useCallback(async () => {
    try {
      const data = await getGameState(gameId);
      setGame(data);
      setLoading(false);
    } catch {
      navigate('/menu');
    }
  }, [gameId, navigate]);

  useEffect(() => {
    loadGame();
    const interval = setInterval(loadGame, 2000);
    return () => clearInterval(interval);
  }, [loadGame]);

  // Update reveal screen data when game state changes during reveal
  useEffect(() => {
    if (showReveal && game && game.rounds_played.length > 0) {
      const currentRoundPlays = game.rounds_played.filter(
        (rp) => rp.round_number === game.current_round
      );
      setRoundResult((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          plays: currentRoundPlays,
          roundResolved: prev.roundResolved,
          gameFinished: prev.gameFinished,
        };
      });
    }
  }, [game?.rounds_played, game?.current_round, showReveal]);

  const handleStart = async () => {
    try {
      const data = await startGame(gameId);
      setGame(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao iniciar jogo');
    }
  };

  const handleChooseAttribute = async (attr: string) => {
    try {
      await chooseAttribute(gameId, attr);
      loadGame();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao escolher atributo');
    }
  };

  const handlePlayCard = async (cardId: number) => {
    try {
      const result = await playCard(gameId, cardId);
      // Show reveal screen immediately after playing
      setShowReveal(true);
      setRoundResult({
        winner: result.round_winner?.user_name || '',
        attribute: result.round_winner?.attribute || game.chosen_attribute || '',
        value: result.round_winner?.value || 0,
        plays: result.round_plays || [],
        roundResolved: result.round_resolved,
        gameFinished: result.game_finished,
      });
      setSelectedCard(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao jogar carta');
    }
  };

  const handleAdvance = () => {
    setShowReveal(false);
    setRoundResult(null);
    loadGame();
  };

  if (loading || !game) {
    return (
      <div className="game-page">
        <div className="game-loading">Carregando jogo...</div>
      </div>
    );
  }

  const myPlayer = game.players.find((p) => p.user_id === user?.id);
  const isLeader = myPlayer && game.current_leader_id === myPlayer.id;
  const needsAttribute = isLeader && !game.chosen_attribute;
  const canPlayCard = game.status === 'playing' && game.chosen_attribute && myPlayer;

  // ── LOBBY STATE ──
  if (game.status === 'waiting') {
    return (
      <div className="game-page">
        <div className="game-lobby">
          <motion.h1
            className="lobby-title"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Swords size={32} color="var(--gold)" />
            Sala de Espera
          </motion.h1>

          <div className="lobby-players">
            {game.players.map((p, i) => (
              <motion.div
                key={p.id}
                className="lobby-player"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="lobby-player-avatar">
                  {p.user_name.charAt(0).toUpperCase()}
                </div>
                <span className="lobby-player-name">{p.user_name}</span>
                {i === 0 && <Crown size={16} color="var(--gold)" />}
              </motion.div>
            ))}

            {Array.from({ length: 4 - game.players.length }, (_, i) => (
              <div key={`empty-${i}`} className="lobby-player lobby-player-empty">
                <div className="lobby-player-avatar lobby-avatar-empty">?</div>
                <span className="lobby-player-name">Aguardando...</span>
              </div>
            ))}
          </div>

          <p className="lobby-info">
            {game.players.length < 2
              ? 'Precisa de pelo menos 2 jogadores'
              : `${game.players.length}/4 jogadores`}
          </p>

          {myPlayer && game.players.length >= 2 && (
            <motion.button
              className="start-game-btn"
              onClick={handleStart}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play size={24} />
              INICIAR JOGO
            </motion.button>
          )}

          {error && <p className="game-error">{error}</p>}
        </div>

        <style>{gameStyles}</style>
      </div>
    );
  }

  // ── GAME FINISHED ──
  if (game.status === 'finished') {
    const sorted = [...game.players].sort((a, b) => b.rounds_won - a.rounds_won);
    const winner = sorted[0];

    return (
      <div className="game-page">
        <ConfettiBurst active={showConfetti} />
        <div className="game-finished">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
          >
            <Trophy size={64} color="var(--gold)" />
          </motion.div>
          <h1 className="finished-title">FIM DE JOGO!</h1>
          <div className="winner-name">{winner.user_name}</div>
          <p className="winner-score">{winner.rounds_won} rodadas vencidas</p>

          <div className="final-ranking">
            {sorted.map((p, i) => (
              <div key={p.id} className={`ranking-item ${i === 0 ? 'ranking-first' : ''}`}>
                <span className="ranking-pos">#{i + 1}</span>
                <span className="ranking-name">{p.user_name}</span>
                <span className="ranking-score">{p.rounds_won}</span>
              </div>
            ))}
          </div>

          <motion.button
            className="back-menu-btn"
            onClick={() => navigate('/menu')}
            whileHover={{ scale: 1.05 }}
          >
            <RefreshCw size={18} />
            Voltar ao Menu
          </motion.button>
        </div>
        <style>{gameStyles}</style>
      </div>
    );
  }

  // ── PLAYING STATE ──
  return (
    <div className="game-page">
      <ConfettiBurst active={showConfetti} />

      {/* ── ROUND REVEAL SCREEN ── */}
      <AnimatePresence>
        {showReveal && roundResult && (
          <motion.div
            className="reveal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="reveal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', bounce: 0.3 }}
            >
              <div className="reveal-header">
                <Sparkles size={48} color="var(--gold)" />
                <h2 className="reveal-title">
                  {roundResult?.roundResolved ? 'RESULTADO DA RODADA' : 'CARTAS NA MESA'}
                </h2>
                {!roundResult?.roundResolved && (
                  <p className="reveal-subtitle">
                    Aguardando {game.players.length - roundResult.plays.length} jogador(es)...
                  </p>
                )}
              </div>

              <div className="reveal-winner">
                <Trophy size={64} color="var(--gold)" />
                <div className="reveal-winner-name">{roundResult.winner}</div>
                <div className="reveal-attribute">
                  {ATTR_META[roundResult.attribute]?.icon} {ATTR_META[roundResult.attribute]?.label}
                </div>
                <div className="reveal-value">{roundResult.value}</div>
              </div>

              <div className="reveal-plays">
                {roundResult.plays.map((play, i) => (
                  <motion.div
                    key={play.player_id}
                    className={`reveal-card ${play.is_winner ? 'reveal-card-winner' : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                  >
                    <div className="reveal-player">{play.player_name}</div>
                    <div className="reveal-character">{play.character_name}</div>
                    <div className="reveal-stat">
                      <span style={{ color: ATTR_META[play.attribute]?.color }}>
                        {ATTR_META[play.attribute]?.icon} {play.value}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {roundResult?.roundResolved && (
                <div className="reveal-result">
                  <div className="reveal-result-label">Vencedor da rodada:</div>
                  <div className="reveal-result-winner">{roundResult.winner}</div>
                </div>
              )}

              <motion.button
                className="advance-btn"
                onClick={handleAdvance}
                disabled={!roundResult?.roundResolved}
                whileHover={{ scale: roundResult?.roundResolved ? 1.05 : 1 }}
                whileTap={{ scale: roundResult?.roundResolved ? 0.95 : 1 }}
              >
                {roundResult?.roundResolved ? 'PRÓXIMA RODADA' : 'AGUARDANDO JOGADORES...'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header: round + scoreboard */}
      <div className="game-top">
        <div className="round-info">
          <span className="round-number">Rodada {game.current_round}</span>
          {game.chosen_attribute && ATTR_META[game.chosen_attribute] && (
            <span className="chosen-attr" style={{ color: ATTR_META[game.chosen_attribute].color }}>
              {ATTR_META[game.chosen_attribute].icon} {ATTR_META[game.chosen_attribute].label}
            </span>
          )}
        </div>

        <div className="scoreboard">
          {game.players.map((p) => (
            <div key={p.id} className={`score-item ${p.id === game.current_leader_id ? 'score-leader' : ''}`}>
              <span className="score-name">{p.user_name}</span>
              <span className="score-value">{p.rounds_won}</span>
              {p.id === game.current_leader_id && <Crown size={12} color="var(--gold)" />}
            </div>
          ))}
        </div>
      </div>

      {/* Round result notification */}
      <AnimatePresence>
        {roundResult && (
          <motion.div
            className="round-result-banner"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
          >
            <span className="result-winner">{roundResult.winner}</span> venceu com{' '}
            <span style={{ color: ATTR_META[roundResult.attribute]?.color }}>
              {ATTR_META[roundResult.attribute]?.icon} {ATTR_META[roundResult.attribute]?.label} {roundResult.value}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Choose attribute (leader only) */}
      {needsAttribute && (
        <div className="choose-attribute">
          <h3 className="choose-title">
            <Crown size={20} color="var(--gold)" />
            Escolha o atributo!
          </h3>
          <div className="attr-choices">
            {Object.entries(ATTR_META).map(([key, meta]) => (
              <motion.button
                key={key}
                className="attr-choice-btn"
                style={{ borderColor: meta.color, color: meta.color }}
                onClick={() => handleChooseAttribute(key)}
                whileHover={{ scale: 1.05, backgroundColor: `${meta.color}22` }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="attr-choice-icon">{meta.icon}</span>
                <span className="attr-choice-label">{meta.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* My cards */}
      {canPlayCard && (
        <div className="my-cards-area">
          <h3 className="my-cards-title">
            {isLeader && !game.chosen_attribute ? 'Sua vez de escolher!' : 'Suas cartas'}
          </h3>

          {game.my_cards.length === 0 ? (
            <p className="no-cards">Sem cartas na mão</p>
          ) : (
            <div className="my-cards-hand">
              {game.my_cards.map((card) => (
                <motion.div
                  key={card.id}
                  className={`hand-card ${selectedCard === card.id ? 'hand-card-selected' : ''}`}
                  whileHover={{ y: -8 }}
                  onClick={() => setSelectedCard(card.id)}
                >
                  <span className="hand-card-name">{card.character_name}</span>
                  <div className="hand-card-stats">
                    {Object.entries(ATTR_META).map(([key, meta]) => (
                      <div key={key} className="hand-card-stat">
                        <span>{meta.icon}</span>
                        <span style={{ color: meta.color, fontFamily: 'var(--font-numbers)' }}>
                          {(card as any)[key]}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {selectedCard && (
            <motion.button
              className="play-card-btn"
              onClick={() => handlePlayCard(selectedCard)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              JOGAR CARTA
            </motion.button>
          )}
        </div>
      )}

      {/* Waiting for attribute or other players */}
      {!needsAttribute && !canPlayCard && game.status === 'playing' && (
        <div className="waiting-area">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {!game.chosen_attribute
              ? 'Aguardando líder escolher atributo...'
              : 'Aguardando outros jogadores...'}
          </motion.div>
        </div>
      )}

      {error && (
        <p className="game-error" onClick={() => setError('')}>{error}</p>
      )}

      <style>{gameStyles}</style>
    </div>
  );
}

const gameStyles = `
  .game-page {
    min-height: 100vh;
    padding: 1rem;
    background: radial-gradient(ellipse at 50% 50%, var(--purple-mid) 0%, var(--dark) 100%);
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  .game-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    color: var(--parchment);
    opacity: 0.6;
  }

  /* ── Lobby ── */
  .game-lobby {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    gap: 2rem;
  }

  .lobby-title {
    font-family: var(--font-display);
    font-size: clamp(1.8rem, 5vw, 2.5rem);
    color: var(--gold);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    letter-spacing: 2px;
  }

  .lobby-players {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    justify-content: center;
  }

  .lobby-player {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .lobby-player-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: 3px solid var(--gold);
    background: linear-gradient(135deg, var(--purple-light), var(--purple-mid));
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-size: 1.5rem;
    color: var(--gold);
  }

  .lobby-avatar-empty {
    border-color: rgba(212,160,23,0.3);
    background: rgba(255,255,255,0.03);
    color: rgba(240,230,211,0.2);
  }

  .lobby-player-name {
    font-size: 0.85rem;
    color: var(--parchment);
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .lobby-player-empty .lobby-player-name {
    opacity: 0.3;
  }

  .lobby-info {
    color: var(--parchment);
    opacity: 0.6;
    font-size: 0.9rem;
  }

  .start-game-btn {
    padding: 1rem 3rem;
    font-family: var(--font-display);
    font-size: 1.4rem;
    letter-spacing: 3px;
    background: linear-gradient(135deg, var(--green), #067A4E);
    border: none;
    border-radius: 12px;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    box-shadow: 0 4px 20px rgba(10, 135, 94, 0.3);
  }

  /* ── Playing State ── */
  .game-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(212, 160, 23, 0.15);
    flex-shrink: 0;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .round-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .round-number {
    font-family: var(--font-display);
    font-size: 1.3rem;
    color: var(--gold);
    letter-spacing: 1px;
  }

  .chosen-attr {
    font-size: 0.9rem;
    font-weight: 700;
  }

  .scoreboard {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .score-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    color: var(--parchment);
    background: rgba(255,255,255,0.05);
    padding: 0.3rem 0.6rem;
    border-radius: 8px;
  }

  .score-leader {
    border: 1px solid var(--gold);
    background: rgba(212, 160, 23, 0.1);
  }

  .score-value {
    font-family: var(--font-numbers);
    font-weight: 700;
    color: var(--gold);
    font-size: 1rem;
  }

  /* ── Round result banner ── */
  .round-result-banner {
    position: fixed;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(26, 10, 48, 0.95);
    border: 2px solid var(--gold);
    border-radius: 12px;
    padding: 0.75rem 1.5rem;
    z-index: 100;
    font-family: var(--font-display);
    font-size: 1rem;
    color: var(--parchment);
    text-align: center;
    letter-spacing: 1px;
  }

  .result-winner {
    color: var(--gold);
  }

  /* ── Choose attribute ── */
  .choose-attribute {
    padding: 1.5rem 0;
    text-align: center;
  }

  .choose-title {
    font-family: var(--font-display);
    font-size: 1.3rem;
    color: var(--gold);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    letter-spacing: 1px;
  }

  .attr-choices {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    max-width: 400px;
    margin: 0 auto;
  }

  .attr-choice-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    padding: 0.75rem;
    background: rgba(0,0,0,0.3);
    border: 2px solid;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .attr-choice-icon {
    font-size: 1.4rem;
  }

  .attr-choice-label {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  /* ── My cards ── */
  .my-cards-area {
    flex: 1;
    padding-top: 1rem;
  }

  .my-cards-title {
    font-family: var(--font-display);
    font-size: 1.1rem;
    color: var(--parchment);
    margin-bottom: 1rem;
    letter-spacing: 1px;
    opacity: 0.8;
  }

  .no-cards {
    color: var(--parchment);
    opacity: 0.4;
    text-align: center;
    padding: 2rem;
  }

  .my-cards-hand {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
  }

  .hand-card {
    background: linear-gradient(145deg, #2E1245, var(--card-bg));
    border: 2px solid rgba(212, 160, 23, 0.25);
    border-radius: 12px;
    padding: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 140px;
    max-width: 180px;
  }

  .hand-card:hover {
    border-color: var(--gold);
    box-shadow: var(--shadow-glow);
  }

  .hand-card-selected {
    border-color: var(--gold) !important;
    box-shadow: var(--shadow-glow), 0 0 30px rgba(212, 160, 23, 0.4) !important;
    transform: translateY(-4px);
  }

  .hand-card-name {
    font-family: var(--font-display);
    font-size: 1rem;
    color: var(--gold);
    letter-spacing: 1px;
    display: block;
    margin-bottom: 0.5rem;
    text-align: center;
  }

  .hand-card-stats {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .hand-card-stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    color: var(--parchment);
    opacity: 0.8;
  }

  .play-card-btn {
    display: block;
    margin: 1.5rem auto;
    padding: 0.8rem 2.5rem;
    font-family: var(--font-display);
    font-size: 1.2rem;
    letter-spacing: 2px;
    background: linear-gradient(135deg, var(--pink), #E0184F);
    border: none;
    border-radius: 12px;
    color: white;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(255, 45, 107, 0.3);
  }

  /* ── Waiting ── */
  .waiting-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--parchment);
    opacity: 0.6;
    font-size: 1rem;
  }

  /* ── Finished ── */
  .game-finished {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    gap: 1rem;
    text-align: center;
  }

  .finished-title {
    font-family: var(--font-display);
    font-size: clamp(2rem, 6vw, 3.5rem);
    color: var(--gold);
    text-shadow: 0 3px 0 #8B6914, 0 6px 15px rgba(0,0,0,0.5);
    letter-spacing: 4px;
  }

  .winner-name {
    font-family: var(--font-display);
    font-size: 2rem;
    color: var(--yellow);
    letter-spacing: 2px;
  }

  .winner-score {
    color: var(--parchment);
    opacity: 0.7;
  }

  .final-ranking {
    width: 100%;
    max-width: 300px;
    margin: 1rem 0;
  }

  .ranking-item {
    display: flex;
    align-items: center;
    padding: 0.6rem 1rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  .ranking-first {
    border: 1px solid var(--gold);
    border-radius: 8px;
    background: rgba(212, 160, 23, 0.1);
    margin-bottom: 0.5rem;
  }

  .ranking-pos {
    font-family: var(--font-numbers);
    font-weight: 700;
    width: 30px;
    color: var(--gold);
  }

  .ranking-name {
    flex: 1;
    color: var(--parchment);
  }

  .ranking-score {
    font-family: var(--font-numbers);
    font-weight: 700;
    color: var(--gold);
  }

  .back-menu-btn {
    padding: 0.7rem 1.5rem;
    font-family: var(--font-display);
    font-size: 1rem;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(212, 160, 23, 0.3);
    border-radius: 10px;
    color: var(--parchment);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    letter-spacing: 1px;
    transition: all 0.2s;
  }
  .back-menu-btn:hover {
    border-color: var(--gold);
    background: rgba(212, 160, 23, 0.1);
  }

  /* ── Round Reveal Screen ── */
  .reveal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(26, 10, 48, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .reveal-content {
    background: linear-gradient(145deg, #2E1245, var(--dark));
    border: 3px solid var(--gold);
    border-radius: 20px;
    padding: 2rem;
    max-width: 500px;
    width: 100%;
    text-align: center;
    box-shadow: 0 0 60px rgba(212, 160, 23, 0.4);
  }

  .reveal-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .reveal-subtitle {
    font-size: 0.9rem;
    color: rgba(240, 230, 211, 0.6);
    margin-top: 0.25rem;
  }

  .reveal-title {
    font-family: var(--font-display);
    font-size: 1.8rem;
    color: var(--gold);
    letter-spacing: 3px;
    text-shadow: 0 3px 0 #8B6914;
  }

  .reveal-winner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1.5rem;
    background: rgba(212, 160, 23, 0.1);
    border-radius: 16px;
    border: 2px solid var(--gold);
    margin-bottom: 1.5rem;
  }

  .reveal-winner-name {
    font-family: var(--font-display);
    font-size: 1.5rem;
    color: var(--yellow);
    letter-spacing: 2px;
  }

  .reveal-attribute {
    font-size: 1rem;
    color: var(--parchment);
    opacity: 0.9;
  }

  .reveal-value {
    font-family: var(--font-numbers);
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--gold);
  }

  .reveal-plays {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .reveal-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: rgba(255,255,255,0.05);
    border: 2px solid rgba(212, 160, 23, 0.2);
    border-radius: 12px;
  }

  .reveal-card-winner {
    border-color: var(--gold);
    background: rgba(212, 160, 23, 0.15);
    box-shadow: 0 0 20px rgba(212, 160, 23, 0.3);
  }

  .reveal-player {
    font-family: var(--font-display);
    font-size: 1rem;
    color: var(--parchment);
    letter-spacing: 1px;
  }

  .reveal-character {
    font-size: 0.85rem;
    color: rgba(240, 230, 211, 0.6);
  }

  .reveal-stat {
    font-family: var(--font-numbers);
    font-size: 1.2rem;
    font-weight: 700;
  }

  .reveal-result {
    padding: 1rem;
    background: rgba(212, 160, 23, 0.15);
    border: 2px solid var(--gold);
    border-radius: 12px;
    margin-bottom: 1rem;
    text-align: center;
  }

  .reveal-result-label {
    font-size: 0.85rem;
    color: rgba(240, 230, 211, 0.7);
    margin-bottom: 0.25rem;
  }

  .reveal-result-winner {
    font-family: var(--font-display);
    font-size: 1.3rem;
    color: var(--gold);
    letter-spacing: 1px;
  }

  .advance-btn {
    width: 100%;
    padding: 1rem 2rem;
    font-family: var(--font-display);
    font-size: 1.2rem;
    letter-spacing: 2px;
    background: linear-gradient(135deg, var(--gold), #B8860B);
    border: none;
    border-radius: 12px;
    color: var(--dark);
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(212, 160, 23, 0.35);
    transition: all 0.2s;
  }
  .advance-btn:hover:not(:disabled) {
    box-shadow: 0 6px 30px rgba(212, 160, 23, 0.5);
  }
  .advance-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .game-error {
    position: fixed;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 45, 107, 0.2);
    border: 1px solid var(--pink);
    border-radius: 8px;
    padding: 0.5rem 1rem;
    color: var(--pink-light);
    font-size: 0.85rem;
    cursor: pointer;
    z-index: 50;
  }
`;