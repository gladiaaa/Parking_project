<?php
declare(strict_types=1);

namespace App\UseCase\Owner;

use App\Domain\Repository\ParkingRepository;
use App\Domain\Repository\StationnementRepository;

final class GetMonthlyRevenueForOwner
{
    public function __construct(
        private readonly ParkingRepository $parkings,
        private readonly StationnementRepository $stationnements
    ) {}

    /** @return array<string,mixed> */
    public function execute(int $ownerId, int $parkingId, string $month): array
    {
        // month format: YYYY-MM
        if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
            throw new \RuntimeException('Invalid month format. Expected YYYY-MM');
        }

        $ownerOfParking = $this->parkings->findOwnerIdByParkingId($parkingId);
        if ($ownerOfParking === null) {
            throw new \RuntimeException('Parking not found');
        }
        if ($ownerOfParking !== $ownerId) {
            throw new \RuntimeException('Accès refusé');
        }

        $from = new \DateTimeImmutable($month . '-01 00:00:00');
        $to = $from->modify('+1 month');

        $totals = $this->stationnements->revenueForParking(
            $from->format('Y-m-d H:i:s'),
            $to->format('Y-m-d H:i:s'),
            $parkingId
        );

        return [
            'parking_id' => $parkingId,
            'month' => $month,
            'from' => $from->format(\DATE_ATOM),
            'to' => $to->format(\DATE_ATOM),
            ...$totals,
        ];
    }
}
