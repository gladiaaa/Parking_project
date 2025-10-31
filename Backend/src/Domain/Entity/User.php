<?php
declare(strict_types=1);

namespace App\Domain\Entity;

final class User {
  public function __construct(
    private int $id,
    private string $email,
    private string $passwordHash,
    private string $role = 'USER',
    private bool $twoFactorEnabled = true,
    private string $twoFactorMethod = 'email',
    private ?string $twoFactorLastCode = null,
    private ?\DateTimeImmutable $twoFactorExpiresAt = null
  ) {}

  public function id(): int { return $this->id; }
  public function email(): string { return $this->email; }
  public function passwordHash(): string { return $this->passwordHash; }
  public function role(): string { return $this->role; }

  public function twoFactorEnabled(): bool { return $this->twoFactorEnabled; }
  public function twoFactorMethod(): string { return $this->twoFactorMethod; }
  public function twoFactorLastCode(): ?string { return $this->twoFactorLastCode; }
  public function twoFactorExpiresAt(): ?\DateTimeImmutable { return $this->twoFactorExpiresAt; }

  public function with2FACode(string $code, \DateTimeImmutable $expires): self {
    $c = clone $this; $c->twoFactorLastCode=$code; $c->twoFactorExpiresAt=$expires; return $c;
  }
  public function clear2FA(): self {
    $c = clone $this; $c->twoFactorLastCode=null; $c->twoFactorExpiresAt=null; return $c;
  }
}
