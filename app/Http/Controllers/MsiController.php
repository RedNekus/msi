<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Msi;
use App\Models\Yourls;
use App\Models\Bitrix;
use Illuminate\View\View;
use App\Jobs\SMS;

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
        $request->session()->put('data', $request->input('data') ?? "");
        return redirect('/');
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
            $bxdata = Bitrix::getAddress((int)$user->bitrix_id ?? 0);
            foreach($bxdata as $idata) {
                if($idata->TYPE_ID === '1') {
                    $data = Bitrix::convertAddress($idata);
                }
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
            $bxdata = Bitrix::getAddress((int)$user->bitrix_id ?? 0);
            foreach($bxdata as $idata) {
                if($idata->TYPE_ID === '4') {
                    $data = Bitrix::convertAddress($idata);
                }
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
            return redirect()->route('step-4', []);
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
            if($data['matches']) {
                return redirect()->route('step-4', []);
            } else {
                return redirect()->route('step-3.5', []);
            }
        } else {
            return redirect()->route('auth', []);
        }
    }
}
