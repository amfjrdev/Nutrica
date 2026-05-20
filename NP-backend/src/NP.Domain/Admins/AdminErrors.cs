using NP.Domain.Abstractions;

namespace NP.Domain.Admins;

public static class AdminErrors
{
    public static readonly Error InvalidUserId = new("Admin.InvalidUserId", "User ID is invalid.");
    public static readonly Error NotFound = new("Admin.NotFound", "Admin not found.");
}
