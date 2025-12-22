<?php
declare(strict_types=1);

namespace App\UseCase\Auth;

interface RefreshTokenInterface
{
    /** @return array<string,mixed>|null */
    public function execute(): ?array;
}