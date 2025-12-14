<?php

namespace App\Domain\Entity;

use DateTimeImmutable;

final class Parking
{
    private int $id;
    private int $nbPlaces;

    private string $gps; // OK en mode “rapide” (ex: "48.8566,2.3522")
    private float $tarif;
    private DateTimeImmutable $heureDebut;
    private DateTimeImmutable $heureFin;

    private array $list_reservation;
    private array $list_stationnement;

    public function __construct(
        int $id,
        int $nbPlaces,
        string $gps,
        float $tarif,
        DateTimeImmutable $heureDebut,
        DateTimeImmutable $heureFin,
        array $list_stationnement = [],
        array $list_reservation = []
    ) {
        if ($nbPlaces < 0) {
            throw new \InvalidArgumentException("nbPlaces must be >= 0");
        }

        $this->id = $id;
        $this->nbPlaces = $nbPlaces;
        $this->gps = $gps;
        $this->tarif = $tarif;
        $this->heureDebut = $heureDebut;
        $this->heureFin = $heureFin;
        $this->list_reservation = $list_reservation;
        $this->list_stationnement = $list_stationnement;
    }

    public function id(): int { return $this->id; }
    public function getNbPlaces(): int { return $this->nbPlaces; }

    public function getGps(): string { return $this->gps; }
    public function getTarif(): float { return $this->tarif; }

    public function getHeureDebut(): DateTimeImmutable { return $this->heureDebut; }
    public function getHeureFin(): DateTimeImmutable { return $this->heureFin; }

    public function getListReservation(): array { return $this->list_reservation; }
    public function getListStationnement(): array { return $this->list_stationnement; }
}
