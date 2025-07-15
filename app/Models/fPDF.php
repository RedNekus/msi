<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Msi;

class fPDF extends Model
{
    use HasFactory;

    public static function getPDFDocument($type = '', $sign = 0) {
        if($type) {
            $pdf = Pdf::loadView('pdf.' . $type, [...Msi::prepareDocumentData(), 'sign' => $sign]);
            return $pdf->stream();
        }
    }
    public static function getAreementReportFile($sign = 0) {
        $state = session()->get('state');
        $stateArr = explode(':', $state);
        $type = array_pop($stateArr); 
        if($type === 'Договорпоручительсва') {
            return self::getPDFDocument("agreenment-guarantee", $sign);
        } else {
            return self::getPDFDocument("areement-report", $sign);
        }
    }
    public static function getAreementFSZNFile($sign = 0) {
        return self::getPDFDocument("areement-fszn", $sign);
    }
}
