<?php
class Parking
{
    private bool $isReserved;
    private string $gps;
    private float $rate;
    private DateTime $startTime;
    private DateTime $endTime;
    private array $reservations;
    private array $parkingSpots;

    public function __construct(
        bool $isReserved,
        string $gps,
        float $rate,
        DateTime $startTime,
        DateTime $endTime,
        array $parkingSpots,
        array $reservations = []
    ) {
        $this->isReserved = $isReserved;
        $this->gps = $gps;
        $this->rate = $rate;
        $this->startTime = $startTime;
        $this->endTime = $endTime;
        $this->reservations = $reservations;
        $this->parkingSpots = $parkingSpots;
    }

    public function getIsReserved(): bool
    {
        return $this->isReserved;
    }

    public function setIsReserved(bool $isReserved): void
    {
        $this->isReserved = $isReserved;
    }

    public function isReserved(): bool
    {
        return $this->isReserved === true;
    }

    public function getEndTime(): DateTime
    {
        return $this->endTime;
    }

    public function setEndTime(DateTime $endTime): void
    {
        $this->endTime = $endTime;
    }

    public function getStartTime(): DateTime
    {
        return $this->startTime;
    }

    public function setStartTime(DateTime $startTime): void
    {
        $this->startTime = $startTime;
    }

    public function getRate(): float
    {
        return $this->rate;
    }

    public function setRate(float $rate): void
    {
        $this->rate = $rate;
    }

    public function getGps(): string
    {
        return $this->gps;
    }

    public function setGps(string $gps): void
    {
        $this->gps = $gps;
    }

    public function getReservations(): array
    {
        return $this->reservations;
    }

    public function setReservations(array $reservations): void
    {
        $this->reservations = $reservations;
    }

    public function getParkingSpots(): array
    {
        return $this->parkingSpots;
    }

    public function setParkingSpots(array $parkingSpots): void
    {
        $this->parkingSpots = $parkingSpots;
    }



}

