<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Leads;
use App\Models\Bitrix;
use App\Models\fPDF;
use App\Jobs\SendSMS;

class LeadsController extends Controller
{
    public function get() {
        $leads = Leads::all();
        return view('leads.list', ['leads' => $leads]);
    }
    public function lead($id = 0) {
        if(Auth::check()) {
            $leadData = [];
            if($id) {
                $lead = Leads::where('id' , '=' , $id)->first();
                $data = json_decode(Bitrix::getDealData($lead->bx_lead_id));
                $leadData = Bitrix::convertDeal($data->result);
            }
            return view('leads.item', ['lead' => $leadData, 'id' => $id]);
        } else {
            return redirect()->route('auth', []);
        } 
    }
    public function add(Request $request) {
        if(Auth::check()) {
            $user = Auth::user();
            $data = $request->all();
            $data['contact_id'] = (int)$user->bitrix_id ?? 0;
            if(isset($data['id']) && $data['id'] > 0) {
                $lead = Leads::find($data['id']);
                if($user->id === $lead->user_id) {
                    $data['deal_id'] = $lead->bx_lead_id;
                    $request->session()->put('deal_id', $lead->bx_lead_id);
                    $res = json_decode(Bitrix::updateDeal($data));
                }
            } else {
                $res = json_decode(Bitrix::creteDeal($data));
                $lead = new Leads;
                $lead->user_id = (int)$user->id;
                $lead->bx_lead_id = (int)$res->result;
                $lead->save();
            }
            $request->session()->put('step', 4);
            $request->session()->put('step-4', $request->all());
            return redirect()->route('step-5', []);
        } else {
            return redirect()->route('auth', []);
        }
    }
    public function info() {
        if(Auth::check()) {
            $infoData = [];
            $user = Auth::user();
            if($user->bitrix_id) {
                $info = json_decode(Bitrix::getUserData($user->bitrix_id));
                $infoData = (array)Bitrix::convertInfo($info->result);
            }
            return view('leads.form', $infoData);
        } else {
            return redirect()->route('auth', []);
        }  
    }
    public function agreements(Request $request) {
        return view('leads.agreements', []);
    }
    public function confirmation(Request $request) {
        if(Auth::check()) {
            $user = Auth::user();
            return view('leads.confirmation', ['phone' => $user->phone ?? '']);
        } else {
            return redirect()->route('auth', []);
        }
    }
    public function success(Request $request) {
        if(Auth::check()) {
            return view('leads.success', ['data' => $request->session()->except(['_token'])]);
        } else {
            return redirect()->route('auth', []);
        }
    }
    public function addInfo(Request $request) {
        if(Auth::check()) {
            $data = $request->all();
            $user = Auth::user();
            $data['contact_id'] = (int)$user->bitrix_id ?? 0;
            $res = json_decode(Bitrix::addUserInfo($data));
            $request->session()->put('step-5', $data);
            $request->session()->put('step', 5);
            return redirect()->route('step-6', []);
        } else {
            return redirect()->route('auth', []);
        }
    }
    public function addAgreements(Request $request) {
        if(Auth::check()) {
            $user = Auth::user();
            $rq = $request->all();
            $data = [
                'agreement_report' => 0,
                'agreement_personal' => 0,
            ];
            foreach($rq as $key=>$item) {
                if(isset($data[$key])) {
                    $data[$key] = (int)$item;
                }
            }
            if( array_search(0,$data,true) ) {
                return view('leads.agreements', $data);
            }
            $data['contact_id'] = (int)$user->bitrix_id ?? 0;
            $res = json_decode(Bitrix::updateDeal($data));
            $request->session()->put('step-6', $data);
            $request->session()->put('step', 6);
            self::sendSms();
            return redirect()->route('step-7', []);
        } else {
            return redirect()->route('auth', []);
        } 
    }
    public function addConfirmation(Request $request) {
        if(Auth::check()) {
            $request->session()->put('step', 6);
            $request->session()->put('step-7', $request->all());
            return redirect()->route('success', []);
        } else {
            return redirect()->route('auth', []);
        }
    }
    public function sendSms() {
        $user = Auth::user();
        if($user->phone) {
            $code = rand( 10000 , 99999 );
            session()->put('code', $code);
            $phone = str_replace(['(',')',' ', '-'], '', $user->phone);
            SendSms::dispatch($phone, "Ваш код: {$code}");
            return true;
        }
    }
    public function areementReport() {
        fPDF::getAreementReportFile();
    }
    public function areementPersonal() {
        fPDF::getAreementPersonalFile();
    }
}
