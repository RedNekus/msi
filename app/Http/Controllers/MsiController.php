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
        $data = [];
        if(Auth::check()) {
            $user = Auth::user();
            $bxdata = Bitrix::getAddress((int)$user->bitrix_id ?? 0);
            foreach($bxdata as $idata) {
                if($idata->TYPE_ID === '1') {
                    $data = Bitrix::convertAddress($idata);
                }
            }
        }
        return view('msi.address', $data);
    }
    public function registerAddress() {
        $data = [];
        if(Auth::check()) {
            $user = Auth::user();
            $bxdata = Bitrix::getAddress((int)$user->bitrix_id ?? 0);
            foreach($bxdata as $idata) {
                if($idata->TYPE_ID === '4') {
                    $data = Bitrix::convertAddress($idata);
                }
            }
        }
        return view('msi.register-address', $data);
    }
    public function addAddress(Request $request) {
        $data = $request->all();
        if(Auth::check()) {
            $user = Auth::user();
            $data['type_id'] = 1;
            $data['contact_id'] = (int)$user->bitrix_id ?? 0;
            $res = json_decode(Bitrix::addUserAddress($data));
            return redirect()->route('step-4', []);
        }
    }
    public function addRegisterAddress(Request $request) {
        $data = $request->all();
        if(Auth::check()) {
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
        }
    }
}
