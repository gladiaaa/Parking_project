<?php

use App\Infrastructure\Http\Response;

final class ReservationController
{

    public function __construct(
        private ReservationManagement $reservationManagement
    ) {}

    public function newAction(): Response
    {

        $places = $this->reservationService->save();
        return $this->render('reservation/new.html.twig', [
            'places' => $places
        ]);
    }

}