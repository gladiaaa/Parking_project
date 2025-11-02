import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SearchBar from "../components/SearchBar";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* SECTION HERO */}
        <section className="bg-[#34A853] text-white py-20 px-6 md:px-20 flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Respirez, vous êtes garés.
            </h1>
            <p className="text-lg text-gray-100">
              Réservez votre parking à l'heure, au jour ou au mois et garez-vous
              l'esprit léger.
            </p>

            {/* Barre de recherche */}
            <div className="mt-8">
              <SearchBar />
            </div>

            {/* CTA */}
            <div className="mt-6 flex gap-4">
              <Link
                to="/login"
                className="bg-white text-[#34A853] px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition"
              >
                Se connecter
              </Link>
              <Link
                to="/register"
                className="bg-gray-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-900 transition"
              >
                S'inscrire
              </Link>
            </div>
          </div>

          {/* IMAGE HERO */}
          <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center">
            <img
              src="https://images.unsplash.com/photo-1573497019390-87b63b454ccb?auto=format&fit=crop&w=500&q=80"
              alt="Femme au volant"
              className="rounded-2xl shadow-lg w-80 md:w-96"
            />
          </div>
        </section>

        {/* SECTION COMMENT ÇA MARCHE */}
        <section className="py-20 text-center bg-white">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">
            Comment ça marche ?
          </h2>
          <p className="text-gray-600 mb-12">
            En cas de pépin, notre équipe vous accompagne pas à pas.
          </p>

        <div className="flex flex-col md:flex-row justify-center items-center gap-12">
          <div className="max-w-xs">
            <img
              src="https://cdn-icons-png.flaticon.com/512/684/684908.png"
              alt=""
              className="w-16 mx-auto mb-4"
            />
            <h3 className="font-semibold">Trouvez votre parking</h3>
            <p className="text-gray-500">
              Parmi plus de 100 000 places disponibles dans votre ville.
            </p>
          </div>
          <div className="max-w-xs">
            <img
              src="https://cdn-icons-png.flaticon.com/512/1170/1170678.png"
              alt=""
              className="w-16 mx-auto mb-4"
            />
            <h3 className="font-semibold">Réservez votre place</h3>
            <p className="text-gray-500">
              Pour une heure, une journée ou un mois.
            </p>
          </div>
          <div className="max-w-xs">
            <img
              src="https://cdn-icons-png.flaticon.com/512/744/744465.png"
              alt=""
              className="w-16 mx-auto mb-4"
            />
            <h3 className="font-semibold">Et enfin, garez-vous</h3>
            <p className="text-gray-500">
              Avec votre smartphone comme télécommande.
            </p>
          </div>
        </div>

          <Link
            to="/register"
            className="inline-block mt-12 bg-[#34A853] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#2d8f45] transition"
          >
            Garez-vous en toute sérénité
          </Link>
        </section>

        {/* SECTION VILLES */}
        <section className="py-20 bg-gray-50 text-center">
          <h2 className="text-3xl font-bold mb-12 text-gray-800">
            Il ne vous manque plus qu'un parking pour arriver à destination.
          </h2>

        <div className="flex flex-wrap justify-center gap-8">
          {[
            {
              city: "Paris",
              img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80",
              count: 271,
            },
            {
              city: "Lyon",
              img: "https://images.unsplash.com/photo-1565808229711-7b1c7c8bdfd2?auto=format&fit=crop&w=600&q=80",
              count: 32,
            },
            {
              city: "Marseille",
              img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=600&q=80",
              count: 13,
            },
          ].map((v) => (
            <div
              key={v.city}
              className="bg-white rounded-2xl shadow-md w-72 overflow-hidden hover:shadow-xl transition"
            >
              <img src={v.img} alt={v.city} className="h-44 w-full object-cover" />
              <div className="p-5">
                <h3 className="font-semibold text-xl">{v.city}</h3>
                <p className="text-gray-500">{v.count} parkings disponibles</p>
              </div>
            </div>
          ))}
        </div>
      </section>

        {/* SECTION AVIS */}
        <section className="py-20 bg-[#34A853] text-white text-center">
          <h2 className="text-3xl font-bold mb-12">
            500 000 automobilistes nous font confiance chaque année.
          </h2>

        <div className="flex flex-col md:flex-row justify-center gap-8 px-6 md:px-20">
          {[
            "Très pratique",
            "Parking bien situé et sécurisé",
            "Une solution fiable et simple",
          ].map((avis, i) => (
            <div
              key={i}
              className="bg-white text-gray-800 p-6 rounded-2xl shadow-lg max-w-sm"
            >
              <p className="italic mb-3">“{avis}”</p>
              <p className="text-sm text-gray-500">01 novembre</p>
            </div>
          ))}
        </div>

          <Link
            to="/register"
            className="inline-block mt-12 bg-white text-[#34A853] px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition"
          >
            Vous aussi trouvez votre place
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
