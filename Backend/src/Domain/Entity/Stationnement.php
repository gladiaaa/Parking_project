<?php
declare(strict_types=1);

namespace App\Domain\Entity;

final class Stationnement
{
    public function __construct(
        private ?int $id,
        private int $reservationId,
        private \DateTimeImmutable $enteredAt,
        private ?\DateTimeImmutable $exitedAt,
        private ?float $billedAmount,
        private ?float $penaltyAmount,
        private \DateTimeImmutable $createdAt
    ) {}

    public static function enter(int $reservationId, \DateTimeImmutable $now): self
    {
        return new self(
            null,
            $reservationId,
            $now,
            null,
            null,
            null,
            new \DateTimeImmutable('now')
        );
    }

    public function id(): ?int { return $this->id; }
    public function reservationId(): int { return $this->reservationId; }
    public function enteredAt(): \DateTimeImmutable { return $this->enteredAt; }
    public function exitedAt(): ?\DateTimeImmutable { return $this->exitedAt; }
    public function billedAmount(): ?float { return $this->billedAmount; }
    public function penaltyAmount(): ?float { return $this->penaltyAmount; }
    public function createdAt(): \DateTimeImmutable { return $this->createdAt; }

    public function withId(int $id): self
    {
        return new self($id, $this->reservationId, $this->enteredAt, $this->exitedAt, $this->billedAmount, $this->penaltyAmount, $this->createdAt);
    }
}
