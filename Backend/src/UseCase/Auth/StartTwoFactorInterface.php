<?php
declare(strict_types=1);

namespace App\UseCase\Auth;

interface StartTwoFactorInterface
{
    public function execute(int $userId): void;
}