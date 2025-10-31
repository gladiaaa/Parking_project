<?php
class Parking
{
    private string $gps;
    private float $tarif;
    private DateTime $HeureDebut;
    private DateTime $HeureFin;
    private array $list_reservation;
    private array $list_stationnement;
    public function __construct(
        string $gps,
        float $tarif,
        DateTime $HeureDebut,
        DateTime $HeureFin,
        array $list_stationnement,
        array $list_reservation = []
    ) {
        $this->gps = $gps;
        $this->tarif = $tarif;
        $this->HeureDebut = $HeureDebut;
        $this->HeureFin = $HeureFin;
        $this->list_reservation = $list_reservation;
        $this->list_stationnement = $list_stationnement;
    }

    public function getHeureFin(): DateTime
    {
        return $this->HeureFin;
    }

    public function setHeureFin(DateTime $HeureFin): void
    {
        $this->HeureFin = $HeureFin;
    }

    public function getHeureDebut(): DateTime
    {
        return $this->HeureDebut;
    }

    public function setHeureDebut(DateTime $HeureDebut): void
    {
        $this->HeureDebut = $HeureDebut;
    }

    public function getTarif(): float
    {
        return $this->tarif;
    }

    public function setTarif(float $tarif): void
    {
        $this->tarif = $tarif;
    }

    public function getGps(): string
    {
        return $this->gps;
    }

    public function setGps(string $gps): void
    {
        $this->gps = $gps;
    }

    public function getListReservation(): array
    {
        return $this->list_reservation;
    }

    public function setListReservation(array $list_reservation): void
    {
        $this->list_reservation = $list_reservation;
    }

    public function getListStationnement(): array
    {
        return $this->list_stationnement;
    }

    public function setListStationnement(array $list_stationnement): void
    {
        $this->list_stationnement = $list_stationnement;
    }
}
