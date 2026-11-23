<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('withdrawals', function (Blueprint $table) {
            $table->string('bank_code', 10)->nullable()->after('bank_name');
            $table->string('payout_reference')->nullable()->unique()->after('account_name');
        });
    }

    public function down(): void
    {
        Schema::table('withdrawals', function (Blueprint $table) {
            $table->dropUnique(['payout_reference']);
            $table->dropColumn(['bank_code', 'payout_reference']);
        });
    }
};
