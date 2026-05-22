import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { listGames, createGame, joinGame, getVoteStatus, type GameListOut } from '../api/client';
import { Plus, Users, LogOut, Crown, UserCircle } from 'lucide-react';

export default function MenuPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<GameListOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadGames = async () => {
    try {
      const data = await listGames();
      setGames(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    // Check if user has voted
    getVoteStatus().then((status) => {
      if (status.voted_count < status.total_characters) {
        navigate('/votar');
      }
    }).catch(() => {});

    loadGames();
    const interval = setInterval(loadGames, 3000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const game = await createGame();
      navigate(`/jogo/${game.id}`);
    } catch {
      alert('Erro ao criar jogo');
    }
    setCreating(false);
  };

  const handleJoin = async (gameId: number) => {
    try {
      await joinGame(gameId);
      navigate(`/jogo/${gameId}`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erro ao entrar no jogo');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="menu-page">
      <div className="menu-bg-pattern" />

      <motion.div
        className="menu-content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <header className="menu-header">
          <div>
            <h1 className="menu-title">SALA DE JOGO</h1>
            <p className="menu-user">
              <Crown size={16} color="var(--gold)" style={{ display: 'inline' }} />
              {' '}Olá, <strong>{user?.name}</strong>!
            </p>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sair">
            <LogOut size={20} />
          </button>
        </header>

        <div className="menu-actions">
          <motion.button
            className="characters-btn"
            onClick={() => navigate('/personagens')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <UserCircle size={24} />
            <span>Personagens</span>
          </motion.button>

          <motion.button
            className="create-game-btn"
            onClick={handleCreate}
            disabled={creating}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Plus size={24} />
            <span>{creating ? 'Criando...' : 'Criar Jogo'}</span>
          </motion.button>
        </div>

        <div className="games-section">
          <h2 className="games-title">
            <Users size={20} />
            Jogos Disponíveis
          </h2>

          {loading ? (
            <div className="games-loading">Carregando...</div>
          ) : games.length === 0 ? (
            <div className="games-empty">
              <p>Nenhum jogo disponível</p>
              <p className="games-empty-hint">Crie um jogo e chame os amigos!</p>
            </div>
          ) : (
            <div className="games-list">
              {games.map((game, i) => (
                <motion.div
                  key={game.id}
                  className="game-card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.02, borderColor: 'var(--gold-light)' }}
                  onClick={() => handleJoin(game.id)}
                >
                  <div className="game-card-info">
                    <span className="game-card-id">Jogo #{game.id}</span>
                    <span className="game-card-players">
                      <Users size={14} /> {game.player_count}/4 jogadores
                    </span>
                  </div>
                  <span className="game-card-join">ENTRAR →</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <style>{`
        .menu-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          padding: 1.5rem;
          background: radial-gradient(ellipse at 70% 30%, var(--purple-mid) 0%, var(--purple-deep) 50%, var(--dark) 100%);
        }

        .menu-bg-pattern {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.04;
          pointer-events: none;
          background-image:
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 40px,
              var(--gold) 40px,
              var(--gold) 41px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 40px,
              var(--gold) 40px,
              var(--gold) 41px
            );
        }

        .menu-content {
          max-width: 600px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .menu-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .menu-title {
          font-family: var(--font-display);
          font-size: clamp(2rem, 6vw, 3rem);
          color: var(--gold);
          text-shadow: 0 3px 0 #8B6914, 0 6px 15px rgba(0,0,0,0.5);
          letter-spacing: 3px;
        }

        .menu-user {
          font-size: 1rem;
          color: var(--parchment);
          margin-top: 0.3rem;
          opacity: 0.8;
        }

        .logout-btn {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 10px;
          padding: 0.5rem;
          color: var(--parchment);
          cursor: pointer;
          transition: all 0.2s;
        }
        .logout-btn:hover {
          background: rgba(255,45,107,0.2);
          border-color: var(--pink);
          color: var(--pink);
        }

        .menu-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 2.5rem;
        }

        .characters-btn {
          width: 100%;
          padding: 1.2rem 2rem;
          font-family: var(--font-display);
          font-size: 1.5rem;
          letter-spacing: 3px;
          background: linear-gradient(135deg, var(--purple-light), #5B2D8E);
          border: 2px solid var(--gold);
          border-radius: 14px;
          color: var(--gold);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          box-shadow: 0 4px 20px rgba(107, 63, 160, 0.35);
          transition: all 0.2s;
        }
        .characters-btn:hover {
          box-shadow: 0 6px 30px rgba(107, 63, 160, 0.5), var(--shadow-glow);
        }

        .create-game-btn {
          width: 100%;
          padding: 1.2rem 2rem;
          font-family: var(--font-display);
          font-size: 1.5rem;
          letter-spacing: 3px;
          background: linear-gradient(135deg, var(--pink), #E0184F);
          border: none;
          border-radius: 14px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          box-shadow: 0 4px 20px rgba(255, 45, 107, 0.35);
          transition: all 0.2s;
        }
        .create-game-btn:hover:not(:disabled) {
          box-shadow: 0 6px 30px rgba(255, 45, 107, 0.5);
        }
        .create-game-btn:disabled {
          opacity: 0.6;
        }

        .games-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .games-title {
          font-family: var(--font-display);
          font-size: 1.4rem;
          color: var(--parchment);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          letter-spacing: 1px;
        }

        .games-loading, .games-empty {
          text-align: center;
          padding: 2rem;
          color: rgba(240, 230, 211, 0.5);
        }

        .games-empty-hint {
          font-size: 0.85rem;
          margin-top: 0.5rem;
          color: var(--gold);
          opacity: 0.6;
        }

        .games-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .game-card {
          background: rgba(255,255,255,0.06);
          border: 2px solid rgba(212, 160, 23, 0.2);
          border-radius: 12px;
          padding: 1rem 1.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .game-card:hover {
          background: rgba(255,255,255,0.1);
        }

        .game-card-info {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .game-card-id {
          font-family: var(--font-display);
          font-size: 1.1rem;
          color: var(--gold);
          letter-spacing: 1px;
        }

        .game-card-players {
          font-size: 0.85rem;
          color: var(--parchment);
          opacity: 0.7;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .game-card-join {
          font-family: var(--font-display);
          font-size: 1rem;
          color: var(--green-light);
          letter-spacing: 1px;
        }
      `}</style>
    </div>
  );
}