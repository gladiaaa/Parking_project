<?php
declare(strict_types=1);

namespace App\UseCase\Reservation;

use App\Infrastructure\Repository\ReservationRepository;
use Exception;

class CancelReservation {
    private ReservationRepository $reservationRepo;

    public function __construct() {
        $this->reservationRepo = new ReservationRepository();
    }

    public function execute(int $id, array $user): array {
        $reservation = $this->reservationRepo->findByIdAndUser($id, (int)$user['id']);
        
        if (!$reservation) {
            throw new Exception('Réservation non trouvée', 404);
        }

        $this->reservationRepo->cancel($id);
        
        return ['message' => 'Réservation annulée'];
    }
}
