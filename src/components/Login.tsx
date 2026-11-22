import { useState, FormEvent } from 'react';
import { Lock, Mail, AlertCircle, Loader2, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import toast from 'react-hot-toast';
import { validateEmail } from '../utils/validation';
import { useTheme } from '../context/ThemeContext';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('L\'adresse email n\'est pas valide');
      return;
    }
    
    setLoading(true);
    try {
      const result = await onLogin(email, password);
      if (!result.success) {
        toast.error(result.error || 'Erreur de connexion');
      }
    } catch {
      toast.error('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center p-4 relative">
      <button onClick={toggleTheme} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400" title={isDark ? 'Mode clair' : 'Mode sombre'}>
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
      <div className="w-full max-w-md">
        {/* Logo / En-tête */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Gestion ONG</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Connectez-vous à votre espace</p>
        </div>

        {/* Formulaire */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Adresse email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="votre@email.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

           {/* Info */}
           <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
             <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
               S'identifier avec vos accès administrateur.
             </p>
           </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          © 2026 Gestion ONG - Tous droits réservés
        </p>
      </div>
    </div>
  );
}
