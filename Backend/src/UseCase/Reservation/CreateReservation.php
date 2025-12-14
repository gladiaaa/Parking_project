<?php
declare(strict_types=1);

namespace App\UseCase\Reservation;

use App\Infrastructure\Repository\ReservationRepository;
use App\Infrastructure\Repository\ParkingRepository;
use DateTime;
use Exception;

class CreateReservation {
    private ReservationRepository $reservationRepo;
    private ParkingRepository $parkingRepo;

    public function __construct() {
        $this->reservationRepo = new ReservationRepository();
        $this->parkingRepo = new ParkingRepository();
    }

    public function execute(array $data, array $user): array {
        $parkingId = $data['parkingId'] ?? 0;
        $dateDebut = $data['date_debut'] ?? '';
        $dateFin = $data['date_fin'] ?? '';
        $vehicule = $data['vehicule'] ?? '';
        $immatriculation = $data['immatriculation'] ?? '';
        $montant = $data['montant'] ?? 0;

        // Validations
        if (empty($dateDebut) || empty($dateFin)) {
            throw new Exception('Dates manquantes', 400);
        }

        $now = new DateTime();
        $start = new DateTime($dateDebut);
        $end = new DateTime($dateFin);

        if ($end <= $start) {
            throw new Exception('La date de fin doit être après la date de début', 400);
        }
        
        if ($start < $now) {
             // On tolère une petite marge ou on bloque ? Pour l'instant on bloque si c'est vraiment dans le passé
             // throw new Exception('La date de début ne peut pas être dans le passé', 400);
        }

        if ($this->reservationRepo->hasOverlapForUser((int)$user['id'], $dateDebut, $dateFin)) {
            throw new Exception('Vous avez déjà une réservation sur cette période', 409);
        }

        $parking = $this->parkingRepo->findById((int)$parkingId);
        if (!$parking) {
            throw new Exception('Parking non trouvé', 404);
        }

        $reserved = $this->reservationRepo->countConfirmed((int)$parkingId, $dateDebut, $dateFin);

        if (($parking['nombre_places'] - $reserved) <= 0) {
            throw new Exception('Plus de places disponibles pour cette période', 409);
        }

        // Création
        $id = $this->reservationRepo->create(
            (int)$user['id'], 
            (int)$parkingId, 
            $dateDebut, 
            $dateFin, 
            $vehicule, 
            $immatriculation, 
            (float)$montant
        );

        return [
            'success' => true, 
            'message' => 'Réservation confirmée',
            'reservation' => [
                'id' => $id,
                'montant' => $montant,
                'date_debut' => $dateDebut,
                'date_fin' => $dateFin,
                'parking_id' => $parkingId
            ]
        ];
    }
}
