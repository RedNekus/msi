<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
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
        return view('msi.leads', ['leads' => $leads]);
    }
}
