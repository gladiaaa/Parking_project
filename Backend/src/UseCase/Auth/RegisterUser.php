<?php
declare(strict_types=1);

namespace App\UseCase\Auth;

use App\Domain\Repository\UserRepository;
use App\Infrastructure\Security\PasswordHasher;

final class RegisterUser implements RegisterUserInterface
{
    public function __construct(
        private UserRepository $repo,
        private PasswordHasher $hasher
    ) {}

    public function execute(
        string $email,
        string $password,
        string $role= 'USER',
        ?string $firstname,
        ?string $lastname
    ): array {
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
}
