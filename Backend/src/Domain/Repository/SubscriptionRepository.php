<?php
declare(strict_types=1);

namespace App\Domain\Repository;

use App\Domain\Entity\Subscription;

interface SubscriptionRepository
{
    public function save(Subscription $subscription): Subscription;

    /** @return Subscription[] */
    public function listByUserId(int $userId): array;

    /** @return Subscription[] */
    public function listByParkingId(int $parkingId): array;

    public function countActiveNow(int $parkingId, string $at): int;
    public function countActiveForSlot(int $parkingId, string $startAt, string $endAt): int;

    public function existsOverlappingForUserParking(
        int $userId,
        int $parkingId,
        string $startDate, // 'Y-m-d'
        string $endDate    // 'Y-m-d'
    ): bool;
    public function coversUserForSlot(
    int $userId,
    int $parkingId,
    string $startAt, // 'Y-m-d H:i:s'
    string $endAt    // 'Y-m-d H:i:s'
): bool;

}
