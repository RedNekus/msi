<?php
namespace App\Jobs;

use Jurager\Sender\Sender;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

class CheckSmsStatus extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    protected $messageId;

    public function __construct($messageId)
    {
        $this->messageId = $messageId;
    }

    public function handle(Sender $sender)
    {
        // Запрос статуса по ID сообщения
        $status = $sender->getStatus($this->messageId);

        return $status;
    }
}