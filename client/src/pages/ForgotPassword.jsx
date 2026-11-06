import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { MailIcon, ArrowLeftIcon, CheckCircleIcon } from '../components/icons/MinimalIcons';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (resetError) {
        if (resetError.message.includes('Invalid email')) {
          setError('Formato de correo electrónico inválido.');
        } else {
          setError(resetError.message);
        }
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('Ocurrió un error inesperado. Por favor intenta de nuevo.');
      console.error('Forgot password error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#13172a' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#13172a]/50 to-[#0f1121]" />
        
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-8">
          <div className="w-full max-w-md">
            <div className="bg-[#1e2439] rounded-3xl p-8 shadow-2xl border border-gray-800 text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Revisa tu correo</h2>
              <p className="text-gray-400 text-sm mb-6">
                Te hemos enviado un enlace para restablecer tu contraseña a <span className="text-purple-400 font-semibold">{email}</span>
              </p>
              
              <p className="text-gray-500 text-xs mb-6">
                Si no recibes el correo en unos minutos, revisa tu carpeta de spam.
              </p>

              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-semibold"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ backgroundColor: '#13172a' }}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#13172a]/50 to-[#0f1121]" />
      
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Volver
          </Link>

          <div className="bg-[#1e2439] rounded-3xl p-8 shadow-2xl border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-2">¿Olvidaste tu contraseña?</h2>
            <p className="text-gray-400 text-sm mb-6">
              No te preocupes. Ingresa tu correo electrónico y te enviaremos un enlace para restablecerla.
            </p>

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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 via-purple-500 to-orange-400 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>

            {/* Additional Info */}
            <div className="mt-6 text-center text-sm">
              <span className="text-gray-400">¿Recordaste tu contraseña? </span>
              <Link to="/login" className="text-purple-400 hover:text-purple-300 transition-colors font-semibold">
                Inicia sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
