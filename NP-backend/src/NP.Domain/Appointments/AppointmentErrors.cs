using NP.Domain.Abstractions;

namespace NP.Domain.Appointments;

public static class AppointmentErrors
{
    public static readonly Error InvalidClientId          = new("Appointment.InvalidClientId",          "Client ID is invalid.");
    public static readonly Error InvalidNutritionistId    = new("Appointment.InvalidNutritionistId",    "Nutritionist ID is invalid.");
    public static readonly Error InvalidScheduledAt       = new("Appointment.InvalidScheduledAt",       "Scheduled date must be in the future.");
    public static readonly Error InvalidStatusTransition  = new("Appointment.InvalidStatusTransition",  "This status transition is not allowed.");
    public static readonly Error NotFound                 = new("Appointment.NotFound",                 "Appointment not found.");
    public static readonly Error SlotAlreadyTaken         = new("Appointment.SlotAlreadyTaken",         "This time slot is already booked.");
    public static readonly Error PremiumRequired          = new("Appointment.PremiumRequired",          "Appointments require an active Personalized subscription.");
    public static readonly Error TooManyPendingRequests   = new("Appointment.TooManyPendingRequests",   "You already have 3 pending appointment requests. Cancel one before booking again.");
}
