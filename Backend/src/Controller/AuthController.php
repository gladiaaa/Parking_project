<?php
declare(strict_types=1);

namespace App\Controller;

use App\Infrastructure\Repository\UserRepository;

class AuthController {
    private UserRepository $userRepository;

    public function __construct() {
        $this->userRepository = new UserRepository();
    }

    public function login(array $data): array {
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';
        
        $user = $this->userRepository->findByEmail($email);
        
        if ($user && password_verify($password, $user['password_hash'])) {
            $token = bin2hex(random_bytes(32));
            $this->userRepository->updateToken((int)$user['id'], $token);
            
            return [
                'status' => 200,
                'data' => [
                    'success' => true,
                    'token' => $token,
                    'user' => $this->formatUser($user)
                ]
            ];
        }
        
        return ['status' => 401, 'data' => ['success' => false, 'error' => 'Email ou mot de passe incorrect']];
    }

    public function register(array $data): array {
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';
        $firstname = trim($data['firstname'] ?? '');
        $lastname = trim($data['lastname'] ?? '');
        $role = $data['role'] ?? 'user';

        if (empty($email) || empty($password) || empty($firstname) || empty($lastname)) {
            return ['status' => 400, 'data' => ['success' => false, 'error' => 'Tous les champs sont obligatoires']];
        }

        if ($this->userRepository->findByEmail($email)) {
            return ['status' => 400, 'data' => ['success' => false, 'error' => 'Cet email est déjà utilisé']];
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $token = bin2hex(random_bytes(32));

        $userId = $this->userRepository->create($email, $passwordHash, $firstname, $lastname, $role, $token);

        return [
            'status' => 201,
            'data' => [
                'success' => true,
                'message' => 'Compte créé avec succès',
                'token' => $token,
                'user' => [
                    'id' => $userId,
                    'email' => $email,
                    'firstname' => $firstname,
                    'lastname' => $lastname,
                    'role' => $role
                ]
            ]
        ];
    }

    public function me(?array $user): array {
        if (!$user) return ['status' => 401, 'data' => ['success' => false, 'error' => 'Non autorisé']];
        
        return [
            'status' => 200,
            'data' => [
                'success' => true,
                'user' => $this->formatUser($user)
            ]
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
