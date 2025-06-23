<?php

namespace App\Jobs;

use SmsAssistent\Sender\Sender;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendSMS implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $to;
    protected $text;

    /**
     * @param $to
     * @param $text
     */
    public function __construct($to, $text)
    {
        $this->to   = $to;
        $this->text = $text;
    }

    public function handle(Sender $sender)
    {
        $result = $sender->sendOne($this->to, $this->text);
        
        if ($result && is_string($result)) {
            file_put_contents('test-sms-status.log', $result . "\n", FILE_APPEND);
            // Создаем задание для проверки статуса через 1 минуту
            //CheckSmsStatus::dispatch($result)->delay(now()->addMinutes(1));
        } else {
            file_put_contents('test-sms-status.log', "Нет результата\n", FILE_APPEND);
        }
    }
}
