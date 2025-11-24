<?php
declare(strict_types=1);

namespace App\Domain\Repository;

use App\Domain\Entity\User;

interface UserRepository
{
    public function findById(int $id): ?User;
    public function findByEmail(string $email): ?User;

    // 👇 on remplace save2FA par ça
    public function save(User $user): void;
    public function create(string $email, string $passwordHash, string $role = 'USER'): User;
}
