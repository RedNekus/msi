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
            $yourlsData = Yourls::setShort($state);
            return [
                'data' => $yourlsData,
            ];
        }
    }
}
