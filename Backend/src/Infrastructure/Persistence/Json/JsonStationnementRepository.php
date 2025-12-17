<?php
declare(strict_types=1);

namespace App\Infrastructure\Persistence\Json;

use App\Domain\Entity\Stationnement;
use App\Domain\Repository\ReservationRepository;
use App\Domain\Repository\StationnementRepository;

final class JsonStationnementRepository implements StationnementRepository
{
    public function __construct(
        private readonly string $path,
        private readonly ReservationRepository $reservationRepo
    ) {}

    /** @return array<int, array<string,mixed>> */
    private function readRows(): array
    {
        if (!is_file($this->path)) return [];

        $raw = file_get_contents($this->path);
        $data = json_decode($raw ?: '[]', true);

        return is_array($data) ? $data : [];
    }

    /** @param array<int, array<string,mixed>> $rows */
    private function writeRows(array $rows): void
    {
        $dir = dirname($this->path);
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }

        file_put_contents(
            $this->path,
            json_encode(array_values($rows), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            LOCK_EX
        );
    }

    private function nextId(array $rows): int
    {
        $max = 0;
        foreach ($rows as $r) {
            $max = max($max, (int)($r['id'] ?? 0));
        }
        return $max + 1;
    }

    /** @param array<string,mixed> $row */
    private function hydrate(array $row): Stationnement
    {
        return new Stationnement(
            isset($row['id']) ? (int)$row['id'] : null,
            (int)$row['reservation_id'],
            new \DateTimeImmutable((string)$row['entered_at']),
            ($row['exited_at'] ?? null) ? new \DateTimeImmutable((string)$row['exited_at']) : null,
            array_key_exists('billed_amount', $row) ? ($row['billed_amount'] !== null ? (float)$row['billed_amount'] : null) : null,
            array_key_exists('penalty_amount', $row) ? ($row['penalty_amount'] !== null ? (float)$row['penalty_amount'] : null) : null,
            new \DateTimeImmutable((string)$row['created_at'])
        );
    }

    /** @return array<string,mixed> */
    private function toRow(Stationnement $s): array
    {
        return [
            'id' => $s->id(),
            'reservation_id' => $s->reservationId(),
            'entered_at' => $s->enteredAt()->format('Y-m-d H:i:s'),
            'exited_at' => $s->exitedAt()?->format('Y-m-d H:i:s'),
            'billed_amount' => $s->billedAmount(),
            'penalty_amount' => $s->penaltyAmount(),
            'created_at' => $s->createdAt()->format('Y-m-d H:i:s'),
        ];
    }

    private function parkingIdFromReservationId(int $reservationId): ?int
    {
        $res = $this->reservationRepo->findById($reservationId);
        return $res ? $res->parkingId() : null;
    }

    public function save(Stationnement $s): Stationnement
    {
        $rows = $this->readRows();

        if ($s->id() === null) {
            $id = $this->nextId($rows);
            $saved = $s->withId($id);

            $rows[] = $this->toRow($saved);
            $this->writeRows($rows);

            return $saved;
        }

        // Pas d'update en SQL dans save(), mais on peut le supporter sans casser
        foreach ($rows as $i => $row) {
            if ((int)($row['id'] ?? 0) === (int)$s->id()) {
                $rows[$i] = $this->toRow($s);
                $this->writeRows($rows);
                break;
            }
        }

        return $s;
    }

    public function findActiveByReservationId(int $reservationId): ?Stationnement
    {
        $rows = array_values(array_filter(
            $this->readRows(),
            fn(array $r) => (int)$r['reservation_id'] === $reservationId && ($r['exited_at'] ?? null) === null
        ));

        if (!$rows) return null;

        // SQL: ORDER BY entered_at DESC LIMIT 1
        usort($rows, fn($a, $b) => strcmp((string)$b['entered_at'], (string)$a['entered_at']));
        return $this->hydrate($rows[0]);
    }

    public function close(
        int $stationnementId,
        \DateTimeImmutable $exitedAt,
        float $billedAmount,
        float $penaltyAmount
    ): void {
        $rows = $this->readRows();

        foreach ($rows as $i => $row) {
            if ((int)($row['id'] ?? 0) === $stationnementId) {
                $rows[$i]['exited_at'] = $exitedAt->format('Y-m-d H:i:s');
                $rows[$i]['billed_amount'] = $billedAmount;
                $rows[$i]['penalty_amount'] = $penaltyAmount;
                $this->writeRows($rows);
                return;
            }
        }
    }

    public function findLastByReservationId(int $reservationId): ?Stationnement
    {
        $rows = array_values(array_filter(
            $this->readRows(),
            fn(array $r) => (int)$r['reservation_id'] === $reservationId
        ));

        if (!$rows) return null;

        // SQL: ORDER BY entered_at DESC LIMIT 1
        usort($rows, fn($a, $b) => strcmp((string)$b['entered_at'], (string)$a['entered_at']));
        return $this->hydrate($rows[0]);
    }

    public function listActiveByParkingId(int $parkingId): array
    {
        $active = [];

        foreach ($this->readRows() as $r) {
            if (($r['exited_at'] ?? null) !== null) continue;

            $rid = (int)$r['reservation_id'];
            $pid = $this->parkingIdFromReservationId($rid);

            if ($pid === $parkingId) {
                $active[] = $r;
            }
        }

        // SQL: ORDER BY s.entered_at DESC
        usort($active, fn($a, $b) => strcmp((string)$b['entered_at'], (string)$a['entered_at']));

        // SQL renvoie des tableaux avec ces colonnes
        return array_map(
            fn(array $r) => [
                'id' => (int)$r['id'],
                'reservation_id' => (int)$r['reservation_id'],
                'entered_at' => (string)$r['entered_at'],
                'exited_at' => $r['exited_at'] ?? null,
                'billed_amount' => ($r['billed_amount'] ?? null) !== null ? (float)$r['billed_amount'] : null,
                'penalty_amount' => ($r['penalty_amount'] ?? null) !== null ? (float)$r['penalty_amount'] : null,
                'created_at' => (string)$r['created_at'],
            ],
            $active
        );
    }

    public function countActiveByParkingId(int $parkingId): int
    {
        // SQL fait un COUNT sur active, donc on reproduit
        $count = 0;

        foreach ($this->readRows() as $r) {
            if (($r['exited_at'] ?? null) !== null) continue;

            $rid = (int)$r['reservation_id'];
            $pid = $this->parkingIdFromReservationId($rid);

            if ($pid === $parkingId) $count++;
        }

        return $count;
    }

    public function revenueForParking(string $from, string $to, int $parkingId): array
    {
        // SQL:
        // exited_at IS NOT NULL
        // exited_at >= from
        // exited_at < to (borne haute exclusive)
        $countExits = 0;
        $totalBilled = 0.0;
        $totalPenalty = 0.0;

        foreach ($this->readRows() as $r) {
            $exited = $r['exited_at'] ?? null;
            if ($exited === null) continue;

            $rid = (int)$r['reservation_id'];
            $pid = $this->parkingIdFromReservationId($rid);
            if ($pid !== $parkingId) continue;

            $exitedAt = (string)$exited;
            if ($exitedAt < $from) continue;
            if ($exitedAt >= $to) continue; // borne exclusive

            $countExits++;
            $totalBilled += (float)($r['billed_amount'] ?? 0.0);
            $totalPenalty += (float)($r['penalty_amount'] ?? 0.0);
        }

        return [
            'count_exits'   => $countExits,
            'total_billed'  => $totalBilled,
            'total_penalty' => $totalPenalty,
            'total'         => $totalBilled + $totalPenalty,
        ];
    }
}
