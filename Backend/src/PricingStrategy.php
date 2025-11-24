<?php

class PricingStrategy
{
    private float $ratePerHour;
    private  string $currency;
    private const  BILLING_INTERVAL_MINUTES = 15;

    /**
     * @param float $ratePerHour Le taux de base par heure.
     * @param string $currency La devise.
     */
    public function __construct(float $ratePerHour, string $currency = 'EUR')
    {
        $this->ratePerHour = $ratePerHour;
        $this->currency = $currency;
    }

    /**
     * Calcule le coût total facturé pour une période de stationnement.
     * La facturation s'effectue par intervalles de 15 minutes entamés.
     * * @param DateTime $startTime Heure de début.
     * @param DateTime $endTime Heure de fin.
     * @return float Le coût total basé sur le temps passé et le taux.
     */
    public function calculateCost(DateTime $startTime, DateTime $endTime): float
    {
        $interval = $startTime->diff($endTime);
        $seconds = $interval->days * 86400
            + $interval->h * 3600
            + $interval->i * 60
            + $interval->s;
        $totalMinutes = $seconds / 60;

        $intervalLength = self::BILLING_INTERVAL_MINUTES;


        $numIntervalsBilled = ceil($totalMinutes / $intervalLength);


        $billedHours = $numIntervalsBilled * ($intervalLength / 60);


        $cost = $billedHours * $this->ratePerHour;

        return max(0.0, $cost);
    }
    public function getRatePerHour(): float
    {
        return $this->ratePerHour;
    }

    public function getCurrency(): string
    {
        return $this->currency;
    }
}