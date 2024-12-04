<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Leads;
use App\Models\Bitrix;


class LeadsController extends Controller
{
    public function get() {
        $leads = Leads::all();
        foreach($leads as $lead) {
            //var_dump($lead);
            //echo "test: {$lead->bx_lead_id}";
            //Bitrix::getDealData($lead->id)
        }
        return view('leads.list', ['leads' => $leads]);
    }
    public function lead() {
        $lead = [];
        return view('leads.item', ['lead' => $lead]);
    }
    public function add(Request $request) {
        if(Auth::check()) {
            $user = Auth::user();
            $res = json_decode(Bitrix::creteDeal($request));
            $lead = new Leads;
            $lead->user_id = (int)$user->id;
            $lead->bx_lead_id = (int)$res->result;
            $lead->save();
        }
        $request->session()->put('step-1', $request->all());
        return redirect()->route('info', []);
    }
    public function info(Request $request) {
        $data = $request->session()->get('step-1');
        return view('leads.form', ['data' => $data]);
    }
    public function agreements(Request $request) {
        return view('leads.agreements', []);
    }
    public function confirmation(Request $request) {
        return view('leads.confirmation', []);
    }
    public function success(Request $request) {
        return view('leads.success', ['data' => $request->session()->except(['_token'])]);
    }
    public function addInfo(Request $request) {
        $request->session()->put('step-2', $request->all());
        return redirect()->route('agreements', []);
    }
    public function addAgreements(Request $request) {
        $request->session()->put('step-3', $request->all());
        return redirect()->route('confirmation', []);
    }
    public function addConfirmation(Request $request) {
        $request->session()->put('step-4', $request->all());
        return redirect()->route('success', []);
    }
}
