<?php
declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use App\Domain\Entity\User;
use App\Domain\Repository\UserRepository;
use PDO;

final class SqlUserRepository implements UserRepository
{
    public function __construct(private PDO $pdo) {}

    public function findById(int $id): ?User {
        $st = $this->pdo->prepare('SELECT * FROM users WHERE id = ?');
        $st->execute([$id]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        return $row ? $this->hydrate($row) : null;
    }

    public function findByEmail(string $email): ?User {
        $st = $this->pdo->prepare('SELECT * FROM users WHERE email = ?');
        $st->execute([$email]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        return $row ? $this->hydrate($row) : null;
    }

    // 👇 NOUVELLE MÉTHODE
    public function save(User $u): void {
        $st = $this->pdo->prepare(
            'UPDATE users SET
                email = ?,
                password_hash = ?,
                role = ?,
                two_factor_enabled = ?,
                two_factor_method = ?,
                two_factor_last_code = ?,
                two_factor_expires_at = ?,
                two_factor_phone = ?,
                two_factor_totp_secret = ?
             WHERE id = ?'
        );

        $exp = $u->twoFactorExpiresAt()?->format('Y-m-d H:i:s');

        $st->execute([
            $u->email(),
            $u->passwordHash(),
            $u->role(),
            $u->twoFactorEnabled() ? 1 : 0,
            $u->twoFactorMethod(),
            $u->twoFactorLastCode(),
            $exp,
            $u->twoFactorPhone(),
            $u->twoFactorTotpSecret(),
            $u->id(),
        ]);
    }

    private function hydrate(array $r): User {
        return new User(
            (int) $r['id'],
            (string) $r['email'],
            (string) $r['password_hash'],
            (string) ($r['role'] ?? 'USER'),
            (bool) $r['two_factor_enabled'],
            (string) ($r['two_factor_method'] ?? 'email'),
            $r['two_factor_last_code'] ?? null,
            isset($r['two_factor_expires_at']) && $r['two_factor_expires_at']
                ? new \DateTimeImmutable($r['two_factor_expires_at'])
                : null,
            $r['two_factor_phone'] ?? null,
            $r['two_factor_totp_secret'] ?? null,
        );
    }
    public function create(string $email, string $passwordHash, string $role = 'USER'): User
{
    $st = $this->pdo->prepare(
        'INSERT INTO users (email, password_hash, role, two_factor_enabled, two_factor_method)
         VALUES (?, ?, ?, 0, "email")'
    );
    $st->execute([$email, $passwordHash, $role]);

    $id = (int) $this->pdo->lastInsertId();

    return new User(
        $id,
        $email,
        $passwordHash,
        $role,
        false,          // 2FA désactivée par défaut
        'email',        // méthode par défaut
        null,
        null,
        null,
        null,
    );
}

}
