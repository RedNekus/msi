<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Msi;
use App\Models\Yourls;
use App\Models\Bitrix;
use Illuminate\View\View;

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
        $firstrname = $data->subject->name_ru->given_name_ru;
        $lastname = $data->subject->name_ru->family_name_ru;
        $middlename = $data->subject->name_ru->middle_name_ru;
        $year = substr($data->subject->birthdate, 0, 4);
        $month = substr($data->subject->birthdate, 4, -2);
        $day = substr($data->subject->birthdate, -2);
        $birthdate = "$year-$month-$day";
        $gender = $data->subject->sex === 'male' ? 0 : 1;
        $phone = "+" . trim($data->contact->phones[0]);
        $user_data = [
            'name' => $firstrname,
            'phone' => $phone,
            'lastname' => $lastname,
            'middlename' => $birthdate,
            'gender' => $gender,
            'birthdate' => $birthdate,
            'password' => 'pass'
        ];
        $request->session()->put('data', $raw_data);
        if (Auth::attempt([
            'phone' => $phone,
            'password' => 'pass',
        ])) {
            SendSms::dispatch($phone, 'Hello world!');
            return redirect('/profile');
        }
        if( User::create($user_data) ) {
            if (Auth::attempt([
                'phone' => $phone,
                'password' => 'pass',
            ])) {
                return redirect('/profile');
            } else {
                return redirect()->route('auth', []);
            }
        }
    }
    public function short(Request $request): array
    {
        $state = $request->input('state');
        if(isset($state) && '' !== $state) 
        {
            $yourlsData = Yourls::setShort($state);
            return ['data' => $yourlsData];
        }
    }
    public function address() {
        
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
    public function registerAddress() {
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
                    $data = Msi::convertMsiAddress($rawData);
                }
            } else {
                $rawData = session()->get('data');
                $data = Msi::convertMsiAddress($rawData);
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
