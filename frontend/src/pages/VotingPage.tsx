import { useState, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { getCharacters, getVoteStatus, submitVote, type CharacterOut, type VoteStatusOut } from '../api/client';
import AttributeSlider from '../components/AttributeSlider';
import { ProgressBar, ConfettiBurst } from '../components/ProgressBar';
import { Check, X, Sparkles } from 'lucide-react';

const ATTRIBUTES = [
  { key: 'carismatica', label: 'Carismática', color: '#FF2D6B', icon: '✨' },
  { key: 'sincera', label: 'Sincera', color: '#4ECDC4', icon: '💎' },
  { key: 'barraqueira', label: 'Barraqueira', color: '#FF6B35', icon: '🔥' },
  { key: 'sonsa', label: 'Sonsa', color: '#C44DFF', icon: '😏' },
  { key: 'lerdona', label: 'Lerdona', color: '#5DADE2', icon: '🦥' },
  { key: 'elegancia', label: 'Elegância', color: '#FFD700', icon: '👑' },
  { key: 'fofoqueira', label: 'Fofoqueira', color: '#FF69B4', icon: '🗣️' },
  { key: 'mentirosa', label: 'Mentiroso', color: '#9B59B6', icon: '🎭' },
  { key: 'boa_energia', label: 'Boa Energia', color: '#2ECC71', icon: '🌟' },
];

const SWIPE_THRESHOLD = 120;

interface CardData {
  character: CharacterOut;
  votes: Record<string, number>;
}

export default function VotingPage() {
  useAuth(); // ensures auth context is loaded
  const navigate = useNavigate();
  const [cards, setCards] = useState<CardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [votedCount, setVotedCount] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [chars, status]: [CharacterOut[], VoteStatusOut] = await Promise.all([
          getCharacters(),
          getVoteStatus(),
        ]);

        setTotalChars(status.total_characters);
        setVotedCount(status.voted_count);

        // Filter characters that haven't been voted yet
        const votedIds = new Set(status.characters.filter((c) => c.voted).map((c) => c.character_id));
        const remaining = chars.filter((c) => !votedIds.has(c.id));

        if (remaining.length === 0) {
          navigate('/menu');
          return;
        }

        const cardData: CardData[] = remaining.map((c) => ({
          character: c,
          votes: Object.fromEntries(ATTRIBUTES.map((a) => [a.key, 10])) as Record<string, number>,
        }));

        setCards(cardData);
        setLoading(false);
      } catch {
        navigate('/');
      }
    }
    load();
  }, [navigate]);

  const currentCard = cards[currentIndex];

  const handleVote = useCallback(
    async (isApprove: boolean) => {
      if (!currentCard || submitting) return;

      if (!isApprove) return; // Must vote, can't skip

      setSubmitting(true);
      try {
        await submitVote({
          character_id: currentCard.character.id,
          ...currentCard.votes,
        } as any);

        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1500);

        const newVotedCount = votedCount + 1;
        setVotedCount(newVotedCount);

        if (currentIndex + 1 >= cards.length) {
          // All voted
          setTimeout(() => navigate('/menu'), 800);
        }

        setCurrentIndex((prev) => prev + 1);
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Erro ao enviar voto');
      } finally {
        setSubmitting(false);
      }
    },
    [currentCard, submitting, currentIndex, cards.length, votedCount, navigate]
  );

  if (loading) {
    return (
      <div className="voting-page">
        <div className="voting-loading">
          <Sparkles size={40} color="var(--gold)" className="spin" />
          <p>Carregando personagens...</p>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="voting-page">
        <div className="voting-complete">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
          >
            <span className="complete-icon" style={{ fontSize: '4rem' }}>🎉</span>
          </motion.div>
          <h2>Votação completa!</h2>
          <button className="menu-btn" onClick={() => navigate('/menu')}>
            Ir para o jogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="voting-page">
      <div className="voting-header">
        <ProgressBar current={votedCount + (currentIndex > 0 ? 1 : 0)} total={totalChars || cards.length + votedCount} />
        <p className="voting-hint">
          Arraste pra direita pra votar ↗
        </p>
      </div>

      <div className="swipe-area">
        <AnimatePresence>
          {cards.map((card, i) => {
            if (i < currentIndex) return null;
            return (
              <SwipeableCard
                key={card.character.id}
                card={card}
                isTop={i === currentIndex}
                onSwipeRight={() => handleVote(true)}
                onSwipeLeft={() => {}}
                zIndex={cards.length - i}
                offset={i - currentIndex}
                onDirectionChange={setDirection}
              />
            );
          })}
        </AnimatePresence>

        {direction === 'right' && (
          <div className="swipe-indicator swipe-like">
            <Check size={60} />
          </div>
        )}
      </div>

      <div className="vote-actions">
        <motion.button
          className="vote-btn vote-btn-reject"
          whileTap={{ scale: 0.9 }}
          disabled
          style={{ opacity: 0.3 }}
        >
          <X size={28} />
        </motion.button>
        <motion.button
          className="vote-btn vote-btn-approve"
          whileTap={{ scale: 0.9 }}
          onClick={() => handleVote(true)}
          disabled={submitting}
        >
          <Check size={28} />
        </motion.button>
      </div>

      <ConfettiBurst active={showConfetti} />

      <style>{`
        .voting-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background:
            radial-gradient(ellipse at 50% 80%, rgba(10, 135, 94, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 20% 20%, var(--purple-mid) 0%, var(--dark) 100%);
          padding: 1rem;
          overflow: hidden;
        }
        .voting-header {
          padding: 0.5rem 0 1rem;
          flex-shrink: 0;
        }
        .vote-progress {
          margin-bottom: 0.5rem;
        }
        .vote-progress-text {
          text-align: center;
          font-family: var(--font-display);
          font-size: 1.1rem;
          color: var(--gold);
          letter-spacing: 1px;
          margin-bottom: 0.4rem;
        }
        .vote-progress-track {
          width: 100%;
          height: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          overflow: hidden;
        }
        .vote-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--gold), var(--yellow));
          border-radius: 4px;
        }
        .voting-hint {
          text-align: center;
          font-size: 0.85rem;
          color: rgba(240, 230, 211, 0.5);
          margin-top: 0.3rem;
        }
        .swipe-area {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          min-height: 400px;
        }
        .swipe-indicator {
          position: absolute;
          font-size: 4rem;
          z-index: 0;
          pointer-events: none;
        }
        .swipe-like {
          color: var(--green);
          animation: pulse 0.5s ease;
        }
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        .vote-actions {
          display: flex;
          justify-content: center;
          gap: 3rem;
          padding: 1rem 0;
          flex-shrink: 0;
        }
        .vote-btn {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 3px solid;
          background: rgba(0,0,0,0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .vote-btn-reject { border-color: #e74c3c; color: #e74c3c; }
        .vote-btn-approve { border-color: var(--green); color: var(--green); }
        .vote-btn-approve:hover:not(:disabled) { background: rgba(10,135,94,0.2); box-shadow: 0 0 20px rgba(10,135,94,0.3); }
        .vote-btn:disabled { cursor: not-allowed; }
        .voting-loading, .voting-complete {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          min-height: 100vh;
          text-align: center;
        }
        .voting-complete h2 {
          font-family: var(--font-display);
          font-size: 2rem;
          color: var(--gold);
        }
        .menu-btn {
          padding: 0.8rem 2rem;
          font-family: var(--font-display);
          font-size: 1.2rem;
          background: linear-gradient(135deg, var(--pink), #E0184F);
          border: none;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          letter-spacing: 2px;
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 2s linear infinite; }
      `}</style>
    </div>
  );
}

// ── Swipeable Card Component ──

function SwipeableCard({
  card,
  isTop,
  onSwipeRight,
  onSwipeLeft,
  zIndex,
  offset,
  onDirectionChange,
}: {
  card: CardData;
  isTop: boolean;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  zIndex: number;
  offset: number;
  onDirectionChange: (dir: 'left' | 'right' | null) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-25, 0, 25]);
  const opacity = useTransform(x, [-300, -100, 0, 100, 300], [0.5, 1, 1, 1, 0.5]);

  const [, setVotes] = useState(card.votes);

  const handleDragEnd = () => {
    const currentX = x.get();
    if (currentX > SWIPE_THRESHOLD) {
      onSwipeRight();
    } else if (currentX < -SWIPE_THRESHOLD) {
      onSwipeLeft();
      x.set(0);
    } else {
      x.set(0);
      onDirectionChange(null);
    }
  };

  const handleDrag = () => {
    const currentX = x.get();
    if (currentX > 50) onDirectionChange('right');
    else if (currentX < -50) onDirectionChange('left');
    else onDirectionChange(null);
  };

  return (
    <motion.div
      className="trunfo-card-wrapper"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        opacity: isTop ? opacity : 1,
        zIndex,
        scale: isTop ? 1 : 1 - offset * 0.04,
        y: isTop ? 0 : offset * 8,
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: isTop ? 1 : 1 - offset * 0.04, opacity: isTop ? 1 : 0.7 - offset * 0.1 }}
      exit={{ x: 500, rotate: 20, opacity: 0, transition: { duration: 0.4 } }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={isTop ? handleDragEnd : undefined}
      onDrag={isTop ? handleDrag : undefined}
      whileDrag={{ cursor: 'grabbing' }}
    >
      <div className="trunfo-card">
        <div className="trunfo-card-border">
          <div className="trunfo-card-inner">
            <div className="trunfo-card-header">
              <span className="trunfo-card-title">{card.character.name}</span>
              <div className="trunfo-card-avatar">
                {card.character.image_url ? (
                  <img src={card.character.image_url} alt={card.character.name} />
                ) : (
                  <span className="avatar-placeholder">
                    {card.character.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <div className="trunfo-card-attributes">
              {ATTRIBUTES.map((attr) => (
                <AttributeSlider
                  key={attr.key}
                  label={attr.label}
                  attrKey={attr.key}
                  value={isTop ? card.votes[attr.key] : 10}
                  onChange={(val) => {
                    if (isTop) {
                      card.votes[attr.key] = val;
                      setVotes({ ...card.votes });
                    }
                  }}
                  color={attr.color}
                  icon={attr.icon}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .trunfo-card-wrapper {
          position: absolute;
          width: min(340px, 90vw);
          touch-action: none;
          cursor: ${isTop ? 'grab' : 'default'};
        }

        .trunfo-card {
          background: linear-gradient(135deg, var(--gold), #8B6914, var(--gold));
          padding: 4px;
          border-radius: var(--card-radius);
          box-shadow: var(--shadow-card), var(--shadow-glow);
        }

        .trunfo-card-border {
          background: linear-gradient(145deg, #2E1245, var(--card-bg), #2E1245);
          border-radius: calc(var(--card-radius) - 2px);
          padding: 3px;
        }

        .trunfo-card-inner {
          background: linear-gradient(180deg, #1A0A30 0%, var(--card-bg) 30%, #1A0A30 100%);
          border-radius: calc(var(--card-radius) - 5px);
          padding: 1.5rem;
          border: 1px solid rgba(212, 160, 23, 0.15);
        }

        .trunfo-card-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(212, 160, 23, 0.2);
        }

        .trunfo-card-title {
          font-family: var(--font-display);
          font-size: 1.8rem;
          color: var(--gold);
          letter-spacing: 2px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        .trunfo-card-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          border: 3px solid var(--gold);
          background: linear-gradient(135deg, var(--purple-mid), var(--purple-light));
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .trunfo-card-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          font-family: var(--font-display);
          font-size: 2rem;
          color: var(--gold);
        }

        .trunfo-card-attributes {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .attr-slider {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .attr-slider-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
        }

        .attr-icon {
          font-size: 1rem;
          width: 20px;
          text-align: center;
        }

        .attr-label {
          flex: 1;
          font-weight: 600;
          color: var(--parchment);
          font-size: 0.82rem;
        }

        .attr-value {
          font-family: var(--font-numbers);
          font-size: 1.1rem;
          font-weight: 700;
          min-width: 28px;
          text-align: right;
        }

        .attr-track-container {
          position: relative;
          height: 24px;
        }

        .attr-track {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 100%;
          height: 6px;
          background: rgba(255,255,255,0.08);
          border-radius: 3px;
          overflow: hidden;
          pointer-events: none;
        }

        .attr-track-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.15s ease;
        }

        .attr-range {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          margin: 0;
        }

        .attr-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--gold);
          border: 2px solid var(--gold-light);
          box-shadow: 0 0 8px rgba(212, 160, 23, 0.5);
          cursor: grab;
          margin-top: -6px;
        }

        .attr-range::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--gold);
          border: 2px solid var(--gold-light);
          box-shadow: 0 0 8px rgba(212, 160, 23, 0.5);
          cursor: grab;
        }

        .attr-range::-webkit-slider-runnable-track {
          height: 6px;
          background: transparent;
        }

        .attr-range::-moz-range-track {
          height: 6px;
          background: transparent;
          border: none;
        }
      `}</style>
    </motion.div>
  );
}