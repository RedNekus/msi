<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;
use App\Models\User;
use App\Models\Msi;
use App\Models\Yourls;
use App\Models\Bitrix;
use App\Jobs\SendSMS;


class MsiController extends Controller
{
    public function index() {
        if(Auth::check()) {
            return redirect()->route('step-1', []);
        } else {
            return redirect()->route('auth', []);
        }
    }
    public function set(Request $request) {
        $raw_data = $request->input('data') ?? "";
        $data = json_decode($raw_data);
        $request->session()->put('data', $raw_data);
        $request->session()->put('state',  $request->input('state') ?? "");
        $request->session()->put('success', 0);
        if(isset($data->subject)) {
            $firstrname = $data->subject->name_ru->given_name_ru;
            $lastname = $data->subject->name_ru->family_name_ru;
            $middlename = $data->subject->name_ru->middle_name_ru;
            $gender = $data->subject->sex === 'male' ? 0 : 1;
            $phone = "+" . trim($data->contact->phones[0]);   
        } else {
            return redirect()->route('auth', []);
        }

        $userExists = User::where('phone', '=', $phone)->first();
        if($userExists) {
            if (Auth::attempt([
                'phone' => $phone,
                'password' => '1p@ssWord2',
            ])) {
                return redirect('/profile');
            }  else {
                return redirect()->route('auth', []);
            }
        }
        $user_data = [
            'name' => $firstrname,
            'phone' => $phone,
            'lastname' => $lastname,
            'middlename' => $middlename,
            'gender' => $gender,
            'password' => '1p@ssWord2',
            'document_number' => $data->national_id_number,
        ];
        $birthdate = null;
        if(!empty($data->subject->birthdate)) {
            $year = substr($data->subject->birthdate, 0, 4);
            $month = substr($data->subject->birthdate, 4, -2);
            $day = substr($data->subject->birthdate, -2);
            $birthdate = "$year-$month-$day";
        }
        if(!empty($birthdate) && preg_match("/^\d{4}-\d{2}-\d{2}$/", $birthdate)) {
            $user_data['birthdate'] = $birthdate;
        }
        if( User::create($user_data) ) {
            if (Auth::attempt([
                'phone' => $phone,
                'password' => '1p@ssWord2',
            ])) {
                return redirect('/profile');
            } else {
                return redirect()->route('error', []);
            }
        }
    }
    public function short(Request $request): array
    {
        $state = $request->input('state');
        if(isset($state) && '' !== $state) 
        {
            $stateArr = explode(':', $state);
            if($stateArr[0]) {
                $yourlsData = Yourls::setShort($state);
                Bitrix::addShortLink($yourlsData, $stateArr[0]);
                if(isset($stateArr[2])) {
                    SendSms::dispatch($stateArr[2], "Ваша ссылка на предоставление данных ООО «Ювилс Лизинг» на приобретение товаров в лизинг: {$yourlsData}");
                }
                return ['data' => $yourlsData];
            }
        }
    }
    public function address(Request $request) {
        if((int)$request->session()->get('success') === 1) {
            return redirect()->route('success', []);
        }
        if(Auth::check()) {
            $data = [];
            $user = Auth::user();
            if( isset($user->bitrix_id) && (int)$user->bitrix_id !==0 ) {
                $bxdata = Bitrix::getAddress((int)$user->bitrix_id ?? 0);
                if(is_array($bxdata) && count($bxdata)) {
                    foreach($bxdata as $idata) {
                        if($idata->TYPE_ID === '1') {
                            $data = Bitrix::convertAddress($idata);
                        }
                    }
                    $rawData = session()->get('data');
                    $data = Msi::convertMsiAddress($rawData);
                } else {
                    $rawData = session()->get('data');
                    $data = Msi::convertMsiAddress($rawData);
                }
            } else {
                $rawData = session()->get('data');
                $data = Msi::convertMsiAddress($rawData);
            }
            return view('msi.address', $data);
        } else {
            return redirect()->route('auth', []);
        }
    }
    public function registerAddress(Request $request) {
        if((int)$request->session()->get('success') === 1) {
            return redirect()->route('success', []);
        }
        if(Auth::check()) {
            $data = [];
            $user = Auth::user();
            if( isset($user->bitrix_id) && (int)$user->bitrix_id !==0 ) {
                $bxdata = Bitrix::getAddress((int)$user->bitrix_id ?? 0);
                if(is_array($bxdata) && count($bxdata)) {
                    foreach($bxdata as $idata) {
                        if($idata->TYPE_ID === '4') {
                            $data = Bitrix::convertAddress($idata);
                        }
                    }
                } else {
                    $rawData = session()->get('data');
                    $data = Msi::convertRegisterAddress($rawData);
                }
            } else {
                $rawData = session()->get('data');
                $data = Msi::convertRegisterAddress($rawData);
            }
            return view('msi.register-address', $data);
        } else {
            return redirect()->route('auth', []);
        }
    }
    public function addAddress(Request $request) {
        if(Auth::check()) {
            $data = $request->all();
            $user = Auth::user();
            $data['type_id'] = 1;
            $data['contact_id'] = (int)$user->bitrix_id ?? 0;
            $res = json_decode(Bitrix::addUserAddress($data));
            return redirect()->route('step-6', []);
        } else {
            return redirect()->route('auth', []);
        }
    }
    public function addRegisterAddress(Request $request) {
        if(Auth::check()) {
            $data = $request->all();
            $user = Auth::user();
            $data['type_id'] = 4;
            $data['contact_id'] = (int)$user->bitrix_id ?? 21167;
            $res = json_decode(Bitrix::addUserAddress($data));
            $request->session()->put('step', 3);
            if(isset($data['matches']) && $data['matches']) {
                return redirect()->route('step-6', []);
            } else {
                return redirect()->route('step-3.5', []);
            }
        } else {
            return redirect()->route('auth', []);
        }
    }
}
