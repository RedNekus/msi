<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\QueryException;
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
        if((int)$request->session()->get('success') === 1) {
            return redirect()->route('success', []);
        }
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
    public function logout() {
        Auth::logout();
        return redirect()->route('auth', []);
    }
    public function register() {    
        return view('user.register', []);
    }
    public function registration(Request $request) {
        try {
            if( User::create($request->all()) ) {
                return redirect()->route('auth', []);
            }
        } catch (QueryException $e) {
            file_put_contents('error.log', date('d.m.Y H:i:s') . ": Ошибка при регистрации пользователя: {$e->getMessage()}\n", FILE_APPEND);
            //return response()->json(['error' => 'Ошибка при сохранении пользователя'], 500);
            return view('error', ['text' => 'Ошибка при сохранении пользователя']);
        }
    }
    public function passport(Request $request) { 
        if((int)$request->session()->get('success') === 1) {
            return redirect()->route('success', []);
        }
        if(Auth::check()) {
            $data = [];
            $user = Auth::user();
            if(isset($user->bitrix_id) && (int)$user->bitrix_id !==0 ) {
                $bxdata = Bitrix::getRequisite((int)$user->bitrix_id);
                if(is_array($bxdata) && count($bxdata)) {
                    $data = Bitrix::convertPassport($bxdata[0]);
                    if($data->document_series === '' || true) {
                        $rawData = session()->get('data');
                        $data = Msi::convertMsiInfo($rawData);
                    }
                } else {
                    $rawData = session()->get('data');
                    $data = Msi::convertMsiInfo($rawData);
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
            $data['contact_id'] = (int)$user->bitrix_id ?? 0;
            $res = json_decode(Bitrix::addPassportData($data));
            $request->session()->put('step', 2);
            return redirect()->route('step-3', []);
        } else {
            return redirect()->route('auth', []);
        }
    }
    public function getPDN() {
        return view('user.pdn', []);
    }
    public function income() {
        if(Auth::check()) {
            $data = [];
            $user = Auth::user();
            if(isset($user->bitrix_id) && (int)$user->bitrix_id !==0 ) {
                return view('user.income', []);
            }
        } else {
            return redirect()->route('auth', []);
        }
    }
    public function setPDN(Request $request) {
        $data = $request->all();
        $data = array_map(fn($item) => $item ?? 0, $data);
        if(!empty($data)) {
            $res = json_decode(Bitrix::addPdnData($data));
            if(!empty($res->result)) {
                file_put_contents('test-pdn.log', "setPDN Data: " . json_encode($data) . "\n", FILE_APPEND);
                file_put_contents('test-pdn.log', "setPDN: " . json_encode($res->result) . "\n", FILE_APPEND);
                return redirect()->route('step-6', []); 
            } else {
                file_put_contents('test-pdn.log', "setPDN Err: " . json_encode($data) . "\n", FILE_APPEND);
                file_put_contents('test-pdn.log', "setPDN Err: " . json_encode($res) . "\n", FILE_APPEND);
                return redirect()->route('step-6', []);
            }
        }
    }
    public function setIncome(Request $request) {
        $user = Auth::user();
        $data = $request->all();
        if(!empty($data)) {
            $res = json_decode(Bitrix::addIncomeData($data));
            if(!empty($res->result)) {
                file_put_contents('test-income.log', "addIncomeData: " . json_encode($res->result) . "\n", FILE_APPEND);
                return redirect()->route('pdn', []); 
            } else {
                file_put_contents('test-income.log', "no Income set \n", FILE_APPEND);
                return redirect()->route('pdn', []);
            }
        } else {
            file_put_contents('test-income.log', "no Income data \n", FILE_APPEND);
            return redirect()->route('pdn', []);
        }
    }
}
