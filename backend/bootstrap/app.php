<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\AuthenticationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // API routes are stateless and authenticated with Sanctum bearer tokens.
        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Always answer API clients with JSON in the shape the app expects:
        // { status, message, errors }.
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => true);

        $exceptions->render(function (ValidationException $e, Request $request) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated.',
            ], 401);
        });
    })->create();
