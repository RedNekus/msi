<?php

namespace App\Jobs;

use SmsAssistent\Sender\Sender;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CheckStatus implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $messageId;
    protected $leadId;

    public function __construct($messageId, $leadId)
    {
        $this->messageId = (int)$messageId;
        $this->leadId = (int)$leadId;
    }

    public function handle(Sender $sender)
    {
        // Запрос статуса по ID сообщения
        $status = $sender->getStatus($this->messageId);
        $url = "https://lk.yowheels.by/index.php?option=com_pcpartners&task=update_sms_status&format=json";
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        $sms_status = $status[0]['status'];
        if($sms_status) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, ['lead_id' => $this->leadId, 'status' => $sms_status]);
        }

        $err = curl_exec($ch);

        $err = curl_errno($ch);
        $errmsg = curl_error($ch);
        $header = curl_getinfo($ch);
        file_put_contents('test_sms-00.log', date('Y.m.d H:i:s') . " test status: {$sms_status}\n", FILE_APPEND);
    }
}