<?php
declare(strict_types=1);

namespace App\UseCase\Parking;

use App\Domain\Repository\ReservationRepository;
use App\Domain\Repository\StationnementRepository;

/**
 * Calcule l'occupation d'un parking.
 *
 * - NOW: voitures actuellement présentes (stationnements actifs exited_at IS NULL)
 * - SLOT: occupation sur un créneau (réservations qui chevauchent le créneau),
 *         en excluant celles déjà entrées si tu veux éviter le double comptage.
 */
final class CalculateOccupancy
{
    public function __construct(
        private readonly StationnementRepository $stationnements,
        private readonly ReservationRepository $reservations
    ) {}

    /** Nombre de voitures actuellement dans le parking (temps réel). */
    public function now(int $parkingId): int
    {
        return $this->stationnements->countActiveByParkingId($parkingId);
    }

    /**
     * Occupation sur un créneau.
     * Stratégie: réservations qui chevauchent le créneau
     * - en excluant celles déjà entrées (sinon tu doubles: réservation + stationnement).
     */
    public function forSlot(int $parkingId, string $startAt, string $endAt): int
    {
        // réservations du créneau MAIS pas encore "entrées" (donc pas de stationnement actif)
        return $this->reservations->countOverlappingNotEntered($parkingId, $startAt, $endAt);
    }


    public function totalForAvailability(int $parkingId, string $startAt, string $endAt): int
    {
        return $this->now($parkingId) + $this->forSlot($parkingId, $startAt, $endAt);
    }
}
