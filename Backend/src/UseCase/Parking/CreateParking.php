<?php
declare(strict_types=1);

namespace App\UseCase\Parking;

use App\Domain\Repository\ParkingRepository;

final class CreateParking
{
    public function __construct(private readonly ParkingRepository $parkingRepo) {}

    /**
     * @return array{parking_id:int}
     */
    public function execute(int $ownerId, array $data): array
    {
        $latitude    = $data['latitude'] ?? null;
        $longitude   = $data['longitude'] ?? null;
        $capacity    = (int)($data['capacity'] ?? 0);
        $hourlyRate  = $data['hourly_rate'] ?? null;

        $openingTime = (string)($data['opening_time'] ?? '');
        $closingTime = (string)($data['closing_time'] ?? '');

        $address = (string)($data['address'] ?? '');


        $openingDays = $data['opening_days'] ?? [1,2,3,4,5,6,7];
        if (is_string($openingDays)) {

            $openingDays = array_filter(array_map('trim', explode(',', $openingDays)), fn($v) => $v !== '');
        }
        if (!is_array($openingDays) || $openingDays === []) {
            $openingDays = [1,2,3,4,5,6,7];
        }
        $openingDays = array_values(array_unique(array_map('intval', $openingDays)));
        $openingDays = array_values(array_filter($openingDays, fn($d) => $d >= 1 && $d <= 7));
        if ($openingDays === []) {
            $openingDays = [1,2,3,4,5,6,7];
        }

        if ($ownerId <= 0) {
            throw new \RuntimeException('Invalid owner');
        }

        if (!is_numeric($latitude) || !is_numeric($longitude)) {
            throw new \RuntimeException('Missing fields');
        }

        if ($capacity <= 0 || !is_numeric($hourlyRate)) {
            throw new \RuntimeException('Missing fields');
        }


        $openingTime = $this->normalizeTime($openingTime);
        $closingTime = $this->normalizeTime($closingTime);

        if ($openingTime === null || $closingTime === null) {
            throw new \RuntimeException('Invalid opening/closing time format');
        }


        if ($openingTime === $closingTime) {
            throw new \RuntimeException('Opening time and closing time cannot be the same');
        }


        $address = trim($address);

        $id = $this->parkingRepo->create([
            'owner_id'      => $ownerId,
            'latitude'      => (float)$latitude,
            'longitude'     => (float)$longitude,
            'capacity'      => $capacity,
            'hourly_rate'   => (float)$hourlyRate,
            'opening_time'  => $openingTime,
            'closing_time'  => $closingTime,
            'address'       => $address,
            'opening_days'  => $openingDays,
        ]);

        return ['parking_id' => $id];
    }

    private function normalizeTime(string $value): ?string
    {
        $value = trim($value);
        if ($value === '') {
            return null;
        }

        // accepte HH:MM
        if (preg_match('/^\d{2}:\d{2}$/', $value) === 1) {
            $value .= ':00';
        }

        // valide HH:MM:SS
        if (preg_match('/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/', $value) !== 1) {
            return null;
        }

        return $value;
    }
}
