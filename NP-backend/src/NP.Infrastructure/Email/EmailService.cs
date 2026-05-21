using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using NP.Application.Abstractions.Email;

namespace NP.Infrastructure.Email;

internal sealed class EmailService : IEmailService
{
    private readonly EmailOptions _options;
    private readonly ILogger<EmailService> _logger;

    public EmailService(
        IOptions<EmailOptions> options,
        ILogger<EmailService> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendOtpAsync(
        string toEmail,
        string firstName,
        string otp,
        CancellationToken cancellationToken = default)
    {
        var message = BuildMessage(toEmail, firstName, otp);

        using var client = new SmtpClient();

        await client.ConnectAsync(
            _options.SmtpHost,
            _options.SmtpPort,
            _options.SmtpPort == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls,
            cancellationToken);

        await client.AuthenticateAsync(
            _options.Username,
            _options.Password,
            cancellationToken);

        await client.SendAsync(message, cancellationToken);

        await client.DisconnectAsync(
            true,
            cancellationToken);

        _logger.LogInformation("OTP email sent successfully.");
    }

    private MimeMessage BuildMessage(
        string toEmail,
        string firstName,
        string otp)
    {
        var message = new MimeMessage();

        message.From.Add(
            new MailboxAddress(
                _options.FromName,
                _options.FromAddress
            )
        );

        message.To.Add(
            new MailboxAddress(
                firstName,
                toEmail
            )
        );

        message.Subject = "Your Nutrica Verification Code";

        message.Body = new TextPart("html")
        {
            Text = BuildHtmlBody(firstName, otp)
        };

        return message;
    }

    private static string BuildHtmlBody(
        string firstName,
        string otp) => $"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nutrica Verification</title>
</head>

<body style="
    margin:0;
    padding:0;
    background-color:#f3f4f6;
    font-family:Arial,sans-serif;
">

    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center" style="padding:40px 20px;">

                <table width="500" cellpadding="0" cellspacing="0" style="
                    background:#ffffff;
                    border-radius:16px;
                    padding:40px;
                    box-shadow:0 4px 12px rgba(0,0,0,0.08);
                ">

                    <tr>
                        <td align="center">

                            <h1 style="
                                margin:0;
                                color:#10b981;
                                font-size:32px;
                            ">
                                Nutrica
                            </h1>

                            <p style="
                                margin-top:8px;
                                color:#6b7280;
                                font-size:14px;
                            ">
                                Secure Verification System
                            </p>

                        </td>
                    </tr>

                    <tr>
                        <td style="padding-top:30px;">

                            <p style="
                                color:#111827;
                                font-size:16px;
                                margin:0;
                            ">
                                Hi <strong>{firstName}</strong>,
                            </p>

                            <p style="
                                color:#4b5563;
                                font-size:15px;
                                line-height:1.7;
                                margin-top:18px;
                            ">
                                Use the verification code below to complete your sign-in.
                                This code will expire in
                                <strong>5 minutes</strong>.
                            </p>

                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding:35px 0;">

                            <div style="
                                display:inline-block;
                                background:#f9fafb;
                                border:1px solid #e5e7eb;
                                border-radius:12px;
                                padding:18px 28px;
                                font-size:38px;
                                font-weight:bold;
                                letter-spacing:10px;
                                color:#111827;
                            ">
                                {otp}
                            </div>

                        </td>
                    </tr>

                    <tr>
                        <td>

                            <p style="
                                color:#6b7280;
                                font-size:13px;
                                line-height:1.6;
                            ">
                                If you did not request this code,
                                you can safely ignore this email.
                            </p>

                        </td>
                    </tr>

                    <tr>
                        <td style="padding-top:30px;">

                            <hr style="
                                border:none;
                                border-top:1px solid #e5e7eb;
                            ">

                            <p style="
                                margin-top:20px;
                                color:#9ca3af;
                                font-size:12px;
                                text-align:center;
                            ">
                                Nutrica Platform — Do not reply to this email.
                            </p>

                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
""";
}