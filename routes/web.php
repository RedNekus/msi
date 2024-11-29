<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MsiController;
use App\Http\Controllers\UserController;
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
Route::post('/profile', [UserController::class, 'userAdd']);
Route::get('/set', [MsiController::class, 'set']);
Route::get('/cabinet', [MsiController::class, 'cabinet']);
Route::post('/cabinet', [MsiController::class, 'dealAdd']);
Route::get('/address', [MsiController::class, 'address']);
Route::get('/info', [MsiController::class, 'info']);

Route::get('/auth', [UserController::class, 'auntificate']);
Route::post('/auth', [UserController::class, 'login']);

Route::get('/register', [UserController::class, 'register']);
Route::post('/register', [UserController::class, 'registration']);