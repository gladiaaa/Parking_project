<?php
declare(strict_types=1);

namespace App\UseCase\Auth;

use App\Domain\Repository\UserRepository;
use App\Infrastructure\Security\PasswordHasher;

final class RegisterUser
{
    public function __construct(
        private UserRepository $userRepository,
        private PasswordHasher $passwordHasher,
    ) {
    }

    public function execute(string $email, string $plainPassword): array
    {
        $email = trim(strtolower($email));

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException('Invalid email');
        }

        if (strlen($plainPassword) < 8) {
            throw new \InvalidArgumentException('Password too short');
        }

        if ($this->userRepository->findByEmail($email)) {
            throw new \RuntimeException('Email already used');
        }

        $hash = $this->passwordHasher->hash($plainPassword);

        $user = $this->userRepository->create($email, $hash, 'USER');

        return [
            'id'    => $user->id(),
            'email' => $user->email(),
            'role'  => $user->role(),
        ];
    }
}
