<?php
declare(strict_types=1);

namespace App\Infrastructure\Repository;

use App\Infrastructure\Database\DatabaseConnection;
use PDO;

class UserRepository {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = DatabaseConnection::getPDO();
    }

    public function findByEmail(string $email): ?array {
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        return $stmt->fetch() ?: null;
    }

    public function findByToken(string $token): ?array {
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE api_token = ?');
        $stmt->execute([$token]);
        return $stmt->fetch() ?: null;
    }

    public function updateToken(int $userId, string $token): void {
        $stmt = $this->pdo->prepare('UPDATE users SET api_token = ? WHERE id = ?');
        $stmt->execute([$token, $userId]);
    }

    public function create(string $email, string $passwordHash, string $firstname, string $lastname, string $role, string $token): int {
        $stmt = $this->pdo->prepare('
            INSERT INTO users (email, password_hash, firstname, lastname, role, api_token)
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([$email, $passwordHash, $firstname, $lastname, $role, $token]);
        return (int)$this->pdo->lastInsertId();
    }
}
