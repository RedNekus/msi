<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Msi extends Model
{
    use HasFactory;
    const SERVER_STB_URL = 'http://oauth.raschet.by:443';
    const OAUTH2_API_URL = self::SERVER_STB_URL.'/oauth';
    const OAUTH2_API_TOKEN = self::OAUTH2_API_URL.'/token';
    const MSI_API_USERINFO = self::SERVER_STB_URL.'/api/msi.userinfo/v1';
    const REDIRECT_URI = 'https://msi.yoowills.by/auth/';
    const CLIENT_ID = 'JUj8W1FvAoToCsDiaQPoQx1w2LmHFeeh';
    const CLIENT_SECRET = 'SvFjQTN8VK1iqkmILY92frmyzEjSLCxh';
    const PROXY = '192.168.1.214:8090';

    public static function msiToken($code) {
        $data = [
            'client_id' => self::CLIENT_ID,
            'client_secret' => self::CLIENT_SECRET,
            'redirect_uri' => self::REDIRECT_URI,
            'grant_type' => 'authorization_code',
            'code' => $code
        ];
        $base64_client_credentials = base64_encode(self::CLIENT_ID.":".self::CLIENT_SECRET);
        $headers = array(
            'Content-Type: application/x-www-form-urlencoded',
            'Accept: application/json',
            'Authorization: Basic '.$base64_client_credentials,
        );					
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, self::OAUTH2_API_TOKEN);
        curl_setopt($ch, CURLOPT_PROXY, self::PROXY);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_FAILONERROR, true);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 0);
        curl_setopt($ch, CURLOPT_TIMEOUT, 720);
        $exec = curl_exec($ch);
        if ($errno = curl_errno($ch)) {
            $message = curl_strerror($errno);
            echo "cURL error ({$errno}):\n {$message}"; // Выведет: cURL error (35): SSL connect error
        }
        curl_close($ch);
        $response = json_decode($exec);
        return $response;
    }

    public static function msiUserInfo($token) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, self::MSI_API_USERINFO);
        curl_setopt($ch, CURLOPT_PROXY, self::PROXY);
        $headers = [
            'Content-Type: application/x-www-form-urlencoded',
            'Accept: application/json',
            'Authorization: Bearer '.$token,
        ];
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        $exec = curl_exec($ch);
        curl_close($ch);
        $response = json_decode($exec);
        return $response;
    }

    public static function convertMsiInfo($data) {
        echo "<pre>";
        var_dump(json_decode($data));
        echo "</pre>";

        $arrData = json_decode($data);
        return [
            'document_type' => '',
            'document_number' => $arrData->national_id_number,
            'document_series' => $arrData->id_document->seriesNumber,
            'document_date' => $arrData->id_document->issueDate,
            'document_validity' => $arrData->id_document->expireDate,
            'issuedby' => $arrData->id_document->authority
        ];
    }
}
