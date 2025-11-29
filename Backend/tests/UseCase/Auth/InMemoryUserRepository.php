<?php
declare(strict_types=1);

namespace Tests\UseCase\Auth;

use App\Domain\Entity\User;
use App\Domain\Repository\UserRepository;

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

    public function create(
        string $email,
        string $passwordHash,
        string $role = 'USER',
        ?string $firstname = null,
        ?string $lastname = null
    ): User {
        $user = new User(
            $this->autoIncrement++,
            $email,
            $passwordHash,
            $role,
            $firstname,
            $lastname,
        );
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
