<?php
declare(strict_types=1);

namespace App\UseCase\Auth;

use App\Infrastructure\Repository\UserRepository;
use Exception;

class LoginUser {
    private UserRepository $userRepository;

    public function __construct() {
        $this->userRepository = new UserRepository();
    }

    public function execute(array $data): array {
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';
        
        $user = $this->userRepository->findByEmail($email);
        
        if ($user && password_verify($password, $user['password_hash'])) {
            $token = bin2hex(random_bytes(32));
            $this->userRepository->updateToken((int)$user['id'], $token);
            
            return [
                'success' => true,
                'token' => $token,
                'user' => $this->formatUser($user)
            ];
        }
        
        throw new Exception('Email ou mot de passe incorrect', 401);
    }

    private function formatUser(array $user): array {
        return [
            'id' => $user['id'],
            'email' => $user['email'],
            'firstname' => $user['firstname'],
            'lastname' => $user['lastname'],
            'role' => $user['role'],
            'typeAbonnement' => $user['type_abonnement'] ?? null,
            'debutAbonnement' => $user['debut_abonnement'] ?? null,
            'finAbonnement' => $user['fin_abonnement'] ?? null
        ];
    }
}
