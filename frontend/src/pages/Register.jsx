import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiService } from "../services/apiService";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    role: "user",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");
  setLoading(true);

  try {
    const result = await apiService.register(form);

    if (result.success) {
      // PLUS DE TOKEN, on stocke juste le user
      localStorage.setItem("user", JSON.stringify(result.user));

      setSuccess("Compte créé avec succès !");
      setTimeout(() => {
        if (result.user.role === "owner") {
          navigate("/dashboard-owner");
        } else {
          navigate("/dashboard-user");
        }
      }, 1500);
    } else {
      setError("Impossible de créer le compte.");
    }
  } catch (err) {
    setError(err.message || "Erreur lors de l'inscription");
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
              Inscription
            </h1>
            <p className="text-center text-gray-500 mb-10 font-light">
              Créez votre compte en quelques instants
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-light mb-3 text-sm">
                    Prénom
                  </label>
                  <input
                    name="firstname"
                    placeholder="John"
                    value={form.firstname}
                    onChange={handleChange}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 focus:bg-white transition-all duration-300 font-light"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-light mb-3 text-sm">
                    Nom
                  </label>
                  <input
                    name="lastname"
                    placeholder="Doe"
                    value={form.lastname}
                    onChange={handleChange}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 focus:bg-white transition-all duration-300 font-light"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-light mb-3 text-sm">
                  Adresse email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="votre@email.com"
                  value={form.email}
                  onChange={handleChange}
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
                  name="password"
                  placeholder="Minimum 6 caractères"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 focus:bg-white transition-all duration-300 font-light"
                  required
                  minLength="6"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-light mb-4 text-sm">
                  Je m'inscris en tant que
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300 ${
                    form.role === "user" 
                      ? 'border-gray-900 bg-gray-900 text-white shadow-lg' 
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="user"
                      checked={form.role === "user"}
                      onChange={handleChange}
                      className="sr-only"
                      required
                    />
                    <div className="text-center">
                      <div className={`font-medium mb-2 ${form.role === "user" ? 'text-white' : 'text-gray-900'}`}>
                        Utilisateur
                      </div>
                      <div className={`text-xs ${form.role === "user" ? 'text-white/80' : 'text-gray-500'} font-light`}>
                        Je cherche un parking
                      </div>
                    </div>
                  </label>
                  
                  <label className={`cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300 ${
                    form.role === "owner" 
                      ? 'border-gray-900 bg-gray-900 text-white shadow-lg' 
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="owner"
                      checked={form.role === "owner"}
                      onChange={handleChange}
                      className="sr-only"
                      required
                    />
                    <div className="text-center">
                      <div className={`font-medium mb-2 ${form.role === "owner" ? 'text-white' : 'text-gray-900'}`}>
                        Propriétaire
                      </div>
                      <div className={`text-xs ${form.role === "owner" ? 'text-white/80' : 'text-gray-500'} font-light`}>
                        Je loue mon parking
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-2xl text-sm font-light">
                  {success}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm font-light">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white py-5 rounded-2xl hover:bg-gray-800 transition-all duration-300 font-light text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                {loading ? "Création en cours..." : "Créer mon compte"}
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-gray-500 font-light text-sm">
                Déjà un compte ?{" "}
                <Link
                  to="/login"
                  className="text-gray-900 hover:text-gray-700 font-medium transition-colors"
                >
                  Se connecter
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
