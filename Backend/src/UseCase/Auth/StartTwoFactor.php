<?php
declare(strict_types=1);

namespace App\UseCase\Auth;

use App\Domain\Repository\UserRepository;

final class StartTwoFactor
{
    public function __construct(
        private UserRepository $userRepository,
        private Mailer $mailer,
        private SmsSender $smsSender
    ) {}

    public function execute(int $userId): void
    {
        $user = $this->userRepository->findById($userId);

        if (!$user) {
            throw new \RuntimeException('User not found');
        }

        $method = $user->twoFactorMethod();

        // TOTP : pas de code à générer, l’app TOTP a déjà le secret
        if ($method === 'totp') {
            return;
        }

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = (new \DateTimeImmutable())->modify('+5 minutes');

        // User est immuable -> on récupère la nouvelle instance
        $user = $user->with2FACode($code, $expiresAt);
        $this->userRepository->save($user);

        if ($method === 'email') {
            $this->mailer->sendTwoFactorCodeEmail($user->email(), $code);
        } elseif ($method === 'sms') {
            $phone = $user->twoFactorPhone();
            if ($phone === null) {
                throw new \RuntimeException('User has no phone number for SMS 2FA');
            }
            $this->smsSender->sendTwoFactorSms($phone, $code);
        } else {
            throw new \RuntimeException('Unknown 2FA method: '.$method);
        }
    }
}
