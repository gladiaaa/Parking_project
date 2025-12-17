<?php
declare(strict_types=1);

namespace App\UseCase\Parking;

use App\Domain\Repository\ParkingRepository;

final class CheckAvailability
{
    public function __construct(
        private readonly ParkingRepository $parkingRepo,
        private readonly CalculateOccupancy $occupancy
    ) {}

    public function execute(array $data): array
    {
        $parkingId = (int)($data['parking_id'] ?? 0);
        $startAt   = (string)($data['start_at'] ?? '');
        $endAt     = (string)($data['end_at'] ?? '');

        if ($parkingId <= 0 || $startAt === '' || $endAt === '') {
            throw new \RuntimeException('Missing fields');
        }

        $parking = $this->parkingRepo->findById($parkingId);
        if ($parking === null) {
            throw new \RuntimeException('Parking not found');
        }

        $capacity = $parking->capacity();

        // Occupation sur le créneau = présents + réservés (pas encore entrés)
        $occupied = $this->occupancy->totalForAvailability($parkingId, $startAt, $endAt);

        $remaining = max(0, $capacity - $occupied);

        return [
            'parking_id' => $parkingId,
            'capacity'   => $capacity,
            'occupied'   => $occupied,
            'remaining'  => $remaining,
            'available'  => $remaining > 0,
            'start_at'   => (new \DateTimeImmutable($startAt))->format(DATE_ATOM),
            'end_at'     => (new \DateTimeImmutable($endAt))->format(DATE_ATOM),
        ];
    }
}
