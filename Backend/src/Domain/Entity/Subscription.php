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
        private \DateTimeImmutable $startDate, // date only (00:00)
        private \DateTimeImmutable $endDate,   // date only (00:00)
        private array $weeklySlots
    ) {}

    public function id(): ?int { return $this->id; }
    public function userId(): int { return $this->userId; }
    public function parkingId(): int { return $this->parkingId; }
    public function startDate(): \DateTimeImmutable { return $this->startDate; }
    public function endDate(): \DateTimeImmutable { return $this->endDate; }

    /** @return array<int, array{dow:int,start:string,end:string}> */
    public function weeklySlots(): array { return $this->weeklySlots; }

    public function withId(int $id): self
    {
        return new self($id, $this->userId, $this->parkingId, $this->startDate, $this->endDate, $this->weeklySlots);
    }
}
