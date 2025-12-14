<?php
declare(strict_types=1);

namespace App\UseCase\Auth;

interface Mailer
{
    public function sendTwoFactorCodeEmail(string $to, string $code): void;
}
