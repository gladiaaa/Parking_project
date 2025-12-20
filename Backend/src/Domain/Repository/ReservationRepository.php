<?php
declare(strict_types=1);

namespace App\Domain\Repository;

use App\Domain\Entity\Reservation;

interface ReservationRepository
{
    public function save(Reservation $reservation): Reservation;
    public function findById(int $id): ?Reservation;

    /** @return Reservation[] */
    public function findByUserId(int $userId): array;

    /** @return Reservation[] */
    public function findByParkingId(int $parkingId): array;

    /** @return array<int, array<string, mixed>> */
    public function listByParking(int $parkingId, ?string $from, ?string $to): array;

    public function countOverlappingForParking(int $parkingId, \DateTimeImmutable $startAt, \DateTimeImmutable $endAt): int;

    public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int;

    public function existsOverlappingForUser(int $userId, string $startAt, string $endAt): bool;

    public function cancelForUser(int $userId, int $reservationId, string $now): bool;


    /** @return array<int, array<string, mixed>> */
    public function listForUser(int $userId): array;
}
