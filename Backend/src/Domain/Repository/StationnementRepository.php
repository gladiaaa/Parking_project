<?php
declare(strict_types=1);

namespace App\Domain\Repository;

use App\Domain\Entity\Stationnement;

interface StationnementRepository
{
    public function save(Stationnement $s): Stationnement;

    public function findActiveByReservationId(int $reservationId): ?Stationnement;

    public function close(
        int $stationnementId,
        \DateTimeImmutable $exitedAt,
        float $billedAmount,
        float $penaltyAmount
    ): void;

    public function findLastByReservationId(int $reservationId): ?Stationnement;
    /** @return array<int, array<string,mixed>> */
    public function listActiveByParkingId(int $parkingId): array;
    public function countActiveByParkingId(int $parkingId): int;

/** @return array{count_exits:int, total_billed:float, total_penalty:float, total:float} */
public function revenueForParking(string $from, string $to, int $parkingId): array;

}
