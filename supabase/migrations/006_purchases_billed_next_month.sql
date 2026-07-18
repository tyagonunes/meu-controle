-- Recalcula o mês de cobrança das parcelas considerando a data de fechamento do cartão.
-- Regra: a fatura é PAGA no mês seguinte ao seu fechamento.
--   * Compra até o dia de fechamento  -> fecha no mês da compra   -> paga no mês seguinte
--   * Compra após o dia de fechamento -> fecha no mês seguinte     -> paga dois meses depois
-- billing_month da parcela N (1-based) = mês de pagamento da 1ª parcela + (N - 1) meses.
update public.purchase_installments as installment
set billing_month = (
  date_trunc('month',
    case
      when extract(day from purchase.purchase_date) <= card.closing_day
        then purchase.purchase_date
      else purchase.purchase_date + interval '1 month'
    end
  )::date
  + make_interval(months => installment.installment_number)
)::date
from public.purchases as purchase
join public.credit_cards as card on card.id = purchase.credit_card_id
where purchase.id = installment.purchase_id
  and installment.billing_month <> (
    date_trunc('month',
      case
        when extract(day from purchase.purchase_date) <= card.closing_day
          then purchase.purchase_date
        else purchase.purchase_date + interval '1 month'
      end
    )::date
    + make_interval(months => installment.installment_number)
  )::date;
