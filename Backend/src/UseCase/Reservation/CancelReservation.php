<?php
declare(strict_types=1);

namespace App\UseCase\Reservation;

use App\Domain\Repository\ReservationRepository;

final class CancelReservation
{
    public function __construct(
        private readonly ReservationRepository $reservationRepo
    ) {}

    public function execute(int $userId, int $reservationId): array
    {
        $now = (new \DateTimeImmutable('now'))->format('Y-m-d H:i:s');

        $ok = $this->reservationRepo->cancelForUser($userId, $reservationId, $now);

        if (!$ok) {
            throw new \RuntimeException("Impossible d'annuler: réservation inexistante, déjà annulée/terminée, ou déjà commencée.");
        }

        return [
            'reservation_id' => $reservationId,
            'status' => 'annulée',
            'cancelled_at' => (new \DateTimeImmutable('now'))->format(DATE_ATOM),
        ];
    }
}
