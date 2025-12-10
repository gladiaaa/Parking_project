<?php

namespace App\UseCase;

use App\Domain\Entity\parking;
use App\Domain\Repository\ParkingReservationRepository;
use DateTimeImmutable;
use InvalidArgumentException;

class ReserverParking
{
// Le Use Case dépend du CONTRAT (l'Interface Repository), pas de l'implémentation BDD concrète.
    public function __construct(
        private ParkingReservationRepository $repository
    ) {}

    /**
     * Exécute le processus de réservation.
     * * @param string $gps La localisation GPS de l'emplacement.
     * @param float $tarif Le tarif applicable.
     * @param DateTimeImmutable $heureDebut L'heure de début de la réservation.
     * @param DateTimeImmutable $heureFin L'heure de fin de la réservation.
     * @param int $placeId L'identifiant de la place à réserver (hypothèse pour la vérification).
     * @return Parking L'entité de réservation nouvellement créée.
     * @throws InvalidArgumentException Si la place est déjà réservée ou si les heures sont invalides.
     */
    public function execute(
        string $gps,
        float $tarif,
        DateTimeImmutable $heureDebut,
        DateTimeImmutable $heureFin,
        int $placeId
    ): Parking {

        // --- 1. Logique métier / Validation des données ---

        if ($heureDebut >= $heureFin) {
            throw new InvalidArgumentException("L'heure de fin doit être postérieure à l'heure de début.");
        }

        if ($heureDebut < new DateTimeImmutable()) {
            throw new InvalidArgumentException("Impossible de réserver dans le passé.");
        }

        // --- 2. Utilisation du Repository (Vérification de la disponibilité) ---

        // Le Use Case utilise la méthode définie dans l'Interface pour vérifier si le créneau est libre.
        if ($this->repository->isPlaceReserved($placeId, $heureDebut, $heureFin)) {
            // L'exception métier (Business Exception) est levée ici.
            throw new InvalidArgumentException(sprintf(
                "La place %d est déjà réservée pour ce créneau horaire.",
                $placeId
            ));
        }
        $parkingEntity = new Parking(
            $gps,
            $tarif,
            \DateTime::createFromImmutable($heureDebut),
            \DateTime::createFromImmutable($heureFin),
            [] // list_stationnement, non géré dans ce use case
        );

        // --- 4. Persistance (Sauvegarde) ---


        $this->repository->save($parkingEntity);

        return $parkingEntity;
    }
}