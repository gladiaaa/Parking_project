<?php
declare(strict_types=1);

namespace App\UseCase\Parking;

use App\Domain\Repository\ParkingRepository;
use Exception;

class GetOwnerParkings {
    private ParkingRepository $parkingRepo;

    public function __construct() {
        $this->parkingRepo = new ParkingRepository();
    }

    public function execute(array $user): array {
        if ($user['role'] !== 'owner') {
            throw new Exception('Non autorisé', 401);
        }

        $parkings = $this->parkingRepo->findByOwner((int)$user['id']);
        return ['parkings' => $parkings];
    }
}
