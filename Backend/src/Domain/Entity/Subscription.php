<?php
declare(strict_types=1);

namespace App\Domain\Entity;

final class Subscription
{
    /**
     * @param array<int, array{dow:int,start:string,end:string}> $weeklySlots
     */
    public function __construct(
        private ?int $id,
        private int $userId,
        private int $parkingId,
        private \DateTimeImmutable $startDate,
        private \DateTimeImmutable $endDate,
        private array $weeklySlots,
        private float $amount = 0.0
    ) {}

    public function id(): ?int { return $this->id; }
    public function userId(): int { return $this->userId; }
    public function parkingId(): int { return $this->parkingId; }
    public function startDate(): \DateTimeImmutable { return $this->startDate; }
    public function endDate(): \DateTimeImmutable { return $this->endDate; }

    /** @return array<int, array{dow:int,start:string,end:string}> */
    public function weeklySlots(): array { return $this->weeklySlots; }

    public function amount(): float { return $this->amount; }

    public function withId(int $id): self
    {
        return new self(
            $id,
            $this->userId,
            $this->parkingId,
            $this->startDate,
            $this->endDate,
            $this->weeklySlots,
            $this->amount
        );
    }

    public function withAmount(float $amount): self
    {
        return new self(
            $this->id,
            $this->userId,
            $this->parkingId,
            $this->startDate,
            $this->endDate,
            $this->weeklySlots,
            round($amount, 2)
        );
    }
}
