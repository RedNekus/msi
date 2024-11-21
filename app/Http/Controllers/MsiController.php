<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Msi;
use App\Models\Yourls;
use App\Models\Bitrix;
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
            return ['data' => $yourlsData];
        }
    }
    public function cabinet(Request $request) {
        $deal = json_decode(Bitrix::getDealData('24269'));
        $contact_id = (int)$deal->result->CONTACT_ID;
        $request->session()->put('contact_id', $contact_id);
        $contact = json_decode(Bitrix::getUserData($contact_id));
        return view('msi.cabinet', ['deal' => $deal->result, 'user' => $contact->result]);
    }
    public function dealAdd(Request $request) {
        $res = json_decode(Bitrix::creteDeal($request));
        var_dump($res);
    }
    public function userAdd(Request $request) {
        $res = json_decode(Bitrix::creteUser($request->all()));
        var_dump($res);
    }
    //TODO
    public function auth() {
        return view('msi.auth', []);
    }
}
