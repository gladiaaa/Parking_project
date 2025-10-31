<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;
use App\Infrastructure\Security\JwtManager;

final class JwtManagerTest extends TestCase {
  public function testIssueAndDecode(): void {
    $jwt = new JwtManager('secret', 600, 2592000);
    [$access, $refresh] = $jwt->issueFor(7, 'OWNER');
    $pa = $jwt->decode($access);
    $this->assertSame(7, $pa['sub']);
    $this->assertSame('OWNER', $pa['role']);
    $this->assertSame('access', $pa['typ']);
    $pr = $jwt->decode($refresh);
    $this->assertSame('refresh', $pr['typ']);
  }
}
