namespace NP.Application.Abstractions.Authentication;

public interface IOtpService
{
    /// <summary>Generates a cryptographically random 6-digit OTP string.</summary>
    string Generate();

    /// <summary>Returns a BCrypt hash of the OTP for safe storage.</summary>
    string Hash(string otp);

    /// <summary>Verifies a plain OTP against its stored hash.</summary>
    bool Verify(string otp, string hash);
}
