<?php
declare(strict_types=1);

namespace App\UseCase\Reservation;

use App\Domain\Repository\ParkingRepository;
use App\Domain\Repository\ReservationRepository;
use App\Domain\Repository\StationnementRepository;
use App\Domain\Entity\Stationnement;

final class EnterReservation
{
    public function __construct(
        private readonly ReservationRepository $reservationRepo,
        private readonly StationnementRepository $stationnementRepo,
        private readonly ParkingRepository $parkingRepo
    ) {}

    public function execute(int $userId, int $reservationId): Stationnement
    {
        $res = $this->reservationRepo->findById($reservationId);
        if (!$res) {
            throw new \RuntimeException('Reservation not found');
        }

        if ($res->userId() !== $userId) {
            throw new \RuntimeException('Forbidden');
        }

        $now = new \DateTimeImmutable('now');

        // "réservation active" = now entre start et end
        if ($now < $res->startAt() || $now > $res->endAt()) {
            throw new \RuntimeException('Reservation not active');
        }

        // ✅ NEW: parking doit être ouvert à l’instant de l’entrée
        $parking = $this->parkingRepo->findById($res->parkingId());
        if ($parking === null) {
            throw new \RuntimeException('Parking not found');
        }

        if (!$parking->isOpenAt($now)) {
            throw new \RuntimeException('Parking closed: entry not allowed');
        }

        $active = $this->stationnementRepo->findActiveByReservationId($reservationId);
        if ($active) {
            throw new \RuntimeException('Already entered');
        }

        $s = Stationnement::enter($reservationId, $now);
        return $this->stationnementRepo->save($s);
    }
}
