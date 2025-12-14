<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Domain\Repository\ParkingReservationRepository;
use App\Domain\Entity\parking;
use Exception;

/**
 * La classe ReservationManagement regroupe les Cas d'Utilisation (Use Cases) liés à la réservation.
 * Elle sert de point d'entrée pour la logique d'application depuis le Contrôleur.
 */
class ReservationManagement
{

    public function __construct(
        private ParkingReservationRepository $parkingRepository
    ) {
    }

    /**
     * Cas d'utilisation: Réserver une place de parking.
     * C'est ici que la logique métier réside (vérification des règles).
     * @param int $placeId L'identifiant de la place à réserver.
     * @param int $userId L'identifiant de l'utilisateur.
     * @throws Exception Si la place est déjà serve.
     */
    public function reserverPlace(int $placeId, int $userId): void
    {

    }

}