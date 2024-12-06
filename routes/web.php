<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MsiController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\LeadsController;
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

Route::get('/set', [MsiController::class, 'set']);
Route::get('/address', [MsiController::class, 'address']);
Route::post('/address', [MsiController::class, 'addAddress']);
Route::get('/register-address', [MsiController::class, 'registerAddress'])->name('step-3');
Route::post('/register-address', [MsiController::class, 'addRegisterAddress']);

Route::get('/profile', [UserController::class, 'index'])->name('step-1');
Route::post('/profile', [UserController::class, 'add']);
Route::get('/auth', [UserController::class, 'auth']);
Route::post('/auth', [UserController::class, 'login']);
Route::get('/register', [UserController::class, 'register']);
Route::post('/register', [UserController::class, 'registration']);
Route::get('/passport', [UserController::class, 'passport'])->name('step-2');
Route::post('/passport', [UserController::class, 'addPassport']);

Route::get('/leads', [LeadsController::class, 'get']);
Route::get('/lead/{id}', [LeadsController::class, 'lead']);

Route::get('/lead/add', [LeadsController::class, 'lead'])->name('step-4');
Route::post('/lead/add', [LeadsController::class, 'add']);

Route::get('/lead/add/info', [LeadsController::class, 'info'])->name('step-5');
Route::post('/lead/add/info', [LeadsController::class, 'addInfo']);

Route::get('/lead/add/agreements', [LeadsController::class, 'agreements'])->name('step-6');
Route::post('/lead/add/agreements', [LeadsController::class, 'addAgreements']);

Route::get('/lead/add/confirmation', [LeadsController::class, 'confirmation'])->name('step-7');
Route::post('/lead/add/confirmation', [LeadsController::class, 'addConfirmation']);

Route::get('/lead/add/success', [LeadsController::class, 'success'])->name('success');