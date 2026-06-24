<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

abstract class Controller
{
    /**
     * Standard success envelope: { status, message, data }.
     * The mobile app reads payloads from `response.data.<key>`.
     */
    protected function respond($data = null, string $message = 'Success', int $code = 200): JsonResponse
    {
        // `status` is the string 'success' — ProfileEditScreen checks
        // `res.status === 'success'`; other screens ignore it.
        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    /**
     * Standard error envelope: { status, message, errors }.
     */
    protected function error(string $message = 'Something went wrong', int $code = 400, $errors = null): JsonResponse
    {
        return response()->json([
            'status' => 'error',
            'message' => $message,
            'errors' => $errors,
        ], $code);
    }
}
