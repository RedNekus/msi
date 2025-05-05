<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Msi;

class fPDF extends Model
{
    use HasFactory;

    public static function getAreementReportFile($sign = 0) {
        $state = session()->get('state');
        $stateArr = explode(':', $state);
        $type = array_pop($stateArr); 
        if($type === 'Договорпоручительсва') {
            $pdf = Pdf::loadView('pdf.agreenment-guarantee', [...Msi::prepareDocumentData(), 'sign' => $sign]);
        } else {
            $pdf = Pdf::loadView('pdf.areement-report', [...Msi::prepareDocumentData(), 'sign' => $sign]);
        }
        return $pdf->stream();
        //return $pdf->download('areement-report.pdf');
    }
    public static function getAreementPersonalFile($sign = 0) {
        $pdf = Pdf::loadView('pdf.areement-personal', [...Msi::prepareDocumentData(), 'sign' => $sign]);
        return $pdf->stream();
        //return $pdf->download('areement-personal.pdf');
    }
    public static function getAreementFSZNFile($sign = 0) {
        $pdf = Pdf::loadView('pdf.areement-fszn', [...Msi::prepareDocumentData(), 'sign' => $sign]);
        return $pdf->stream();
    }
}
