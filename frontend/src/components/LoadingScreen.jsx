import React, { useEffect, useState } from 'react';

export default function LoadingScreen({ onLoadingComplete }) {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Animation de la barre de progression
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsComplete(true);
          setTimeout(() => {
            onLoadingComplete();
          }, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [onLoadingComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-white flex items-center justify-center transition-opacity duration-500 ${
        isComplete ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="max-w-md w-full px-8">
        {/* Logo / Icône */}
        <div className="flex justify-center mb-12">
          <div className="relative">
            <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-white text-3xl font-bold">P</span>
            </div>
            {/* Cercle animé autour */}
            <div className="absolute inset-0 border-4 border-gray-900 rounded-full animate-spin" style={{ borderTopColor: 'transparent', borderRightColor: 'transparent' }}></div>
          </div>
        </div>

        {/* Titre */}
        <h2 className="text-3xl font-light text-gray-900 text-center mb-3 tracking-tight">
          ParkingPartagé
        </h2>
        <p className="text-sm text-gray-500 font-light text-center mb-12">
          Chargement en cours...
        </p>

        {/* Barre de progression minimaliste */}
        <div className="relative">
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          {/* Pourcentage */}
          <div className="text-xs text-gray-400 font-light text-center mt-4">
            {progress}%
          </div>
        </div>

        {/* Dots animés */}
        <div className="flex justify-center gap-2 mt-12">
          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}


