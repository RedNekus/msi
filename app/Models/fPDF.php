<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Barryvdh\DomPDF\Facade\Pdf;

class fPDF extends Model
{
    use HasFactory;

    public function getAreementReportFile() {
        $pdf = Pdf::loadView('pdf.areement-report', $data);
        return $pdf->download('areement-report.pdf');
    }
    public function getAreementPersonalFile() {
        $pdf = Pdf::loadView('pdf.areement-personal', $data);
        return $pdf->download('areement-personal.pdf');
    }
}
