import React, { useState } from 'react';
import { User, Mail, Lock, Shield, Sparkles, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Language, t } from '../utils/i18n';
import { supabase } from '../lib/supabaseClient';

interface RegisterProps {
  lang: Language;
  onSetLanguage?: (lang: Language) => void;
  onRegisterSuccess: (accountData: { username: string; email: string }) => void;
  onSkipGuest?: () => void;
}

export const Register: React.FC<RegisterProps> = ({ lang, onSetLanguage, onRegisterSuccess, onSkipGuest }) => {
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || (!isLoginMode && !username.trim())) {
      setErrorMessage(lang === 'en' ? 'Please fill in all fields.' : 'Bitte alle Felder ausfüllen.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (isLoginMode) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }

        setSuccessMessage(lang === 'en' ? 'Login successful!' : 'Erfolgreich angemeldet!');
        setTimeout(() => {
          onRegisterSuccess({
            username: data.user?.user_metadata?.username || email.split('@')[0],
            email: data.user?.email || email.trim(),
          });
        }, 800);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              username: username.trim() || email.split('@')[0],
            },
          },
        });

        if (error) {
          throw error;
        }

        setSuccessMessage(
          data.session
            ? t('registerSuccess', lang)
            : (lang === 'en' ? 'Account created! Check your email.' : 'Konto erstellt! Bitte überprüfe deine E-Mails.')
        );

        setTimeout(() => {
          onRegisterSuccess({
            username: username.trim() || email.split('@')[0],
            email: email.trim(),
          });
        }, 1200);
      }
    } catch (err: any) {
      console.warn('Supabase Auth error:', err);
      setErrorMessage(err.message || (lang === 'en' ? 'Authentication failed.' : 'Authentifizierung fehlgeschlagen.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-mono relative overflow-hidden">
      {/* Background Cyberpunk Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Register Card */}
      <div
        className="relative w-full max-w-md bg-slate-900/90 border-2 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl transition-all"
        style={{
          borderColor: 'rgba(6, 182, 212, 0.5)',
          boxShadow: '0 0 40px rgba(6, 182, 212, 0.25)',
        }}
      >
        {/* Futuristic Corner Accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br-2xl" />

        {/* Top Right Flag Selector for Language */}
        {onSetLanguage && (
          <div className="absolute top-3 right-3 z-10 flex items-center space-x-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => onSetLanguage('de')}
              className={`px-2 py-1 rounded text-[11px] font-bold flex items-center space-x-1 transition-all ${
                lang === 'de'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Deutsch"
            >
              <span className="text-xs">🇩🇪</span>
              <span>DE</span>
            </button>
            <button
              type="button"
              onClick={() => onSetLanguage('en')}
              className={`px-2 py-1 rounded text-[11px] font-bold flex items-center space-x-1 transition-all ${
                lang === 'en'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="English"
            >
              <span className="text-xs">🇬🇧</span>
              <span>EN</span>
            </button>
          </div>
        )}

        {/* Header Branding */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] mb-2">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-wider uppercase flex items-center justify-center space-x-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span>{isLoginMode ? (lang === 'en' ? 'System Login' : 'System Anmeldung') : t('registerTitle', lang)}</span>
          </h1>
          <p className="text-xs text-slate-400">
            {isLoginMode
              ? (lang === 'en' ? 'Enter your credentials to access your ARC profile' : 'Gib deine Zugangsdaten ein, um dein ARC-Profil aufzurufen')
              : t('registerSubtitle', lang)}
          </p>
        </div>

        {/* Mode Toggle (Login vs Register) */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(false);
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              !isLoginMode
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {lang === 'en' ? 'Register' : 'Registrieren'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(true);
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              isLoginMode
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {lang === 'en' ? 'Login' : 'Anmelden'}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field (Sign up mode) */}
          {!isLoginMode && (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('usernameLabel', lang)}</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required={!isLoginMode}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('usernamePlaceholder', lang)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-sm rounded-xl px-4 py-3 outline-none transition-all placeholder:text-slate-600 focus:ring-1 focus:ring-cyan-400/50"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('emailLabel', lang)}</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder', lang)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-sm rounded-xl px-4 py-3 outline-none transition-all placeholder:text-slate-600 focus:ring-1 focus:ring-cyan-400/50"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('passwordLabel', lang)}</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder', lang)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-sm rounded-xl px-4 py-3 outline-none transition-all placeholder:text-slate-600 focus:ring-1 focus:ring-cyan-400/50"
              />
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center space-x-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message Alert */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center space-x-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center space-x-2 disabled:opacity-50 mt-2 active:scale-98"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('loading', lang)}</span>
              </>
            ) : (
              <>
                <span>{isLoginMode ? (lang === 'en' ? 'Sign In' : 'Anmelden') : t('submitRegister', lang)}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Skip / Guest Link */}
        {onSkipGuest && (
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={onSkipGuest}
              className="text-xs text-slate-400 hover:text-cyan-400 transition-colors underline underline-offset-4"
            >
              {t('continueAsGuest', lang)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

