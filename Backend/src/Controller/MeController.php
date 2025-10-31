<?php
declare(strict_types=1);

namespace App\Controller;

use App\Infrastructure\Http\Response;
use App\UseCase\Auth\GetCurrentUser;
use App\Infrastructure\Security\JwtManager;
use App\Domain\Repository\UserRepository;

final class MeController {
  public function __construct(private UserRepository $users, private JwtManager $jwt) {}

  public function me(): void {
    $res = (new GetCurrentUser($this->jwt, $this->users))->__invoke();
    if (!$res) { Response::json(['error'=>'Unauthorized'], 401); return; }
    Response::json($res);
  }
}
