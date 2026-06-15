<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return $this->respond(['user' => $request->user()->toApiArray()], 'Profile fetched.');
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'device_token' => ['sometimes', 'nullable', 'string'],
            'avatar' => ['sometimes', 'nullable', 'image', 'max:4096'],
        ]);

        if ($request->hasFile('avatar')) {
            $data['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        $user->fill(collect($data)->except('avatar')->toArray());
        if (isset($data['avatar'])) {
            $user->avatar = $data['avatar'];
        }
        $user->save();

        return $this->respond(['user' => $user->fresh()->toApiArray()], 'Profile updated.');
    }

    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            return $this->error('Current password is incorrect.', 422, [
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $user->forceFill(['password' => $data['new_password']])->save();

        return $this->respond(null, 'Password changed successfully.');
    }

    public function deviceToken(Request $request)
    {
        $data = $request->validate(['device_token' => ['required', 'string']]);

        $request->user()->forceFill(['device_token' => $data['device_token']])->save();

        return $this->respond(null, 'Device token updated.');
    }
}
