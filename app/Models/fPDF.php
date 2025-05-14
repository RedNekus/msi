<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Msi;

class fPDF extends Model
{
    use HasFactory;

    public static function getPDFDocument($type = '', $state = 0) {
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
            return getPDFDocument("agreenment-guarantee", $sign);
        } else {
            return getPDFDocument("areement-report", $sign);
        }
    }
    public static function getAreementPersonalFile($sign = 0) {
        return getPDFDocument("areement-personal", $sign);
    }
    public static function getAreementFSZNFile($sign = 0) {
        return getPDFDocument("areement-fszn", $sign);
    }
}
