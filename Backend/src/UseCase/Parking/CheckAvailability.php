<?php
declare(strict_types=1);

namespace App\UseCase\Parking;

use App\Domain\Repository\ParkingRepository;
use App\Domain\Repository\ReservationRepository;

final class CheckAvailability
{
    public function __construct(
        private readonly ParkingRepository $parkingRepo,
        private readonly ReservationRepository $reservationRepo
    ) {}

    public function execute(array $data): array
    {
        $parkingId = (int)($data['parking_id'] ?? 0);
        $startAt = (string)($data['start_at'] ?? '');
        $endAt = (string)($data['end_at'] ?? '');

        if ($parkingId <= 0 || $startAt === '' || $endAt === '') {
            throw new \RuntimeException('Missing fields');
        }

        $start = new \DateTimeImmutable($startAt);
        $end = new \DateTimeImmutable($endAt);

        $parking = $this->parkingRepo->findById($parkingId);
        if ($parking === null) {
            throw new \RuntimeException('Parking not found');
        }

        $capacity = $parking->capacity();
        $overlapping = $this->reservationRepo->countOverlappingForParking($parkingId, $start, $end);
        $remaining = max(0, $capacity - $overlapping);

        return [
            'parking_id' => $parkingId,
            'capacity' => $capacity,
            'overlapping' => $overlapping,
            'remaining' => $remaining,
            'available' => $remaining > 0,
            'start_at' => $start->format(DATE_ATOM),
            'end_at' => $end->format(DATE_ATOM),
        ];
    }
}
