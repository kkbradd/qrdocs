import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isRegister) {
      if (!name.trim()) { toast.error('Ad soyad giriniz.'); return; }
      if (password !== passwordConfirm) { toast.error('Şifreler eşleşmiyor.'); return; }
      if (password.length < 6) { toast.error('Şifre en az 6 karakter olmalı.'); return; }
    }
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, name.trim());
        toast.success('Hesap oluşturuldu!');
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      const errors = {
        'auth/invalid-credential': 'E-posta veya şifre hatalı.',
        'auth/email-already-in-use': 'Bu e-posta zaten kullanılıyor.',
        'auth/weak-password': 'Şifre çok zayıf.',
        'auth/invalid-email': 'Geçersiz e-posta adresi.',
      };
      toast.error(errors[err.code] || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setName(''); setPassword(''); setPasswordConfirm('');
  };

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <img src="/logo.png" alt="QRDocs" className={styles.brandLogo} />
          <h1 className={styles.brandName}>QR<span>Docs</span></h1>
          <p className={styles.brandTagline}>SCAN · CONNECT · TRUST</p>
        </div>
        <div className={styles.leftGlow} />
      </div>

      <div className={styles.right}>
        <form className={styles.card} onSubmit={handleSubmit}>
          <div className={styles.cardHeader}>
            <h2>{isRegister ? 'Hesap Oluştur' : 'Hoş Geldiniz'}</h2>
            <p>{isRegister ? 'Ücretsiz hesabınızı oluşturun' : 'Hesabınıza giriş yapın'}</p>
          </div>

          {isRegister && (
            <div className={styles.field}>
              <label>Ad Soyad</label>
              <input
                type="text"
                placeholder="Adınız Soyadınız"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          )}

          <div className={styles.field}>
            <label>E-posta</label>
            <input
              type="email"
              placeholder="ornek@sirket.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.field}>
            <label>Şifre</label>
            <div className={styles.passWrap}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder={isRegister ? 'En az 6 karakter' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div className={styles.field}>
              <label>Şifre Tekrar</label>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          )}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading
              ? <Loader2 size={18} className={styles.spinner} />
              : isRegister ? 'Hesap Oluştur' : 'Giriş Yap'}
          </button>

          <div className={styles.switchRow}>
            <span>{isRegister ? 'Zaten hesabın var mı?' : 'Hesabın yok mu?'}</span>
            <button type="button" className={styles.switchBtn} onClick={switchMode}>
              {isRegister ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}