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

        $start = new \DateTimeImmutable($startAt);
        $end   = new \DateTimeImmutable($endAt);
        if ($end <= $start) {
            throw new \RuntimeException('Invalid time range');
        }

        if (!$parking->isOpenForSlot($start, $end)) {
            return [
                'parking_id' => $parkingId,
                'capacity'   => $parking->capacity(),
                'occupied'   => null,
                'remaining'  => 0,
                'available'  => false,
                'reason'     => 'PARKING_CLOSED',
                'start_at'   => $start->format(DATE_ATOM),
                'end_at'     => $end->format(DATE_ATOM),
            ];
        }

        $capacity = $parking->capacity();
        
$occupied = $this->occupancy->forSlot(
  $parkingId,
  $start->format('Y-m-d H:i:s'),
  $end->format('Y-m-d H:i:s')
);


        $remaining = max(0, $capacity - $occupied);

        return [
            'parking_id' => $parkingId,
            'capacity'   => $capacity,
            'occupied'   => $occupied,
            'remaining'  => $remaining,
            'available'  => $remaining > 0,
            'start_at'   => $start->format(DATE_ATOM),
            'end_at'     => $end->format(DATE_ATOM),
        ];
    }
}
