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

    public EmailService(IOptions<EmailOptions> options, ILogger<EmailService> logger)
    {
        _options = options.Value;
        _logger  = logger;
    }

    public async Task SendOtpAsync(
        string toEmail, string firstName, string otp,
        CancellationToken cancellationToken = default)
    {
        var message = BuildMessage(toEmail, firstName, otp);

        using var client = new SmtpClient();

        // SecureSocketOptions.StartTls works with Gmail App Passwords on port 587.
        // For port 465 (SSL) use SecureSocketOptions.SslOnConnect instead.
        await client.ConnectAsync(
            _options.SmtpHost,
            _options.SmtpPort,
            SecureSocketOptions.StartTls,
            cancellationToken);

        await client.AuthenticateAsync(
            _options.Username,
            _options.Password,
            cancellationToken);

        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(quit: true, cancellationToken);

        _logger.LogInformation("OTP email dispatched successfully (recipient masked)");
    }

    private MimeMessage BuildMessage(string toEmail, string firstName, string otp)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_options.FromName, _options.FromAddress));
        message.To.Add(new MailboxAddress(firstName, toEmail));
        message.Subject = "Your NutriLife Verification Code";

        message.Body = new TextPart("html")
        {
            Text = BuildHtmlBody(firstName, otp)
        };

        return message;
    }

    private static string BuildHtmlBody(string firstName, string otp) => $"""
        <!DOCTYPE html>
        <html>
        <body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;">
          <div style="max-width:480px;margin:auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
            <h2 style="color:#10b981;margin-bottom:8px;">NutriLife</h2>
            <p style="color:#374151;">Hi <strong>{firstName}</strong>,</p>
            <p style="color:#374151;">Use the code below to complete your sign-in. It expires in <strong>5 minutes</strong>.</p>
            <div style="text-align:center;margin:28px 0;">
              <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#111827;background:#f9fafb;padding:16px 24px;border-radius:8px;border:1px solid #e5e7eb;">{otp}</span>
            </div>
            <p style="color:#6b7280;font-size:13px;">If you did not request this code, you can safely ignore this email.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
            <p style="color:#9ca3af;font-size:12px;text-align:center;">NutriLife Platform &mdash; Do not reply to this email.</p>
          </div>
        </body>
        </html>
        """;
}
