<?php
declare(strict_types=1);

namespace App\UseCase\Auth;

interface RegisterUserInterface
{
    /** @return array<string,mixed> */
    public function execute(string $email, string $password, string $role, ?string $firstname, ?string $lastname): array;
}