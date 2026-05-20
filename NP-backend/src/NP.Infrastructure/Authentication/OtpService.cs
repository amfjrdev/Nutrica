using System.Security.Cryptography;
using NP.Application.Abstractions.Authentication;

namespace NP.Infrastructure.Authentication;

internal sealed class OtpService : IOtpService
{
    // Generates a cryptographically random 6-digit OTP (000000–999999).
    // Uses RandomNumberGenerator instead of Random to prevent predictability.
    public string Generate()
    {
        var bytes = new byte[4];
        RandomNumberGenerator.Fill(bytes);
        var value = Math.Abs(BitConverter.ToInt32(bytes, 0)) % 1_000_000;
        return value.ToString("D6"); // zero-padded to always be 6 digits
    }

    // BCrypt is intentionally slow — appropriate for OTP hashing.
    // Work factor 10 is the same as used for passwords in this project.
    public string Hash(string otp) =>
        BCrypt.Net.BCrypt.HashPassword(otp, workFactor: 10);

    public bool Verify(string otp, string hash) =>
        BCrypt.Net.BCrypt.Verify(otp, hash);
}
