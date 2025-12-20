<?php
declare(strict_types=1);

namespace App\Domain\Entity;

use DateTimeImmutable;

final class Parking
{
    private int $id;
    private int $capacity;

    private string $gps;
    private float $tarif;

    private DateTimeImmutable $heureDebut;
    private DateTimeImmutable $heureFin;

    private string $address;

    /** @var int[] days ISO-8601 1..7 (Mon..Sun) */
    private array $openingDays;

    private array $list_reservation;
    private array $list_stationnement;

    public function __construct(
        int $id,
        int $capacity,
        string $gps,
        float $tarif,
        DateTimeImmutable $heureDebut,
        DateTimeImmutable $heureFin,
        string $address = '',
        array $openingDays = [1,2,3,4,5,6,7],
        array $list_stationnement = [],
        array $list_reservation = []
    ) {
        if ($capacity < 0) {
            throw new \InvalidArgumentException('capacity must be >= 0');
        }

        $this->assertOpeningDays($openingDays);

        $this->id = $id;
        $this->capacity = $capacity;
        $this->gps = $gps;
        $this->tarif = $tarif;
        $this->heureDebut = $heureDebut;
        $this->heureFin = $heureFin;
        $this->address = $address;
        $this->openingDays = array_values(array_unique($openingDays));
        $this->list_reservation = $list_reservation;
        $this->list_stationnement = $list_stationnement;
    }

    private function assertOpeningDays(array $days): void
    {
        foreach ($days as $d) {
            if (!is_int($d) || $d < 1 || $d > 7) {
                throw new \InvalidArgumentException('openingDays must contain ints 1..7');
            }
        }
    }

    public function id(): int { return $this->id; }
    public function capacity(): int { return $this->capacity; }

    public function gps(): string { return $this->gps; }
    public function hourlyRate(): float { return $this->tarif; }
    public function openingTime(): DateTimeImmutable { return $this->heureDebut; }
    public function closingTime(): DateTimeImmutable { return $this->heureFin; }

    public function address(): string { return $this->address; }

    /** @return int[] */
    public function openingDays(): array { return $this->openingDays; }

    /**
     * Règle métier: le parking est-il ouvert à cet instant ?
     * - jour doit être dans openingDays
     * - heure doit être entre heureDebut et heureFin
     */
    public function isOpenAt(DateTimeImmutable $at): bool
    {
        $day = (int)$at->format('N'); // 1..7
        if (!in_array($day, $this->openingDays, true)) {
            return false;
        }

        $time = $at->format('H:i:s');
        $open = $this->heureDebut->format('H:i:s');
        $close = $this->heureFin->format('H:i:s');

        // Cas simple: ouverture et fermeture dans la même journée
        if ($open <= $close) {
            return $time >= $open && $time <= $close;
        }

        // Cas “nuit” (ex 22:00 -> 06:00)
        return ($time >= $open) || ($time <= $close);
    }

    /**
     * Slot ouvert = ouvert sur tout le slot (au minimum).
     * Option: tu peux être plus permissif si tu veux.
     */
    public function isOpenForSlot(DateTimeImmutable $startAt, DateTimeImmutable $endAt): bool
    {
        return $this->isOpenAt($startAt) && $this->isOpenAt($endAt);
    }
}
