namespace NP.Application.Abstractions.Email;

public interface IEmailService
{
    Task SendOtpAsync(string toEmail, string firstName, string otp, CancellationToken cancellationToken = default);
}
