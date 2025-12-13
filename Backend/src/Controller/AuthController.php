<?php
declare(strict_types=1);

namespace App\Controller;

use App\UseCase\Auth\LoginUser;
use App\UseCase\Auth\RegisterUser;
use App\UseCase\Auth\GetCurrentUser;
use Exception;

class AuthController {
    public function login(array $data): array {
        try {
            $useCase = new LoginUser();
            $result = $useCase->execute($data);
            
            return [
                'status' => 200,
                'data' => $result
            ];
        } catch (Exception $e) {
            $code = $e->getCode() ?: 401;
            if ($code < 100 || $code > 599) $code = 401;
            
            return [
                'status' => $code,
                'data' => ['success' => false, 'error' => $e->getMessage()]
            ];
        }
    }

    public function register(array $data): array {
        try {
            $useCase = new RegisterUser();
            $result = $useCase->execute($data);
            
            return [
                'status' => 201,
                'data' => $result
            ];
        } catch (Exception $e) {
            $code = $e->getCode() ?: 400;
            if ($code < 100 || $code > 599) $code = 400;
            
            return [
                'status' => $code,
                'data' => ['success' => false, 'error' => $e->getMessage()]
            ];
        }
    }

    public function me(?array $user): array {
        try {
            $useCase = new GetCurrentUser();
            $result = $useCase->execute($user);
            
            return [
                'status' => 200,
                'data' => $result
            ];
        } catch (Exception $e) {
            $code = $e->getCode() ?: 401;
            if ($code < 100 || $code > 599) $code = 401;
            
            return [
                'status' => $code,
                'data' => ['success' => false, 'error' => $e->getMessage()]
            ];
        }
    }
}
