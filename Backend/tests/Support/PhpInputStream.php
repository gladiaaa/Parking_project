<?php
declare(strict_types=1);

namespace App\Tests\Support;

final class PhpInputStream
{
    public static string $content = '';
    private int $index = 0;

    public function stream_open(): bool { $this->index = 0; return true; }

    public function stream_read(int $count): string
    {
        $ret = substr(self::$content, $this->index, $count);
        $this->index += strlen($ret);
        return $ret;
    }

    public function stream_eof(): bool
    {
        return $this->index >= strlen(self::$content);
    }

    public function stream_stat(): array { return []; }
}