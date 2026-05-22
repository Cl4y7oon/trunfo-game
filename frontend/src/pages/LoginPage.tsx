import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { loginUser, getVoteStatus } from '../api/client';
import { useNavigate } from 'react-router';

function Confetti() {
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 4,
    color: ['#FF2D6B', '#FFD700', '#4ECDC4', '#C44DFF', '#FF6B35'][
      Math.floor(Math.random() * 5)
    ],
    size: 4 + Math.random() * 8,
  }));

  return (
    <div className="confetti-container">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            backgroundColor: p.color,
            width: `${p.size}px`,
            height: `${p.size}px`,
          }}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await loginUser(name.trim());
      login(res.user, res.token);

      // Check if user has already voted on all characters
      try {
        const status = await getVoteStatus();
        if (status.voted_count >= status.total_characters) {
          navigate('/menu');
        } else {
          navigate('/votar');
        }
      } catch {
        navigate('/votar');
      }
    } catch {
      setError('Erro ao entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Confetti />

      <motion.div
        className="login-content"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.8, bounce: 0.4 }}
      >
        <motion.div
          className="login-logo"
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.6, delay: 0.2 }}
        >
          <span className="logo-trunfo">TRUNFO</span>
          <motion.span
            className="logo-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Quem vai vencer?
          </motion.span>
        </motion.div>

        <form onSubmit={handleSubmit} className="login-form">
          <motion.div
            className="input-wrapper"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome, campeão(ã)..."
              className="login-input"
              maxLength={30}
              autoFocus
              disabled={loading}
            />
          </motion.div>

          {error && (
            <motion.p
              className="login-error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            className="login-button"
            disabled={!name.trim() || loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            {loading ? '...' : 'ENTRAR'}
          </motion.button>
        </form>

        <motion.div
          className="login-cards-decorative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1 }}
        >
          <div className="deco-card deco-card-1" />
          <div className="deco-card deco-card-2" />
          <div className="deco-card deco-card-3" />
        </motion.div>
      </motion.div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(ellipse at 30% 20%, var(--purple-mid) 0%, var(--purple-deep) 50%, var(--dark) 100%);
          position: relative;
          overflow: hidden;
        }

        .confetti-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }

        .confetti-piece {
          position: absolute;
          top: -20px;
          border-radius: 2px;
          animation: confetti-fall linear infinite;
          opacity: 0.7;
        }

        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0.9; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }

        .login-content {
          text-align: center;
          z-index: 1;
          padding: 2rem;
          width: 100%;
          max-width: 420px;
        }

        .login-logo {
          margin-bottom: 3rem;
        }

        .logo-trunfo {
          font-family: var(--font-display);
          font-size: clamp(4rem, 12vw, 7rem);
          color: var(--gold);
          text-shadow:
            0 0 20px rgba(212, 160, 23, 0.5),
            0 4px 0 #8B6914,
            0 8px 20px rgba(0, 0, 0, 0.5);
          letter-spacing: 6px;
          display: block;
          line-height: 1;
        }

        .logo-subtitle {
          font-family: var(--font-body);
          font-size: 1.1rem;
          color: var(--pink-light);
          font-weight: 600;
          margin-top: 0.5rem;
          display: block;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .input-wrapper {
          position: relative;
        }

        .login-input {
          width: 100%;
          padding: 1rem 1.5rem;
          font-family: var(--font-body);
          font-size: 1.1rem;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.08);
          border: 2px solid var(--gold);
          border-radius: 12px;
          color: var(--parchment);
          outline: none;
          transition: all 0.3s ease;
        }

        .login-input::placeholder {
          color: rgba(240, 230, 211, 0.4);
        }

        .login-input:focus {
          border-color: var(--gold-light);
          box-shadow: 0 0 20px rgba(212, 160, 23, 0.3);
          background: rgba(255, 255, 255, 0.12);
        }

        .login-button {
          padding: 1rem 2rem;
          font-family: var(--font-display);
          font-size: 1.5rem;
          letter-spacing: 3px;
          background: linear-gradient(135deg, var(--pink), #E0184F);
          border: none;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 15px rgba(255, 45, 107, 0.4);
        }

        .login-button:hover:not(:disabled) {
          box-shadow: 0 6px 25px rgba(255, 45, 107, 0.6);
        }

        .login-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .login-error {
          color: var(--pink);
          font-weight: 600;
        }

        .login-cards-decorative {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          pointer-events: none;
        }

        .deco-card {
          position: absolute;
          width: 60px;
          height: 90px;
          border: 2px solid var(--gold);
          border-radius: 8px;
          background: linear-gradient(135deg, var(--purple-mid), var(--dark));
        }

        .deco-card-1 {
          bottom: 10%;
          left: 5%;
          transform: rotate(-20deg);
        }
        .deco-card-2 {
          bottom: 8%;
          left: 10%;
          transform: rotate(-5deg);
        }
        .deco-card-3 {
          top: 15%;
          right: 5%;
          transform: rotate(15deg);
        }
      `}</style>
    </div>
  );
}