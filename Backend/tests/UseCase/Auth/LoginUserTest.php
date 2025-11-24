<?php
declare(strict_types=1);

namespace Tests\UseCase\Auth;

use App\Domain\Entity\User;
use App\Domain\Repository\UserRepository;
use App\Infrastructure\Security\PasswordHasher;
use App\UseCase\Auth\LoginUser;
use PHPUnit\Framework\TestCase;

/**
 * Petit repository en mémoire uniquement pour les tests.
 */
final class InMemoryUserRepository implements UserRepository
{
    /** @var User[] */
    private array $users = [];
    private int $autoIncrement = 1;

    public function __construct(User ...$users)
    {
        foreach ($users as $user) {
            $this->save($user);
        }
    }

    public function create(string $email, string $passwordHash, string $role = 'USER',    ?string $firstname = null,
    ?string $lastname = null): User
    {
        $user = new User($this->autoIncrement++, $email, $passwordHash, $role);
        $this->save($user);
        return $user;
    }

    public function findById(int $id): ?User
    {
        return $this->users[$id] ?? null;
    }

    public function findByEmail(string $email): ?User
    {
        foreach ($this->users as $user) {
            if ($user->email() === $email) {
                return $user;
            }
        }
        return null;
    }

    public function save(User $user): void
    {
        $this->users[$user->id()] = $user;

        if ($user->id() >= $this->autoIncrement) {
            $this->autoIncrement = $user->id() + 1;
        }
    }
}

/**
 * Tests du cas d’usage LoginUser.
 */
final class LoginUserTest extends TestCase
{
    private PasswordHasher $hasher;

    protected function setUp(): void
    {
        $this->hasher = new PasswordHasher();
    }

    public function testLoginSucceedsWithValidCredentialsAnd2FAEnabled(): void
    {
        $plain = 'MyStrongPassword!';
        $hash  = $this->hasher->hash($plain);

        // 2FA activée par défaut
        $user = new User(
            1,
            'user@example.com',
            $hash,
            'USER'
        );

        $repo    = new InMemoryUserRepository($user);
        $useCase = new LoginUser($repo, $this->hasher);

        $result = $useCase->execute('user@example.com', $plain);

        $this->assertTrue($result['success'] ?? false);
        $this->assertTrue($result['two_factor_required'] ?? false);
        $this->assertSame(1, $result['user_id'] ?? null);
        $this->assertSame('USER', $result['role'] ?? null);
    }

    public function testLoginSucceedsWithValidCredentialsAnd2FADisabled(): void
    {
        $plain = 'MyStrongPassword!';
        $hash  = $this->hasher->hash($plain);

        // On désactive la 2FA via withTwoFactorConfig
        $user = new User(
            2,
            'no2fa@example.com',
            $hash,
            'USER'
        );
        $user = $user->withTwoFactorConfig(false, 'email');

        $repo    = new InMemoryUserRepository($user);
        $useCase = new LoginUser($repo, $this->hasher);

        $result = $useCase->execute('no2fa@example.com', $plain);

        $this->assertTrue($result['success'] ?? false);
        $this->assertFalse($result['two_factor_required'] ?? true);
        $this->assertSame(2, $result['user_id'] ?? null);
        $this->assertSame('USER', $result['role'] ?? null);
    }

    public function testLoginFailsWithWrongPassword(): void
    {
        $plain = 'MyStrongPassword!';
        $hash  = $this->hasher->hash($plain);

        $user = new User(
            3,
            'user@example.com',
            $hash,
            'USER'
        );

        $repo    = new InMemoryUserRepository($user);
        $useCase = new LoginUser($repo, $this->hasher);

        $result = $useCase->execute('user@example.com', 'wrong-password');

        $this->assertFalse($result['success'] ?? true);
        $this->assertArrayNotHasKey('user_id', $result);
        $this->assertArrayNotHasKey('role', $result);
    }

    public function testLoginFailsWithUnknownUser(): void
    {
        $repo    = new InMemoryUserRepository(); // aucun user enregistré
        $useCase = new LoginUser($repo, $this->hasher);

        $result = $useCase->execute('doesnotexist@example.com', 'whatever');

        $this->assertFalse($result['success'] ?? true);
        $this->assertArrayNotHasKey('user_id', $result);
        $this->assertArrayNotHasKey('role', $result);
    }
}
