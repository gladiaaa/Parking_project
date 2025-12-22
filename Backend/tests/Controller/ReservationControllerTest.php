<?php
declare(strict_types=1);

namespace Tests\Controller;

use App\Controller\ReservationController;
use App\Domain\Repository\ReservationRepository;
use App\Infrastructure\Security\JwtManager;
use App\UseCase\CreateReservationInterface;
use App\UseCase\Reservation\EnterReservation;
use App\UseCase\Reservation\ExitReservation;
use App\UseCase\Reservation\GetInvoiceHtml;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

final class ReservationControllerTest extends TestCase
{
    private ReservationController $controller;

    /** @var MockObject&CreateReservationInterface */
    private MockObject $createReservation;

    /** @var MockObject&ReservationRepository */
    private MockObject $repository;

    /** @var MockObject&JwtManager */
    private MockObject $jwtManager;

    /** @var MockObject&EnterReservation */
    private MockObject $enterReservation;

    /** @var MockObject&ExitReservation */
    private MockObject $exitReservation;

    /** @var MockObject&GetInvoiceHtml */
    private MockObject $getInvoiceHtml;

    protected function setUp(): void
    {
        $this->createReservation = $this->createMock(CreateReservationInterface::class);
        $this->repository = $this->createMock(ReservationRepository::class);
        $this->jwtManager = $this->createMock(JwtManager::class);
        $this->enterReservation = $this->createMock(EnterReservation::class);
        $this->exitReservation = $this->createMock(ExitReservation::class);
        $this->getInvoiceHtml = $this->createMock(GetInvoiceHtml::class);

        $this->controller = new ReservationController(
            $this->createReservation,
            $this->repository,
            $this->jwtManager,
            $this->enterReservation,
            $this->exitReservation,
            $this->getInvoiceHtml
        );
    }

    /**
     * Teste la récupération des réservations de l'utilisateur
     */
    public function testMyReservationsSuccess(): void
    {
        $this->jwtManager->method('readAccessFromCookie')
            ->willReturn(['sub' => 42, 'typ' => 'access']);

        $this->repository->expects($this->once())
            ->method('findByUserId')
            ->with(42)
            ->willReturn([]);

        ob_start();
        $this->controller->myReservations();
        $output = ob_get_clean();

        $this->assertStringContainsString('"data":[]', $output);
    }

    /**
     * Teste l'entrée dans le parking
     */
    public function testEnterSuccess(): void
    {
        $this->jwtManager->method('readAccessFromCookie')
            ->willReturn(['sub' => 42, 'typ' => 'access']);

        $stationnementMock = $this->createMock(\App\Domain\Entity\Stationnement::class);
        $stationnementMock->method('id')->willReturn(100);
        $stationnementMock->method('reservationId')->willReturn(500);
        $stationnementMock->method('enteredAt')->willReturn(new \DateTimeImmutable('2023-10-10 10:00:00'));

        $this->enterReservation->expects($this->once())
            ->method('execute')
            ->with(42, 500)
            ->willReturn($stationnementMock);

        ob_start();
        $this->controller->enter(500);
        $result = ob_get_clean();

        $data = json_decode($result, true);

        $this->assertIsArray($data);
        $this->assertTrue($data['success']);
        $this->assertEquals(100, $data['stationnement_id']);
    }

    /**
     * Teste le cas Unauthorized (pas de JWT)
     */
    public function testRequireUserIdFailsWhenNoToken(): void
    {
        $this->jwtManager->method('readAccessFromCookie')
            ->willReturn(null);

        $this->expectOutputRegex('/Unauthorized/i');

        try {
            $this->controller->myReservations();
        } catch (\Throwable) {
            // Si le code appelle app_exit() / exit, on ignore ici.
        }
    }
}