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
                "CONTACT_ID" => $data['contact_id'],
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
    private static function preparePassportData($data) {
        $num = substr($data['document_series'], 0, 2);
        $series = substr($data['document_series'], 2);
        $data = [
            'fields' => [
                "RQ_IDENT_DOC" => $data['document_type'], //Вид документа
                "RQ_IDENT_DOC_SER" =>  $num, //серия
                "RQ_IDENT_DOC_NUM" =>  $series, //номер
                "RQ_IDENT_DOC_PERS_NUM" => $data['document_number'], // идентификационный номер
                "RQ_IDENT_DOC_DATE" => $data['document_date'], // дата выдачи
                "UF_CRM_1733410954" => $data['document_validity'], // срок действия
                "RQ_IDENT_DOC_ISSUED_BY" => $data['issuedby'], //Кем выдан
            ]  
        ];
        if(!empty($data['PresetID']) && !empty($data['requisite_name'])) {
            $data['fields'] = [...[
                'ENTITY_TYPE_ID' => $data['entity_type'],
                'ENTITY_ID' => $data[ 'contact_id' ],//contact id
                'PRESET_ID' => $data['PresetID'],
                'ACTIVE' => 'Y',
                'NAME' => $data['requisite_name']
            ], ...$data['fields']];
        }
        return $data;
    }
    private static function prepareAddrData($data) {
        $queryParams = [
            'fields' => [
                "TYPE_ID" => $data["TYPE_ID"],
                "ENTITY_TYPE_ID" => $data["ENTITY_TYPE_ID"],
                "ENTITY_ID" => $data["ENTITY_ID"],
                "POSTAL_CODE" => $data["zip_code"] ?? '',
                "ADDRESS_1" => implode(", ", [$data['street'], $data['house'], $data['housing']]),
                "ADDRESS_2" => $data['apartment'] ?? '',
                "CITY" => $data['settlement'] ?? ''
            ],
            'params' => ['REGISTER_SONET_EVENT' => 'Y']
        ];
        return json_encode($queryParams);
    }
    private static function prepareRequisiteData($data) {
        $queryParams = [
            'fields' => [
				'ENTITY_TYPE_ID' => 3,
				'ENTITY_ID' => $data[ 'contact_id' ],//contact id
				'PRESET_ID' => $data['PresetID'],
				'ACTIVE' => 'Y',
				'NAME' => $data['requisite_name']
            ],
            'params' => ['REGISTER_SONET_EVENT' => 'Y']
        ];
        if(isset($data['id']) && '' !== $data['id']) {
            $queryParams['id'] = $data['id'];
        }
        return json_encode($queryParams);  
    }
    private static function prepareInfoData($data) {
        $queryParams = [
            'fields' => [
                "UF_CRM_664C9676C5442" => $data['workplace'], //Место работы
                "UF_CRM_664C9676D12F2" => $data['position'], //Должность
                "UF_CRM_1732540293158" => $data['experience'], //Стаж работы на последнем месте, мес.
                "UF_CRM_1732541815194" => $data['income'], //Среднемесячный доход
                "UF_CRM_1732541938356" => $data['hr_phone'], //Телефон отдела кадров/бухгалтерии
                "UF_CRM_1732542363048" => $data['spouse_name'], //Ф.И.О. супруга(и)/ ближайщего родcтвенника
                "UF_CRM_1732542288007" => $data['marital_status'], //Семейное положение [891 => 'Не женат/ не замужем', 893 => 'Женат/ замужем', 895 => 'Вдовец/ вдова']
                "UF_CRM_1732542429824" => $data['spouse_phone'], //Телефон супруга(и)/ ближайшего родсвенника
                "UF_CRM_1732542562113" => $data['spouse_workplace'], //Место работы супруга(и)/ ближайшего родственника
                "UF_CRM_1732542638985" => $data['spouse_income'], //Среднемесячный доход супруга(и)/ ближайшего родственника
                "UF_CRM_1732542718544" => $data['dependents'], //Количество иждивенцев
                "UF_CRM_1732542745561" => $data['contact_person'], //Контактное лицо
                "UF_CRM_1732542763384" => $data['person_phone'], //Телефон контактного лица
            ],
            'params' => ['REGISTER_SONET_EVENT' => 'Y']
        ];
        if(isset($data['contact_id']) && (int)$data['contact_id']) {
            $queryParams['id'] = $data['contact_id'];
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
    public static function creteDeal($data) {
        if(!$data['contact_id']) {
            $data['contact_id'] = $request->session()->get('contact_id');
        }
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
        if(!$data['contact_id']) {
            $data['contact_id']= $request->session()->get('contact_id') ?? 0;
        }
        $params = self::prepareDealData($data);
        $res = self::BXQuery('crm.deal.update.json', $params);
        return $res;
    }
    public static function creteUser($data) {
        $params = self::prepareContactData($data);
        $res = self::BXQuery('crm.contact.add.json', $params);
        $resObj = json_decode($res);
        $genders= ['М' => 1, 'Ж' => 0];
        echo 'test'. (int)$resObj->result;
        $birthdate = array_reverse(explode('.', $data['birthday']));
        $birthdate = implode('-', $birthdate) . ' 00:00:00';
        User::create([
            'name' => $data['firstrname'],
            'phone' => $data['phone'],
            'lastname' => $data['lastname'],
            'middlename' => $data['middlename'],
            'bitrix_id' => (int)($resObj->result),
            'gender' => $genders[$data['gender']] ?? 0,
            'birthdate' => $birthdate,
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
    public static function addUserInfo($data) {
        if(!$data['contact_id']) {
            $data['contact_id']= $request->session()->get('contact_id') ?? 0;
        }
        if(!$data['contact_id']) {
            return 0;
        }
        $params = self::prepareInfoData($data);
        $res = self::BXQuery('crm.contact.update.json', $params);
        return $res;
    }
    public static function addUserAddress($data) {
        if(empty($data['contact_id'])) {
            $data['contact_id']= session()->get('contact_id') ?? 0;
        }
        if($data['contact_id']) {
            $requisiteFilter = [
                "order" => [ "DATE_CREATE" => "ASC" ],
                "filter" => [ "ENTITY_ID" => $data['contact_id']],
                "select"=> [ "ID" ]        
            ];
            $requisites = json_decode(self::BXQuery('crm.requisite.list.json', json_encode($requisiteFilter)));
            if(empty($requisites->result)) {
                $data['PresetID'] = 3;
                $data['entity_type'] = 3;
                $data['requisite_name'] = "Паспотные данные";
                $params = self::prepareRequisiteData($data);
                $resultRequisite = json_decode(self::BXQuery('crm.requisite.add.json', $params));
                $data[ 'ENTITY_ID' ] = $resultRequisite->result;//id requisite
                $data[ 'TYPE_ID' ] = $data['type_id'] ?? 1;
                $data[ 'ENTITY_TYPE_ID' ] = 8;
                $params = self::prepareAddrData($data);
                $res = self::BXQuery('crm.address.add.json', $params);
            } else {
                $data[ 'ENTITY_ID' ] = $requisites->result[0]->ID;//id requisite
                $data[ 'TYPE_ID' ] = $data['type_id'] ?? 1;
                $data[ 'ENTITY_TYPE_ID' ] =  8;
                $params = self::prepareAddrData($data);
                $res = self::BXQuery('crm.address.update.json', $params);
            }
           return $res;
        }
    }
    public static function addPassportData($data) {
        if(empty($data['contact_id']) || '' === $data['contact_id']) {
            $data['contact_id'] = session()->get('contact_id') ?? 0;
        }
        if($data['contact_id']) {
            $data = self::preparePassportData($data);
            $requisiteFilter = [
                "order" => [ "DATE_CREATE" => "ASC" ],
                "filter" => [ "ENTITY_ID" => $data['contact_id'] ?? 21167],
                "select"=> [ "ID" ]        
            ];
            $requisites = json_decode(self::BXQuery('crm.requisite.list.json', json_encode($requisiteFilter)));
            if(empty($requisites->result)) {
                $data['PresetID'] = 3;
                $data['requisite_name'] = "Паспотные данные";
                $res = self::BXQuery('crm.requisite.add.json', json_encode($data));
            } else {
                $data['id'] = $requisites->result[0]->ID;
                $res = self::BXQuery('crm.requisite.update.json', json_encode($data));                
            } 
        }
    }
}
