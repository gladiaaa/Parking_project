import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiService } from "../services/apiService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validation côté client
    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    
    if (!email.includes('@')) {
      setError("Veuillez entrer une adresse email valide");
      return;
    }
    
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    
    setLoading(true);

    try {
      // Normaliser l'email
      const normalizedEmail = email.trim().toLowerCase();
      
      // Debug: vérifier localStorage avant connexion
      const storedUsers = localStorage.getItem('mockUsers');
      console.log('📦 Utilisateurs dans localStorage:', storedUsers ? JSON.parse(storedUsers) : 'Aucun');
      
      const result = await apiService.login(normalizedEmail, password);
      
      if (result.success && result.token && result.user) {
        // Sauvegarder dans localStorage
        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));
        
        console.log('✅ Token sauvegardé:', result.token);
        console.log('✅ Utilisateur sauvegardé:', result.user);
        
        // Redirection selon le rôle
        if (result.user.role === 'owner') {
          navigate("/dashboard-owner", { replace: true });
        } else {
          navigate("/dashboard-user", { replace: true });
        }
      } else {
        setError("Erreur lors de la connexion. Veuillez réessayer.");
      }
    } catch (err) {
      console.error('❌ Erreur connexion:', err);
      console.error('📧 Email utilisé:', email.trim().toLowerCase());
      console.error('🔑 Mot de passe utilisé:', password);
      
      // Message d'erreur plus détaillé
      let errorMessage = err.message || "Email ou mot de passe incorrect";
      if (errorMessage.includes('Email ou mot de passe incorrect')) {
        errorMessage += "\n\n💡 Vérifiez que vous avez bien créé un compte. Si c'est le cas, vérifiez l'email et le mot de passe dans la console (F12).";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      <main className="flex-1 flex items-center justify-center py-32 px-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-100">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">P</span>
              </div>
            </div>

            <h1 className="text-4xl font-light text-center mb-3 text-gray-900 tracking-tight">
              Connexion
            </h1>
            <p className="text-center text-gray-500 mb-10 font-light">
              Bienvenue ! Connectez-vous à votre compte
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-light mb-3 text-sm">
                  Adresse email
                </label>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 focus:bg-white transition-all duration-300 font-light"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-light mb-3 text-sm">
                  Mot de passe
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 focus:bg-white transition-all duration-300 font-light"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm font-light flex items-center gap-2 animate-pulse">
                  <span>❌</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white py-5 rounded-2xl hover:bg-gray-800 transition-all duration-300 font-light text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                {loading ? "Connexion en cours..." : "Se connecter"}
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-gray-500 font-light text-sm">
                Pas encore de compte ?{" "}
                <Link
                  to="/register"
                  className="text-gray-900 hover:text-gray-700 font-medium transition-colors"
                >
                  Créer un compte
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
