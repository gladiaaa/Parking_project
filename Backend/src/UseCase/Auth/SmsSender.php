<?php
declare(strict_types=1);

namespace App\UseCase\Auth;

interface SmsSender
{
    public function sendTwoFactorSms(string $phone, string $code): void;
}
