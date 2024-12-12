<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class Bitrix extends Model
{
    use HasFactory;
    const BX_USER_ID = '43';
    const BX_TOKEN = 'oe3fy79wpdjuym8v';
    const HOOK_URL = 'https://yoow.bitrix24.by/rest';
    const DEAL_FIELDS = [
        'CONTACT_ID' => 'contact_id',
        'OPPORTUNITY' => 'price',
        'UF_CRM_1732543687' => 'model', //марка
        'UF_CRM_1732543715' => 'link', //ссылка на автомобиль
        'UF_CRM_664C94A742925' => 'term', //срок лизинга
        'UF_CRM_65DDB202BF4AA' => 'down_payment', //первоначальный взнос (Авансовый платеж)
        "UF_CRM_1733757327" => 'agreement_report', //Cогласие на предоставление кредитного отчета
        "UF_CRM_1733757480" => 'agreement_personal', //Cогласие на хранение и обработку персональных данных
        "UF_CRM_1733757560" => 'agreement_politic', //Согласен с условиями политики конфиденциальности
    ];
    const INFO_FIELDS = [
        "UF_CRM_664C9676C5442" => 'workplace', //Место работы
        "UF_CRM_664C9676D12F2" => 'position', //Должность
        "UF_CRM_1732540293158" => 'experience', //Стаж работы на последнем месте, мес.
        "UF_CRM_1732541815194" => 'income', //Среднемесячный доход
        "UF_CRM_1732541938356" => 'hr_phone', //Телефон отдела кадров/бухгалтерии
        "UF_CRM_1732542363048" => 'spouse_name', //Ф.И.О. супруга(и)/ ближайщего родcтвенника
        "UF_CRM_1732542288007" => 'marital_status', //Семейное положение [891 => 'Не женат/ не замужем', 893 => 'Женат/ замужем', 895 => 'Вдовец/ вдова']
        "UF_CRM_1732542429824" => 'spouse_phone', //Телефон супруга(и)/ ближайшего родсвенника
        "UF_CRM_1732542562113" => 'spouse_workplace', //Место работы супруга(и)/ ближайшего родственника
        "UF_CRM_1732542638985" => 'spouse_income', //Среднемесячный доход супруга(и)/ ближайшего родственника
        "UF_CRM_1732542718544" => 'dependents',// количество иждевенцев
        "UF_CRM_1732542745561" => 'contact_person', //Контактное лицо
        "UF_CRM_1732542763384" => 'person_phone', //Телефон контактного лица
        "UF_CRM_1733755945" => 'liability',
        "UF_CRM_1733755985" => 'decisions',
    ];
    const ADDR_FIELDS = [
        "POSTAL_CODE" => 'zip_code',
        "ADDRESS_2" => 'apartment',
        "CITY" => 'settlement'
    ];
    const PASSPORT_FIELDS = [
        "RQ_IDENT_DOC" => 'document_type', //Вид документа
        "RQ_IDENT_DOC_PERS_NUM" => 'document_number', // идентификационный номер
        "RQ_IDENT_DOC_DATE" => 'document_date', // дата выдачи
        "UF_CRM_1733410954" => 'document_validity', // срок действия
        "RQ_IDENT_DOC_ISSUED_BY" => 'issuedby', // Кем выдан
    ];
    private static function formatDate($date) {
        $dateArr = explode('T', $date);
        $dt = array_shift($dateArr);
        $dtArr = array_reverse(explode('-', $dt));
        return implode('.', $dtArr);
    }
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
    public static function convertDeal($data) {
        return self::convert($data, 'DEAL_FIELDS');
    }
    public static function convertInfo($data) {
        return self::convert($data, 'INFO_FIELDS');
    }
    public static function convertAddress($data) {
        $res = self::convert($data, 'ADDR_FIELDS');
        if($data->ADDRESS_1) {
            $arrAddr = explode(',', $data->ADDRESS_1);
            $arrAddr = array_map('trim', $arrAddr);
            $arrAddr = array_filter($arrAddr, fn($item) => '' !== $item);
            $res->street = $arrAddr[0];
            $res->house = $arrAddr[1];
            if(count($arrAddr) === 3) {
                $res->housing = $arrAddr[2];
            }
        }
        return (array)$res;
    }
    public static function convertPassport($data) {
        $res = self::convert($data, 'PASSPORT_FIELDS');
        if($res->document_validity) {
            $res->document_validity = self::formatDate($res->document_validity);  
        }
        $res->document_series = $data->RQ_IDENT_DOC_SER . $data->RQ_IDENT_DOC_NUM;
        return $res;
    }
    private static function convert($data, $arr) {
        $res = new \stdClass();
        $fields = constant('self::'. $arr);
        if(is_array($fields)) {
            foreach($fields as $name=>$field) {
                $res->$field = $data->$name;
            }
        }
        return $res;
    }
    private static function prepareDealData($data) {
        $fields = [
            "TITLE" => "Заполнена анкета",
            "TYPE_ID" => "GOODS", 
            "STAGE_ID" => "NEW",
            "OPENED" => "Y",
            "CURRENCY_ID" => "USD",
            "ASSIGNED_BY_ID" => 135,
        ];
        foreach(self::DEAL_FIELDS as $name=>$field) {
            if(isset($data[$field]) && '' !== $data[$field]) {
                $fields[$name] = $data[$field];
            }
        }
        $queryParams = [
            'fields' => $fields,
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
        $fields = [
            "RQ_IDENT_DOC_SER" =>  $num, //серия
            "RQ_IDENT_DOC_NUM" =>  $series, //номер
        ];
        foreach(self::PASSPORT_FIELDS as $name=>$field) {
            if(isset($data[$field]) && '' !== $data[$field]) {
                $fields[$name] = $data[$field];
            }
        }
        if(!empty($data['PresetID']) && !empty($data['requisite_name'])) {
            $fields = [
                'ENTITY_TYPE_ID' => $data['entity_type'],
                'ENTITY_ID' => $data[ 'contact_id' ],//contact id
                'PRESET_ID' => $data['PresetID'],
                'ACTIVE' => 'Y',
                'NAME' => $data['requisite_name'],
                ...$fields
            ];
        }
        $data = [
            'fields' => $fields,
            'params' => ['REGISTER_SONET_EVENT' => 'Y']
        ];
        return $data;
    }
    private static function prepareAddrData($data) {
        $fields = [
            "TYPE_ID" => $data["TYPE_ID"],
            "ENTITY_TYPE_ID" => $data["ENTITY_TYPE_ID"],
            "ENTITY_ID" => $data["ENTITY_ID"],
            "ADDRESS_1" => implode(", ", [$data['street'], $data['house'], $data['housing']]),
        ];
        foreach(self::ADDR_FIELDS as $name=>$field) {
            if(isset($data[$field]) && '' !== $data[$field]) {
                $fields[$name] = $data[$field];
            }
        }
        $queryParams = [
            'fields' => $fields,
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
        $queryParams = [
            'fields' => $fields,
            'params' => ['REGISTER_SONET_EVENT' => 'Y']
        ];
        if(isset($data['id']) && '' !== $data['id']) {
            $queryParams['id'] = $data['id'];
        }
        return json_encode($queryParams);  
    }
    private static function prepareInfoData($data) {
        $fields = [];
        foreach(self::INFO_FIELDS as $name=>$field) {
            if(isset($data[$field]) && '' !== $data[$field]) {
                $fields[$name] = $data[$field];
            }
        }
        $queryParams = [
            'fields' => $fields,
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
    public static function updateDeal($data) {
        $data['deal_id'] = session()->get('deal_id') ?? 0;
        if(!$data['deal_id']) {
            return 0;
        }
        if(!$data['contact_id']) {
            $data['contact_id']= session()->get('contact_id') ?? 0;
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
        $birthdate = array_reverse(explode('.', $data['birthday']));
        $birthdate = implode('-', $birthdate) . ' 00:00:00';
        $userData = [
            'name' => $data['firstrname'],
            'phone' => $data['phone'],
            'lastname' => $data['lastname'],
            'middlename' => $data['middlename'],
            'bitrix_id' => (int)($resObj->result),
            'gender' => $genders[$data['gender']] ?? 0,
            'birthdate' => $birthdate,
        ];
        if (Auth::attempt([
            'phone' => $data['phone'],
            'password' => $data['password'] ?? '1p@ssWord2',
        ])) {
            $user = Auth::user();
            foreach($userData as $property => $value) {
                $user->$property = $value;
            }
            $user->save();
        } else {
            $userData['password'] = Hash::make('1p@ssWord2');
            User::create($userData);
        }
        return $res;
    }
    public static function updateUser($data) {
        if(!$data['contact_id']) {
            return 0;
        }
        $params = self::prepareContactData($data);
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
        $res = self::BXQuery('crm.contact.update.json', $params);;
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
                "filter" => [ "ENTITY_ID" => $data['contact_id'] ?? 0],
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
    public static function getRequisite($id) {
        $requisiteData = [
            "order" => [ "DATE_CREATE" => "ASC" ],
            "filter" => [ "ENTITY_ID" => $id],
            "select"=> [ 
                "ID",
                "ENTITY_ID",
                "RQ_IDENT_DOC",//Вид документа
                "RQ_IDENT_DOC_SER",//серия
                "RQ_IDENT_DOC_NUM",//номер
                "RQ_IDENT_DOC_PERS_NUM",// идентификационный номер
                "RQ_IDENT_DOC_DATE", // дата выдачи
                "UF_CRM_1733410954", // срок действия
                "RQ_IDENT_DOC_ISSUED_BY" //Кем выдан 
            ]        
        ];
        $res = json_decode(self::BXQuery('crm.requisite.list.json', json_encode($requisiteData)));
        //var_dump($res->result); 
        return $res->result;
    }
    public static function getAddress($id) {
        $res = self::getRequisite($id);
        if(isset($res) && count($res)) {
            $addrData = [
                "order" => [ "TYPE_ID" => "ASC" ],
                "filter" => [ "ENTITY_ID" => $res[0]->ID],
                "select"=> [ 
                    "TYPE_ID",
                    "ADDRESS_1",
                    "ADDRESS_2",
                    "CITY",
                    "POSTAL_CODE"
                ]        
            ];
            $resAddr = json_decode(self::BXQuery('crm.address.list.json', json_encode($addrData)));
            return $resAddr->result;
        }
    }
}
