<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Msi;
use App\Models\Yourls;
use Illuminate\View\View;

class MsiController extends Controller
{
    public function index(Request $request): View
    {
        $data = [];
        $raw_data = $request->session()->get('data');
        if(isset($raw_data)) {
           $data = json_decode($raw_data); 
        }
        return view('msi.profile', ['data' => $data]);
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
            $urlData = Yourls::setShort($state);
            $token = Msi::msiToken($request);
            $info = [];
            if($token) {
                $info = Msi::msiUserInfo($token->access_token);
            }
            return [
                'data' => $urlData,
                'token' => 'test__' . $token,
                'info' => $info
            ];
        }
    }
}
