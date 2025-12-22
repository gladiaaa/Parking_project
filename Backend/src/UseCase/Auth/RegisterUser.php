<?php
declare(strict_types=1);

namespace App\UseCase\Auth;

use App\Domain\Repository\UserRepository;
use App\Infrastructure\Security\PasswordHasher;

final class RegisterUser
{
    public function __construct(
        private UserRepository $repo,
        private PasswordHasher $hasher
    ) {}

    public function execute(
        string $email,
        string $password,
        string $role = 'USER',
        ?string $firstname = null,
        ?string $lastname = null
    ): array {
        $email = trim($email);
        $role  = strtoupper(trim($role));

        // ✅ normalisation: DB NOT NULL => jamais null/empty
        $firstname = $this->normalizeName($firstname, 'User');
        $lastname  = $this->normalizeName($lastname, 'User');

        if ($email === '') {
            throw new \RuntimeException('Email is required');
        }
        if ($password === '') {
            throw new \RuntimeException('Password is required');
        }

        if ($this->repo->findByEmail($email)) {
            throw new \RuntimeException("Email already in use");
        }

        $hash = $this->hasher->hash($password);

        $user = $this->repo->create(
            $email,
            $hash,
            $role,
            $firstname,
            $lastname
        );

        return [
            'id' => $user->id(),
            'email' => $user->email(),
            'firstname' => $user->firstname(),
            'lastname' => $user->lastname(),
            'role' => $user->role(),
        ];
    }

    private function normalizeName(?string $value, string $fallback): string
    {
        $v = trim((string)($value ?? ''));
        return $v !== '' ? $v : $fallback;
    }
}
