<?php
declare(strict_types=1);

namespace App\UseCase\Parking;

use App\Infrastructure\Repository\ParkingRepository;
use App\Infrastructure\Repository\ReservationRepository;
use Exception;

class CheckAvailability {
    private ParkingRepository $parkingRepo;
    private ReservationRepository $reservationRepo;

    public function __construct() {
        $this->parkingRepo = new ParkingRepository();
        $this->reservationRepo = new ReservationRepository();
    }

    public function execute(array $data): array {
        $parkingId = $data['parkingId'] ?? 0;
        $dateDebut = $data['dateDebut'] ?? '';
        $dateFin = $data['dateFin'] ?? '';

        if (!$parkingId || !$dateDebut || !$dateFin) {
            throw new Exception('Données incomplètes', 400);
        }

        $parking = $this->parkingRepo->findById((int)$parkingId);
        if (!$parking) {
            throw new Exception('Parking non trouvé', 404);
        }

        $reserved = $this->reservationRepo->countConfirmed((int)$parkingId, $dateDebut, $dateFin);
        $available = max(0, $parking['nombre_places'] - $reserved);

        return [
            'available' => $available > 0,
            'places_disponibles' => $available,
            'parking' => $parking
        ];
    }
}
