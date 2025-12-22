<?php
declare(strict_types=1);

namespace Tests\Infrastructure\Http;

use App\Infrastructure\Http\IsGranted;
use App\Infrastructure\Http\Response;
use App\Infrastructure\Http\Router;
use App\Infrastructure\Security\JwtManager;
use PHPUnit\Framework\TestCase;

final class RouterTest extends TestCase
{
    private Router $router;

    protected function setUp(): void
    {
        $this->router = new Router();

        // reset globals between tests
        $_COOKIE = [];
        $_SERVER = [];

        if (function_exists('header_remove')) {
            header_remove();
        }

        http_response_code(200);
    }

    public function testDispatchReturns404WhenNoRouteMatches(): void
    {
        ob_start();
        $this->router->dispatch('GET', '/nope');
        $out = (string) ob_get_clean();

        self::assertSame(404, http_response_code());
        self::assertJson($out);
        self::assertSame(['error' => 'Not found'], json_decode($out, true));
    }

    public function testExactRouteMatchWorks(): void
    {
        $this->router->get('/ping', function (): void {
            Response::json(['ok' => true], 200);
        });

        ob_start();
        $this->router->dispatch('GET', '/ping');
        $out = (string) ob_get_clean();

        self::assertSame(200, http_response_code());
        self::assertSame(['ok' => true], json_decode($out, true));
    }

    public function testTrailingSlashIsNormalized(): void
    {
        $this->router->get('/ping', function (): void {
            Response::json(['ok' => true], 200);
        });

        ob_start();
        $this->router->dispatch('GET', '/ping/');
        $out = (string) ob_get_clean();

        self::assertSame(200, http_response_code());
        self::assertSame(['ok' => true], json_decode($out, true));
    }

    public function testPathVariablesAreExtractedAndCastToInt(): void
    {
        $this->router->get('/users/{id}', function (int $id): void {
            Response::json(['id' => $id], 200);
        });

        ob_start();
        $this->router->dispatch('GET', '/users/42');
        $out = (string) ob_get_clean();

        self::assertSame(200, http_response_code());
        self::assertSame(['id' => 42], json_decode($out, true));
    }

    public function testPathVariablesCanBeStringsToo(): void
    {
        $this->router->get('/tags/{name}', function (string $name): void {
            Response::json(['name' => $name], 200);
        });

        ob_start();
        $this->router->dispatch('GET', '/tags/hello-world');
        $out = (string) ob_get_clean();

        self::assertSame(200, http_response_code());
        self::assertSame(['name' => 'hello-world'], json_decode($out, true));
    }

    public function testGuardAllowsWhenRoleIsSufficient(): void
    {
        $jwt = $this->makeJwt();
        [$access] = $jwt->issueFor(1, 'OWNER');
        $_COOKIE['ACCESS_TOKEN'] = $access;

        $controller = new class($jwt) {
            public function __construct(private JwtManager $jwt) {}

            public function jwt(): JwtManager
            {
                return $this->jwt;
            }

            #[IsGranted('OWNER')]
            public function ok(): void
            {
                Response::json(['ok' => true], 200);
            }
        };

        $this->router->get('/secure', [$controller, 'ok']);

        ob_start();
        $this->router->dispatch('GET', '/secure');
        $out = (string) ob_get_clean();

        self::assertSame(200, http_response_code());
        self::assertSame(['ok' => true], json_decode($out, true));
    }

    public function testGuardReturns401WhenNoCookie(): void
    {
        $jwt = $this->makeJwt();

        // Flag pour prouver que le handler n'est pas exécuté
        $called = false;

        $controller = new class($jwt, $called) {
            public function __construct(
                private JwtManager $jwt,
                private bool &$called
            ) {}

            public function jwt(): JwtManager
            {
                return $this->jwt;
            }

            #[IsGranted('USER')]
            public function secure(): void
            {
                // Si ça s'exécute, c'est que le Router est buggé
                $this->called = true;
                Response::json(['ok' => true], 200);
            }
        };

        $router = new Router();
        $router->get('/secure', [$controller, 'secure']);

        ob_start();
        $router->dispatch('GET', '/secure');
        $out = (string) ob_get_clean();

        self::assertFalse($called, 'Le handler ne doit pas être appelé si Unauthorized.');
        self::assertSame(401, http_response_code());
        self::assertSame(['error' => 'Unauthorized'], json_decode($out, true));
    }

    public function testGuardReturns403WhenRoleTooLow(): void
    {
        $jwt = $this->makeJwt();
        [$access] = $jwt->issueFor(1, 'USER');
        $_COOKIE['ACCESS_TOKEN'] = $access;

        $called = false;

        $controller = new class($jwt, $called) {
            public function __construct(
                private JwtManager $jwt,
                private bool &$called
            ) {}

            public function jwt(): JwtManager
            {
                return $this->jwt;
            }

            #[IsGranted('OWNER')]
            public function secure(): void
            {
                $this->called = true;
                Response::json(['ok' => true], 200);
            }
        };

        $router = new Router();
        $router->get('/secure', [$controller, 'secure']);

        ob_start();
        $router->dispatch('GET', '/secure');
        $out = (string) ob_get_clean();

        self::assertFalse($called, 'Le handler ne doit pas être appelé si Forbidden.');
        self::assertSame(403, http_response_code());
        self::assertSame(['error' => 'Forbidden'], json_decode($out, true));
    }

    private function makeJwt(): JwtManager
    {
        // On évite dépendre de .env ici.
        return new JwtManager('test_secret_for_tests', 3600, 86400);
    }
}
