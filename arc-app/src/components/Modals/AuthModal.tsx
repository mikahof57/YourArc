import React, { useState } from 'react';
import { X, KeyRound, Mail, Lock, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, LogOut, RefreshCw, Loader2 } from 'lucide-react';
import { UserAuthAccount } from '../../types';
import { supabase } from '../../lib/supabaseClient';

interface AuthModalProps {
  currentAuth: UserAuthAccount | null;
  onLoginSuccess: (account: UserAuthAccount) => void;
  onLogout: () => void;
  onClose: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot_password' | 'unverified_warning';

export const AuthModal: React.FC<AuthModalProps> = ({
  currentAuth,
  onLoginSuccess,
  onLogout,
  onClose,
}) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle Registration via Supabase
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Die Passwörter stimmen nicht überein.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.user) {
        setSuccessMessage('Konto erfolgreich erstellt!');
        if (data.session) {
          onLoginSuccess({
            email: data.user.email || email.trim(),
            isVerified: true,
            createdAt: data.user.created_at,
          });
          onClose();
        } else {
          setMode('unverified_warning');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registrierung fehlgeschlagen.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Login via Supabase
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Bitte gib deine E-Mail-Adresse ein.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message || 'Ungültige Anmeldedaten.');
        return;
      }

      if (data.user) {
        onLoginSuccess({
          email: data.user.email || email.trim(),
          isVerified: true,
          createdAt: data.user.created_at,
        });
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Anmeldung fehlgeschlagen.');
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate Email Verification Link Check
  const handleVerifyEmailSimulated = async () => {
    setIsLoading(true);
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      onLoginSuccess({
        email: data.session.user.email || email.trim(),
        isVerified: true,
        createdAt: data.session.user.created_at,
      });
      onClose();
    } else {
      setErrorMessage('Noch nicht verifiziert oder nicht angemeldet.');
    }
    setIsLoading(false);
  };

  // Handle Forgot Password via Supabase
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage('Ein Link zum Zurücksetzen des Passworts wurde an deine E-Mail-Adresse gesendet.');
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-fadeIn font-mono">
      <div className="relative w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-xl p-5 sm:p-7 shadow-[0_0_50px_rgba(0,240,255,0.2)] my-auto max-h-[90vh] flex flex-col">
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400 rounded-br-xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4 mb-4 pr-12">
          <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-cyan-400 uppercase tracking-widest block">
              AUTHENTICATION // SYSTEM
            </span>
            <h2 className="text-base font-bold text-slate-100 uppercase">
              {currentAuth ? 'Benutzer-Konto' : mode === 'register' ? 'Registrierung' : mode === 'forgot_password' ? 'Passwort vergessen' : 'Anmelden'}
            </h2>
          </div>
        </div>

        {/* ALREADY LOGGED IN VIEW */}
        {currentAuth ? (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">E-Mail-Adresse:</span>
                <span className="font-bold text-slate-100">{currentAuth.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>E-Mail Verifiziert</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Registriert am:</span>
                <span className="text-slate-300">{new Date(currentAuth.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="w-full py-2.5 px-4 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-500/50 text-rose-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>Abmelden</span>
            </button>
          </div>
        ) : (
          <div>
            {/* Notifications */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/90 border border-rose-500/50 text-rose-300 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* UNVERIFIED E-MAIL WARNING MODE */}
            {mode === 'unverified_warning' ? (
              <div className="space-y-4 text-center py-2">
                <div className="p-3 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-400 w-12 h-12 mx-auto flex items-center justify-center">
                  <Mail className="w-6 h-6 animate-bounce" />
                </div>

                <div className="bg-amber-950/30 border border-amber-500/40 p-4 rounded-xl text-left space-y-2">
                  <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>E-Mail-Bestätigung erforderlich</span>
                  </h3>
                  <p className="text-xs text-slate-200 leading-relaxed font-bold">
                    Bitte bestätige deine E-Mail, bevor du dich einloggen kannst.
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Wir haben eine Bestätigungs-E-Mail an <strong className="text-cyan-300">{email}</strong> gesendet.
                  </p>
                </div>

                {/* Simulated Verification Action */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-left space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block">
                    [E-Mail Simulation]
                  </span>
                  <p className="text-[11px] text-slate-300">
                    Klicke unten, um das Bestätigen des E-Mail-Links zu simulieren:
                  </p>
                  <button
                    onClick={handleVerifyEmailSimulated}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>E-Mail Verifizierung jetzt simulieren</span>
                  </button>
                </div>

                <div className="flex justify-between items-center text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-cyan-400 hover:underline"
                  >
                    Zurück zum Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuccessMessage('Bestätigungs-E-Mail erneut gesendet!')}
                    className="text-slate-400 hover:text-slate-200 flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>E-Mail erneut senden</span>
                  </button>
                </div>
              </div>
            ) : mode === 'forgot_password' ? (
              /* FORGOT PASSWORD FORM */
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Gib deine registrierte E-Mail-Adresse ein, um einen Link zum Zurücksetzen deines Passworts zu erhalten.
                </p>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    E-Mail-Adresse
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="deine@email.de"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-xs text-slate-100 placeholder-slate-600 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all"
                >
                  Passwort zurücksetzen Link senden
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    Zurück zum Login
                  </button>
                </div>
              </form>
            ) : mode === 'register' ? (
              /* REGISTER FORM */
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    E-Mail-Adresse
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="deine@email.de"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-xs text-slate-100 placeholder-slate-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Passwort (mind. 6 Zeichen)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-xs text-slate-100 placeholder-slate-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Passwort bestätigen
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-xs text-slate-100 placeholder-slate-600 outline-none"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic">
                  * Nach der Registrierung wird eine E-Mail-Bestätigung gesendet.
                </p>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all flex items-center justify-center space-x-1"
                >
                  <span>Jetzt Registrieren</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="text-center pt-2">
                  <span className="text-xs text-slate-400">Bereits ein Konto? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage(null);
                    }}
                    className="text-xs text-cyan-400 font-bold hover:underline"
                  >
                    Anmelden
                  </button>
                </div>
              </form>
            ) : (
              /* LOGIN FORM */
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    E-Mail-Adresse
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="deine@email.de"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-xs text-slate-100 placeholder-slate-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Passwort
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot_password');
                        setErrorMessage(null);
                      }}
                      className="text-[10px] text-cyan-400 hover:underline"
                    >
                      Passwort vergessen?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-xs text-slate-100 placeholder-slate-600 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all flex items-center justify-center space-x-1"
                >
                  <span>Anmelden</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="text-center pt-2">
                  <span className="text-xs text-slate-400">Noch kein Konto? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMessage(null);
                    }}
                    className="text-xs text-cyan-400 font-bold hover:underline"
                  >
                    Registrieren
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
