<?php
class User
{
    public string $email;
    public string $password;
    public string $name;
    public string $prenoms;
    public array $list_reservation;
    public array $list_parking;

    // Constructeur (appelé à la création d’un objet)
    public function __construct(
        string $email,
        string $password,
        string $name,
        string $prenoms,
        array $list_reservation = [],
        array $list_parking = []
    ) {
        $this->email = $email;
        $this->password = $password;
        $this->name = $name;
        $this->prenoms = $prenoms;
        $this->list_reservation = $list_reservation;
        $this->list_parking = $list_parking;
    }

    public function getPassword(): string
    {
        return $this->password;
    }

    public function setPassword(string $password): void
    {
        $this->password = $password;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function setEmail(string $email): void
    {
        $this->email = $email;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    public function getPrenoms(): string
    {
        return $this->prenoms;
    }

    public function setPrenoms(string $prenoms): void
    {
        $this->prenoms = $prenoms;
    }
}
?>
