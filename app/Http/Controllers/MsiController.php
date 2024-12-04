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
    public function address(Request $request) {
        return view('msi.address', []);
    }
}
