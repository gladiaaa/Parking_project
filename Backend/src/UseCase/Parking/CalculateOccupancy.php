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

    /** Nombre de voitures actuellement dans le parking (temps réel). */
    public function now(int $parkingId): int
    {
        $stationnements = $this->stationnements->countActiveByParkingId($parkingId);

        // "maintenant" au format attendu par le repo
        $at = (new \DateTimeImmutable('now'))->format('Y-m-d H:i:s');
        $subs = $this->subscriptions->countActiveNow($parkingId, $at);

        return $stationnements + $subs;
    }

    /**
     * Occupation sur un créneau:
     * - stationnements qui chevauchent le créneau
     * - + réservations qui chevauchent le créneau, en excluant celles déjà entrées
     * - + abonnements actifs sur ce créneau
     */
    public function forSlot(int $parkingId, string $startAt, string $endAt): int
    {
        $stationnements = $this->stationnements->countOverlappingForSlot($parkingId, $startAt, $endAt);
        $reservations   = $this->reservations->countOverlappingNotEntered($parkingId, $startAt, $endAt);
        $subs           = $this->subscriptions->countActiveForSlot($parkingId, $startAt, $endAt);

        return $stationnements + $reservations + $subs;
    }

    public function totalForAvailability(int $parkingId, string $startAt, string $endAt): int
    {
        // IMPORTANT: ne pas faire now()+forSlot(), sinon tu doubles.
        return $this->forSlot($parkingId, $startAt, $endAt);
    }
}
