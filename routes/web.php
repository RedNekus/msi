<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MsiController;
/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', [MsiController::class, 'index']);
Route::post('/profile', [MsiController::class, 'userAdd']);
Route::get('/set', [MsiController::class, 'set']);
Route::get('/cabinet', [MsiController::class, 'cabinet']);
Route::post('/cabinet', [MsiController::class, 'dealAdd']);
Route::get('/address', [MsiController::class, 'address']);
Route::get('/info', [MsiController::class, 'info']);

Route::get('/auth', [MsiController::class, 'auth']);