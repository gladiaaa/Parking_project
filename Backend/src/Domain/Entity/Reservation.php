<?php

namespace App\Domain\Entity;

final class Reservation
{
    public function __construct(
        private ?int $id,
        private int $userId,
        private int $parkingId,
        private \DateTimeImmutable $startAt,
        private \DateTimeImmutable $endAt,
        private \DateTimeImmutable $createdAt,
        private string $vehicleType,
        private float $amount,
    ) {
        if ($endAt <= $startAt) {
            throw new \InvalidArgumentException("endAt must be after startAt");
        }
        if ($this->vehicleType === '') {
            throw new \InvalidArgumentException("vehicleType is required");
        }
        if ($this->amount < 0) {
            throw new \InvalidArgumentException("amount must be >= 0");
        }
    }

    public static function create(
        int $userId,
        int $parkingId,
        \DateTimeImmutable $startAt,
        \DateTimeImmutable $endAt,
        string $vehicleType,
        float $amount
    ): self {
        return new self(
            null,
            $userId,
            $parkingId,
            $startAt,
            $endAt,
            new \DateTimeImmutable('now'),
            $vehicleType,
            $amount
        );
    }

    public function id(): ?int { return $this->id; }
    public function userId(): int { return $this->userId; }
    public function parkingId(): int { return $this->parkingId; }
    public function startAt(): \DateTimeImmutable { return $this->startAt; }
    public function endAt(): \DateTimeImmutable { return $this->endAt; }
    public function createdAt(): \DateTimeImmutable { return $this->createdAt; }
    public function vehicleType(): string { return $this->vehicleType; }
    public function amount(): float { return $this->amount; }

    public function withId(int $id): self
    {
        return new self(
            $id,
            $this->userId,
            $this->parkingId,
            $this->startAt,
            $this->endAt,
            $this->createdAt,
            $this->vehicleType,
            $this->amount
        );
    }
}
