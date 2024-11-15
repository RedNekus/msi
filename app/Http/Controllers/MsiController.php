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
        $token = Msi::msiToken('NYmsJedysmnl0qAqh8Rw16HQImPQLOUbweotB4Cq');
        echo "TEST TEST<br>";
        var_dump($token);
        $info = [];
        if($token) {
            $info = Msi::msiUserInfo($token->access_token);
        }
        return view('msi.profile', [
            'data' => [
                'token' => 'test__' . $token,
                'info' => $info
            ]
        ]);
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
