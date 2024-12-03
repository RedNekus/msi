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
    public function userAdd(Request $request) {
        $res = json_decode(Bitrix::creteUser($request->all()));
        var_dump($res);
        //var_dump($request->all());
    }
    //TODO
    public function auntificate() {
        return view('msi.auth', []);
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
        return view('msi.register', []);
    }
    public function registration(Request $request) {
        User::create($request->all());
        return 1;
    }
}
