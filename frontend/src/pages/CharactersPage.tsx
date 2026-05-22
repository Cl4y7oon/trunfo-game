import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Plus, Trash2, UserCircle, Upload } from 'lucide-react';
import { getCharacters, createCharacter, deleteCharacter, type CharacterOut } from '../api/client';

export default function CharactersPage() {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<CharacterOut[]>([]);
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadCharacters = async () => {
    try {
      const data = await getCharacters();
      setCharacters(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadCharacters();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !file) return;

    setSubmitting(true);
    try {
      await createCharacter(name.trim(), file);
      setName('');
      setFile(null);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadCharacters();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erro ao cadastrar personagem');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCharacter(id);
      loadCharacters();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erro ao deletar personagem');
    }
  };

  return (
    <div className="characters-page">
      <motion.div
        className="characters-content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <header className="characters-header">
          <button className="back-btn" onClick={() => navigate('/menu')}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="characters-title">PERSONAGENS</h1>
          <div style={{ width: 40 }} />
        </header>

        <form className="character-form" onSubmit={handleSubmit}>
          <div className="form-fields">
            <input
              className="name-input"
              type="text"
              placeholder="Nome do personagem"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div
              className="file-upload"
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="Preview" className="file-preview" />
              ) : (
                <div className="file-placeholder">
                  <Upload size={32} />
                  <span>Foto do personagem</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                required
              />
            </div>
          </div>

          <motion.button
            className="submit-btn"
            type="submit"
            disabled={submitting || !name.trim() || !file}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Plus size={20} />
            <span>{submitting ? 'Cadastrando...' : 'Cadastrar'}</span>
          </motion.button>
        </form>

        <div className="characters-list-section">
          <h2 className="list-title">
            <UserCircle size={20} />
            Personagens Cadastrados
          </h2>

          {loading ? (
            <div className="list-loading">Carregando...</div>
          ) : characters.length === 0 ? (
            <div className="list-empty">
              <p>Nenhum personagem cadastrado</p>
              <p className="list-empty-hint">Cadastre personagens para votar e jogar!</p>
            </div>
          ) : (
            <div className="characters-list">
              <AnimatePresence>
                {characters.map((char, i) => (
                  <motion.div
                    key={char.id}
                    className="character-card"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    {char.image_url ? (
                      <img
                        src={char.image_url}
                        alt={char.name}
                        className="character-avatar"
                      />
                    ) : (
                      <div className="character-avatar-placeholder">
                        <UserCircle size={32} />
                      </div>
                    )}
                    <span className="character-name">{char.name}</span>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(char.id)}
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>

      <style>{`
        .characters-page {
          min-height: 100vh;
          padding: 1.5rem;
          background: radial-gradient(ellipse at 70% 30%, var(--purple-mid) 0%, var(--purple-deep) 50%, var(--dark) 100%);
        }

        .characters-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .characters-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
        }

        .back-btn {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 10px;
          padding: 0.5rem;
          color: var(--parchment);
          cursor: pointer;
          transition: all 0.2s;
        }
        .back-btn:hover {
          background: rgba(255,255,255,0.15);
          border-color: var(--gold);
          color: var(--gold);
        }

        .characters-title {
          font-family: var(--font-display);
          font-size: clamp(2rem, 6vw, 3rem);
          color: var(--gold);
          text-shadow: 0 3px 0 #8B6914, 0 6px 15px rgba(0,0,0,0.5);
          letter-spacing: 3px;
          text-align: center;
        }

        .character-form {
          background: rgba(255,255,255,0.05);
          border: 2px solid rgba(212, 160, 23, 0.2);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .form-fields {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          align-items: flex-start;
        }

        .name-input {
          flex: 1;
          padding: 0.8rem 1rem;
          font-family: var(--font-body);
          font-size: 1rem;
          background: rgba(0,0,0,0.3);
          border: 2px solid rgba(212, 160, 23, 0.3);
          border-radius: 12px;
          color: var(--parchment);
          outline: none;
          transition: border-color 0.2s;
        }
        .name-input:focus {
          border-color: var(--gold);
        }
        .name-input::placeholder {
          color: rgba(240, 230, 211, 0.4);
        }

        .file-upload {
          width: 120px;
          height: 120px;
          border-radius: 12px;
          border: 2px dashed rgba(212, 160, 23, 0.4);
          overflow: hidden;
          cursor: pointer;
          transition: border-color 0.2s;
          flex-shrink: 0;
        }
        .file-upload:hover {
          border-color: var(--gold);
        }

        .file-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .file-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          color: rgba(240, 230, 211, 0.4);
          font-size: 0.75rem;
          background: rgba(0,0,0,0.2);
        }

        .submit-btn {
          width: 100%;
          padding: 0.9rem 2rem;
          font-family: var(--font-display);
          font-size: 1.3rem;
          letter-spacing: 2px;
          background: linear-gradient(135deg, var(--gold), #B8860B);
          border: none;
          border-radius: 14px;
          color: var(--dark);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 4px 20px rgba(212, 160, 23, 0.35);
          transition: all 0.2s;
        }
        .submit-btn:hover:not(:disabled) {
          box-shadow: 0 6px 30px rgba(212, 160, 23, 0.5);
        }
        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .characters-list-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .list-title {
          font-family: var(--font-display);
          font-size: 1.4rem;
          color: var(--parchment);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          letter-spacing: 1px;
        }

        .list-loading, .list-empty {
          text-align: center;
          padding: 2rem;
          color: rgba(240, 230, 211, 0.5);
        }

        .list-empty-hint {
          font-size: 0.85rem;
          margin-top: 0.5rem;
          color: var(--gold);
          opacity: 0.6;
        }

        .characters-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .character-card {
          background: rgba(255,255,255,0.06);
          border: 2px solid rgba(212, 160, 23, 0.2);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          transition: all 0.2s;
        }
        .character-card:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(212, 160, 23, 0.4);
        }

        .character-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--gold);
        }

        .character-avatar-placeholder {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 2px solid rgba(212, 160, 23, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.3);
          color: rgba(240, 230, 211, 0.4);
        }

        .character-name {
          flex: 1;
          font-family: var(--font-display);
          font-size: 1.1rem;
          color: var(--parchment);
          letter-spacing: 1px;
        }

        .delete-btn {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 8px;
          padding: 0.4rem;
          color: var(--parchment);
          cursor: pointer;
          transition: all 0.2s;
          opacity: 0.5;
        }
        .delete-btn:hover {
          opacity: 1;
          background: rgba(255,45,107,0.2);
          border-color: var(--pink);
          color: var(--pink);
        }

        @media (max-width: 480px) {
          .form-fields {
            flex-direction: column;
            align-items: center;
          }
          .name-input {
            width: 100%;
          }
          .file-upload {
            width: 160px;
            height: 160px;
          }
        }
      `}</style>
    </div>
  );
}