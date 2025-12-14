class ConfigureTwoFactorMethod
{
    public function __construct(
        private UserRepository $userRepository
    ) {}

    public function execute(int $userId, string $method): array
    {
        $allowed = ['email', 'sms', 'totp'];
        if (!in_array($method, $allowed, true)) {
            throw new \InvalidArgumentException('Invalid 2FA method');
        }

        $user = $this->userRepository->findById($userId);

        if (!$user) {
            throw new \RuntimeException('User not found');
        }

        $user->enableTwoFactor($method);

        $qrData = null;

        if ($method === 'totp') {
            // Génération d’un secret TOTP (genre base32)
            $secret = $this->generateTotpSecret();
            $user->setTotpSecret($secret);

            // URI TOTP standard (pour les apps)
            $qrData = $this->buildTotpProvisioningUri($user->getEmail(), $secret);
        }

        $this->userRepository->save($user);

        return [
            'method' => $method,
            'totp_uri' => $qrData, // null si pas TOTP
        ];
    }
}
