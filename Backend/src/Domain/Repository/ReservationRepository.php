<?php

namespace App\Domain\Repository;

use App\Domain\Entity\Reservation;

interface ReservationRepository
{
    public function save(Reservation $reservation): Reservation;

    /** @return Reservation[] */
    public function findByUserId(int $userId): array;

    /** @return Reservation[] */
    public function findByParkingId(int $parkingId): array;

    public function countOverlappingForParking(
        int $parkingId,
        \DateTimeImmutable $startAt,
        \DateTimeImmutable $endAt
    ): int;
}
