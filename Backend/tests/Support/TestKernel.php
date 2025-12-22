<?php
declare(strict_types=1);

namespace Tests\Support;

use App\Infrastructure\Http\Router;

/**
 * Charge le Router de l'application pour les tests fonctionnels.
 *
 * IMPORTANT:
 * - Remplace ROUTER_FACTORY_FILE par le fichier de ton projet qui:
 *   (1) instancie Router
 *   (2) enregistre toutes les routes
 *   (3) retourne $router (ou le met dans une variable accessible)
 */
final class TestKernel
{
    /**
     * Mets ici le fichier réel de ton backend qui construit les routes.
     * Exemples fréquents:
     * - Backend/public/index.php (si tu refacto un peu)
     * - Backend/bootstrap/app.php
     * - Backend/config/routes.php
     */
    private const ROUTER_FACTORY_FILE = __DIR__ . '/../../src/bootstrap.php';

    public static function boot(): Router
    {
        if (!file_exists(self::ROUTER_FACTORY_FILE)) {
            throw new \RuntimeException(
                "ROUTER_FACTORY_FILE introuvable: " . self::ROUTER_FACTORY_FILE .
                "\n➡️ Remplace TestKernel::ROUTER_FACTORY_FILE par le bon fichier de ton projet."
            );
        }

        /** @var Router $router */
        $router = require self::ROUTER_FACTORY_FILE;

        if (!$router instanceof Router) {
            throw new \RuntimeException(
                "Le fichier router factory doit retourner une instance de " . Router::class
            );
        }

        return $router;
    }
}
