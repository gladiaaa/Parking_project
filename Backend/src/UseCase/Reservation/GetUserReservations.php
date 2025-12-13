<?php
declare(strict_types=1);

namespace App\UseCase\Reservation;

use App\Infrastructure\Repository\ReservationRepository;

class GetUserReservations {
    private ReservationRepository $reservationRepo;

    public function __construct() {
        $this->reservationRepo = new ReservationRepository();
    }

    public function execute(array $user): array {
        $reservations = $this->reservationRepo->findByUser((int)$user['id']);
        return ['reservations' => $reservations];
    }
}
