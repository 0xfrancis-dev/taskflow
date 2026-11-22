<?php

use Illuminate\Support\Facades\Route;

// Single-page React app: every non-API URL renders the same view.
Route::get('/{any?}', fn () => view('app'))->where('any', '^(?!api|storage|up).*$');
