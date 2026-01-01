"""
Banking Regulations Seed Data - Bilingual (English/Russian)
Comprehensive Basel III and IFRS 9 regulations for banks
"""

banking_regulations_bilingual = [
    # Basel III - Pillar 1: Minimum Capital Requirements
    {
        "code": "BASEL-III-CAR",
        "title": "Basel III: Capital Adequacy Ratio (CAR) / Базель III: Коэффициент достаточности капитала (КДК)",
        "content": """
**English:**
The Capital Adequacy Ratio (CAR) is a key measure of a bank's financial strength. Under Basel III, banks must maintain a minimum CAR of 8% of risk-weighted assets (RWA).

**Formula**: CAR = (Tier 1 Capital + Tier 2 Capital) / Risk-Weighted Assets × 100

**Minimum Requirements**:
- Total Capital Ratio: 8% of RWA
- Tier 1 Capital Ratio: 6% of RWA  
- Common Equity Tier 1 (CET1): 4.5% of RWA

**Capital Conservation Buffer**: Additional 2.5% of RWA, bringing total CET1 requirement to 7%

**Countercyclical Capital Buffer**: 0-2.5% of RWA (varies by jurisdiction and economic conditions)

**Purpose**: Ensures banks have sufficient capital to absorb unexpected losses and maintain operations during financial stress.

---

**Русский:**
Коэффициент достаточности капитала (КДК) является ключевым показателем финансовой устойчивости банка. Согласно Базелю III, банки должны поддерживать минимальный КДК на уровне 8% от активов, взвешенных по риску (АВР).

**Формула**: КДК = (Капитал 1-го уровня + Капитал 2-го уровня) / Активы, взвешенные по риску × 100

**Минимальные требования**:
- Общий коэффициент капитала: 8% от АВР
- Коэффициент капитала 1-го уровня: 6% от АВР
- Базовый капитал 1-го уровня (CET1): 4,5% от АВР

**Буфер консервации капитала**: Дополнительные 2,5% от АВР, доводя общее требование CET1 до 7%

**Контрциклический буфер капитала**: 0-2,5% от АВР (варьируется в зависимости от юрисдикции и экономических условий)

**Цель**: Обеспечить достаточность капитала банков для поглощения неожиданных убытков и поддержания операций во время финансового стресса.
        """,
        "category": "Financial",
        "jurisdiction": "Global",
        "effective_date": "2019-01-01",
        "workflow_steps": [
            {
                "step": 1,
                "title": "Calculate Risk-Weighted Assets (RWA) / Расчет активов, взвешенных по риску (АВР)",
                "description": "Determine RWA for credit risk, market risk, and operational risk / Определение АВР для кредитного, рыночного и операционного риска",
                "checklist": [
                    "Classify all assets by risk category / Классифицировать все активы по категориям риска",
                    "Apply risk weights (0%, 20%, 50%, 100%, 150%) / Применить весовые коэффициенты риска",
                    "Calculate credit risk RWA / Рассчитать АВР кредитного риска",
                    "Calculate market risk RWA / Рассчитать АВР рыночного риска",
                    "Calculate operational risk RWA / Рассчитать АВР операционного риска",
                    "Sum total RWA / Суммировать общий АВР"
                ]
            },
            {
                "step": 2,
                "title": "Determine Capital Components / Определение компонентов капитала",
                "description": "Calculate Tier 1 and Tier 2 capital / Расчет капитала 1-го и 2-го уровня",
                "checklist": [
                    "Calculate Common Equity Tier 1 (CET1) / Рассчитать базовый капитал 1-го уровня",
                    "Calculate Additional Tier 1 (AT1) / Рассчитать дополнительный капитал 1-го уровня",
                    "Calculate Tier 2 capital / Рассчитать капитал 2-го уровня",
                    "Apply regulatory adjustments / Применить регуляторные корректировки",
                    "Verify capital quality / Проверить качество капитала"
                ]
            },
            {
                "step": 3,
                "title": "Calculate Capital Ratios / Расчет коэффициентов капитала",
                "description": "Compute CAR and component ratios / Расчет КДК и компонентных коэффициентов",
                "checklist": [
                    "Calculate CET1 ratio / Рассчитать коэффициент CET1",
                    "Calculate Tier 1 ratio / Рассчитать коэффициент капитала 1-го уровня",
                    "Calculate Total Capital ratio / Рассчитать общий коэффициент капитала",
                    "Apply capital buffers / Применить буферы капитала",
                    "Compare against minimum requirements / Сравнить с минимальными требованиями"
                ]
            },
            {
                "step": 4,
                "title": "Regulatory Reporting / Регуляторная отчетность",
                "description": "Prepare and submit capital adequacy reports / Подготовка и представление отчетов о достаточности капитала",
                "checklist": [
                    "Complete regulatory templates / Заполнить регуляторные формы",
                    "Document methodology / Документировать методологию",
                    "Obtain management approval / Получить одобрение руководства",
                    "Submit to supervisory authority / Представить надзорному органу",
                    "Maintain audit trail / Вести аудиторский след"
                ]
            }
        ]
    },
    
    # Basel III - Leverage Ratio
    {
        "code": "BASEL-III-LR",
        "title": "Basel III: Leverage Ratio / Базель III: Коэффициент левериджа",
        "content": """
**English:**
The Leverage Ratio is a non-risk-based measure that supplements risk-based capital requirements. It limits the build-up of leverage in the banking sector.

**Formula**: Leverage Ratio = Tier 1 Capital / Total Exposure × 100

**Minimum Requirement**: 3% (some jurisdictions require higher ratios for systemically important banks)

**Total Exposure Includes**:
- On-balance sheet exposures
- Derivative exposures
- Securities financing transaction exposures
- Off-balance sheet items

**Purpose**: Prevents excessive leverage and provides a backstop to risk-based capital measures.

**Reporting**: Must be disclosed publicly on a quarterly basis under Pillar 3.

---

**Русский:**
Коэффициент левериджа является мерой, не основанной на риске, которая дополняет требования к капиталу, основанные на риске. Он ограничивает накопление левериджа в банковском секторе.

**Формула**: Коэффициент левериджа = Капитал 1-го уровня / Общая подверженность риску × 100

**Минимальное требование**: 3% (некоторые юрисдикции требуют более высоких коэффициентов для системно значимых банков)

**Общая подверженность включает**:
- Балансовые требования
- Требования по производным инструментам
- Требования по операциям финансирования ценными бумагами
- Внебалансовые статьи

**Цель**: Предотвращение чрезмерного левериджа и обеспечение страховки для мер капитала, основанных на риске.

**Отчетность**: Должна раскрываться публично на ежеквартальной основе в рамках Столпа 3.
        """,
        "category": "Financial",
        "jurisdiction": "Global",
        "effective_date": "2018-01-01",
        "workflow_steps": [
            {
                "step": 1,
                "title": "Calculate Total Exposure / Расчет общей подверженности риску",
                "description": "Determine all on and off-balance sheet exposures / Определение всех балансовых и внебалансовых требований",
                "checklist": [
                    "Sum on-balance sheet assets / Суммировать балансовые активы",
                    "Calculate derivative exposures (replacement cost + add-on) / Рассчитать требования по производным инструментам",
                    "Calculate securities financing exposures / Рассчитать требования по финансированию ценными бумагами",
                    "Convert off-balance sheet items / Конвертировать внебалансовые статьи",
                    "Apply netting where permitted / Применить неттинг где разрешено"
                ]
            },
            {
                "step": 2,
                "title": "Calculate Leverage Ratio / Расчет коэффициента левериджа",
                "description": "Compute ratio and compare to minimum / Расчет коэффициента и сравнение с минимумом",
                "checklist": [
                    "Obtain Tier 1 capital amount / Получить сумму капитала 1-го уровня",
                    "Divide by total exposure / Разделить на общую подверженность",
                    "Multiply by 100 for percentage / Умножить на 100 для процента",
                    "Compare to 3% minimum / Сравнить с минимумом 3%",
                    "Document any shortfall / Документировать любой дефицит"
                ]
            }
        ]
    },
    
    # IFRS 9 - Expected Credit Loss
    {
        "code": "IFRS-9-ECL",
        "title": "IFRS 9: Expected Credit Loss Model / МСФО 9: Модель ожидаемых кредитных убытков",
        "content": """
**English:**
IFRS 9 introduced a forward-looking Expected Credit Loss (ECL) model for recognizing impairment on financial assets, replacing the incurred loss model.

**Three-Stage Approach**:

**Stage 1**: Performing assets (no significant increase in credit risk)
- Recognize: 12-month ECL
- Interest revenue: Calculated on gross carrying amount

**Stage 2**: Underperforming assets (significant increase in credit risk)
- Recognize: Lifetime ECL
- Interest revenue: Calculated on gross carrying amount

**Stage 3**: Credit-impaired assets
- Recognize: Lifetime ECL
- Interest revenue: Calculated on net carrying amount (gross - loss allowance)

**Key Concepts**:
- **12-month ECL**: Expected credit losses from default events within 12 months
- **Lifetime ECL**: Expected credit losses from all possible default events over the life of the instrument
- **Significant Increase in Credit Risk**: Determined by comparing default risk at reporting date vs. initial recognition

**Measurement**: ECL = PD × LGD × EAD
- PD: Probability of Default
- LGD: Loss Given Default  
- EAD: Exposure at Default

---

**Русский:**
МСФО 9 ввел перспективную модель ожидаемых кредитных убытков (ОКУ) для признания обесценения финансовых активов, заменив модель понесенных убытков.

**Трехэтапный подход**:

**Этап 1**: Работающие активы (нет значительного увеличения кредитного риска)
- Признание: 12-месячные ОКУ
- Процентный доход: Рассчитывается от валовой балансовой стоимости

**Этап 2**: Недостаточно работающие активы (значительное увеличение кредитного риска)
- Признание: Пожизненные ОКУ
- Процентный доход: Рассчитывается от валовой балансовой стоимости

**Этап 3**: Кредитно-обесцененные активы
- Признание: Пожизненные ОКУ
- Процентный доход: Рассчитывается от чистой балансовой стоимости (валовая - резерв под убытки)

**Ключевые концепции**:
- **12-месячные ОКУ**: Ожидаемые кредитные убытки от событий дефолта в течение 12 месяцев
- **Пожизненные ОКУ**: Ожидаемые кредитные убытки от всех возможных событий дефолта в течение срока действия инструмента
- **Значительное увеличение кредитного риска**: Определяется путем сравнения риска дефолта на отчетную дату с первоначальным признанием

**Измерение**: ОКУ = ВД × УПД × ПнД
- ВД: Вероятность дефолта
- УПД: Убыток при дефолте
- ПнД: Подверженность на дату дефолта
        """,
        "category": "Financial",
        "jurisdiction": "Global",
        "effective_date": "2018-01-01",
        "workflow_steps": [
            {
                "step": 1,
                "title": "Stage Classification / Классификация по этапам",
                "description": "Classify financial assets into stages 1, 2, or 3 / Классификация финансовых активов по этапам 1, 2 или 3",
                "checklist": [
                    "Assess credit risk at reporting date / Оценить кредитный риск на отчетную дату",
                    "Compare to credit risk at initial recognition / Сравнить с кредитным риском при первоначальном признании",
                    "Identify significant increases in credit risk / Выявить значительные увеличения кредитного риска",
                    "Identify credit-impaired assets / Выявить кредитно-обесцененные активы",
                    "Document staging decisions / Документировать решения по этапам"
                ]
            },
            {
                "step": 2,
                "title": "Calculate ECL Parameters / Расчет параметров ОКУ",
                "description": "Determine PD, LGD, and EAD for each stage / Определение ВД, УПД и ПнД для каждого этапа",
                "checklist": [
                    "Calculate Probability of Default (PD) / Рассчитать вероятность дефолта (ВД)",
                    "Determine Loss Given Default (LGD) / Определить убыток при дефолте (УПД)",
                    "Calculate Exposure at Default (EAD) / Рассчитать подверженность на дату дефолта (ПнД)",
                    "Apply forward-looking information / Применить перспективную информацию",
                    "Consider multiple scenarios / Рассмотреть множественные сценарии"
                ]
            },
            {
                "step": 3,
                "title": "Compute ECL Provision / Расчет резерва ОКУ",
                "description": "Calculate 12-month or lifetime ECL / Расчет 12-месячных или пожизненных ОКУ",
                "checklist": [
                    "For Stage 1: Calculate 12-month ECL / Для этапа 1: Рассчитать 12-месячные ОКУ",
                    "For Stage 2/3: Calculate lifetime ECL / Для этапов 2/3: Рассчитать пожизненные ОКУ",
                    "Apply discount rate / Применить ставку дисконтирования",
                    "Sum across all exposures / Суммировать по всем подверженностям",
                    "Compare to previous period / Сравнить с предыдущим периодом"
                ]
            },
            {
                "step": 4,
                "title": "Financial Statement Impact / Влияние на финансовую отчетность",
                "description": "Record ECL in financial statements / Отражение ОКУ в финансовой отчетности",
                "checklist": [
                    "Record loss allowance / Отразить резерв под убытки",
                    "Recognize impairment loss in P&L / Признать убыток от обесценения в ОПУ",
                    "Adjust interest revenue calculation / Скорректировать расчет процентного дохода",
                    "Prepare IFRS 7 disclosures / Подготовить раскрытия по МСФО 7",
                    "Document significant judgments / Документировать значимые суждения"
                ]
            }
        ]
    },
    
    # Basel III - Liquidity Coverage Ratio
    {
        "code": "BASEL-III-LCR",
        "title": "Basel III: Liquidity Coverage Ratio (LCR) / Базель III: Коэффициент покрытия ликвидности (КПЛ)",
        "content": """
**English:**
The Liquidity Coverage Ratio ensures banks hold sufficient high-quality liquid assets (HQLA) to survive a significant stress scenario lasting 30 days.

**Formula**: LCR = High-Quality Liquid Assets / Total Net Cash Outflows over 30 days × 100

**Minimum Requirement**: 100%

**High-Quality Liquid Assets (HQLA)**:
- **Level 1**: Cash, central bank reserves, sovereign debt (0% haircut)
- **Level 2A**: Corporate bonds, covered bonds (15% haircut)
- **Level 2B**: Lower-rated corporate bonds, equities (50% haircut)

**Net Cash Outflows**: Expected cash outflows minus expected cash inflows (capped at 75% of outflows)

**Stress Scenario Assumptions**:
- Partial loss of retail deposits
- Partial loss of wholesale funding
- Drawdown of committed credit facilities
- Increased collateral requirements

**Purpose**: Promotes short-term resilience to liquidity disruptions.

---

**Русский:**
Коэффициент покрытия ликвидности обеспечивает наличие у банков достаточных высококачественных ликвидных активов (ВКЛА) для выживания в значительном стрессовом сценарии продолжительностью 30 дней.

**Формула**: КПЛ = Высококачественные ликвидные активы / Общий чистый отток денежных средств за 30 дней × 100

**Минимальное требование**: 100%

**Высококачественные ликвидные активы (ВКЛА)**:
- **Уровень 1**: Наличные, резервы центрального банка, суверенный долг (0% дисконт)
- **Уровень 2A**: Корпоративные облигации, покрытые облигации (15% дисконт)
- **Уровень 2B**: Корпоративные облигации с более низким рейтингом, акции (50% дисконт)

**Чистый отток денежных средств**: Ожидаемый отток денежных средств минус ожидаемый приток (ограничен 75% от оттока)

**Предположения стрессового сценария**:
- Частичная потеря розничных депозитов
- Частичная потеря оптового финансирования
- Использование обязательств по кредитным линиям
- Увеличение требований к обеспечению

**Цель**: Способствует краткосрочной устойчивости к нарушениям ликвидности.
        """,
        "category": "Financial",
        "jurisdiction": "Global",
        "effective_date": "2015-01-01",
        "workflow_steps": [
            {
                "step": 1,
                "title": "Identify and Value HQLA / Идентификация и оценка ВКЛА",
                "description": "Determine eligible liquid assets and apply haircuts / Определение приемлемых ликвидных активов и применение дисконтов",
                "checklist": [
                    "Classify assets into Level 1, 2A, 2B / Классифицировать активы по уровням 1, 2A, 2B",
                    "Apply appropriate haircuts / Применить соответствующие дисконты",
                    "Verify operational requirements / Проверить операционные требования",
                    "Check concentration limits / Проверить лимиты концентрации",
                    "Calculate total HQLA / Рассчитать общие ВКЛА"
                ]
            },
            {
                "step": 2,
                "title": "Calculate Cash Outflows / Расчет оттоков денежных средств",
                "description": "Estimate 30-day stressed outflows / Оценка 30-дневных стрессовых оттоков",
                "checklist": [
                    "Calculate retail deposit outflows / Рассчитать оттоки розничных депозитов",
                    "Calculate wholesale funding outflows / Рассчитать оттоки оптового финансирования",
                    "Estimate derivative collateral calls / Оценить требования по обеспечению производных инструментов",
                    "Include committed facility drawdowns / Включить использование обязательств",
                    "Sum total outflows / Суммировать общие оттоки"
                ]
            },
            {
                "step": 3,
                "title": "Calculate Cash Inflows / Расчет притоков денежных средств",
                "description": "Estimate 30-day inflows (capped at 75% of outflows) / Оценка 30-дневных притоков (ограничено 75% от оттоков)",
                "checklist": [
                    "Calculate contractual receivables / Рассчитать договорную дебиторскую задолженность",
                    "Estimate maturing reverse repos / Оценить погашающиеся обратные репо",
                    "Include other inflows / Включить другие притоки",
                    "Apply 75% cap / Применить ограничение 75%",
                    "Calculate net cash outflows / Рассчитать чистые оттоки денежных средств"
                ]
            },
            {
                "step": 4,
                "title": "Compute LCR and Report / Расчет КПЛ и отчетность",
                "description": "Calculate ratio and submit regulatory reports / Расчет коэффициента и представление регуляторных отчетов",
                "checklist": [
                    "Divide HQLA by net cash outflows / Разделить ВКЛА на чистые оттоки",
                    "Verify LCR ≥ 100% / Проверить КПЛ ≥ 100%",
                    "Prepare regulatory templates / Подготовить регуляторные формы",
                    "Submit to supervisor / Представить надзорному органу",
                    "Monitor daily / Мониторить ежедневно"
                ]
            }
        ]
    },
    
    # IFRS 9 - Classification and Measurement
    {
        "code": "IFRS-9-CLASS",
        "title": "IFRS 9: Classification and Measurement of Financial Instruments / МСФО 9: Классификация и оценка финансовых инструментов",
        "content": """
**English:**
IFRS 9 establishes principles for classifying and measuring financial assets and liabilities based on business model and contractual cash flow characteristics.

**Financial Assets Classification**:

**Amortized Cost**: If both conditions met:
1. Business model: Hold to collect contractual cash flows
2. Cash flows: Solely payments of principal and interest (SPPI test)

**Fair Value Through Other Comprehensive Income (FVOCI)**: If both conditions met:
1. Business model: Hold to collect AND sell
2. Cash flows: Pass SPPI test

**Fair Value Through Profit or Loss (FVTPL)**: All other financial assets

**SPPI Test (Solely Payments of Principal and Interest)**:
- Principal: Fair value at initial recognition
- Interest: Consideration for time value of money and credit risk
- Must not have leverage, prepayment features that could result in holder not recovering substantially all investment

**Financial Liabilities**: Generally measured at amortized cost, except:
- Derivatives
- Trading liabilities
- Liabilities designated at FVTPL

**Reclassification**: Only when business model changes (rare).

---

**Русский:**
МСФО 9 устанавливает принципы классификации и оценки финансовых активов и обязательств на основе бизнес-модели и характеристик договорных денежных потоков.

**Классификация финансовых активов**:

**Амортизированная стоимость**: Если выполнены оба условия:
1. Бизнес-модель: Удержание для получения договорных денежных потоков
2. Денежные потоки: Исключительно платежи основной суммы и процентов (тест SPPI)

**Справедливая стоимость через прочий совокупный доход (ССЧПСД)**: Если выполнены оба условия:
1. Бизнес-модель: Удержание для получения И продажи
2. Денежные потоки: Прохождение теста SPPI

**Справедливая стоимость через прибыль или убыток (ССЧПУ)**: Все остальные финансовые активы

**Тест SPPI (Исключительно платежи основной суммы и процентов)**:
- Основная сумма: Справедливая стоимость при первоначальном признании
- Проценты: Возмещение за временную стоимость денег и кредитный риск
- Не должно быть левериджа, функций досрочного погашения, которые могут привести к невозврату держателем практически всех инвестиций

**Финансовые обязательства**: Обычно оцениваются по амортизированной стоимости, за исключением:
- Производных инструментов
- Торговых обязательств
- Обязательств, определенных по ССЧПУ

**Реклассификация**: Только при изменении бизнес-модели (редко).
        """,
        "category": "Financial",
        "jurisdiction": "Global",
        "effective_date": "2018-01-01",
        "workflow_steps": [
            {
                "step": 1,
                "title": "Assess Business Model / Оценка бизнес-модели",
                "description": "Determine how financial assets are managed / Определение способа управления финансовыми активами",
                "checklist": [
                    "Identify portfolio objectives / Определить цели портфеля",
                    "Analyze historical sales patterns / Проанализировать исторические модели продаж",
                    "Review management compensation / Проверить вознаграждение руководства",
                    "Assess frequency and volume of sales / Оценить частоту и объем продаж",
                    "Classify as: Hold to collect, Hold and sell, or Other / Классифицировать как: Удержание, Удержание и продажа, или Другое"
                ]
            },
            {
                "step": 2,
                "title": "Perform SPPI Test / Выполнение теста SPPI",
                "description": "Assess contractual cash flow characteristics / Оценка характеристик договорных денежных потоков",
                "checklist": [
                    "Review contractual terms / Проверить договорные условия",
                    "Identify principal amount / Определить основную сумму",
                    "Verify interest components / Проверить компоненты процентов",
                    "Check for leverage features / Проверить на наличие функций левериджа",
                    "Assess prepayment terms / Оценить условия досрочного погашения",
                    "Document SPPI conclusion / Документировать вывод по SPPI"
                ]
            },
            {
                "step": 3,
                "title": "Classify Financial Instrument / Классификация финансового инструмента",
                "description": "Determine measurement category / Определение категории оценки",
                "checklist": [
                    "If Hold to collect + SPPI pass → Amortized Cost / Если Удержание + SPPI пройден → Амортизированная стоимость",
                    "If Hold and sell + SPPI pass → FVOCI / Если Удержание и продажа + SPPI пройден → ССЧПСД",
                    "Otherwise → FVTPL / Иначе → ССЧПУ",
                    "Consider fair value option / Рассмотреть опцию справедливой стоимости",
                    "Document classification / Документировать классификацию"
                ]
            },
            {
                "step": 4,
                "title": "Apply Measurement Principles / Применение принципов оценки",
                "description": "Measure and recognize in financial statements / Оценка и признание в финансовой отчетности",
                "checklist": [
                    "Initial recognition at fair value / Первоначальное признание по справедливой стоимости",
                    "Subsequent measurement per classification / Последующая оценка согласно классификации",
                    "Recognize gains/losses appropriately / Признать прибыли/убытки надлежащим образом",
                    "Apply effective interest method if applicable / Применить метод эффективной ставки процента при необходимости",
                    "Prepare disclosures / Подготовить раскрытия"
                ]
            }
        ]
    }
]
