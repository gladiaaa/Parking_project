<?php
declare(strict_types=1);

namespace App\UseCase\Auth;

use App\Infrastructure\Repository\UserRepository;
use Exception;

class RegisterUser {
    private UserRepository $userRepository;

    public function __construct() {
        $this->userRepository = new UserRepository();
    }

    public function execute(array $data): array {
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';
        $firstname = trim($data['firstname'] ?? '');
        $lastname = trim($data['lastname'] ?? '');
        $role = $data['role'] ?? 'user';

        if (empty($email) || empty($password) || empty($firstname) || empty($lastname)) {
            throw new Exception('Tous les champs sont obligatoires', 400);
        }

        if ($this->userRepository->findByEmail($email)) {
            throw new Exception('Cet email est déjà utilisé', 400);
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $token = bin2hex(random_bytes(32));

        $userId = $this->userRepository->create($email, $passwordHash, $firstname, $lastname, $role, $token);

        return [
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
        ];
    }
}
