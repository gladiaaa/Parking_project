<?php
declare(strict_types=1);

namespace App\Domain\Entity;

final class User
{
    public function __construct(
        private int $id,
        private string $email,
        private string $passwordHash,
        private string $role = 'USER',

        private ?string $firstname = null,
        private ?string $lastname = null,

        // Config 2FA
        private bool $twoFactorEnabled = true,
        // 'email' | 'sms' | 'totp'
        private string $twoFactorMethod = 'email',

        // 2FA par code (email / sms)
        private ?string $twoFactorLastCode = null,
        private ?\DateTimeImmutable $twoFactorExpiresAt = null,

        // 2FA SMS
        private ?string $twoFactorPhone = null,

        // 2FA TOTP (Google Authenticator, etc.)
        private ?string $twoFactorTotpSecret = null,
    ) {
    }

    // ====================
    // Getters de base
    // ====================

    public function id(): int
    {
        return $this->id;
    }

    public function email(): string
    {
        return $this->email;
    }

    public function passwordHash(): string
    {
        return $this->passwordHash;
    }

    public function role(): string
    {
        return $this->role;
    }

    public function firstname(): ?string
    {
        return $this->firstname;
    }
    public function lastname(): ?string
    {
        return $this->lastname;
    }
    // ====================
    // 2FA - configuration
    // ====================

    public function twoFactorEnabled(): bool
    {
        return $this->twoFactorEnabled;
    }

    public function twoFactorMethod(): string
    {
        return $this->twoFactorMethod;
    }

    public function twoFactorPhone(): ?string
    {
        return $this->twoFactorPhone;
    }

    public function twoFactorTotpSecret(): ?string
    {
        return $this->twoFactorTotpSecret;
    }

    // immuable : config complète de la 2FA (méthode + éventuel numéro)
    public function withTwoFactorConfig(
        bool $enabled,
        string $method,
        ?string $phone = null
    ): self {
        $allowed = ['email', 'sms', 'totp'];
        if (!\in_array($method, $allowed, true)) {
            throw new \InvalidArgumentException('Invalid 2FA method');
        }

        $c = clone $this;
        $c->twoFactorEnabled = $enabled;
        $c->twoFactorMethod = $method;
        $c->twoFactorPhone = $phone;

        return $c;
    }

    public function withTotpSecret(string $secret): self
    {
        $c = clone $this;
        $c->twoFactorTotpSecret = $secret;
        return $c;
    }

    public function hasTotpConfigured(): bool
    {
        return $this->twoFactorTotpSecret !== null && $this->twoFactorTotpSecret !== '';
    }


    public function twoFactorLastCode(): ?string
    {
        return $this->twoFactorLastCode;
    }

    public function twoFactorExpiresAt(): ?\DateTimeImmutable
    {
        return $this->twoFactorExpiresAt;
    }

    public function with2FACode(string $code, \DateTimeImmutable $expires): self
    {
        $c = clone $this;
        $c->twoFactorLastCode = $code;
        $c->twoFactorExpiresAt = $expires;
        return $c;
    }

    public function clear2FA(): self
    {
        $c = clone $this;
        $c->twoFactorLastCode = null;
        $c->twoFactorExpiresAt = null;
        return $c;
    }

    public function hasValid2FACode(string $code, \DateTimeImmutable $now): bool
    {
        if ($this->twoFactorLastCode === null || $this->twoFactorExpiresAt === null) {
            return false;
        }

        if ($this->twoFactorExpiresAt < $now) {
            return false;
        }

        return hash_equals($this->twoFactorLastCode, $code);
    }
}
