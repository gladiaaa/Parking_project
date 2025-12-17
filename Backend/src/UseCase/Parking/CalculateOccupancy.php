<?php
declare(strict_types=1);

namespace App\UseCase\Parking;

use App\Domain\Repository\ReservationRepository;
use App\Domain\Repository\StationnementRepository;
use App\Domain\Repository\SubscriptionRepository;

final class CalculateOccupancy
{
    public function __construct(
        private readonly StationnementRepository $stationnements,
        private readonly ReservationRepository $reservations,
        private readonly SubscriptionRepository $subscriptions
    ) {}

    /** Nombre de voitures actuellement dans le parking (temps réel) + abonnements actifs NOW. */
    public function now(int $parkingId): int
    {
        $at = (new \DateTimeImmutable('now'))->format('Y-m-d H:i:s');

        return $this->stationnements->countActiveByParkingId($parkingId)
            + $this->subscriptions->countActiveNow($parkingId, $at);
    }

    /**
     * Occupation sur un créneau.
     * Stratégie:
     * - réservations qui chevauchent le créneau, en excluant celles déjà entrées
     * - + abonnements actifs sur le créneau (occupent une place même sans entrée)
     */
    public function forSlot(int $parkingId, string $startAt, string $endAt): int
    {
        return $this->reservations->countOverlappingNotEntered($parkingId, $startAt, $endAt)
            + $this->subscriptions->countActiveForSlot($parkingId, $startAt, $endAt);
    }

    public function totalForAvailability(int $parkingId, string $startAt, string $endAt): int
    {
        return $this->now($parkingId) + $this->forSlot($parkingId, $startAt, $endAt);
    }
}
