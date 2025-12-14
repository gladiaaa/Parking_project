<?php
declare(strict_types=1);

namespace App\UseCase\Parking;

use App\Infrastructure\Repository\ParkingRepository;
use App\Infrastructure\Repository\ReservationRepository;

class SearchParkings {
    private ParkingRepository $parkingRepo;
    private ReservationRepository $reservationRepo;

    public function __construct() {
        $this->parkingRepo = new ParkingRepository();
        $this->reservationRepo = new ReservationRepository();
    }

    public function execute(array $params): array {
        $filters = [
            'ville' => $params['ville'] ?? '',
            'vehicule' => $params['vehicule'] ?? ''
        ];
        $sort = $params['sort'] ?? null;
        $dateDebut = $params['dateDebut'] ?? null;
        $dateFin = $params['dateFin'] ?? null;

        $parkings = $this->parkingRepo->findAll($filters, $sort);

        // Si on a des dates, on calcule la dispo réelle
        if ($dateDebut && $dateFin) {
            foreach ($parkings as &$parking) {
                $reserved = $this->reservationRepo->countConfirmed((int)$parking['id'], $dateDebut, $dateFin);
                $parking['places_disponibles'] = max(0, $parking['nombre_places'] - $reserved);
            }
        } else {
            // Sinon on affiche le total
            foreach ($parkings as &$parking) {
                $parking['places_disponibles'] = $parking['nombre_places'];
            }
        }

        return [
            'parkings' => $parkings,
            'total' => count($parkings)
        ];
    }
}
