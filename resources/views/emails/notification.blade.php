<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{{ $mailSubject }}</title></head>
<body style="margin:0;padding:0;background:#F4F2FF;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#1B1340;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F4F2FF;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
      <tr><td style="padding:0 0 20px 4px;">
        <span style="display:inline-block;width:34px;height:34px;line-height:34px;text-align:center;background:#6B4CFF;border-radius:10px;color:#fff;font-weight:800;font-size:18px;vertical-align:middle;">&#10003;</span>
        <span style="font-size:22px;font-weight:800;vertical-align:middle;margin-left:8px;">Task<span style="color:#FF6B57;">Flow</span></span>
      </td></tr>
      <tr><td style="background:#ffffff;border-radius:24px;padding:36px 32px;box-shadow:0 12px 32px -16px rgba(27,19,64,.25);">
        <h1 style="margin:0 0 18px;font-size:24px;line-height:1.25;color:#1B1340;">{{ $heading }}</h1>
        @foreach ($lines as $line)
          <p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#352A6E;">{{ $line }}</p>
        @endforeach
        @if ($buttonText && $buttonUrl)
          <p style="margin:26px 0 6px;"><a href="{{ $buttonUrl }}" style="display:inline-block;background:#6B4CFF;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:999px;">{{ $buttonText }}</a></p>
        @endif
      </td></tr>
      <tr><td style="padding:22px 8px 0;text-align:center;font-size:12px;line-height:1.6;color:#6A6190;">
        Need help? Reply to this email or write to <a href="mailto:{{ config('taskflow.support_email') }}" style="color:#6B4CFF;">{{ config('taskflow.support_email') }}</a><br>
        &copy; {{ date('Y') }} TaskFlow
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
