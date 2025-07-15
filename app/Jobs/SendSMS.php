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
        //file_put_contents('test_sms.log', "Дата: " . date('d.m.Y H:i:s') . "\n", FILE_APPEND);
        //file_put_contents('test_sms.log', date('d.m.Y H:i:s') . " START " . $this->to . "\n", FILE_APPEND);
        $result = $sender->sendOne($this->to, $this->text);
        //$testVar = var_export($result, true);
        //file_put_contents('test_sms.log', date('d.m.Y H:i:s') . " ТЕСТ " . json_encode($testVar) . "\n", FILE_APPEND);
        sleep(2);
        if ( $result && isset($result[0]) ) {
            file_put_contents('test_sms.log', date('d.m.Y H:i:s') . " Есть результат:\n" . json_encode($result) . "\n", FILE_APPEND);
            //file_put_contents('test_sms_status.log', "Статус: " . $sender->getStatus() . "\n", FILE_APPEND);
            // Создаем задание для проверки статуса через 1 минуту
            //CheckSmsStatus::dispatch($result)->delay(now()->addMinutes(1));
        } else {
            file_put_contents('test_sms.log', date('d.m.Y H:i:s') . " Нет результата", FILE_APPEND);
        }
    }
}
