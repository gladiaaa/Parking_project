<?php

declare(strict_types=1);

namespace Tests\Infrastructure\Security;

use App\Infrastructure\Security\PasswordHasher;
use PHPUnit\Framework\TestCase;

final class PasswordHasherTest extends TestCase
{
    public function testHashIsNotPlainPassword(): void
    {
        $hasher = new PasswordHasher();
        $plain  = 'MySecurePassword123!';
        $hash   = $hasher->hash($plain);

        $this->assertIsString($hash);
        $this->assertNotSame($plain, $hash, 'Le hash ne doit pas être le mot de passe en clair');
        $this->assertGreaterThan(20, strlen($hash), 'Le hash doit être suffisamment long');
    }

    public function testVerifyReturnsTrueWithCorrectPassword(): void
    {
        $hasher = new PasswordHasher();
        $plain  = 'Secret123!';
        $hash   = $hasher->hash($plain);

        $this->assertTrue($hasher->verify($plain, $hash));
    }

    public function testVerifyReturnsFalseWithWrongPassword(): void
    {
        $hasher = new PasswordHasher();
        $hash   = $hasher->hash('correct-password');

        $this->assertFalse($hasher->verify('wrong-password', $hash));
    }
}
