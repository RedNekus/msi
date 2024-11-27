<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->integer('bitrix_id')->nullable()->unique();
            $table->string('phone')->unique();
            $table->string('lastname')->nullable();
            $table->string('middlename')->nullable();
            $table->string('email')->nullable()->unique(false)->change();
            //$table->dropColumn('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('bitrix_id');
            $table->dropColumn('phone');
            $table->dropColumn('lastname');
            $table->dropColumn('middlename');
            $table->string('email')->nullable(false)->unique()->change();
        });
    }
};
