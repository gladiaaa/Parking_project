<?php
declare(strict_types=1);

namespace Tests\Infrastructure\Http;

use App\Infrastructure\Http\IsGranted;
use App\Infrastructure\Security\JwtManager;
use PHPUnit\Framework\TestCase;

final class IsGrantedTest extends TestCase
{
    protected function setUp(): void
    {
        $_COOKIE = [];
        if (function_exists('header_remove')) {
            header_remove();
        }
        http_response_code(200);
    }

    #[\PHPUnit\Framework\Attributes\RunInSeparateProcess]
    #[\PHPUnit\Framework\Attributes\PreserveGlobalState(false)]
    public function testAssertReturns401WhenNoToken(): void
    {
        $jwt = new JwtManager('test_secret_for_tests', 3600, 86400);

        $guard = new IsGranted('USER');

        ob_start();
        $guard->assert($jwt);
        $out = (string)ob_get_clean();

        $this->assertSame(401, http_response_code());
        $this->assertSame(['error' => 'Unauthorized'], json_decode($out, true));
    }

    #[\PHPUnit\Framework\Attributes\RunInSeparateProcess]
    #[\PHPUnit\Framework\Attributes\PreserveGlobalState(false)]
    public function testAssertReturns403WhenRoleTooLow(): void
    {
        $jwt = new JwtManager('test_secret_for_tests', 3600, 86400);
        [$access] = $jwt->issueFor(1, 'USER');
        $_COOKIE['ACCESS_TOKEN'] = $access;

        $guard = new IsGranted('OWNER');

        ob_start();
        $guard->assert($jwt);
        $out = (string)ob_get_clean();

        $this->assertSame(403, http_response_code());
        $this->assertSame(['error' => 'Forbidden'], json_decode($out, true));
    }

    public function testAssertAllowsWhenRoleIsEnough(): void
    {
        $jwt = new JwtManager('test_secret_for_tests', 3600, 86400);
        [$access] = $jwt->issueFor(1, 'ADMIN');
        $_COOKIE['ACCESS_TOKEN'] = $access;

        $guard = new IsGranted('OWNER');

        // Pas de exit ici, ça doit juste passer.
        $guard->assert($jwt);

        $this->assertTrue(true);
    }
}
