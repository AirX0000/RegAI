from app.api.v1.calculators import IFRS16Input, calculate_ifrs16, IAS36Input, calculate_ias36, IFRS9Input, calculate_ifrs9

ifrs16 = calculate_ifrs16(IFRS16Input(lease_term_months=60, discount_rate_annual=5.0, monthly_payment=5000, initial_direct_costs=1000))
print("IFRS 16:", ifrs16)

ias36 = calculate_ias36(IAS36Input(carrying_amount=100000, fair_value_less_costs=80000, value_in_use=85000))
print("IAS 36:", ias36)

ifrs9_stage1 = calculate_ifrs9(IFRS9Input(ead=500000, pd_percentage=2.0, lgd_percentage=45.0, days_past_due=15))
print("IFRS 9 Stage 1:", ifrs9_stage1)

ifrs9_stage2 = calculate_ifrs9(IFRS9Input(ead=500000, pd_percentage=8.0, lgd_percentage=50.0, days_past_due=60, discount_rate_annual=6.0))
print("IFRS 9 Stage 2:", ifrs9_stage2)

