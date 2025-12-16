<?php
declare(strict_types=1);

namespace App\Domain\Entity;

use DateTimeImmutable;

final class Parking
{
    private int $id;
    private int $capacity;

    // GPS stocké en string "lat,long" (rapide et suffisant pour l’instant)
    private string $gps;

    // Tarif horaire
    private float $tarif;

    // Horaires
    private DateTimeImmutable $heureDebut;
    private DateTimeImmutable $heureFin;

    // Relations (pour plus tard)
    private array $list_reservation;
    private array $list_stationnement;

    public function __construct(
        int $id,
        int $capacity,
        string $gps,
        float $tarif,
        DateTimeImmutable $heureDebut,
        DateTimeImmutable $heureFin,
        array $list_stationnement = [],
        array $list_reservation = []
    ) {
        if ($capacity < 0) {
            throw new \InvalidArgumentException('capacity must be >= 0');
        }

        $this->id = $id;
        $this->capacity = $capacity;
        $this->gps = $gps;
        $this->tarif = $tarif;
        $this->heureDebut = $heureDebut;
        $this->heureFin = $heureFin;
        $this->list_reservation = $list_reservation;
        $this->list_stationnement = $list_stationnement;
    }

    /* ============================
       Identité & capacité
       ============================ */

    public function id(): int
    {
        return $this->id;
    }

    public function capacity(): int
    {
        return $this->capacity;
    }

    /* ============================
       Accès FR (legacy)
       ============================ */

    public function getGps(): string
    {
        return $this->gps;
    }

    public function getTarif(): float
    {
        return $this->tarif;
    }

    public function getHeureDebut(): DateTimeImmutable
    {
        return $this->heureDebut;
    }

    public function getHeureFin(): DateTimeImmutable
    {
        return $this->heureFin;
    }

    public function getListReservation(): array
    {
        return $this->list_reservation;
    }

    public function getListStationnement(): array
    {
        return $this->list_stationnement;
    }

    /* ============================
       Aliases EN (API / UseCases)
       ============================ */

    public function gps(): string
    {
        return $this->getGps();
    }

    public function hourlyRate(): float
    {
        return $this->getTarif();
    }

    public function openingTime(): DateTimeImmutable
    {
        return $this->getHeureDebut();
    }

    public function closingTime(): DateTimeImmutable
    {
        return $this->getHeureFin();
    }
}
