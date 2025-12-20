<?php

namespace App\Domain\Repository;

use App\Domain\Entity\Parking;

interface ParkingRepository
{
    public function create(array $data): int;

    public function findById(int $id): ?Parking;

    /** @return array<int, array<string,mixed>> */
    public function listByOwnerId(int $ownerId): array;

    public function findOwnerIdByParkingId(int $parkingId): ?int;

    /** @return array<int, array<string, mixed>> */
    public function searchNearby(float $lat, float $lng, float $radiusKm): array;

    /** @return array<int, array<string, mixed>> */
    public function listAll(): array;
}
