<?php
declare(strict_types=1);

namespace App\Domain\Repository;


use App\Domain\Entity\Parking; // Parking equivaut à réservation c'est juste mal nommé
use DateTimeImmutable;

/**
 * Interface définissant les contrats pour l'accès aux données des Réservations.
 */
interface ParkingReservationRepository
{

    public function save(parking $reservation): void;

    public function getById(int $reservationId): ?parking;
    public function delete(parking $reservation): void;

    public function isPlaceReserved(int $placeId, DateTimeImmutable $heureDebut, DateTimeImmutable $heureFin): bool;
}