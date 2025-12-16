<?php
declare(strict_types=1);

namespace App\Controller;

use App\Infrastructure\Http\Response;
use App\Infrastructure\Http\IsGranted;
use App\Infrastructure\Security\JwtManager;
use App\UseCase\Owner\ListOwnerParkings;
use App\UseCase\Owner\ListParkingReservationsForOwner;
use App\UseCase\Owner\ListActiveStationnementsForOwner;
use App\UseCase\Parking\CreateParking;


final class OwnerParkingController
{
    public function __construct(
        private JwtManager $jwt,
        private ListOwnerParkings $listOwnerParkings,
        private ListParkingReservationsForOwner $listParkingReservationsForOwner,
        private ListActiveStationnementsForOwner $listActiveStationnementsForOwner,
        private CreateParking $createParking,

    ) {
    }


    public function jwt(): JwtManager
    {
        return $this->jwt;
    }
    
   #[IsGranted('OWNER')]
public function createParking(): void
{
    $payload = $this->jwt->readAccessFromCookie();
    if (!$payload) {
        Response::json(['error' => 'Unauthorized'], 401);
        return;
    }

    $ownerId = (int)($payload['sub'] ?? 0);
    $data = json_decode(file_get_contents('php://input') ?: '[]', true) ?: [];

    try {
        $result = $this->createParking->execute($ownerId, $data);
        Response::json(['success' => true] + $result, 201);
    } catch (\Throwable $e) {
        Response::json(['success' => false, 'error' => $e->getMessage()], 400);
    }
}


    #[IsGranted('OWNER')]
    public function listMyParkings(): void
    {
        $payload = $this->jwt->readAccessFromCookie();
        if (!$payload) {
            Response::json(['error' => 'Unauthorized'], 401);
            return;
        }

        $ownerId = (int) ($payload['sub'] ?? 0);
        $data = $this->listOwnerParkings->execute($ownerId);

        Response::json(['data' => $data], 200);
    }

    #[IsGranted('OWNER')]
    public function listParkingReservations(int $id): void
    {
        $payload = $this->jwt->readAccessFromCookie();
        if (!$payload) {
            Response::json(['error' => 'Unauthorized'], 401);
            return;
        }

        $ownerId = (int) ($payload['sub'] ?? 0);
        $from = isset($_GET['from']) ? (string) $_GET['from'] : null;
        $to = isset($_GET['to']) ? (string) $_GET['to'] : null;

        $data = $this->listParkingReservationsForOwner->execute(
            ownerId: $ownerId,
            parkingId: $id,
            from: $from,
            to: $to
        );

        Response::json(['data' => $data], 200);
    }

    #[IsGranted('OWNER')]
    public function listActiveStationnements(int $id): void
    {
        $payload = $this->jwt->readAccessFromCookie();
        if (!$payload) {
            Response::json(['error' => 'Unauthorized'], 401);
            return;
        }

        $ownerId = (int) ($payload['sub'] ?? 0);

        try {
            $data = $this->listActiveStationnementsForOwner->execute($ownerId, $id);
            Response::json(['data' => $data], 200);
        } catch (\RuntimeException $e) {
            $msg = $e->getMessage();
            $code = ($msg === 'Accès refusé') ? 403 : 404;
            Response::json(['error' => $msg], $code);
        }
    }

}
