<?php
declare(strict_types=1);

namespace App\UseCase\Auth;

interface LoginUserInterface
{
    /** @return array<string,mixed> */
    public function execute(string $email, string $password): array;
}