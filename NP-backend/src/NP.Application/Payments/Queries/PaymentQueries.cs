using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Payments;
using NP.Domain.Payments.Repositories;

namespace NP.Application.Payments.Queries;

public sealed record PaymentDto(Guid Id, Guid ClientId, Guid SubscriptionId, decimal Amount, string Currency, string Status, string StripePaymentIntentId, DateTime CreatedAt, DateTime? PaidAt);

public sealed record GetAllPaymentsQuery : IQuery<List<PaymentDto>>;

public sealed record GetPaymentsByClientQuery(Guid ClientId) : IQuery<List<PaymentDto>>;

public sealed record GetPendingPaymentsQuery : IQuery<List<PaymentDto>>;

internal static class PaymentMapper
{
    public static PaymentDto ToDto(Payment p) =>
        new(p.Id, p.ClientId, p.SubscriptionId, p.Amount, p.Currency, p.Status.ToString(), p.StripePaymentIntentId, p.CreatedAt, p.PaidAt);
}

internal sealed class GetAllPaymentsQueryHandler : IQueryHandler<GetAllPaymentsQuery, List<PaymentDto>>
{
    private readonly IPaymentRepository _repo;
    public GetAllPaymentsQueryHandler(IPaymentRepository repo) => _repo = repo;

    public async Task<Result<List<PaymentDto>>> HandleAsync(GetAllPaymentsQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _repo.GetAllAsync(cancellationToken);
        return Result.Success(list.Select(PaymentMapper.ToDto).ToList());
    }
}

internal sealed class GetPaymentsByClientQueryHandler : IQueryHandler<GetPaymentsByClientQuery, List<PaymentDto>>
{
    private readonly IPaymentRepository _repo;
    public GetPaymentsByClientQueryHandler(IPaymentRepository repo) => _repo = repo;

    public async Task<Result<List<PaymentDto>>> HandleAsync(GetPaymentsByClientQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _repo.GetByClientIdAsync(query.ClientId, cancellationToken);
        return Result.Success(list.Select(PaymentMapper.ToDto).ToList());
    }
}

internal sealed class GetPendingPaymentsQueryHandler : IQueryHandler<GetPendingPaymentsQuery, List<PaymentDto>>
{
    private readonly IPaymentRepository _repo;
    public GetPendingPaymentsQueryHandler(IPaymentRepository repo) => _repo = repo;

    public async Task<Result<List<PaymentDto>>> HandleAsync(GetPendingPaymentsQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _repo.GetAllAsync(cancellationToken);
        return Result.Success(list.Where(p => p.Status == NP.Domain.Payments.PaymentStatus.Pending).Select(PaymentMapper.ToDto).ToList());
    }
}
