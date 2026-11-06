import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from '../components/icons/MinimalIcons';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Por favor confirma tu correo antes de iniciar sesión.');
        } else {
          setError(signInError.message);
        }
        return;
      }

      if (data.user) {
        // Check if user has completed character selection using RPC
        const { data: profile, error: profileError } = await supabase
          .rpc('kuneo_get_user_profile', { p_user_id: data.user.id });

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }

        // Extract profile object from array (RPC returns array)
        const profileObject = Array.isArray(profile) && profile.length > 0 ? profile[0] : profile;
        
        if (!profileObject || !profileObject.character_preference) {
          navigate('/character-selection');
        } else {
          navigate('/home');
        }
      }
    } catch (err) {
      setError('Ocurrió un error inesperado. Por favor intenta de nuevo.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ backgroundColor: '#13172a' }}>
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: 'url(/image/characters/tuko-login.png)',
          backgroundPosition: 'center top'
        }}
      />
      
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#13172a]/70 to-[#13172a]/95" />
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-end px-6 py-8">

        {/* Login Card */}
        <div className="w-full max-w-md">
          <div className="bg-[#1e2439] rounded-3xl p-8 shadow-2xl border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-2">Bienvenido de nuevo</h2>
            <p className="text-gray-400 text-sm mb-6">Inicia sesión para continuar tu aprendizaje.</p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2">
                <span className="text-red-400 text-sm">⚠️ {error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <MailIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#2a3149] text-white placeholder-gray-500 rounded-xl py-3 pl-11 pr-4 border border-gray-700 focus:border-purple-500 focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <LockIcon className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#2a3149] text-white placeholder-gray-500 rounded-xl py-3 pl-11 pr-12 border border-gray-700 focus:border-purple-500 focus:outline-none transition-colors"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-700 bg-[#2a3149] text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                  />
                  <span className="text-gray-400">Recordarme</span>
                </label>
                <Link to="/forgot-password" className="text-purple-400 hover:text-purple-300 transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 via-purple-500 to-orange-400 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Cargando...' : 'Iniciar sesión'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#1e2439] text-gray-500">o continúa con</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2a3149] border border-gray-700 text-white hover:bg-[#323a56] transition-colors"
                onClick={() => alert('Autenticación con Google próximamente')}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Google</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2a3149] border border-gray-700 text-white hover:bg-[#323a56] transition-colors"
                onClick={() => alert('Autenticación con Apple próximamente')}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <span>Apple</span>
              </button>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center mt-6 text-sm">
            <span className="text-gray-400">¿No tienes una cuenta? </span>
            <Link to="/register" className="text-purple-400 hover:text-purple-300 transition-colors font-semibold">
              Regístrate
            </Link>
          </div>
        </div>

        {/* Bottom Spacer */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}

export default Login;