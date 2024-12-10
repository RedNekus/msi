<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Bitrix;
use Illuminate\View\View;
use App\Models\User;
use App\Jobs\SMS;

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
                $res = json_decode(Bitrix::updateUser($data));
            } else {
                $res = json_decode(Bitrix::creteUser($request->all()));
            }
        } else {
            $res = json_decode(Bitrix::creteUser($request->all()));
        }
        $request->session()->put('step', 1);
        //var_dump($res);
        //var_dump($request->all());
    }
    //TODO
    public function auth() {
        return view('user.auth', []);
    }
    public function login(Request $request) {
        $formattedPhone = $request->input('phone');
        $phone = str_replace(['(', ')', ' ', '-'], '', $formattedPhone) ?? '';
        //echo $phone;
        if(isset($phone) && '' !== $phone) {
            //dispath sms
            
            if (Auth::attempt([
                'phone' => $formattedPhone,
                'password' => '1p@ssWord2',
            ])) {
                echo "test";
                $user = Auth::user();
                var_dump($user);
                // Authentication was successful...
                //dispatch(new SMS( '+375447929174', 'Hello world!'))->withoutDelay();
            } else {
                echo 'Error auth';
            }
        }
    }
    public function register() {    
        return view('user.register', []);
    }
    public function registration(Request $request) {
        User::create($request->all());
        return 1;
    }
    public function passport() { 
        $data = [];
        if(Auth::check()) {
            $user = Auth::user();
            $bxdata = Bitrix::getRequisite((int)$user->bitrix_id ?? 0);
            $data = Bitrix::convertPassport($bxdata[0]);
        }
        return view('user.passport', (array)$data);
    }
    public function addPassport(Request $request) {  
        if(Auth::check()) {
            $data = $request->all();
            $user = Auth::user();
            $data['contact_id'] = (int)$user->bitrix_id ?? 21167;
            $res = json_decode(Bitrix::addPassportData($data));
            $request->session()->put('step', 2);
        }
    }
}
