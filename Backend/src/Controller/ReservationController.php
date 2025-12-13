<?php
declare(strict_types=1);

namespace App\Controller;

use App\UseCase\Reservation\CreateReservation;
use App\UseCase\Reservation\GetUserReservations;
use App\UseCase\Reservation\CancelReservation;
use Exception;

class ReservationController {
    public function create(array $data, ?array $user): array {
        if (!$user) return ['status' => 401, 'data' => ['success' => false, 'error' => 'Non autorisé']];

        try {
            $useCase = new CreateReservation();
            $result = $useCase->execute($data, $user);
            
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

    public function list(?array $user): array {
        if (!$user) return ['status' => 401, 'data' => ['success' => false, 'error' => 'Non autorisé']];
        
        try {
            $useCase = new GetUserReservations();
            $result = $useCase->execute($user);
            
            return [
                'status' => 200, 
                'data' => array_merge(['success' => true], $result)
            ];
        } catch (Exception $e) {
            return ['status' => 500, 'data' => ['success' => false, 'error' => $e->getMessage()]];
        }
    }

    public function cancel(int $id, ?array $user): array {
        if (!$user) return ['status' => 401, 'data' => ['success' => false, 'error' => 'Non autorisé']];

        try {
            $useCase = new CancelReservation();
            $result = $useCase->execute($id, $user);
            
            return [
                'status' => 200, 
                'data' => array_merge(['success' => true], $result)
            ];
        } catch (Exception $e) {
            $code = $e->getCode() ?: 400;
            if ($code < 100 || $code > 599) $code = 400;
            
            return ['status' => $code, 'data' => ['success' => false, 'error' => $e->getMessage()]];
        }
    }
}
