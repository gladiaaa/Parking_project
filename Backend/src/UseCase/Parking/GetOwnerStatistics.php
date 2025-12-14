<?php
declare(strict_types=1);

namespace App\UseCase\Parking;

use App\Infrastructure\Repository\ReservationRepository;
use Exception;

class GetOwnerStatistics {
    private ReservationRepository $reservationRepo;

    public function __construct() {
        $this->reservationRepo = new ReservationRepository();
    }

    public function execute(array $user): array {
        if ($user['role'] !== 'owner') {
            throw new Exception('Non autorisé', 401);
        }

        $revenue = $this->reservationRepo->getMonthlyRevenue((int)$user['id']);
        $activeReservations = $this->reservationRepo->countActiveByOwner((int)$user['id']);
        $activeStationnements = $this->reservationRepo->countActiveStationnementsByOwner((int)$user['id']);

        return [
            'revenus_mensuels' => $revenue,
            'reservations_en_cours' => $activeReservations,
            'stationnements_actifs' => $activeStationnements
        ];
    }
}
