<?php
declare(strict_types=1);

namespace App\Controller;

use App\Infrastructure\Repository\ReservationRepository;
use App\Infrastructure\Repository\ParkingRepository;
use DateTime;

class ReservationController {
    private ReservationRepository $reservationRepo;
    private ParkingRepository $parkingRepo;

    public function __construct() {
        $this->reservationRepo = new ReservationRepository();
        $this->parkingRepo = new ParkingRepository();
    }

    public function create(array $data, ?array $user): array {
        if (!$user) return ['status' => 401, 'data' => ['success' => false, 'error' => 'Non autorisé']];

        $parkingId = $data['parkingId'] ?? 0;
        $dateDebut = $data['date_debut'] ?? '';
        $dateFin = $data['date_fin'] ?? '';
        $vehicule = $data['vehicule'] ?? '';
        $immatriculation = $data['immatriculation'] ?? '';
        $montant = $data['montant'] ?? 0;

        // Validations
        $now = new DateTime();
        $start = new DateTime($dateDebut);
        $end = new DateTime($dateFin);

        if ($end <= $start) {
            return ['status' => 400, 'data' => ['success' => false, 'error' => 'La date de fin doit être après la date de début']];
        }

        if ($this->reservationRepo->hasOverlapForUser((int)$user['id'], $dateDebut, $dateFin)) {
            return ['status' => 409, 'data' => ['success' => false, 'error' => 'Vous avez déjà une réservation sur cette période']];
        }

        $parking = $this->parkingRepo->findById((int)$parkingId);
        $reserved = $this->reservationRepo->countConfirmed((int)$parkingId, $dateDebut, $dateFin);

        if (($parking['nombre_places'] - $reserved) <= 0) {
            return ['status' => 409, 'data' => ['success' => false, 'error' => 'Plus de places disponibles']];
        }

        $id = $this->reservationRepo->create((int)$user['id'], (int)$parkingId, $dateDebut, $dateFin, $vehicule, $immatriculation, (float)$montant);

        return [
            'status' => 201,
            'data' => [
                'success' => true, 
                'message' => 'Réservation confirmée',
                'reservation_id' => $id
            ]
        ];
    }

    public function list(?array $user): array {
        if (!$user) return ['status' => 401, 'data' => ['success' => false, 'error' => 'Non autorisé']];
        
        $reservations = $this->reservationRepo->findByUser((int)$user['id']);
        return ['status' => 200, 'data' => ['success' => true, 'reservations' => $reservations]];
    }

    public function cancel(int $id, ?array $user): array {
        if (!$user) return ['status' => 401, 'data' => ['success' => false, 'error' => 'Non autorisé']];

        $reservation = $this->reservationRepo->findByIdAndUser($id, (int)$user['id']);
        
        if (!$reservation) {
            return ['status' => 404, 'data' => ['success' => false, 'error' => 'Réservation non trouvée']];
        }

        $this->reservationRepo->cancel($id);
        return ['status' => 200, 'data' => ['success' => true, 'message' => 'Réservation annulée']];
    }
}
