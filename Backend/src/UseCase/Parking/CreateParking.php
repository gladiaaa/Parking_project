<?php
declare(strict_types=1);

namespace App\UseCase\Parking;

use App\Infrastructure\Repository\ParkingRepository;
use Exception;

class CreateParking {
    private ParkingRepository $parkingRepo;

    public function __construct() {
        $this->parkingRepo = new ParkingRepository();
    }

    public function execute(array $user, array $data): array {
        if ($user['role'] !== 'owner') {
            throw new Exception('Non autorisé', 401);
        }

        if (empty($data['nom']) || empty($data['adresse']) || empty($data['nombre_places'])) {
            throw new Exception('Données incomplètes', 400);
        }

        $id = $this->parkingRepo->create((int)$user['id'], $data);
        $parking = $this->parkingRepo->findById($id);

        return ['parking' => $parking];
    }
}
