<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Msi;
use App\Models\Yourls;
use Illuminate\View\View;

class MsiController extends Controller
{
    public function show(Request $request): View
    {
        $urlData = Yourls::setShort('12345678');
        $token = Msi::msiToken($request);
        $info = [];
        if($token) {
            $info = Msi::msiUserInfo($token->access_token);
        }
        return view('msi.profile', [
            'data' => $urlData,
            'token' => 'test__' . $token,
            'info' => $info
        ]);
    }
    public function short(Request $request): array
    {
        $urlData = Yourls::setShort('12345678');
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
