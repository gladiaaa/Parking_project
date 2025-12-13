<?php
declare(strict_types=1);

namespace App\UseCase\Parking;

use App\Infrastructure\Repository\ParkingRepository;
use Exception;

class GetParkingDetails {
    private ParkingRepository $parkingRepo;

    public function __construct() {
        $this->parkingRepo = new ParkingRepository();
    }

    public function execute(int $id): array {
        $parking = $this->parkingRepo->findById($id);
        
        if (!$parking) {
            throw new Exception('Parking non trouvé', 404);
        }

        return $parking;
    }
}
