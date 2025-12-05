<?php
declare(strict_types=1);

namespace App\Infrastructure\Persistence;



use App\Domain\Entity\parking;
use App\Domain\Entity\User;
use App\Domain\Repository\ParkingReservationRepository;
use DateTimeImmutable;
use PDO;

final class SqlReservationRepository implements ParkingReservationRepository
{
    public function save(Parking $parking): void
    {
        // Extraction des valeurs pour la requête
        $gps = $parking->getGps();
        $tarif = $parking->getTarif();
        // Conversion de l'objet DateTime en format SQL standard
        $heureDebut = $parking->getHeureDebut()->format('Y-m-d H:i:s');
        $heureFin = $parking->getHeureFin()->format('Y-m-d H:i:s');

        // --- CAS 1: Création (INSERT) ---
        if ($parking->getId() === null) {
            $sql = "INSERT INTO reservations (gps, tarif, heure_debut, heure_fin) 
                    VALUES (:gps, :tarif, :h_deb, :h_fin)";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':gps'    => $gps,
                ':tarif'  => $tarif,
                ':h_deb'  => $heureDebut,
                ':h_fin'  => $heureFin,
            ]);

            // Récupérer l'ID généré par la DB et l'assigner à l'Entité
            $newId = (int)$this->db->lastInsertId();
            $parking->setId($newId);

        }
        // --- CAS 2: Mise à jour (UPDATE) ---
        else {
            $sql = "UPDATE reservations 
                    SET gps = :gps, tarif = :tarif, heure_debut = :h_deb, heure_fin = :h_fin 
                    WHERE id = :id";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':id'     => $parking->getId(),
                ':gps'    => $gps,
                ':tarif'  => $tarif,
                ':h_deb'  => $heureDebut,
                ':h_fin'  => $heureFin,
            ]);
        }
    }
    public function delete(Parking $reservation): void
    {
        // TODO: Implement delete() method.
    }

    public function getById(int $reservationId): ?parking
    {
        // TODO: Implement getById() method.
    }

    public function isPlaceReserved(int $placeId, DateTimeImmutable $heureDebut, DateTimeImmutable $heureFin): bool
    {
        // TODO: Implement isPlaceReserved() method.
    }
}
