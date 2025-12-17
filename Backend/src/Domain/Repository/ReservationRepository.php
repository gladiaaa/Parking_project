<?php

namespace App\Domain\Repository;

use App\Domain\Entity\Reservation;

interface ReservationRepository
{
    public function findById(int $id): ?Reservation;

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
    /** @return array<int, array<string,mixed>> */
    public function listByParking(int $parkingId, ?string $from, ?string $to): array;

    public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int;
    public function existsOverlappingForUser(int $userId, string $startAt, string $endAt): bool;

}
