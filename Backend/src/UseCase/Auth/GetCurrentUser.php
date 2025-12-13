<?php
declare(strict_types=1);

namespace App\UseCase\Auth;

class GetCurrentUser {
    public function execute(?array $user): array {
        if (!$user) {
            throw new \Exception('Non autorisé', 401);
        }
        
        return [
            'success' => true,
            'user' => $this->formatUser($user)
        ];
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
