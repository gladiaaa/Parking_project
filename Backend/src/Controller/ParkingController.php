<?php
declare(strict_types=1);

namespace App\Controller;

use App\UseCase\Parking\SearchParkings;
use App\UseCase\Parking\CheckAvailability;
use App\UseCase\Parking\GetParkingDetails;
use App\UseCase\Parking\GetOwnerParkings;
use App\UseCase\Parking\CreateParking;
use App\UseCase\Parking\GetOwnerStatistics;
use Exception;

class ParkingController {
    
    // Note: Plus besoin d'injecter les repos ici car les UseCases s'en occupent

    public function list(array $params): array {
        $useCase = new SearchParkings();
        $result = $useCase->execute($params);

        return [
            'status' => 200,
            'data' => [
                'success' => true,
                'parkings' => $result['parkings'],
                'total' => $result['total']
            ]
        ];
    }

    public function detail(int $id): array {
        try {
            $useCase = new GetParkingDetails();
            $parking = $useCase->execute($id);

            return ['status' => 200, 'data' => ['success' => true, 'parking' => $parking]];
        } catch (Exception $e) {
            $code = $e->getCode() ?: 404;
            return ['status' => $code, 'data' => ['success' => false, 'error' => $e->getMessage()]];
        }
    }

    public function checkAvailability(array $data): array {
        try {
            $useCase = new CheckAvailability();
            $result = $useCase->execute($data);

            return [
                'status' => 200,
                'data' => array_merge(['success' => true], $result)
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

    public function listByOwner(?array $user): array {
        if (!$user) return ['status' => 401, 'data' => ['success' => false, 'error' => 'Non autorisé']];

        try {
            $useCase = new GetOwnerParkings();
            $result = $useCase->execute($user);
            
            return [
                'status' => 200,
                'data' => array_merge(['success' => true], $result)
            ];
        } catch (Exception $e) {
            $code = $e->getCode() ?: 401;
            if ($code < 100 || $code > 599) $code = 401;
            
            return ['status' => $code, 'data' => ['success' => false, 'error' => $e->getMessage()]];
        }
    }

    public function create(?array $user, array $data): array {
        if (!$user) return ['status' => 401, 'data' => ['success' => false, 'error' => 'Non autorisé']];

        try {
            $useCase = new CreateParking();
            $result = $useCase->execute($user, $data);
            
            return [
                'status' => 201,
                'data' => array_merge(['success' => true], $result)
            ];
        } catch (Exception $e) {
            $code = $e->getCode() ?: 400;
            if ($code < 100 || $code > 599) $code = 400;
            
            return ['status' => $code, 'data' => ['success' => false, 'error' => $e->getMessage()]];
        }
    }

    public function getStatistics(?array $user): array {
        if (!$user) return ['status' => 401, 'data' => ['success' => false, 'error' => 'Non autorisé']];

        try {
            $useCase = new GetOwnerStatistics();
            $result = $useCase->execute($user);
            
            return [
                'status' => 200,
                'data' => array_merge(['success' => true], $result)
            ];
        } catch (Exception $e) {
            $code = $e->getCode() ?: 401;
            if ($code < 100 || $code > 599) $code = 401;
            
            return ['status' => $code, 'data' => ['success' => false, 'error' => $e->getMessage()]];
        }
    }
}
