<?php
declare(strict_types=1);

namespace App\UseCase\Reservation;

use App\Domain\Repository\ReservationRepository;
use App\Domain\Repository\StationnementRepository;
use App\Domain\Repository\ParkingRepository;

final class GetInvoiceHtml
{
    public function __construct(
        private readonly ReservationRepository $reservationRepo,
        private readonly StationnementRepository $stationnementRepo,
        private readonly ParkingRepository $parkingRepo
    ) {}

    public function execute(int $userId, int $reservationId): string
    {
        $res = $this->reservationRepo->findById($reservationId);
        if (!$res) throw new \RuntimeException('Reservation not found');
        if ($res->userId() !== $userId) throw new \RuntimeException('Forbidden');

        $parking = $this->parkingRepo->findById($res->parkingId());
        if (!$parking) throw new \RuntimeException('Parking not found');

        $st = $this->stationnementRepo->findLastByReservationId($reservationId);

        $entered = $st?->enteredAt()?->format('Y-m-d H:i:s') ?? '—';
        $exited  = $st?->exitedAt()?->format('Y-m-d H:i:s') ?? '—';

        $base = $st?->billedAmount();
        $pen  = $st?->penaltyAmount();
        $total = ($base ?? 0) + ($pen ?? 0);

        return "<!doctype html>
<html lang='fr'>
<head>
<meta charset='utf-8'>
<title>Facture réservation #{$reservationId}</title>
<style>
body{font-family:Arial,sans-serif;margin:24px;color:#111}
h1{margin:0 0 12px}
.card{border:1px solid #ddd;border-radius:10px;padding:16px;margin:12px 0}
.row{display:flex;justify-content:space-between;margin:6px 0}
.small{color:#555;font-size:12px}
</style>
</head>
<body>
<h1>Facture - Réservation #{$reservationId}</h1>
<div class='small'>Générée le ".date('Y-m-d H:i:s')."</div>

<div class='card'>
  <h3>Réservation</h3>
  <div class='row'><div>Parking</div><div>#{$res->parkingId()}</div></div>
  <div class='row'><div>Début réservé</div><div>{$res->startAt()->format('Y-m-d H:i:s')}</div></div>
  <div class='row'><div>Fin réservée</div><div>{$res->endAt()->format('Y-m-d H:i:s')}</div></div>
  <div class='row'><div>Véhicule</div><div>{$res->vehicleType()}</div></div>
</div>

<div class='card'>
  <h3>Stationnement</h3>
  <div class='row'><div>Entrée</div><div>{$entered}</div></div>
  <div class='row'><div>Sortie</div><div>{$exited}</div></div>
</div>

<div class='card'>
  <h3>Montants</h3>
  <div class='row'><div>Base</div><div>".($base !== null ? number_format($base, 2, ',', ' ') . " €" : "—")."</div></div>
  <div class='row'><div>Pénalité</div><div>".($pen !== null ? number_format($pen, 2, ',', ' ') . " €" : "—")."</div></div>
  <hr>
  <div class='row'><strong>Total</strong><strong>".number_format($total, 2, ',', ' ')." €</strong></div>
</div>

<div class='small'>Tarif horaire parking: ".number_format($parking->hourlyRate(), 2, ',', ' ')." €</div>
</body>
</html>";
    }
}
