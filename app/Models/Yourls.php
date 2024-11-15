<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Yourls extends Model
{
    use HasFactory;
    const API_URL = 'http://msi.yoowills.local/s/yourls-api.php';
    const MSI_URL = 'https://ioauth.raschet.by/oauth/authorize';
    const CLIENT_ID = 'JUj8W1FvAoToCsDiaQPoQx1w2LmHFeeh';
    const REDIRECT_URL = 'https://msi.yoowills.by';

    public static function setShort($state) {
        $data = [
            'action' => 'shorturl',
            'format' => 'json',
            'signature' => 'b16f87440c',
            'url' => self::MSI_URL . '?client_id=' . self::CLIENT_ID . '&state=' . $state . '&response_type=code&authentication=online_otp&redirect_uri=' . urlencode(self::REDIRECT_URL) . '%2Fauth%2F&scope=msi_subject+msi_national_id_number+msi_id_document+msi_contact+msi_user_registration_info+msi_session_info',
        ];
        $headers = [
            'Content-Type: application/x-www-form-urlencoded',
            'Accept: application/json'
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, self::API_URL);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        $exec = curl_exec($ch);
        curl_close($ch);
        $response = json_decode($exec);
        if(isset($response->status) && $response->status === 'success') {
            return $response->shorturl;
        } else {
            if(isset($response->shorturl) && '' !== $response->shorturl) {
                return $response->shorturl;
            } else {
                return "{$response->errorCode}:{$response->code}";
            }
        }
    }
}
