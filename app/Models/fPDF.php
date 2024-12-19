<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Barryvdh\DomPDF\Facade\Pdf;

class fPDF extends Model
{
    use HasFactory;

    public static function getAreementReportFile() {
        $pdf = Pdf::loadView('pdf.areement-report', []);
        return $pdf->download('areement-report.pdf');
    }
    public static function getAreementPersonalFile() {
        $pdf = Pdf::loadView('pdf.areement-personal', []);
        return $pdf->download('areement-personal.pdf');
    }
}
