"""
Audit Standards Seed Data - Bilingual (English/Russian)
International Standards on Auditing (ISA) for audit firms
"""

audit_standards_bilingual = [
    # ISA 315 - Risk Assessment
    {
        "code": "ISA-315",
        "title": "ISA 315: Identifying and Assessing Risks of Material Misstatement / МСА 315: Выявление и оценка рисков существенного искажения",
        "content": """
**English:**
ISA 315 requires auditors to identify and assess risks of material misstatement in financial statements through understanding the entity and its environment.

**Key Requirements**:

**1. Risk Assessment Procedures**:
- Inquiries of management and others
- Analytical procedures
- Observation and inspection

**2. Understanding the Entity**:
- Industry, regulatory, and external factors
- Nature of the entity (operations, ownership, governance)
- Accounting policies
- Objectives and strategies
- Financial performance measurement

**3. Understanding Internal Control**:
- Control environment
- Entity's risk assessment process
- Information system and communication
- Control activities
- Monitoring of controls

**4. Identifying Risks**:
- At financial statement level
- At assertion level for classes of transactions, account balances, and disclosures

**5. Significant Risks**:
- Require special audit consideration
- Often relate to non-routine transactions or judgmental matters
- Must be specifically addressed in audit plan

**Documentation**: Must document understanding of entity, internal control, identified risks, and assessment of risks.

---

**Русский:**
МСА 315 требует от аудиторов выявления и оценки рисков существенного искажения в финансовой отчетности посредством понимания предприятия и его среды.

**Ключевые требования**:

**1. Процедуры оценки рисков**:
- Запросы руководству и другим лицам
- Аналитические процедуры
- Наблюдение и инспектирование

**2. Понимание предприятия**:
- Отраслевые, регуляторные и внешние факторы
- Характер предприятия (операции, собственность, управление)
- Учетная политика
- Цели и стратегии
- Измерение финансовых показателей

**3. Понимание внутреннего контроля**:
- Контрольная среда
- Процесс оценки рисков предприятия
- Информационная система и коммуникация
- Контрольные действия
- Мониторинг средств контроля

**4. Выявление рисков**:
- На уровне финансовой отчетности
- На уровне предпосылок для классов операций, остатков по счетам и раскрытий

**5. Значимые риски**:
- Требуют особого внимания при аудите
- Часто связаны с нестандартными операциями или вопросами, требующими суждений
- Должны быть конкретно рассмотрены в плане аудита

**Документация**: Необходимо документировать понимание предприятия, внутреннего контроля, выявленные риски и оценку рисков.
        """,
        "category": "Audit",
        "jurisdiction": "Global",
        "effective_date": "2021-12-15",
        "workflow_steps": [
            {
                "step": 1,
                "title": "Perform Risk Assessment Procedures / Выполнение процедур оценки рисков",
                "description": "Gather information about the entity / Сбор информации о предприятии",
                "checklist": [
                    "Conduct inquiries with management / Провести запросы руководству",
                    "Interview key personnel / Опросить ключевой персонал",
                    "Perform analytical procedures / Выполнить аналитические процедуры",
                    "Observe entity operations / Наблюдать за операциями предприятия",
                    "Inspect documents and records / Инспектировать документы и записи"
                ]
            },
            {
                "step": 2,
                "title": "Understand the Entity and Environment / Понимание предприятия и среды",
                "description": "Analyze business context and operations / Анализ бизнес-контекста и операций",
                "checklist": [
                    "Research industry and regulatory factors / Исследовать отраслевые и регуляторные факторы",
                    "Understand business model / Понять бизнес-модель",
                    "Review accounting policies / Проверить учетную политику",
                    "Analyze financial performance / Проанализировать финансовые показатели",
                    "Identify related parties / Выявить связанные стороны"
                ]
            },
            {
                "step": 3,
                "title": "Evaluate Internal Control / Оценка внутреннего контроля",
                "description": "Assess design and implementation of controls / Оценка разработки и внедрения средств контроля",
                "checklist": [
                    "Assess control environment / Оценить контрольную среду",
                    "Understand entity's risk assessment / Понять оценку рисков предприятия",
                    "Evaluate information systems / Оценить информационные системы",
                    "Identify control activities / Выявить контрольные действия",
                    "Review monitoring of controls / Проверить мониторинг средств контроля"
                ]
            },
            {
                "step": 4,
                "title": "Identify and Assess Risks / Выявление и оценка рисков",
                "description": "Determine risks of material misstatement / Определение рисков существенного искажения",
                "checklist": [
                    "Identify risks at FS level / Выявить риски на уровне ФО",
                    "Identify risks at assertion level / Выявить риски на уровне предпосылок",
                    "Assess likelihood and magnitude / Оценить вероятность и величину",
                    "Identify significant risks / Выявить значимые риски",
                    "Document risk assessment / Документировать оценку рисков"
                ]
            }
        ]
    },
    
    # ISA 330 - Responses to Assessed Risks
    {
        "code": "ISA-330",
        "title": "ISA 330: The Auditor's Responses to Assessed Risks / МСА 330: Аудиторские процедуры в ответ на оцененные риски",
        "content": """
**English:**
ISA 330 establishes requirements for designing and implementing responses to risks of material misstatement identified in accordance with ISA 315.

**Overall Responses**:
- Emphasize professional skepticism
- Assign more experienced staff
- Provide more supervision
- Incorporate unpredictability

**Further Audit Procedures**:

**1. Tests of Controls**: When:
- Relying on operating effectiveness of controls
- Substantive procedures alone are insufficient

**2. Substantive Procedures**: Required for all material classes of transactions, account balances, and disclosures
- Tests of details
- Substantive analytical procedures

**Procedures for Significant Risks**:
- Must include tests of details
- Cannot rely solely on analytical procedures
- Must test controls if planning to rely on them

**Timing Considerations**:
- Interim vs. year-end testing
- Roll-forward procedures if testing at interim

**Extent of Testing**:
- Sample size considerations
- Items to select for testing

**Evaluation**: Determine whether sufficient appropriate audit evidence obtained.

---

**Русский:**
МСА 330 устанавливает требования к разработке и выполнению процедур в ответ на риски существенного искажения, выявленные в соответствии с МСА 315.

**Общие ответные действия**:
- Подчеркнуть профессиональный скептицизм
- Назначить более опытных сотрудников
- Обеспечить больший надзор
- Включить элемент непредсказуемости

**Дальнейшие аудиторские процедуры**:

**1. Тесты средств контроля**: Когда:
- Полагаемся на операционную эффективность средств контроля
- Процедур по существу недостаточно

**2. Процедуры по существу**: Требуются для всех существенных классов операций, остатков по счетам и раскрытий
- Тесты деталей
- Аналитические процедуры по существу

**Процедуры для значимых рисков**:
- Должны включать тесты деталей
- Нельзя полагаться только на аналитические процедуры
- Необходимо тестировать средства контроля, если планируется на них полагаться

**Соображения по срокам**:
- Промежуточное тестирование vs. тестирование на конец года
- Процедуры переноса при промежуточном тестировании

**Объем тестирования**:
- Соображения по размеру выборки
- Элементы для отбора для тестирования

**Оценка**: Определить, получены ли достаточные надлежащие аудиторские доказательства.
        """,
        "category": "Audit",
        "jurisdiction": "Global",
        "effective_date": "2021-12-15",
        "workflow_steps": [
            {
                "step": 1,
                "title": "Design Overall Responses / Разработка общих ответных действий",
                "description": "Plan audit approach based on assessed risks / Планирование подхода к аудиту на основе оцененных рисков",
                "checklist": [
                    "Emphasize professional skepticism / Подчеркнуть профессиональный скептицизм",
                    "Assign appropriate staff / Назначить соответствующий персонал",
                    "Determine supervision level / Определить уровень надзора",
                    "Incorporate unpredictability / Включить непредсказуемость",
                    "Document overall approach / Документировать общий подход"
                ]
            },
            {
                "step": 2,
                "title": "Design Tests of Controls / Разработка тестов средств контроля",
                "description": "Plan control testing procedures / Планирование процедур тестирования средств контроля",
                "checklist": [
                    "Identify controls to test / Выявить средства контроля для тестирования",
                    "Determine nature of tests / Определить характер тестов",
                    "Select timing of tests / Выбрать сроки тестов",
                    "Determine extent of testing / Определить объем тестирования",
                    "Prepare test programs / Подготовить программы тестирования"
                ]
            },
            {
                "step": 3,
                "title": "Design Substantive Procedures / Разработка процедур по существу",
                "description": "Plan substantive testing / Планирование тестирования по существу",
                "checklist": [
                    "Design tests of details / Разработать тесты деталей",
                    "Design analytical procedures / Разработать аналитические процедуры",
                    "Determine sample sizes / Определить размеры выборок",
                    "Select items for testing / Отобрать элементы для тестирования",
                    "Address significant risks / Рассмотреть значимые риски"
                ]
            },
            {
                "step": 4,
                "title": "Execute and Evaluate Procedures / Выполнение и оценка процедур",
                "description": "Perform procedures and evaluate results / Выполнение процедур и оценка результатов",
                "checklist": [
                    "Perform tests of controls / Выполнить тесты средств контроля",
                    "Perform substantive procedures / Выполнить процедуры по существу",
                    "Evaluate misstatements / Оценить искажения",
                    "Assess sufficiency of evidence / Оценить достаточность доказательств",
                    "Document conclusions / Документировать выводы"
                ]
            }
        ]
    },
    
    # ISA 500 - Audit Evidence
    {
        "code": "ISA-500",
        "title": "ISA 500: Audit Evidence / МСА 500: Аудиторские доказательства",
        "content": """
**English:**
ISA 500 establishes what constitutes audit evidence and the auditor's responsibility to design and perform audit procedures to obtain sufficient appropriate audit evidence.

**Sufficient Appropriate Audit Evidence**:
- **Sufficiency**: Measure of quantity (affected by risk and quality)
- **Appropriateness**: Measure of quality (relevance and reliability)

**Sources of Audit Evidence**:
1. **Inspection** of records or documents
2. **Inspection** of tangible assets
3. **Observation** of processes or procedures
4. **Inquiry** of knowledgeable persons
5. **Confirmation** from third parties
6. **Recalculation** of mathematical accuracy
7. **Reperformance** of procedures or controls
8. **Analytical procedures**

**Reliability of Audit Evidence** (Generally):
- External evidence > Internal evidence
- Documentary evidence > Oral evidence
- Original documents > Photocopies
- Direct auditor knowledge > Indirect knowledge

**Assertions**:
- **Existence/Occurrence**: Assets/liabilities exist; transactions occurred
- **Completeness**: All transactions and accounts recorded
- **Rights and Obligations**: Entity holds rights to assets
- **Valuation/Allocation**: Assets/liabilities at appropriate amounts
- **Presentation and Disclosure**: Items properly classified and described

**Inconsistent or Doubtful Evidence**: Investigate and obtain additional evidence.

---

**Русский:**
МСА 500 устанавливает, что представляют собой аудиторские доказательства, и обязанность аудитора разрабатывать и выполнять аудиторские процедуры для получения достаточных надлежащих аудиторских доказательств.

**Достаточные надлежащие аудиторские доказательства**:
- **Достаточность**: Мера количества (зависит от риска и качества)
- **Надлежащий характер**: Мера качества (уместность и надежность)

**Источники аудиторских доказательств**:
1. **Инспектирование** записей или документов
2. **Инспектирование** материальных активов
3. **Наблюдение** за процессами или процедурами
4. **Запрос** осведомленных лиц
5. **Подтверждение** от третьих сторон
6. **Пересчет** математической точности
7. **Повторное выполнение** процедур или средств контроля
8. **Аналитические процедуры**

**Надежность аудиторских доказательств** (Обычно):
- Внешние доказательства > Внутренние доказательства
- Документальные доказательства > Устные доказательства
- Оригинальные документы > Фотокопии
- Прямое знание аудитора > Косвенное знание

**Предпосылки**:
- **Существование/Возникновение**: Активы/обязательства существуют; операции произошли
- **Полнота**: Все операции и счета отражены
- **Права и обязанности**: Предприятие имеет права на активы
- **Оценка/Распределение**: Активы/обязательства в надлежащих суммах
- **Представление и раскрытие**: Статьи надлежащим образом классифицированы и описаны

**Противоречивые или сомнительные доказательства**: Провести расследование и получить дополнительные доказательства.
        """,
        "category": "Audit",
        "jurisdiction": "Global",
        "effective_date": "2009-12-15",
        "workflow_steps": [
            {
                "step": 1,
                "title": "Plan Evidence Gathering / Планирование сбора доказательств",
                "description": "Design procedures to obtain evidence / Разработка процедур для получения доказательств",
                "checklist": [
                    "Identify assertions to test / Выявить предпосылки для тестирования",
                    "Select appropriate procedures / Выбрать надлежащие процедуры",
                    "Determine sources of evidence / Определить источники доказательств",
                    "Consider reliability factors / Рассмотреть факторы надежности",
                    "Plan for sufficient evidence / Спланировать достаточные доказательства"
                ]
            },
            {
                "step": 2,
                "title": "Obtain Audit Evidence / Получение аудиторских доказательств",
                "description": "Execute planned procedures / Выполнение запланированных процедур",
                "checklist": [
                    "Perform inspections / Выполнить инспектирование",
                    "Conduct observations / Провести наблюдения",
                    "Make inquiries / Сделать запросы",
                    "Obtain confirmations / Получить подтверждения",
                    "Perform recalculations / Выполнить пересчеты",
                    "Reperform procedures / Повторно выполнить процедуры",
                    "Perform analytical procedures / Выполнить аналитические процедуры"
                ]
            },
            {
                "step": 3,
                "title": "Evaluate Evidence Quality / Оценка качества доказательств",
                "description": "Assess reliability and relevance / Оценка надежности и уместности",
                "checklist": [
                    "Assess source reliability / Оценить надежность источника",
                    "Evaluate relevance to assertions / Оценить уместность для предпосылок",
                    "Consider contradictory evidence / Рассмотреть противоречивые доказательства",
                    "Identify need for additional evidence / Выявить потребность в дополнительных доказательствах",
                    "Document evaluation / Документировать оценку"
                ]
            },
            {
                "step": 4,
                "title": "Conclude on Sufficiency / Вывод о достаточности",
                "description": "Determine if evidence is sufficient and appropriate / Определение достаточности и надлежащего характера доказательств",
                "checklist": [
                    "Assess quantity of evidence / Оценить количество доказательств",
                    "Assess quality of evidence / Оценить качество доказательств",
                    "Consider all assertions covered / Рассмотреть охват всех предпосылок",
                    "Identify any gaps / Выявить любые пробелы",
                    "Document conclusion / Документировать вывод"
                ]
            }
        ]
    },
    
    # ISA 540 - Accounting Estimates
    {
        "code": "ISA-540",
        "title": "ISA 540: Auditing Accounting Estimates and Related Disclosures / МСА 540: Аудит оценочных значений и соответствующих раскрытий",
        "content": """
**English:**
ISA 540 (Revised) addresses the auditor's responsibilities relating to accounting estimates and related disclosures, with enhanced focus on areas of significant judgment.

**Risk Assessment**:
- Understand how management makes estimates
- Identify estimation uncertainty
- Assess complexity, subjectivity, and other inherent risk factors
- Determine if estimates give rise to significant risks

**Responses to Assessed Risks**:

**1. Test Management's Process**:
- Evaluate method, assumptions, and data
- Test calculations
- Consider management bias

**2. Develop Independent Estimate**:
- Use auditor's own method and assumptions
- Compare to management's estimate

**3. Obtain Evidence from Events After Reporting Period**:
- Review subsequent events
- Compare actual outcomes to estimates

**Estimation Uncertainty**:
- Assess whether management has appropriately addressed
- Evaluate sensitivity analysis
- Consider range of possible outcomes

**Management Bias**:
- Evaluate for indicators of bias
- Consider bias in aggregate
- Assess impact on fair presentation

**Disclosures**:
- Evaluate adequacy of disclosures
- Consider estimation uncertainty disclosures
- Assess compliance with framework

**Examples**: Fair value measurements, provisions, expected credit losses, depreciation, inventory obsolescence.

---

**Русский:**
МСА 540 (Пересмотренный) рассматривает обязанности аудитора в отношении оценочных значений и соответствующих раскрытий, с усиленным фокусом на областях значительных суждений.

**Оценка рисков**:
- Понять, как руководство делает оценки
- Выявить неопределенность оценки
- Оценить сложность, субъективность и другие факторы неотъемлемого риска
- Определить, приводят ли оценки к значимым рискам

**Ответные действия на оцененные риски**:

**1. Тестирование процесса руководства**:
- Оценить метод, допущения и данные
- Тестировать расчеты
- Рассмотреть предвзятость руководства

**2. Разработка независимой оценки**:
- Использовать собственный метод и допущения аудитора
- Сравнить с оценкой руководства

**3. Получение доказательств из событий после отчетной даты**:
- Проверить последующие события
- Сравнить фактические результаты с оценками

**Неопределенность оценки**:
- Оценить, надлежащим ли образом руководство рассмотрело
- Оценить анализ чувствительности
- Рассмотреть диапазон возможных результатов

**Предвзятость руководства**:
- Оценить индикаторы предвзятости
- Рассмотреть предвзятость в совокупности
- Оценить влияние на достоверное представление

**Раскрытия**:
- Оценить адекватность раскрытий
- Рассмотреть раскрытия неопределенности оценки
- Оценить соответствие основам

**Примеры**: Оценки справедливой стоимости, резервы, ожидаемые кредитные убытки, амортизация, устаревание запасов.
        """,
        "category": "Audit",
        "jurisdiction": "Global",
        "effective_date": "2019-12-15",
        "workflow_steps": [
            {
                "step": 1,
                "title": "Understand Management's Process / Понимание процесса руководства",
                "description": "Learn how estimates are developed / Изучение разработки оценок",
                "checklist": [
                    "Identify accounting estimates / Выявить оценочные значения",
                    "Understand estimation methods / Понять методы оценки",
                    "Review data sources / Проверить источники данных",
                    "Assess key assumptions / Оценить ключевые допущения",
                    "Evaluate controls over estimates / Оценить средства контроля над оценками"
                ]
            },
            {
                "step": 2,
                "title": "Assess Estimation Uncertainty / Оценка неопределенности оценки",
                "description": "Evaluate degree of uncertainty / Оценка степени неопределенности",
                "checklist": [
                    "Identify sources of uncertainty / Выявить источники неопределенности",
                    "Assess complexity / Оценить сложность",
                    "Evaluate subjectivity / Оценить субъективность",
                    "Consider range of outcomes / Рассмотреть диапазон результатов",
                    "Determine if significant risk / Определить, является ли значимым риском"
                ]
            },
            {
                "step": 3,
                "title": "Perform Audit Procedures / Выполнение аудиторских процедур",
                "description": "Test estimates and related disclosures / Тестирование оценок и соответствующих раскрытий",
                "checklist": [
                    "Test management's process / Тестировать процесс руководства",
                    "Develop independent estimate / Разработать независимую оценку",
                    "Review subsequent events / Проверить последующие события",
                    "Evaluate reasonableness / Оценить обоснованность",
                    "Test related disclosures / Тестировать соответствующие раскрытия"
                ]
            },
            {
                "step": 4,
                "title": "Evaluate Management Bias / Оценка предвзятости руководства",
                "description": "Assess for indicators of bias / Оценка индикаторов предвзятости",
                "checklist": [
                    "Review changes in estimates / Проверить изменения в оценках",
                    "Assess directional bias / Оценить направленную предвзятость",
                    "Consider aggregate impact / Рассмотреть совокупное влияние",
                    "Evaluate reasonableness of changes / Оценить обоснованность изменений",
                    "Document bias assessment / Документировать оценку предвзятости"
                ]
            }
        ]
    },
    
    # ISA 700 - Audit Opinion
    {
        "code": "ISA-700",
        "title": "ISA 700: Forming an Opinion and Reporting on Financial Statements / МСА 700: Формирование мнения и составление заключения по финансовой отчетности",
        "content": """
**English:**
ISA 700 establishes the auditor's responsibility to form an opinion on financial statements and prescribes the form and content of the auditor's report.

**Forming an Opinion**:
The auditor shall evaluate whether:
1. Financial statements prepared in accordance with applicable framework
2. Financial statements achieve fair presentation
3. Sufficient appropriate audit evidence obtained
4. Uncorrected misstatements are immaterial

**Types of Opinions**:

**1. Unmodified Opinion** (Clean Opinion):
- Financial statements present fairly in all material respects
- No material misstatements identified
- Sufficient appropriate evidence obtained

**2. Modified Opinions**:
- **Qualified Opinion**: Material but not pervasive misstatement or scope limitation
- **Adverse Opinion**: Material and pervasive misstatement
- **Disclaimer of Opinion**: Material and pervasive scope limitation

**Auditor's Report Elements**:
1. Title
2. Addressee
3. Opinion section
4. Basis for Opinion
5. Going Concern (if applicable)
6. Key Audit Matters (for listed entities)
7. Other Information
8. Responsibilities sections
9. Signature, date, and location

**Key Audit Matters (KAM)**:
- Required for listed entities
- Matters of most significance in the audit
- Selected from matters communicated to those charged with governance

---

**Русский:**
МСА 700 устанавливает обязанность аудитора формировать мнение по финансовой отчетности и предписывает форму и содержание аудиторского заключения.

**Формирование мнения**:
Аудитор должен оценить:
1. Подготовлена ли финансовая отчетность в соответствии с применимыми основами
2. Обеспечивает ли финансовая отчетность достоверное представление
3. Получены ли достаточные надлежащие аудиторские доказательства
4. Являются ли неисправленные искажения несущественными

**Типы мнений**:

**1. Немодифицированное мнение** (Безоговорочно положительное):
- Финансовая отчетность представляет достоверно во всех существенных отношениях
- Не выявлено существенных искажений
- Получены достаточные надлежащие доказательства

**2. Модифицированные мнения**:
- **Мнение с оговоркой**: Существенное, но не всеобъемлющее искажение или ограничение объема
- **Отрицательное мнение**: Существенное и всеобъемлющее искажение
- **Отказ от выражения мнения**: Существенное и всеобъемлющее ограничение объема

**Элементы аудиторского заключения**:
1. Название
2. Адресат
3. Раздел мнения
4. Основание для мнения
5. Непрерывность деятельности (если применимо)
6. Ключевые вопросы аудита (для публичных компаний)
7. Прочая информация
8. Разделы об ответственности
9. Подпись, дата и место

**Ключевые вопросы аудита (КВА)**:
- Требуются для публичных компаний
- Вопросы наибольшей значимости в аудите
- Выбираются из вопросов, доведенных до сведения лиц, отвечающих за управление
        """,
        "category": "Audit",
        "jurisdiction": "Global",
        "effective_date": "2016-12-15",
        "workflow_steps": [
            {
                "step": 1,
                "title": "Evaluate Financial Statements / Оценка финансовой отчетности",
                "description": "Assess compliance and fair presentation / Оценка соответствия и достоверного представления",
                "checklist": [
                    "Review compliance with framework / Проверить соответствие основам",
                    "Assess fair presentation / Оценить достоверное представление",
                    "Evaluate disclosures / Оценить раскрытия",
                    "Consider uncorrected misstatements / Рассмотреть неисправленные искажения",
                    "Assess materiality / Оценить существенность"
                ]
            },
            {
                "step": 2,
                "title": "Form Audit Opinion / Формирование аудиторского мнения",
                "description": "Determine type of opinion to issue / Определение типа мнения для выражения",
                "checklist": [
                    "Assess sufficiency of evidence / Оценить достаточность доказательств",
                    "Evaluate identified misstatements / Оценить выявленные искажения",
                    "Consider scope limitations / Рассмотреть ограничения объема",
                    "Determine if modification needed / Определить необходимость модификации",
                    "Select appropriate opinion type / Выбрать надлежащий тип мнения"
                ]
            },
            {
                "step": 3,
                "title": "Identify Key Audit Matters / Выявление ключевых вопросов аудита",
                "description": "Select KAM for listed entities / Выбор КВА для публичных компаний",
                "checklist": [
                    "Review matters communicated to governance / Проверить вопросы, доведенные до управления",
                    "Assess significance of matters / Оценить значимость вопросов",
                    "Select most significant matters / Выбрать наиболее значимые вопросы",
                    "Draft KAM descriptions / Составить описания КВА",
                    "Review with engagement team / Проверить с командой задания"
                ]
            },
            {
                "step": 4,
                "title": "Prepare Auditor's Report / Подготовка аудиторского заключения",
                "description": "Draft and finalize audit report / Составление и завершение аудиторского заключения",
                "checklist": [
                    "Include all required elements / Включить все требуемые элементы",
                    "Draft opinion section / Составить раздел мнения",
                    "Prepare basis for opinion / Подготовить основание для мнения",
                    "Include KAM section if applicable / Включить раздел КВА при необходимости",
                    "Review and sign report / Проверить и подписать заключение"
                ]
            }
        ]
    },
    
    # ISA 701 - Key Audit Matters
    {
        "code": "ISA-701",
        "title": "ISA 701: Communicating Key Audit Matters in the Independent Auditor's Report / МСА 701: Информирование о ключевых вопросах аудита в аудиторском заключении",
        "content": """
**English:**
ISA 701 deals with the auditor's responsibility to communicate Key Audit Matters (KAM) in the auditor's report for audits of complete sets of general purpose financial statements of listed entities.

**What are Key Audit Matters?**:
- Matters of most significance in the audit of current period financial statements
- Selected from matters communicated to those charged with governance
- Required for listed entity audits

**Determining KAM**:
Consider:
1. Areas of higher assessed risk or significant risks (ISA 315)
2. Significant auditor judgments relating to areas of significant management judgment
3. Effect of significant events or transactions during the period

**Communicating KAM**:

**For Each KAM, Describe**:
1. Why the matter was considered most significant
2. How the matter was addressed in the audit

**Reference to Disclosures**:
- If matter disclosed in financial statements, refer to disclosure
- Do not provide original information about the entity

**Circumstances Where KAM Not Communicated**:
1. Law or regulation precludes public disclosure
2. Extremely rare: Communication would have adverse consequences outweighing public interest

**No KAM**: If determine no KAM, state this fact in report.

**Benefits**:
- Enhanced transparency
- Greater insight into the audit
- Focus on entity-specific matters
- Improved communication with stakeholders

---

**Русский:**
МСА 701 рассматривает обязанность аудитора информировать о ключевых вопросах аудита (КВА) в аудиторском заключении для аудитов полных комплектов финансовой отчетности общего назначения публичных компаний.

**Что такое ключевые вопросы аудита?**:
- Вопросы наибольшей значимости в аудите финансовой отчетности текущего периода
- Выбираются из вопросов, доведенных до сведения лиц, отвечающих за управление
- Требуются для аудитов публичных компаний

**Определение КВА**:
Рассмотреть:
1. Области более высокого оцененного риска или значимые риски (МСА 315)
2. Значительные суждения аудитора, относящиеся к областям значительных суждений руководства
3. Влияние значительных событий или операций в течение периода

**Информирование о КВА**:

**Для каждого КВА описать**:
1. Почему вопрос был признан наиболее значимым
2. Как вопрос был рассмотрен в аудите

**Ссылка на раскрытия**:
- Если вопрос раскрыт в финансовой отчетности, сослаться на раскрытие
- Не предоставлять оригинальную информацию о предприятии

**Обстоятельства, когда КВА не сообщается**:
1. Закон или регулирование запрещает публичное раскрытие
2. Крайне редко: Информирование имело бы неблагоприятные последствия, перевешивающие общественный интерес

**Нет КВА**: Если определено, что нет КВА, указать этот факт в заключении.

**Преимущества**:
- Повышенная прозрачность
- Больше понимания аудита
- Фокус на вопросах, специфичных для предприятия
- Улучшенная коммуникация с заинтересованными сторонами
        """,
        "category": "Audit",
        "jurisdiction": "Global",
        "effective_date": "2016-12-15",
        "workflow_steps": [
            {
                "step": 1,
                "title": "Identify Potential KAM / Выявление потенциальных КВА",
                "description": "Review matters communicated to governance / Проверка вопросов, доведенных до управления",
                "checklist": [
                    "Review governance communications / Проверить коммуникации с управлением",
                    "Identify significant risks / Выявить значимые риски",
                    "Note areas of significant judgment / Отметить области значительных суждений",
                    "Consider significant events / Рассмотреть значительные события",
                    "List potential KAM / Составить список потенциальных КВА"
                ]
            },
            {
                "step": 2,
                "title": "Determine KAM / Определение КВА",
                "description": "Select matters of most significance / Выбор вопросов наибольшей значимости",
                "checklist": [
                    "Assess relative significance / Оценить относительную значимость",
                    "Consider audit effort required / Рассмотреть требуемые аудиторские усилия",
                    "Evaluate complexity / Оценить сложность",
                    "Select most significant matters / Выбрать наиболее значимые вопросы",
                    "Document selection rationale / Документировать обоснование выбора"
                ]
            },
            {
                "step": 3,
                "title": "Draft KAM Descriptions / Составление описаний КВА",
                "description": "Prepare clear and concise descriptions / Подготовка четких и кратких описаний",
                "checklist": [
                    "Explain why matter is significant / Объяснить, почему вопрос значим",
                    "Describe how matter was addressed / Описать, как вопрос был рассмотрен",
                    "Reference related disclosures / Сослаться на соответствующие раскрытия",
                    "Avoid original information / Избегать оригинальной информации",
                    "Use clear, understandable language / Использовать ясный, понятный язык"
                ]
            },
            {
                "step": 4,
                "title": "Finalize KAM Section / Завершение раздела КВА",
                "description": "Review and include in audit report / Проверка и включение в аудиторское заключение",
                "checklist": [
                    "Review with engagement team / Проверить с командой задания",
                    "Ensure consistency with FS / Обеспечить согласованность с ФО",
                    "Verify no original information / Проверить отсутствие оригинальной информации",
                    "Include in auditor's report / Включить в аудиторское заключение",
                    "Obtain quality control review / Получить проверку контроля качества"
                ]
            }
        ]
    }
]
