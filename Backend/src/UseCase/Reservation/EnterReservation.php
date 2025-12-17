<?php
declare(strict_types=1);

namespace App\UseCase\Reservation;

use App\Domain\Repository\ReservationRepository;
use App\Domain\Repository\StationnementRepository;
use App\Domain\Entity\Stationnement;

final class EnterReservation
{
    public function __construct(
        private readonly ReservationRepository $reservationRepo,
        private readonly StationnementRepository $stationnementRepo
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

        $active = $this->stationnementRepo->findActiveByReservationId($reservationId);
        if ($active) {
            throw new \RuntimeException('Already entered');
        }

        $s = Stationnement::enter($reservationId, $now);
        return $this->stationnementRepo->save($s);
    }
}
