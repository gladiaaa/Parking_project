<?php
declare(strict_types=1);

namespace App\UseCase\Auth;

use App\Domain\Repository\UserRepository;
use App\Infrastructure\Security\PasswordHasher;

final class LoginUser
{
    public function __construct(
        private UserRepository $users,
        private PasswordHasher $hasher,
    ) {}

    public function execute(string $email, string $password): array
    {
        $u = $this->users->findByEmail($email);

        if (!$u || !$this->hasher->verify($password, $u->passwordHash())) {
            return ['success' => false];
        }

        if ($u->twoFactorEnabled()) {
            return [
                'success'             => true,
                'two_factor_required' => true,
                'user_id'             => $u->id(),
                'role'                => $u->role(),
            ];
        }

        return [
            'success'             => true,
            'two_factor_required' => false,
            'user_id'             => $u->id(),
            'role'                => $u->role(),
        ];
    }
}
