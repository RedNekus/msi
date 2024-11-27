<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class Bitrix extends Model
{
    use HasFactory;
    const BX_USER_ID = '43';
    const BX_TOKEN = 'oe3fy79wpdjuym8v';
    const HOOK_URL = 'https://yoow.bitrix24.by/rest';
    private static function BXQuery($action, $params) {
        $url = implode('/', [self::HOOK_URL,self::BX_USER_ID,self::BX_TOKEN,$action]);
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type:application/json'] );
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_FAILONERROR, 1);
        curl_setopt($ch, CURLOPT_AUTOREFERER, 1);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $params);

        $content = curl_exec($ch);

        $err = curl_errno($ch);
        $errmsg = curl_error($ch);
        $header = curl_getinfo($ch);

        if($content) {
            return $content;
        } else {
            return json_encode(['err' => $err, 'msg' => $errmsg, 'url' => $url]);
        }
    }
    public static function getDealData($id) {
        $data = self::BXQuery('crm.deal.get.json', json_encode(['id' => (int)$id]));
        return $data;
    }
    public static function getUserData($id) {
        $data = self::BXQuery('crm.contact.get.json', json_encode(['ID' => (int)$id]));
        return $data;
    }
    private static function prepareDealData($data) {
        $queryParams = [
            'fields' => [
                "TITLE" => "Заполнена анкета",
                "TYPE_ID" => "GOODS", 
                "STAGE_ID" => "NEW",
                "CONTACT_ID" => $data['contact_id'] ?? 0,
                "OPENED" => "Y",
                "CURRENCY_ID" => "USD",
                "OPPORTUNITY" => $data['price'] ?? 0,
                "ASSIGNED_BY_ID" => 135,
                "UF_CRM_1732543687" => $data['model'] ?? "", //марка
                "UF_CRM_1732543715" => $data['link'] ?? "", //ссылка на автомобиль
                "UF_CRM_664C94A742925" => $data['term'] ?? "", //срок лизинга
                "UF_CRM_65DDB202BF4AA" => $data['down_payment'] ?? "", //первоначальный взнос (Авансовый платеж)
            ],
            'params' => ['REGISTER_SONET_EVENT' => 'Y']
        ];
        if(isset($data['deal_id']) && (int)$data['deal_id']) {
            $queryParams['id'] = $data['deal_id'];
        }
        return json_encode($queryParams);
    }
    private static function prepareContactData($data) {
        $queryParams = [
            'fields' => [
                "NAME" => $data['firstrname'] ?? '',
                "SECOND_NAME" => $data['middlename'] ?? '',
                "LAST_NAME" =>  $data['lastname'] ?? '',
                "OPENED" => "Y",
                "ASSIGNED_BY_ID" => 1,
                "TYPE_ID" => "CLIENT",
                "SOURCE_ID" => "SELF",
                "PHONE" => [[ "VALUE" => $data['phone'] ?? '', "VALUE_TYPE" => "WORK" ]]
            ],
            'params' => ['REGISTER_SONET_EVENT' => 'Y']
        ];
        if(isset($data['contact_id']) && (int)$data['contact_id']) {
            $queryParams['id'] = $data['contact_id'];
        }
        return json_encode($queryParams);
    }
    public static function creteDeal($request) {
        $data = $request->all();
        $data['contact_id']= $request->session()->get('contact_id');
        $params = self::prepareDealData($data);
        $res = self::BXQuery('crm.deal.add.json', $params);
        return $res;
    }
    public static function updateDeal($request) {
        $data = $request->all();
        $data['deal_id'] = $request->session()->get('deal_id') ?? 0;
        if(!$data['deal_id']) {
            return 0;
        }
        $data['contact_id']= $request->session()->get('contact_id') ?? 0;
        $params = self::prepareDealData($data);
        $res = self::BXQuery('crm.deal.update.json', $params);
        return $res;
    }
    public static function creteUser($data) {
        $params = self::prepareContactData($data);
        $res = self::BXQuery('crm.contact.add.json', $params);
        $resObj = json_decode($res);
        echo 'test'. (int)$resObj->result;
        User::create([
            'name' => $data['firstrname'],
            'phone' => $data['phone'],
            'lastname' => $data['lastname'],
            'middlename' => $data['middlename'],
            'bitrix_id' => (int)($resObj->result),
            'password' => Hash::make('1p@ssWord2'),
        ]);
        return $res;
    }
    public static function updateUser($data) {
        if(!$data['contact_id']) {
            return 0;
        }
        $params = prepareContactData($data);
        $res = self::BXQuery('crm.contact.update.json', $params);
        return $res;
    }
}
