<?php

namespace App\Jobs;

use SmsAssistent\Sender\Sender;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendSMS implements ShouldQueue
{
    use Queueable;

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
        $sender->sendOne($this->to, $this->text);
    }
}