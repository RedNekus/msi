<?php

namespace App\Jobs;

use SmsAssistent\Sender\Sender;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Jobs\CheckStatus;

class SuperSender implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $to;
    protected $text;
    protected $lead_id;

    /**
     * @param $to
     * @param $text
     * @param $lead_id
     */
    public function __construct($to, $text, $id = 0)
    {
        $this->to   = $to;
        $this->text = $text;
        $this->lead_id = $id;
    }

    public function handle(Sender $sender)
    {
        $result = $sender->sendOne($this->to, $this->text, $this->lead_id);
        if(isset($result[0]['id'])) {
            $url = "https://lk.yowheels.by/index.php?option=com_pcpartners&task=update_sms_status&format=json";
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_POST, true);
            $sms_id = (int)$result[0]['id'];
            if($sms_id > 0) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, ['lead_id' => $this->lead_id, 'sms_id' => $sms_id]);
            } else {
                curl_setopt($ch, CURLOPT_POSTFIELDS, ['lead_id' => $this->lead_id, 'sms_error' => $sms_id]);
            }

            $err = curl_exec($ch);

            $err = curl_errno($ch);
            $errmsg = curl_error($ch);
            $header = curl_getinfo($ch);
            
            file_put_contents('test_sms-0.log', date('Y.m.d H:i:s') . " test status: " . $result[0]['id'] . "\n", FILE_APPEND);
            sleep(2*60);
            CheckStatus::dispatch($result[0]['id'], $this->lead_id)->delay(now()->addMinutes(2));
        }
    }
}
