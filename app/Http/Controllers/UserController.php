<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Bitrix;
use Illuminate\View\View;
use App\Models\User;
use App\Models\Msi;

class UserController extends Controller
{
    public function index(Request $request): View
    {
        $data = [];
        $raw_data = $request->session()->get('data');
        if(isset($raw_data)) {
           $data = json_decode($raw_data); 
        } else {
            if(Auth::check()) {
                $user = Auth::user();
                $data = (array)$user->getAttributes();
                $data['firstname'] = $data['name'];   
            }
        }
        return view('user.profile', ['data' => $data]);
    }
    public function add(Request $request) {
        if(Auth::check()) {
            $user = Auth::user();
            if($user->bitrix_id) {
                $data = $request->all();
                $data['contact_id'] = $user->bitrix_id;
                Bitrix::updateUser($data);
            } else {
               Bitrix::creteUser($request->all());
            }
        } else {
            Bitrix::creteUser($request->all());
        }
        $request->session()->put('step', 1);
        return redirect()->route('step-2', []);
    }
    public function auth() {
        return view('user.auth', []);
    }
    public function login(Request $request) {
        $formattedPhone = $request->input('phone');
        $phone = str_replace(['(', ')', ' ', '-'], '', $formattedPhone) ?? '';
        if(isset($phone) && '' !== $phone) {
            if (Auth::attempt([
                'phone' => $formattedPhone,
                'password' => $request->input('password'),
            ])) {
                return redirect()->route('step-4', []);
            } else {
                return redirect()->route('auth', []);
            }
        }
    }
    public function register() {    
        return view('user.register', []);
    }
    public function registration(Request $request) {
        if( User::create($request->all()) ) {
            return redirect()->route('auth', []);
        } else {
            //TODO
        }
    }
    public function passport() { 
        if(Auth::check()) {
            $data = [];
            $user = Auth::user();
            if(isset($user->bitrix_id) && (int)$user->bitrix_id !==0 ) {
                $bxdata = Bitrix::getRequisite((int)$user->bitrix_id);
                if(is_array($bxdata) && count($bxdata)) {
                    $data = Bitrix::convertPassport($bxdata[0]);
                }
            } else {
                $rawData = session()->get('data');
                $data = Msi::convertMsiInfo($rawData);
            }
            return view('user.passport', (array)$data);
        } else {
            return redirect()->route('auth', []);
        } 
    }
    public function addPassport(Request $request) {  
        if(Auth::check()) {
            $data = $request->all();
            $user = Auth::user();
            $data['contact_id'] = (int)$user->bitrix_id ?? 21167;
            $res = json_decode(Bitrix::addPassportData($data));
            $request->session()->put('step', 2);
        } else {
            return redirect()->route('auth', []);
        }
    }
}
