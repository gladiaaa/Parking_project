<?php
declare(strict_types=1);

namespace App\Controller;

use App\Infrastructure\Repository\ParkingRepository;
use App\Infrastructure\Repository\ReservationRepository;

class ParkingController {
    private ParkingRepository $parkingRepo;
    private ReservationRepository $reservationRepo;

    public function __construct() {
        $this->parkingRepo = new ParkingRepository();
        $this->reservationRepo = new ReservationRepository();
    }

    public function list(array $params): array {
        $filters = [
            'ville' => $params['ville'] ?? '',
            'vehicule' => $params['vehicule'] ?? ''
        ];
        $sort = $params['sort'] ?? null;
        $dateDebut = $params['dateDebut'] ?? null;
        $dateFin = $params['dateFin'] ?? null;

        $parkings = $this->parkingRepo->findAll($filters, $sort);

        if ($dateDebut && $dateFin) {
            foreach ($parkings as &$parking) {
                $reserved = $this->reservationRepo->countConfirmed((int)$parking['id'], $dateDebut, $dateFin);
                $parking['places_disponibles'] = max(0, $parking['nombre_places'] - $reserved);
            }
        } else {
            foreach ($parkings as &$parking) {
                $parking['places_disponibles'] = $parking['nombre_places'];
            }
        }

        return [
            'status' => 200,
            'data' => [
                'success' => true,
                'parkings' => $parkings,
                'total' => count($parkings)
            ]
        ];
    }

    public function detail(int $id): array {
        $parking = $this->parkingRepo->findById($id);
        
        if (!$parking) {
            return ['status' => 404, 'data' => ['success' => false, 'error' => 'Parking non trouvé']];
        }

        return ['status' => 200, 'data' => ['success' => true, 'parking' => $parking]];
    }

    public function checkAvailability(array $data): array {
        $parkingId = $data['parkingId'] ?? 0;
        $dateDebut = $data['dateDebut'] ?? '';
        $dateFin = $data['dateFin'] ?? '';

        if (!$parkingId || !$dateDebut || !$dateFin) {
            return ['status' => 400, 'data' => ['success' => false, 'error' => 'Données incomplètes']];
        }

        $parking = $this->parkingRepo->findById((int)$parkingId);
        if (!$parking) {
            return ['status' => 404, 'data' => ['success' => false, 'error' => 'Parking non trouvé']];
        }

        $reserved = $this->reservationRepo->countConfirmed((int)$parkingId, $dateDebut, $dateFin);
        $available = max(0, $parking['nombre_places'] - $reserved);

        return [
            'status' => 200,
            'data' => [
                'success' => true,
                'available' => $available > 0,
                'places_disponibles' => $available,
                'parking' => $parking
            ]
        ];
    }

    public function listByOwner(?array $user): array {
        if (!$user || $user['role'] !== 'owner') {
            return ['status' => 401, 'data' => ['success' => false, 'error' => 'Non autorisé']];
        }

        $parkings = $this->parkingRepo->findByOwner((int)$user['id']);
        return ['status' => 200, 'data' => ['success' => true, 'parkings' => $parkings]];
    }

    public function create(?array $user, array $data): array {
        if (!$user || $user['role'] !== 'owner') {
            return ['status' => 401, 'data' => ['success' => false, 'error' => 'Non autorisé']];
        }

        if (empty($data['nom']) || empty($data['adresse']) || empty($data['nombre_places'])) {
            return ['status' => 400, 'data' => ['success' => false, 'error' => 'Données incomplètes']];
        }

        $id = $this->parkingRepo->create((int)$user['id'], $data);
        $parking = $this->parkingRepo->findById($id);

        return ['status' => 201, 'data' => ['success' => true, 'parking' => $parking]];
    }

    public function getStatistics(?array $user): array {
        if (!$user || $user['role'] !== 'owner') {
            return ['status' => 401, 'data' => ['success' => false, 'error' => 'Non autorisé']];
        }

        $revenue = $this->reservationRepo->getMonthlyRevenue((int)$user['id']);
        $activeReservations = $this->reservationRepo->countActiveByOwner((int)$user['id']);
        $activeStationnements = $this->reservationRepo->countActiveStationnementsByOwner((int)$user['id']);

        return [
            'status' => 200,
            'data' => [
                'success' => true,
                'revenus_mensuels' => $revenue,
                'reservations_en_cours' => $activeReservations,
                'stationnements_actifs' => $activeStationnements
            ]
        ];
    }
}
