<?php
declare(strict_types=1);

namespace App\Infrastructure\Persistence\Json;

use App\Domain\Entity\Reservation;
use App\Domain\Repository\ReservationRepository;

final class JsonReservationRepository implements ReservationRepository
{
    public function __construct(
        private readonly string $reservationsPath,
        private readonly ?string $stationnementsPath = null
    ) {}

    /** @return array<int, array<string,mixed>> */
    private function readRows(): array
    {
        if (!is_file($this->reservationsPath)) return [];

        $raw = file_get_contents($this->reservationsPath);
        $data = json_decode($raw ?: '[]', true);

        return is_array($data) ? $data : [];
    }

    /** @param array<int, array<string,mixed>> $rows */
/** @param array<int, array<string,mixed>> $rows */
private function writeRows(array $rows): void
{
    $dir = dirname($this->reservationsPath);
    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }

    $json = json_encode(array_values($rows), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

    error_log("[JSON] reservationsPath=" . $this->reservationsPath);
    error_log("[JSON] reservationsDir=" . $dir);
    error_log("[JSON] dirExists=" . (is_dir($dir) ? "yes" : "no"));
    error_log("[JSON] dirWritable=" . (is_writable($dir) ? "yes" : "no"));

    $bytes = file_put_contents($this->reservationsPath, $json, LOCK_EX);
    error_log("[JSON] bytesWritten=" . var_export($bytes, true));

    if ($bytes === false) {
        $err = error_get_last();
        error_log("[JSON] write error=" . var_export($err, true));
    }
}


    /** @param array<string,mixed> $row */
    private function hydrate(array $row): Reservation
    {
        return new Reservation(
            isset($row['id']) ? (int)$row['id'] : null,
            (int)$row['user_id'],
            (int)$row['parking_id'],
            new \DateTimeImmutable((string)$row['start_at']),
            new \DateTimeImmutable((string)$row['end_at']),
            new \DateTimeImmutable((string)$row['created_at']),
            (string)$row['vehicle_type'],
            (float)$row['amount']
        );
    }

    /** @return Reservation[] */
    private function hydrateAll(array $rows): array
    {
        return array_map(fn(array $r) => $this->hydrate($r), $rows);
    }

    /** @return array<string,mixed> */
    private function toRow(Reservation $r): array
    {
        return [
            'id' => $r->id(),
            'user_id' => $r->userId(),
            'parking_id' => $r->parkingId(),
            'start_at' => $r->startAt()->format('Y-m-d H:i:s'),
            'end_at' => $r->endAt()->format('Y-m-d H:i:s'),
            'vehicle_type' => $r->vehicleType(),
            'amount' => $r->amount(),
            'created_at' => $r->createdAt()->format('Y-m-d H:i:s'),
        ];
    }

    private function nextId(array $rows): int
    {
        $max = 0;
        foreach ($rows as $r) {
            $max = max($max, (int)($r['id'] ?? 0));
        }
        return $max + 1;
    }

    // -------------------------
    // Interface ReservationRepository
    // -------------------------

    public function findById(int $id): ?Reservation
    {
        foreach ($this->readRows() as $row) {
            if ((int)($row['id'] ?? 0) === $id) {
                return $this->hydrate($row);
            }
        }
        return null;
    }

    public function save(Reservation $reservation): Reservation
    {
        $rows = $this->readRows();

        if ($reservation->id() === null) {
            $id = $this->nextId($rows);
            $saved = $reservation->withId($id);

            $rows[] = $this->toRow($saved);
            $this->writeRows($rows);

            return $saved;
        }

        // Update si jamais tu l’utilises plus tard
        $updated = false;
        foreach ($rows as $i => $row) {
            if ((int)($row['id'] ?? 0) === (int)$reservation->id()) {
                $rows[$i] = $this->toRow($reservation);
                $updated = true;
                break;
            }
        }

        if ($updated) {
            $this->writeRows($rows);
        }

        return $reservation;
    }

    public function findByUserId(int $userId): array
    {
        $rows = array_filter(
            $this->readRows(),
            fn(array $r) => (int)$r['user_id'] === $userId
        );

        // ORDER BY start_at DESC
        usort($rows, fn($a, $b) => strcmp((string)$b['start_at'], (string)$a['start_at']));

        return $this->hydrateAll($rows);
    }

    public function findByParkingId(int $parkingId): array
    {
        $rows = array_filter(
            $this->readRows(),
            fn(array $r) => (int)$r['parking_id'] === $parkingId
        );

        // ORDER BY start_at DESC
        usort($rows, fn($a, $b) => strcmp((string)$b['start_at'], (string)$a['start_at']));

        return $this->hydrateAll($rows);
    }

    public function countOverlappingForParking(
        int $parkingId,
        \DateTimeImmutable $startAt,
        \DateTimeImmutable $endAt
    ): int {
        $start = $startAt->format('Y-m-d H:i:s');
        $end   = $endAt->format('Y-m-d H:i:s');

        $count = 0;
        foreach ($this->readRows() as $r) {
            if ((int)$r['parking_id'] !== $parkingId) continue;

            // start_at < end_at AND end_at > start_at
            if ((string)$r['start_at'] < $end && (string)$r['end_at'] > $start) {
                $count++;
            }
        }

        return $count;
    }

    public function listByParking(int $parkingId, ?string $from, ?string $to): array
    {
        $rows = array_filter(
            $this->readRows(),
            fn(array $r) => (int)$r['parking_id'] === $parkingId
        );

        if ($from) {
            // end_at >= from
            $rows = array_filter($rows, fn(array $r) => (string)$r['end_at'] >= $from);
        }
        if ($to) {
            // start_at <= to
            $rows = array_filter($rows, fn(array $r) => (string)$r['start_at'] <= $to);
        }

        // ORDER BY start_at ASC
        usort($rows, fn($a, $b) => strcmp((string)$a['start_at'], (string)$b['start_at']));

        return array_map(
            fn(array $r) => [
                'id' => (int)$r['id'],
                'user_id' => (int)$r['user_id'],
                'parking_id' => (int)$r['parking_id'],
                'start_at' => (string)$r['start_at'],
                'end_at' => (string)$r['end_at'],
                'vehicle_type' => (string)$r['vehicle_type'],
                'amount' => (float)$r['amount'],
                'created_at' => (string)$r['created_at'],
            ],
            $rows
        );
    }

    public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int
    {
        // Si stationnementsPath n'est pas fourni, on ne peut pas exclure les "déjà entrés"
        // => on retombe sur overlap simple (au moins ça reste cohérent et ça ne crashe pas).
        $activeReservationIds = [];

        if ($this->stationnementsPath && is_file($this->stationnementsPath)) {
            $raw = file_get_contents($this->stationnementsPath);
            $st = json_decode($raw ?: '[]', true);

            if (is_array($st)) {
                foreach ($st as $s) {
                    if (($s['exited_at'] ?? null) === null) {
                        $rid = (int)($s['reservation_id'] ?? 0);
                        if ($rid > 0) $activeReservationIds[$rid] = true;
                    }
                }
            }
        }

        $rows = array_filter(
            $this->readRows(),
            fn(array $r) => (int)$r['parking_id'] === $parkingId
        );

        $count = 0;
        foreach ($rows as $r) {
            $rid = (int)($r['id'] ?? 0);

            if ($rid > 0 && isset($activeReservationIds[$rid])) {
                continue;
            }

            $rs = (string)$r['start_at'];
            $re = (string)$r['end_at'];

            // NOT (end_at <= start OR start_at >= end)
            $overlap = !($re <= $startAt || $rs >= $endAt);
            if ($overlap) $count++;
        }

        return $count;
    }
}
