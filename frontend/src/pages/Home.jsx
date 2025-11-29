import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LoadingScreen from "../components/LoadingScreen";
import CountUp from '../UI/Countup'
import GooglePlayBadge from '../assets/google_play_badge.svg';
import AppStoreBadge from '../assets/app_store_badge.svg';

export default function Home() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [searchForm, setSearchForm] = useState({
    ville: '',
    vehicule: 'Voiture',
    dateDebut: '',
    dateFin: ''
  });

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Rediriger vers la page de réservation avec les paramètres de recherche
    navigate('/reservation', { state: searchForm });
  };

  return (
    <>
      {isLoading && <LoadingScreen onLoadingComplete={handleLoadingComplete} />}
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1">

          {/* HERO SECTION - EXACT ZENPARK avec arrondi en bas - VERSION COMPACTE */}
          <section className="relative bg-primary text-white pt-24 pb-32 overflow-visible h-screen flex items-center">
            <div className="container mx-auto px-6 lg:px-12 relative z-10 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

                {/* Colonne gauche - Titre + Formulaire */}
                <div className="space-y-4">
                  {/* Titre principal */}
                  <h1 className="text-4xl md:text-5xl font-serif font-normal leading-tight mb-2">
                    Stationnez malin, vivez mieux.
                  </h1>
                  <p className="text-sm md:text-base text-white/95 font-light mb-4">
                    Trouvez et réservez votre place de parking<br />
                    en quelques clics, où que vous soyez.
                  </p>

                  {/* Formulaire de recherche blanc */}
                  <div className="bg-white rounded-2xl p-5 shadow-2xl">
                    {/* Onglets */}
                    <div className="flex gap-2 mb-4">
                      <button className="bg-primary text-white px-5 py-2 rounded-full text-xs font-normal">
                        Heure/Jour
                      </button>
                      <button className="text-gray-700 px-5 py-2 rounded-full text-xs font-normal hover:bg-gray-100 transition">
                        Au mois
                      </button>
                    </div>

                  {/* Champs de recherche */}
                  <form onSubmit={handleSearchSubmit} className="space-y-3">
                    {/* Où */}
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">📍</span>
                      <input
                        type="text"
                        placeholder="Où cherchez-vous un parking ?"
                        value={searchForm.ville}
                        onChange={(e) => setSearchForm({ ...searchForm, ville: e.target.value })}
                        className="w-full pl-11 pr-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 text-sm"
                      />
                    </div>

                    {/* Type de véhicule */}
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🚗</span>
                      <select
                        value={searchForm.vehicule}
                        onChange={(e) => setSearchForm({ ...searchForm, vehicule: e.target.value })}
                        className="w-full pl-11 pr-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 text-sm appearance-none"
                      >
                        <option value="Voiture">Voiture</option>
                        <option value="Moto">Moto</option>
                        <option value="Vélo">Vélo</option>
                        <option value="Trottinette">Trottinette</option>
                      </select>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-base z-10">📅</span>
                        <input
                          type="datetime-local"
                          value={searchForm.dateDebut}
                          onChange={(e) => setSearchForm({ ...searchForm, dateDebut: e.target.value })}
                          className="w-full pl-8 pr-2 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 text-xs"
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-base z-10">📅</span>
                        <input
                          type="datetime-local"
                          value={searchForm.dateFin}
                          onChange={(e) => setSearchForm({ ...searchForm, dateFin: e.target.value })}
                          className="w-full pl-8 pr-2 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 text-xs"
                        />
                      </div>
            </div>

                      {/* Bouton rechercher */}
                      <button
                        type="submit"
                        className="w-full bg-primary text-white py-3 rounded-lg hover:bg-accent transition duration-300 text-base font-normal"
                      >
                        Rechercher
                      </button>
                    </form>
                  </div>

                  {/* Badges stores */}
                  <div className="flex gap-2">
                    <a href="#" className="inline-block">
                      <img
                        src={AppStoreBadge}
                        alt="Disponible sur Google Play"
                        className="h-12 w-auto"
                      />
                    </a>
                    <a href="#" className="inline-block">
                      <img
                        src={GooglePlayBadge}
                        alt="Disponible sur Google Play"
                        className="h-12 w-auto"
                      />
                    </a>
                  </div>

                  {/* Trustpilot */}
                  <div className="flex items-center gap-1 flex-wrap text-xs">
                    <div className="flex gap-0.5">
                      <span className="text-green-400 text-xs">⭐</span>
                      <span className="text-green-400 text-xs">⭐</span>
                      <span className="text-green-400 text-xs">⭐</span>
                      <span className="text-green-400 text-xs">⭐</span>
                      <span className="text-green-400 text-xs">⭐</span>
                    </div>
                    <span className="text-white/90">Trustpilot</span>
                    <span className="text-white font-semibold">Excellent 4,3/5</span>
                    <span className="text-white/90">| 3496 avis</span>
                  </div>
                </div>

                {/* Colonne droite - Image */}
                <div className="hidden lg:block relative">
                  <div className="rounded-2xl overflow-hidden shadow-2xl">
                    <img
                      src="/images/Cityparker.png"
                      alt="Happy driver"
                      className="w-full h-[420px] object-cover"
                    />
                  </div>
                  {/* Bouton play vidéo */}
                  <button className="absolute bottom-4 right-4 bg-white text-primary px-4 py-2 rounded-full shadow-xl hover:bg-gray-100 transition flex items-center gap-2 text-sm">
                    <span>▶️</span>
                    <span className="font-light">Voir la vidéo</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ARRONDI EN BAS - SVG comme Zenpark - BIEN VISIBLE */}
            <div className="absolute bottom-0 left-0 right-0 overflow-hidden" style={{ lineHeight: 0 }}>
              <svg className="relative block w-full" style={{ height: '120px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" preserveAspectRatio="none">
                <path d="M0,0 C360,120 1080,120 1440,0 L1440,120 L0,120 Z" fill="#ffffff"></path>
              </svg>
            </div>
          </section>

          {/* BADGES - 3 icônes - Style ultra-épuré */}
          <section id="services" className="py-16 bg-white">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
                <div className="flex flex-col items-center gap-3 text-center group cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-125 group-hover:rotate-6 group-hover:shadow-lg">
                    <span className="text-3xl group-hover:scale-110 transition-transform duration-300">🅿️</span>
                  </div>
                  <h3 className="font-light text-gray-800 text-lg group-hover:text-primary transition-colors">Stationnement dédié</h3>
                </div>
                <div className="flex flex-col items-center gap-3 text-center group cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-125 group-hover:-rotate-6 group-hover:shadow-lg">
                    <span className="text-3xl group-hover:scale-110 transition-transform duration-300">🔒</span>
                  </div>
                  <h3 className="font-light text-gray-800 text-lg group-hover:text-primary transition-colors">Parking privé</h3>
                </div>
                <div className="flex flex-col items-center gap-3 text-center group cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-125 group-hover:rotate-6 group-hover:shadow-lg">
                    <span className="text-3xl group-hover:scale-110 transition-transform duration-300">📅</span>
                  </div>
                  <h3 className="font-light text-gray-800 text-lg group-hover:text-primary transition-colors">Réservez à l'avance</h3>
                </div>
              </div>
            </div>
          </section>

          {/* COMMENT ÇA MARCHE - EXACT ZENPARK */}
          <section className="py-24 px-6 text-center bg-white">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-5xl md:text-6xl font-serif font-normal mb-4 text-gray-900">
                Simple et rapide
              </h2>
              <p className="text-gray-600 text-base font-normal mb-16 max-w-2xl mx-auto">
                Trois étapes suffisent pour réserver votre place de parking.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                {/* 1. Trouvez votre parking */}
                <div className="flex flex-col items-center">
                  <div className="relative mb-8 w-48 h-48 flex items-center justify-center">
                    {/* Illustration parking avec personnage */}
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      {/* Panneau P */}
                      <circle cx="60" cy="60" r="25" fill="#1a1a1a" stroke="#1a1a1a" strokeWidth="3" />
                      <text x="60" y="72" fontSize="32" fontWeight="bold" fill="white" textAnchor="middle">P</text>
                      <line x1="60" y1="85" x2="60" y2="130" stroke="#1a1a1a" strokeWidth="3" />

                      {/* Personnage turquoise */}
                      <ellipse cx="130" cy="90" rx="30" ry="35" fill="#A8D5D5" opacity="0.8" />
                      <circle cx="130" cy="70" r="15" fill="#A8D5D5" />
                      <circle cx="125" cy="68" r="2" fill="#1a1a1a" />
                      <circle cx="135" cy="68" r="2" fill="#1a1a1a" />
                      <path d="M 120 75 Q 130 78 140 75" stroke="#1a1a1a" strokeWidth="2" fill="none" />

                      {/* Bras */}
                      <path d="M 105 95 Q 95 85 90 80" stroke="#A8D5D5" strokeWidth="8" strokeLinecap="round" fill="none" />
                      <path d="M 155 95 Q 165 85 170 80" stroke="#A8D5D5" strokeWidth="8" strokeLinecap="round" fill="none" />

                      {/* Jambes */}
                      <ellipse cx="120" cy="130" rx="8" ry="15" fill="#A8D5D5" />
                      <ellipse cx="140" cy="130" rx="8" ry="15" fill="#A8D5D5" />

                      {/* Badge numéro 1 */}
                      <circle cx="165" cy="35" r="15" fill="#1a1a1a" />
                      <text x="165" y="42" fontSize="18" fontWeight="bold" fill="white" textAnchor="middle">1</text>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Recherchez une place</h3>
                  <p className="text-gray-600 text-sm font-normal leading-relaxed">
                    Découvrez des milliers de parkings disponibles près de chez vous.
                  </p>
                </div>

                {/* 2. Réservez votre place */}
                <div className="flex flex-col items-center">
                  <div className="relative mb-8 w-48 h-48 flex items-center justify-center">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      {/* Téléphone */}
                      <rect x="85" y="40" width="60" height="100" rx="8" fill="#1a1a1a" stroke="#1a1a1a" strokeWidth="2" />
                      <rect x="90" y="48" width="50" height="75" rx="4" fill="#4A7C59" />
                      <circle cx="115" cy="132" r="5" fill="#666" />
                      <line x1="100" y1="60" x2="130" y2="60" stroke="white" strokeWidth="2" />
                      <line x1="100" y1="70" x2="125" y2="70" stroke="white" strokeWidth="2" />

                      {/* Personnage turquoise */}
                      <ellipse cx="40" cy="110" rx="22" ry="28" fill="#A8D5D5" opacity="0.8" />
                      <circle cx="40" cy="90" r="12" fill="#A8D5D5" />
                      <circle cx="36" cy="88" r="2" fill="#1a1a1a" />
                      <circle cx="44" cy="88" r="2" fill="#1a1a1a" />

                      {/* Bras pointant vers téléphone */}
                      <path d="M 55 105 Q 70 95 80 90" stroke="#A8D5D5" strokeWidth="6" strokeLinecap="round" fill="none" />
                      <path d="M 25 110 Q 15 105 10 100" stroke="#A8D5D5" strokeWidth="6" strokeLinecap="round" fill="none" />

                      {/* Jambes */}
                      <ellipse cx="33" cy="140" rx="6" ry="12" fill="#A8D5D5" />
                      <ellipse cx="47" cy="140" rx="6" ry="12" fill="#A8D5D5" />

                      {/* Badge numéro 2 */}
                      <circle cx="165" cy="35" r="15" fill="#1a1a1a" />
                      <text x="165" y="42" fontSize="18" fontWeight="bold" fill="white" textAnchor="middle">2</text>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Réservez en ligne</h3>
                  <p className="text-gray-600 text-sm font-normal leading-relaxed">
                    Choisissez votre durée : horaire, journalière ou mensuelle.
                  </p>
                </div>

                {/* 3. Et enfin, garez-vous */}
                <div className="flex flex-col items-center">
                  <div className="relative mb-8 w-48 h-48 flex items-center justify-center">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      {/* Voiture */}
                      <rect x="80" y="90" width="80" height="40" rx="5" fill="#1a1a1a" />
                      <rect x="95" y="75" width="50" height="20" rx="4" fill="#1a1a1a" />
                      <circle cx="95" cy="132" r="12" fill="#333" />
                      <circle cx="95" cy="132" r="8" fill="#666" />
                      <circle cx="145" cy="132" r="12" fill="#333" />
                      <circle cx="145" cy="132" r="8" fill="#666" />
                      <rect x="90" y="95" width="20" height="15" fill="#87CEEB" opacity="0.7" />
                      <rect x="115" y="95" width="20" height="15" fill="#87CEEB" opacity="0.7" />

                      {/* Panneau P mini */}
                      <rect x="148" y="60" width="18" height="20" rx="2" fill="white" stroke="#1a1a1a" strokeWidth="1" />
                      <text x="157" y="73" fontSize="12" fontWeight="bold" fill="#1a1a1a" textAnchor="middle">P</text>

                      {/* Personnage turquoise */}
                      <ellipse cx="45" cy="110" rx="22" ry="28" fill="#A8D5D5" opacity="0.8" />
                      <circle cx="45" cy="90" r="12" fill="#A8D5D5" />
                      <circle cx="41" cy="88" r="2" fill="#1a1a1a" />
                      <circle cx="49" cy="88" r="2" fill="#1a1a1a" />
                      <path d="M 40 95 Q 45 97 50 95" stroke="#1a1a1a" strokeWidth="1.5" fill="none" />

                      {/* Bras */}
                      <path d="M 30 105 Q 20 100 15 95" stroke="#A8D5D5" strokeWidth="6" strokeLinecap="round" fill="none" />
                      <path d="M 60 110 Q 70 105 75 100" stroke="#A8D5D5" strokeWidth="6" strokeLinecap="round" fill="none" />

                      {/* Jambes */}
                      <ellipse cx="38" cy="140" rx="6" ry="12" fill="#A8D5D5" />
                      <ellipse cx="52" cy="140" rx="6" ry="12" fill="#A8D5D5" />

                      {/* Badge numéro 3 */}
                      <circle cx="165" cy="35" r="15" fill="#1a1a1a" />
                      <text x="165" y="42" fontSize="18" fontWeight="bold" fill="white" textAnchor="middle">3</text>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Accédez à votre place</h3>
                  <p className="text-gray-600 text-sm font-normal leading-relaxed">
                    Présentez votre réservation et stationnez en toute tranquillité.
                  </p>
                </div>
              </div>

              <button className="bg-primary text-white px-10 py-3.5 rounded-full hover:bg-primary-700 transition-all duration-300 shadow-md hover:shadow-lg font-normal text-base">
                Commencer maintenant
              </button>
            </div>
          </section>

        {/* SECTION Quote + 3 avantages - ULTRA ORIGINAL & MINIMALISTE */}
        <section className="relative py-32 bg-white px-6 overflow-hidden">
          {/* Background gradient subtil */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10"></div>
          
          <div className="max-w-7xl mx-auto">
            {/* Layout asymétrique - Quote à gauche, Stats à droite */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-24">
              
              {/* Quote - Côté gauche */}
              <div className="space-y-8">
                {/* Badge minimaliste */}
                <div className="inline-flex items-center gap-2 border border-primary/20 rounded-full px-4 py-1.5">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-xs uppercase tracking-wider text-gray-600 font-medium">Simplicité garantie</span>
                </div>
                
                <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif font-light leading-[1.05] text-gray-900">
                  Le parking partagé<br />
                  <span className="italic text-primary/80">repensé pour</span><br />
                  votre quotidien.
                </h2>
                
                <p className="text-lg text-gray-600 font-light leading-relaxed max-w-xl">
                  ParkingPartagé simplifie votre stationnement au quotidien. Que ce soit pour vos courses, un rendez-vous ou vos déplacements professionnels.
                </p>
                
                <button
                  onClick={() => navigate('/reservation')}
                  className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-full hover:bg-primary-800 transition-all duration-300 font-light text-sm shadow-md hover:shadow-xl hover:-translate-y-0.5 group"
                >
                  <span>Découvrir l'offre</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
              
              {/* Métriques - Côté droit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 rounded-2xl p-6 hover:border-primary/30 transition-all duration-300">
                  <div className="text-4xl font-light text-primary mb-2">100K+</div>
                  <div className="text-sm text-gray-700 font-medium">Places</div>
                  <div className="text-xs text-gray-500 font-light">Disponibles</div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-transparent border border-gray-200 rounded-2xl p-6 hover:border-primary/30 transition-all duration-300">
                  <div className="text-4xl font-light text-gray-900 mb-2">6 mois</div>
                  <div className="text-sm text-gray-700 font-medium">Réservation</div>
                  <div className="text-xs text-gray-500 font-light">À l'avance</div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-transparent border border-gray-200 rounded-2xl p-6 hover:border-primary/30 transition-all duration-300">
                  <div className="text-4xl font-light text-gray-900 mb-2">-66%</div>
                  <div className="text-sm text-gray-700 font-medium">Prix</div>
                  <div className="text-xs text-gray-500 font-light">vs. Voirie</div>
                </div>
                <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 rounded-2xl p-6 hover:border-primary/30 transition-all duration-300">
                  <div className="text-4xl font-light text-primary mb-2">700</div>
                  <div className="text-sm text-gray-700 font-medium">Villes</div>
                  <div className="text-xs text-gray-500 font-light">Couvertes</div>
                </div>
              </div>
            </div>

              {/* 3 avantages - Liste horizontale avec séparateurs */}
              <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-x divide-gray-200 border-t border-b border-gray-200 py-12">
                  <div className="px-8 group cursor-pointer hover:bg-gray-50/50 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-all duration-300">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-1">Proximité</h3>
                        <p className="text-sm text-gray-600 font-light leading-relaxed">
                          Toujours une place près de vous
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-8 group cursor-pointer hover:bg-gray-50/50 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-all duration-300">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-1">Instantané</h3>
                        <p className="text-sm text-gray-600 font-light leading-relaxed">
                          Réservez en un clic
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-8 group cursor-pointer hover:bg-gray-50/50 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-all duration-300">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-1">Transparent</h3>
                        <p className="text-sm text-gray-600 font-light leading-relaxed">
                          Prix fixe, pas de surprise
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

        {/* SECTION IMAGE PANORAMIQUE - ULTRA ORIGINAL & MINIMALISTE */}
        <section className="relative py-32 bg-white px-6 overflow-hidden">
          {/* Cercles décoratifs en arrière-plan */}
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-gray-100 rounded-full blur-3xl -z-10"></div>
          
          <div className="max-w-7xl mx-auto">
            {/* Grid asymétrique */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
              
              {/* Colonne gauche - Texte (2/5) */}
              <div className="lg:col-span-2 space-y-8">
                <div className="inline-flex items-center gap-2 border border-primary/20 rounded-full px-4 py-1.5 mb-4">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-xs uppercase tracking-widest text-gray-600 font-medium">Innovation</span>
                </div>
                
                <h2 className="text-5xl md:text-6xl font-light leading-[1.1] text-gray-900">
                  Un parking<br />
                  quand vous<br />
                  <span className="italic text-primary/80">en avez besoin</span>
                </h2>
                
                <p className="text-lg text-gray-600 font-light leading-relaxed">
                  Accédez à des milliers de places disponibles instantanément
                </p>
                
                {/* Stats inline */}
                <div className="flex items-center gap-8 pt-4">
                  <div className="flex flex-col">
                    <span className="text-3xl font-light text-primary">100K+</span>
                    <span className="text-xs text-gray-500 font-light">Places</span>
                  </div>
                  <div className="w-px h-12 bg-gray-200"></div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-light text-primary">700</span>
                    <span className="text-xs text-gray-500 font-light">Villes</span>
                  </div>
                  <div className="w-px h-12 bg-gray-200"></div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-light text-primary">24/7</span>
                    <span className="text-xs text-gray-500 font-light">Accès</span>
                  </div>
                </div>
                
                <button
                  onClick={() => navigate('/reservation')}
                  className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-all duration-300 font-light text-sm shadow-lg group"
                >
                  <span>Découvrir nos parkings</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
              
              {/* Colonne droite - Image (3/5) */}
              <div className="lg:col-span-3">
                <div className="relative group">
                  {/* Image principale avec masque */}
                  <div className="relative overflow-hidden rounded-3xl">
                    <img
                      src="/images/pcityparker.png"
                      alt="Parking moderne"
                      className="w-full h-[500px] object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />
                    {/* Overlay subtil */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent mix-blend-overlay"></div>
                  </div>
                  
                  {/* Carte flottante */}
                  <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-6 shadow-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Stationnement intelligent</div>
                        <div className="text-xs text-gray-500 font-light">Disponible maintenant</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

          {/* SECTION Types de stationnement - ULTRA ORIGINAL & MINIMALISTE */}
          <section id="tarifs" className="py-40 bg-gradient-to-b from-gray-50 to-white px-6">
            <div className="max-w-6xl mx-auto">
              {/* Titre avec ligne décorative */}
              <div className="text-center mb-24">
                <div className="inline-flex items-center gap-4 mb-8">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-gray-300"></div>
                  <span className="text-xs uppercase tracking-[0.3em] text-gray-500 font-medium">Nos formules</span>
                  <div className="h-px w-12 bg-gradient-to-l from-transparent to-gray-300"></div>
                </div>

                <h2 className="text-5xl md:text-6xl font-light leading-tight text-gray-900 mb-6">
                  Des formules adaptées<br />
                  <span className="text-primary italic">à tous vos besoins</span>
                </h2>

                <p className="text-lg text-gray-600 font-light max-w-2xl mx-auto">
                  Stationnement flexible pour courte ou longue durée
                </p>
              </div>

              {/* Cartes en bento box style */}
              <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                {/* Carte 1 - 2 colonnes */}
                <div className="lg:col-span-2 group cursor-pointer">
                  <div className="bg-white border border-gray-200 rounded-3xl p-8 h-full hover:border-primary hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-all duration-300">
                          <svg className="w-7 h-7 text-gray-700 group-hover:text-primary transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-light text-gray-900 mb-2">À l'heure</h3>
                        <p className="text-sm text-gray-500 font-light leading-relaxed">Flexibilité maximale pour vos déplacements</p>
                      </div>
                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-400 font-light">Dès 2€/h</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Carte 2 - 3 colonnes (MISE EN AVANT) */}
                <div className="lg:col-span-3 group cursor-pointer">
                  <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10 h-full shadow-2xl hover:shadow-3xl hover:-translate-y-3 transition-all duration-500 overflow-hidden">
                    {/* Badge populaire */}
                    <div className="absolute top-4 right-4">
                      <div className="bg-white/10 backdrop-blur-sm text-white text-xs font-light px-3 py-1 rounded-full border border-white/20">
                        Populaire
                      </div>
                    </div>

                    {/* Motif décoratif */}
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>

                    <div className="relative flex flex-col h-full justify-between">
                      <div>
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="text-3xl font-light text-white mb-3">Jour & Semaine</h3>
                        <p className="text-sm text-white/70 font-light leading-relaxed">Idéal pour les courts séjours et événements</p>
                      </div>
                      <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                        <span className="text-xs text-white/50 font-light">Dès 15€/jour</span>
                        <button className="bg-white text-gray-900 px-4 py-2 rounded-full text-xs font-medium hover:bg-gray-100 transition-all duration-300">
                          Choisir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Carte 3 - 2 colonnes */}
                <div className="lg:col-span-2 group cursor-pointer">
                  <div className="bg-white border border-gray-200 rounded-3xl p-8 h-full hover:border-primary hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-all duration-300">
                          <svg className="w-7 h-7 text-gray-700 group-hover:text-primary transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-light text-gray-900 mb-2">Au mois</h3>
                        <p className="text-sm text-gray-500 font-light leading-relaxed">Sans engagement pour une liberté totale</p>
                      </div>
                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-400 font-light">Dès 80€/mois</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* VILLES - ULTRA ORIGINAL & MINIMALISTE */}
          <section id="villes" className="py-40 bg-white px-6">
            <div className="max-w-7xl mx-auto">
              {/* Titre avec design asymétrique */}
              <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8 mb-20">
                <div className="max-w-2xl">
                  <h2 className="text-5xl md:text-6xl font-light leading-tight text-gray-900 mb-4">
                    Partout en France,<br />
                    <span className="italic text-primary/80">votre place vous attend</span>
                  </h2>
                  <p className="text-lg text-gray-600 font-light">
                    Des parkings dans les plus grandes villes françaises
                  </p>
                </div>
                <button className="bg-gray-900 text-white px-6 py-3 rounded-full text-sm font-light hover:bg-gray-800 transition-all duration-300 shadow-lg">
                  Voir toutes les villes
                </button>
              </div>

              {/* Grid ultra-minimaliste */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    city: "Bruxelles",
                    img: "https://images.unsplash.com/photo-1559564484-e48bf1b38c6b?auto=format&fit=crop&w=600&q=80",
                    count: 5,
                    categories: ["Gares", "Lieux touristiques"]
                  },
                  {
                    city: "Paris",
                    img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80",
                    count: 271,
                    categories: ["Arrondissements", "Aéroports"]
                  },
                  {
                    city: "Lyon",
                    img: "https://images.unsplash.com/photo-1524396309943-e03f5249f002?auto=format&fit=crop&w=600&q=80",
                    count: 32,
                    categories: ["Quartiers", "Gares"]
                  },
                  {
                    city: "Marseille",
                    img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=600&q=80",
                    count: 13,
                    categories: ["Centre-ville", "Stades"]
                  },
                ].map((city, index) => (
                  <div key={city.city} className="group cursor-pointer">
                    <div className="relative overflow-hidden rounded-2xl h-80">
                      {/* Image avec overlay */}
                      <img
                        src={city.img}
                        alt={city.city}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />

                      {/* Overlay dégradé */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>

                      {/* Contenu */}
                      <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                        <div className="space-y-3">
                          {/* Badge nombre */}
                          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20 w-fit">
                            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                            <span className="text-xs font-light">{city.count} parkings</span>
                          </div>

                          {/* Nom de la ville */}
                          <h3 className="text-3xl font-light">{city.city}</h3>

                          {/* Catégories */}
                          <div className="flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {city.categories.map((cat) => (
                              <span key={cat} className="text-xs text-white/70 font-light">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Flèche hover */}
                      <div className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                        <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* AVIS - ULTRA ORIGINAL & MINIMALISTE */}
          <section className="py-40 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white px-6 relative overflow-hidden">
            {/* Motifs décoratifs */}
            <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

            <div className="max-w-7xl mx-auto relative z-10">
              {/* Header avec stats */}
              <div className="text-center mb-20">
                <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-6 py-2 mb-8">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-light">4.8/5 • Trustpilot Excellent</span>
                </div>

                <h2 className="text-5xl md:text-6xl font-light leading-tight mb-4">
                  Des milliers d'utilisateurs<br />
                  <span className="italic text-white/80">satisfaits</span>
                </h2>

                <p className="text-lg text-white/60 font-light">Découvrez leurs témoignages</p>
              </div>

              {/* Témoignages en masonry style */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                {[
                  {
                    title: "Pratique",
                    quote: "Rapide et efficace, pas besoin de tourner pendant des heures pour trouver une place de parking.",
                    author: "Marie L.",
                    date: "17 novembre",
                  },
                  {
                    title: "Très satisfaite",
                    quote: "Parking situé à Caen proche de la gare. Facile d'accès, voiture retrouvée nickel.",
                    author: "Sophie D.",
                    date: "17 novembre",
                  },
                  {
                    title: "App bien faite",
                    quote: "Application très bien faite, pratique d'utilisation. Je recommande !",
                    author: "Thomas M.",
                    date: "17 novembre",
                  },
                ].map((avis, i) => (
                  <div key={i} className="group cursor-pointer">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                      {/* Étoiles */}
                      <div className="flex gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>

                      {/* Contenu */}
                      <h3 className="font-medium text-lg mb-3 text-white">{avis.title}</h3>
                      <p className="text-white/70 text-sm mb-6 font-light leading-relaxed">{avis.quote}</p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <span className="text-xs text-white/50 font-light">{avis.author}</span>
                        <span className="text-xs text-white/40 font-light">{avis.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="text-center">
                <button className="bg-white text-gray-900 px-10 py-4 rounded-full hover:bg-gray-100 transition-all duration-300 shadow-2xl font-light text-base inline-flex items-center gap-2 group">
                  <span>Rejoignez-nous</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </section>

          {/* APP SECTION - ULTRA MODERNE 3D IPHONE */}
          <section className="relative py-40 bg-white px-6 overflow-hidden">
            {/* Cercles décoratifs */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gray-100 rounded-full blur-3xl"></div>

            <div className="max-w-7xl mx-auto relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

                {/* iPhone 3D - GAUCHE */}
                <div className="relative flex justify-center items-center order-2 lg:order-1">
                  {/* Ombre 3D */}
                  <div className="absolute bottom-0 w-64 h-8 bg-gray-900/10 rounded-full blur-2xl"></div>

                  {/* iPhone mockup 3D */}
                  <div className="relative perspective-1000">
                    <div className="relative transform transition-transform duration-700 hover:rotate-y-12 hover:scale-105" style={{ transformStyle: 'preserve-3d' }}>
                      {/* Bordure iPhone */}
                      <div className="relative w-72 h-[600px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl border-[8px] border-gray-800">
                        {/* Encoche */}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-3xl z-20"></div>

                        {/* Écran ultra-spacieux et développé */}
                        <div className="relative w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                          {/* Status bar */}
                          <div className="absolute top-0 left-0 right-0 pt-4 px-8 flex justify-between items-center text-xs font-light text-gray-900 z-30">
                            <span>9:41</span>
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-3 border border-gray-900 rounded-sm relative">
                                <div className="absolute inset-0.5 bg-gray-900"></div>
                              </div>
                            </div>
                          </div>

                          {/* Contenu ultra-spacieux */}
                          <div className="pt-24 px-10 pb-12 h-full flex flex-col justify-between">

                            {/* Titre principal - très espacé */}
                            <div className="text-center">
                              <h2 className="text-3xl font-normal text-gray-900 mb-6 tracking-tight">
                                Recherche<br />Appartement
                              </h2>
                              <p className="text-base font-light text-gray-500 mb-4">Paris</p>
                            </div>

                            {/* Card centrale - grande et aérée */}
                            <div className="flex-1 flex flex-col justify-center py-8">
                              <div className="bg-gray-50 rounded-[2rem] p-10">

                                {/* Badge numéro */}
                                <div className="flex items-center justify-center w-16 h-16 bg-gray-900 rounded-full mb-8 mx-auto">
                                  <span className="text-white text-2xl font-medium">03</span>
                                </div>

                                {/* Titre */}
                                <h3 className="text-xl font-medium text-gray-900 mb-6 text-center leading-relaxed">
                                  Recherche Active<br />Logement
                                </h3>

                                {/* Description */}
                                <p className="text-sm text-gray-500 font-light mb-10 text-center leading-loose px-4">
                                  Exploration du marché<br />immobilier parisien
                                </p>

                                {/* Stats - espacées */}
                                <div className="space-y-5">
                                  <div className="flex items-center gap-4">
                                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                    <span className="text-sm text-gray-700 font-light">15 appartements analysés</span>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                    <span className="text-sm text-gray-700 font-light">4 visites programmées</span>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                    <span className="text-sm text-gray-700 font-light">2 dossiers locations prêts</span>
                                  </div>
                                </div>

                              </div>
                            </div>

                            {/* Bouton principal - grand */}
                            <div className="pt-4">
                              <button className="w-full bg-gray-900 text-white py-5 rounded-full text-base font-medium mb-4">
                                Voir Appartements Trouvés
                              </button>
                              <button className="w-full text-gray-500 py-4 text-sm font-light">
                                Ajuster Critères Recherche
                              </button>
                            </div>

                          </div>
                        </div>
                      </div>

                      {/* Reflet 3D */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-[3rem] pointer-events-none"></div>
                    </div>

                    {/* Badges flottants */}
                    <div className="absolute -right-6 top-20 bg-white rounded-2xl p-4 shadow-xl animate-float">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-900">4.8/5</div>
                          <div className="text-xs text-gray-500">Trustpilot</div>
                        </div>
                      </div>
                    </div>

                    <div className="absolute -left-6 bottom-32 bg-white rounded-2xl p-4 shadow-xl animate-pulse-fun">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                          <span className="text-primary font-bold">100K+</span>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-900">Places</div>
                          <div className="text-xs text-gray-500">disponibles</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenu texte - DROITE */}
                <div className="space-y-8 order-1 lg:order-2">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1.5">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-xs uppercase tracking-widest text-gray-600 font-medium">Application mobile</span>
                  </div>

                  {/* Titre */}
                  <h2 className="text-5xl md:text-6xl font-light leading-[1.1] text-gray-900">
                    Votre parking<br />
                    <span className="italic text-primary/80">dans votre poche</span>
                  </h2>

                  <p className="text-lg text-gray-600 font-light leading-relaxed max-w-xl">
                    Téléchargez l'app et gérez tous vos stationnements facilement
                  </p>

                  {/* Features list */}
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Trouvez</div>
                        <div className="text-xs text-gray-500 font-light">votre parking</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Réservez</div>
                        <div className="text-xs text-gray-500 font-light">votre place</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Payez</div>
                        <div className="text-xs text-gray-500 font-light">en un clic</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Garez-vous</div>
                        <div className="text-xs text-gray-500 font-light">l'esprit léger</div>
                      </div>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-6">
                    <a href="#" className="inline-flex items-center justify-center bg-gray-900 text-white px-6 py-3 rounded-full text-sm font-light hover:bg-gray-800 transition-all duration-300 shadow-lg group">
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                      </svg>
                      <span>App Store</span>
                    </a>

                    <a href="#" className="inline-flex items-center justify-center bg-gray-900 text-white px-6 py-3 rounded-full text-sm font-light hover:bg-gray-800 transition-all duration-300 shadow-lg">
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                      </svg>
                      <span>Google Play</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </main>
        <Footer />
      </div>
    </>
  );
}
