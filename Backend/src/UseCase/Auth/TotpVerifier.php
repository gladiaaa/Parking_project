<?php
declare(strict_types=1);

namespace App\UseCase\Auth;

interface TotpVerifier
{
    public function verify(string $secret, string $code): bool;
}
