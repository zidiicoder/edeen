<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{ $purpose === 'reset' ? 'Reset your password' : 'Verify your email' }}</title>
</head>
<body style="margin:0; padding:0; background-color:#F6F6F6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F6F6F6; padding:32px 16px;">
    <tr>
        <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">

                {{-- Logo --}}
                <tr>
                    <td align="center" style="padding-bottom:24px;">
                        <img src="{{ $message->embed($logoPath) }}" width="64" height="64" alt="Edeen" style="display:block; border-radius:16px;">
                    </td>
                </tr>

                {{-- Card --}}
                <tr>
                    <td style="background-color:#FFFFFF; border-radius:20px; padding:36px 32px; box-shadow:0 2px 12px rgba(27,27,27,0.06);">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td align="center" style="padding-bottom:8px;">
                                    <p style="margin:0; font-size:20px; line-height:28px; font-weight:700; color:#1B1B1B;">
                                        {{ $purpose === 'reset' ? 'Reset your password' : 'Verify your email' }}
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding-bottom:28px;">
                                    <p style="margin:0; font-size:14px; line-height:22px; color:#6B6B6B;">
                                        @if ($purpose === 'reset')
                                            Use the code below to reset your Edeen password.
                                        @else
                                            Welcome to Edeen. Use the code below to verify your email and get started.
                                        @endif
                                    </p>
                                </td>
                            </tr>

                            {{-- OTP code --}}
                            <tr>
                                <td align="center" style="padding-bottom:24px;">
                                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background-color:#CFE7E0; border-radius:16px;">
                                        <tr>
                                            <td style="padding:18px 32px;">
                                                <span style="font-size:34px; line-height:40px; font-weight:700; letter-spacing:10px; color:#2F5D50; font-family:'Courier New',Courier,monospace;">
                                                    {{ $code }}
                                                </span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <tr>
                                <td align="center" style="padding-bottom:4px;">
                                    <p style="margin:0; font-size:13px; line-height:20px; color:#6B6B6B;">
                                        This code expires in {{ $expiresInMinutes }} minutes.
                                    </p>
                                </td>
                            </tr>

                            {{-- Divider --}}
                            <tr>
                                <td style="padding-top:24px; padding-bottom:20px;">
                                    <div style="border-top:1px solid #EEEEEE;"></div>
                                </td>
                            </tr>

                            <tr>
                                <td align="center">
                                    <p style="margin:0; font-size:12px; line-height:18px; color:#9B9B9B;">
                                        If you didn't request this code, you can safely ignore this email.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- Footer --}}
                <tr>
                    <td align="center" style="padding-top:24px;">
                        <p style="margin:0; font-size:12px; line-height:18px; color:#9B9B9B;">
                            Edeen &middot; Habits, Salah &amp; Qur'an tracking
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
