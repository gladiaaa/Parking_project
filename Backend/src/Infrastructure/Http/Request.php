<?php
declare(strict_types=1);

namespace App\Infrastructure\Http;

final class Request
{
    public static function rawBody(): string
    {
        // Pendant les tests (PHPUnit), on injecte un body contrôlé
        if (defined('APP_TESTING') && isset($GLOBALS['__TEST_RAW_BODY__'])) {
            return (string) $GLOBALS['__TEST_RAW_BODY__'];
        }

        $raw = file_get_contents('php://input');
        return is_string($raw) ? $raw : '';
    }

    /** @return array<string,mixed> */
    public static function json(): array
    {
        $data = json_decode(self::rawBody(), true);
        return is_array($data) ? $data : [];
    }
}