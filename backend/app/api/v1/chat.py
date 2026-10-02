from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core import deps
from app.db.models.user import User
from app.rag.retriever import search_regulations

router = APIRouter()

class Message(BaseModel):
    role: str # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[Message] = []
    locale: Optional[str] = "en"

class ChatResponse(BaseModel):
    response: str
    sources: List[Dict[str, Any]] = []

def _detect_language(query: str, fallback_locale: str = "en") -> str:
    if not query or not query.strip():
        fb = (fallback_locale or "en").lower()
        if fb.startswith("ru"):
            return "ru"
        if fb.startswith("uz"):
            return "uz"
        return "en"

    q_lower = query.lower()
    uzbek_words = [
        "soliq", "soliqlar", "stavka", "stavkalari", "hisobot", "qoidalar", "nima", "qanday",
        "haqida", "uchun", "qonun", "daromad", "foyda", "msfo", "mhxs", "talab", "talablar",
        "yordam", "tizim", "yillik", "buxgalter", "korxona", "hujjat", "bering", "tushuntiring",
        "bormi", "kerak", "ijara", "barqaror", "yashil"
    ]
    if any(k in q_lower for k in uzbek_words) or any(char in query for char in ["o'", "g'", "o‘", "g‘", "o’", "g’"]):
        return "uz"

    cyrillic_count = sum(1 for c in query if '\u0400' <= c <= '\u04FF')
    latin_count = sum(1 for c in query if ('a' <= c <= 'z') or ('A' <= c <= 'Z'))

    if cyrillic_count > 0 and cyrillic_count >= latin_count:
        return "ru"
    if latin_count > 0 and latin_count > cyrillic_count:
        return "en"

    fb = (fallback_locale or "en").lower()
    if fb.startswith("ru"):
        return "ru"
    if fb.startswith("uz"):
        return "uz"
    return "en"

@router.post("/", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Chat with the AI assistant about regulations.
    """
    context_docs = search_regulations(
        tenant_id=str(current_user.tenant_id),
        query=request.message,
        limit=3
    )

    context_text = "\n\n".join([f"Document {i+1}:\n{doc['content']}" for i, doc in enumerate(context_docs)])

    from app.core.config import settings
    import openai

    detected_lang = _detect_language(request.message, request.locale or "en")

    if settings.OPENAI_API_KEY:
        try:
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

            system_prompt = f"""You are an expert regulatory compliance assistant.
Answer the user's question in the SAME language the user asked ({detected_lang.upper()}: English, Russian, or Uzbek).
Answer based on the provided context documents when available.
Cite the document numbers (e.g. [1]) when referencing information."""

            user_prompt = f"""Context:
{context_text}

Question: {request.message}
"""

            completion = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3
            )

            response_text = completion.choices[0].message.content
        except Exception as e:
            print(f"OpenAI Error: {e}")
            response_text = _generate_expert_response(request.message, context_docs, detected_lang)
    else:
        response_text = _generate_expert_response(request.message, context_docs, detected_lang)

    return ChatResponse(
        response=response_text,
        sources=context_docs
    )

def _generate_expert_response(query: str, context_docs: List[Dict], lang: str = "en") -> str:
    q_lower = query.lower()

    # 1. ESG
    if any(k in q_lower for k in ["esg", "csrd", "cbam", "sustainability", "устойчив", "экологи", "barqaror", "yashil"]):
        if lang == "en":
            return (
                "### 🌍 Summary of Current ESG Regulations (2025–2026)\n\n"
                "1. **EU Corporate Sustainability Reporting Directive (CSRD):** Mandatory disclosure of ESG risks, decarbonization targets, and greenhouse gas emissions (Scope 1, 2, and 3) for large corporations and non-EU entities with significant European operations.\n\n"
                "2. **IFRS S1 & IFRS S2 Standards (ISSB):** Globally harmonized disclosure requirements for general sustainability and climate-related financial impacts, adopted across Europe, the Middle East, and Central Asia.\n\n"
                "3. **Green Transformation Tax Incentives:** Corporate income tax exemptions, accelerated depreciation, and property tax relief for enterprise investments in renewable energy and green technologies in Uzbekistan and Kazakhstan.\n\n"
                "4. **EU Carbon Border Adjustment Mechanism (CBAM):** EU carbon border tariff requiring verified emissions audits for cross-border exports of steel, aluminum, cement, fertilizers, and hydrogen."
            )
        elif lang == "uz":
            return (
                "### 🌍 Amaldagi ESG me'yorlari bo'yicha umumiy ma'lumot (2025–2026)\n\n"
                "1. **Yevropa CSRD direktivasi (Barqaror rivojlanish hisoboti):** yirik korxonalar va xalqaro hamkorlar uchun iqlim xatarlari hamda Scope 1-3 issiqxona gazlari emissiyasini majburiy oshkor qilish talabi.\n\n"
                "2. **IFRS S1 va IFRS S2 standartlari (ISSB):** barqaror rivojlanish va iqlim bilan bog'liq moliyaviy ma'lumotlarni oshkor qilishning yagona global standartlari, O'zbekiston qonunchiligiga integratsiya qilinmoqda.\n\n"
                "3. **\"Yashil iqtisodiyot\" uchun soliq imtiyozlari:** qayta tiklanuvchi energiya manbalari (quyosh panellari) va energiya tejovchi texnologiyalarni joriy etgan korxonalar uchun foyda solig'i hamda mol-mulk solig'i bo'yicha imtiyozlar.\n\n"
                "4. **Uglerod chegarasi mexanizmi (CBAM):** Yevropa Ittifoqiga eksport qilinadigan metallurgiya, sement va kimyo mahsulotlari uchun uglerod izining tasdiqlangan auditini talab qiladi."
            )
        else:
            return (
                "### 🌍 Сводка актуальных ESG нормативов (2025–2026)\n\n"
                "1. **Европейские стандарты CSRD (Corporate Sustainability Reporting Directive):** обязательное раскрытие информации по климатическим рискам и выбросам Scope 1-3 для крупных предприятий и международных контрагентов.\n\n"
                "2. **Стандарты IFRS S1 и IFRS S2 (ISSB):** единые глобальные стандарты раскрытия финансовой информации, связанной с устойчивым развитием и климатом, интегрированные в комплаенс-регуляторику стран СНГ.\n\n"
                "3. **Налоговые стимулы «зелёной трансформации»:** налоговые льготы по налогу на имущество и налогу на прибыль при внедрении возобновляемых источников энергии и энергоэффективных технологий в Узбекистане и Казахстане.\n\n"
                "4. **Углеродное регулирование (CBAM):** трансграничный углеродный налог ЕС требует верифицированного аудита углеродного следа экспортной продукции."
            )

    # 2. IFRS 16 / Lease / Ijara
    if any(k in q_lower for k in ["ifrs 16", "lease", "аренд", "мсфо 16", "rou", "ijara"]):
        if lang == "en":
            return (
                "### 📑 Expert Analysis on IFRS 16 «Leases»\n\n"
                "Under **IFRS 16**, lessees must recognize a Right-of-Use (**ROU**) Asset and a corresponding **Lease Liability** at lease commencement.\n\n"
                "#### 🔢 Initial Valuation Formula:\n"
                "$$PV = \\sum_{t=1}^{N} \\frac{PMT_t}{(1 + r)^t}$$\n"
                "where:\n"
                "- $PMT_t$ — fixed periodic lease payments;\n"
                "- $r$ — discount rate (implicit rate or incremental borrowing rate);\n"
                "- $N$ — lease term including renewal/termination options.\n\n"
                "#### 📌 Accounting Journal Entries:\n"
                "1. **Asset Recognition:** `Dr ROU Asset — Cr Lease Liability`\n"
                "2. **Interest Accrual:** `Dr Interest Expense — Cr Lease Liability`\n"
                "3. **ROU Depreciation:** `Dr Depreciation Expense — Cr Accumulated Depreciation (ROU)`\n\n"
                "**RegAI** automates these calculations and can export adjusting entries to 1C:Enterprise."
            )
        elif lang == "uz":
            return (
                "### 📑 MHXS (IFRS) 16 «Ijara» bo'yicha ekspert tahlili\n\n"
                "**MHXS 16** talablariga muvofiq, ijarachi ijara boshlangan sanada Foydalanish huquqi aktivini (**Right-of-Use Asset, ROU**) va **Ijara majburiyatini** balansda tan olishi shart.\n\n"
                "#### 🔢 Dastlabki baholash formulasi:\n"
                "$$PV = \\sum_{t=1}^{N} \\frac{PMT_t}{(1 + r)^t}$$\n"
                "bu yerda:\n"
                "- $PMT_t$ — davriy ijara to'lovlari;\n"
                "- $r$ — diskont stavkasi (shartnomadagi stavka yoki qo'shimcha qarz jalb qilish stavkasi);\n"
                "- $N$ — uzaytirish/bekor qilish huquqlarini hisobga olgan ijara muddati.\n\n"
                "#### 📌 Buxgalteriya provodkalari:\n"
                "1. **Aktivni tan olish:** `Dt 01.ROU (Aktivdan foydalanish huquqi) — Kt 76.Lease (Ijara majburiyatlari)`\n"
                "2. **Foiz xarajatlari:** `Dt 96.10 (Foiz xarajatlari) — Kt 76.Lease`\n"
                "3. **ROU amortizatsiyasi:** `Dt 20/26/94 (Amortizatsiya xarajatlari) — Kt 02.ROU`\n\n"
                "**RegAI** tizimida mazkur tuzatishlar avtomatik hisoblanib, 1C:Korxona tizimiga eksport qilinadi."
            )
        else:
            return (
                "### 📑 Экспертный анализ по МСФО (IFRS) 16 «Аренда»\n\n"
                "В соответствии с требованиями **МСФО (IFRS) 16**, арендатор признает актив в форме права пользования (**Right-of-Use Asset, ROU**) "
                "и арендное обязательство (**Lease Liability**) на дату начала аренды.\n\n"
                "#### 🔢 Формула первоначальной оценки:\n"
                "$$PV = \\sum_{t=1}^{N} \\frac{PMT_t}{(1 + r)^t}$$\n"
                "где:\n"
                "- $PMT_t$ — фиксированные арендные платежи периода $t$;\n"
                "- $r$ — ставка дисконтирования;\n"
                "- $N$ — срок аренды с учетом опционов на продление/расторжение.\n\n"
                "#### 📌 Типовые бухгалтерские проводки трансформации:\n"
                "1. **Признание актива:** `Дт 01.ROU (Право пользования активом) — Кт 76.Lease (Арендные обязательства)`\n"
                "2. **Начисление процентных расходов:** `Дт 91.02 (Проценты к уплате) — Кт 76.Lease`\n"
                "3. **Амортизация актива ROU:** `Дт 20/26/44 (Амортизация ROU) — Кт 02.ROU`\n\n"
                "В системе **RegAI** данные корректировки рассчитываются автоматически и могут быть экспортированы в 1С:Бухгалтерия в виде документа `ОперацияБух`."
            )

    # 3. IFRS 9 / ECL / Резервы
    if any(k in q_lower for k in ["ifrs 9", "мсфо 9", "ecl", "резерв", "кредитн", "обесцен", "mhxs 9"]):
        if lang == "en":
            return (
                "### 📊 Expert Analysis on IFRS 9 «Financial Instruments»\n\n"
                "IFRS 9 introduces a three-stage **Expected Credit Loss (ECL)** model for debt instruments and receivables:\n\n"
                "- **Stage 1 (Performing):** 12-month expected credit losses (12m ECL);\n"
                "- **Stage 2 (Underperforming):** Significant increase in credit risk (SICR) ➔ lifetime expected credit losses (Lifetime ECL);\n"
                "- **Stage 3 (Credit-impaired):** Objective evidence of default ➔ interest calculated on net carrying amount.\n\n"
                "$$ECL = PD \\times LGD \\times EAD \\times DF$$\n"
                "- **PD** — Probability of Default;\n"
                "- **LGD** — Loss Given Default;\n"
                "- **EAD** — Exposure at Default;\n"
                "- **DF** — Discount Factor based on Effective Interest Rate (EIR)."
            )
        elif lang == "uz":
            return (
                "### 📊 MHXS (IFRS) 9 «Moliyaviy instrumentlar» bo'yicha ekspert tahlili\n\n"
                "MHXS 9 qarz vositalari va debitorlik qarzlari bo'yicha kutilayotgan kredit zararlarini (**ECL**) baholashning 3 bosqichli modelini belgilaydi:\n\n"
                "- **1-bosqich (Ishonchli):** 12 oylik kutilayotgan kredit zararlari (12m ECL);\n"
                "- **2-bosqich (Xavfi oshgan):** Kredit xatarining sezilarli darajada oshishi (SICR) ➔ butun muddat bo'yicha kutilayotgan zararlar (Lifetime ECL);\n"
                "- **3-bosqich (Defolt holatidagi):** Defolt aktivlar ➔ foizlar aktivning sof balans qiymatidan hisoblanadi.\n\n"
                "$$ECL = PD \\times LGD \\times EAD \\times DF$$\n"
                "- **PD** — Defolt ehtimoli;\n"
                "- **LGD** — Defoltdagi yo'qotishlar darajasi;\n"
                "- **EAD** — Xavf ostidagi summa;\n"
                "- **DF** — Samarali foiz stavkasi (EIR) bo'yicha diskontlash omili."
            )
        else:
            return (
                "### 📊 Экспертный анализ по МСФО (IFRS) 9 «Финансовые инструменты»\n\n"
                "МСФО 9 регламентирует модель оценки ожидаемых кредитных убытков (**ECL — Expected Credit Loss Model**) на основе 3 стадий:\n\n"
                "- **Стадия 1 (Performing):** Оценка 12-месячных ожидаемых убытков (12m ECL);\n"
                "- **Стадия 2 (Underperforming):** Значительное увеличение кредитного риска (SICR) ➔ оценка пожизненных убытков (Lifetime ECL);\n"
                "- **Стадия 3 (Credit-impaired):** Дефолтные активы (Default) ➔ начисление процентов на чистую балансовую стоимость.\n\n"
                "$$ECL = PD \\times LGD \\times EAD \\times DF$$\n"
                "- **PD** (Probability of Default) — вероятность дефолта;\n"
                "- **LGD** (Loss Given Default) — уровень потерь при дефолте;\n"
                "- **EAD** (Exposure at Default) — сумма под риском на момент дефолта;\n"
                "- **DF** (Discount Factor) — фактор дисконтирования по эффективной процентной ставке (EIR)."
            )

    # 4. Tax / SaaS / Digital VAT
    if any(k in q_lower for k in ["tax", "налог", "soliq", "saas", "vat", "ндс", "qqs", "it park", "withholding"]):
        if lang == "en":
            return (
                "### 💼 Tax Regulations for Digital Services & SaaS\n\n"
                "* **Digital VAT (\"Google Tax\"):** Applicable at destination jurisdiction for B2C services. Rates: Uzbekistan 12%, Kazakhstan 12%, UAE 5%, Turkey 20%, Russia 20%.\n\n"
                "* **IT Park Uzbekistan Regime:** 0% Corporate Income Tax, 0% VAT on IT services, and reduced 7.5% personal income tax on employee salaries.\n\n"
                "* **Withholding Tax (WHT):** Non-resident software royalty payments standardly incur 10–15% withholding, reducible under Double Tax Treaties.\n\n"
                "* **Transfer Pricing:** Multi-entity cross-border SaaS setups require benchmarked intercompany IP licensing documentation."
            )
        elif lang == "uz":
            return (
                "### 💼 SaaS va raqamli xizmatlar uchun soliqqa tortish tartibi\n\n"
                "* **Elektron xizmatlar uchun QQS (\"Google solig'i\"):** B2C xizmatlar ko'rsatilganda xaridor davlatida to'lanadi. O'zbekistonda QQS stavkasi — 12%, Qozog'istonda — 12%, BAAda — 5%.\n\n"
                "* **IT Park imtiyozlari:** O'zbekiston IT Park rezidentlari foyda solig'i va QQS to'lashdan to'liq ozod qilingan (0%), xodimlar JShODS stavkasi 7.5% ga pasaytirilgan.\n\n"
                "* **To'lov manbaida soliq (WHT):** Xorijiy litsenziyalar bo'yicha to'lovlarda 10–15% soliq ushlanadi, xalqaro soliq bitimlari asosida kamaytirilishi mumkin.\n\n"
                "* **Hujjatlar rasmiylashtiruvi:** B2B xizmat ko'rsatishda elektron hisob-faktura (EHF) va dasturiy ta'minotni qabul qilish aktlari talab etiladi."
            )
        else:
            return (
                "### 💼 Налогообложение цифровых сервисов и SaaS\n\n"
                "* **НДС на электронные услуги (Digital VAT):** B2C реализация облачных сервисов облагается по ставке страны покупателя: Узбекистан — 12%, РФ — 20%, Казахстан — 12%, ОАЭ — 5%.\n\n"
                "* **Преференции IT Park:** Резиденты освобождены от налога на прибыль и НДС, ставка НДФЛ сотрудников снижена до 7.5%.\n\n"
                "* **Налог у источника (Withholding Tax):** Роялти нерезидентам облагаются по ставке 10–15%, если льготы не предусмотрены СИДН.\n\n"
                "* **Трансфертное ценообразование:** При внутригрупповых сделках требуется документальное подтверждение рыночного уровня цен."
            )

    # 5. 1C Integration
    if any(k in q_lower for k in ["1c", "1с", "odata", "синхрон", "выгруз", "интеграц", "integratsiya"]):
        if lang == "en":
            return (
                "### 🔌 Bi-directional 1C:Enterprise Integration (OData v4 REST API)\n\n"
                "The **RegAI** platform connects directly to 1C:Enterprise (CORP/PROF) and 1C:ERP:\n\n"
                "1. **Ingestion:** Automated retrieval of Trial Balance via `AccountingRegister_General/Balance` (accounts 01, 10, 50, 51, 60, 62, 80, 84).\n"
                "2. **Security:** Credentials and API keys encrypted with **AES-256 (Fernet)** at rest.\n"
                "3. **Pushback Adjustments:** Automated transmission of IFRS transformation entries directly into `Document_OperationAccounting`."
            )
        elif lang == "uz":
            return (
                "### 🔌 1C:Korxona bilan ikki tomonlama integratsiya (OData v4 REST API)\n\n"
                "**RegAI** platformasi 1C:Buxgalteriya va 1C:ERP konfiguratsiyalari bilan to'liq integratsiyalashgan:\n\n"
                "1. **Ma'lumotlar importi:** Aylanma-qoldiq vedomostini (OSV) `AccountingRegister_Хозрасчетный/Balance` orqali 01, 10, 50, 51, 60, 62, 80, 84 hisoblari bo'yicha yuklash.\n"
                "2. **Xavfsizlik:** OData parollari ma'lumotlar bazasida **AES-256 (Fernet)** shifrlash bilan himoyalangan.\n"
                "3. **Tuzatishlarni eksport qilish:** Hisoblangan MHXS tuzatishlari to'g'ridan-to'g'ri 1C dagi `Document_ОперацияБух` hujjatiga yuboriladi."
            )
        else:
            return (
                "### 🔌 Двусторонняя интеграция с 1С:Предприятие (OData v4 REST API)\n\n"
                "Платформа **RegAI** взаимодействует с конфигурациями 1С:Бухгалтерия (КОРП/ПРОФ) и 1С:ERP:\n\n"
                "1. **Импорт (Ingestion):** Извлечение оборотно-сальдовой ведомости (ОСВ) через `AccountingRegister_Хозрасчетный/Balance` со счетами 01, 10, 50, 51, 60, 62, 80, 84.\n"
                "2. **Безопасность:** Пароли и токены OData шифруются симметричным шифром **AES-256 (Fernet)** на уровне БД.\n"
                "3. **Экспорт корректировок (Pushback):** Трансляция рассчитанных МСФО-корректировок напрямую в `Document_ОперацияБух` с генерацией бухгалтерских проводок."
            )

    # 6. Fallback General Question
    if not context_docs:
        if lang == "en":
            return (
                f"### Regulatory Compliance Consultation: \"{query}\"\n\n"
                "Thank you for your inquiry. The **RegAI Compliance Engine** analyzed the regulatory database.\n\n"
                "To ensure strict compliance with international standards and national legislation, we recommend:\n\n"
                "1. **Reconciliation:** Review account reconciliations and supporting primary documentation.\n"
                "2. **Automated Audit:** Run the automated compliance and tax audit in the **AI Tax Analysis** section.\n"
                "3. **Framework Review:** Review specific regulatory acts in the **Regulations** and **Tax Config** modules."
            )
        elif lang == "uz":
            return (
                f"### Normativlar bo'yicha maslahat: \"{query}\"\n\n"
                "Savolingiz uchun tashakkur. **RegAI** intellektual yordamchisi normativ-huquqiy bazani tekshirdi.\n\n"
                "MHXS va soliq qonunchiligi talablariga to'liq rioya qilish uchun quyidagilar tavsiya etiladi:\n\n"
                "1. **Birlamchi hujjatlar:** Hisob-kitoblarni taqqoslash va birlamchi buxgalteriya hujjatlarini tekshirish.\n"
                "2. **Avtomatik audit:** **AI Tax Analysis** bo'limida avtomatik soliq va komplayens tahlilini ishga tushirish.\n"
                "3. **Normativ baza:** **Regulations** hamda **Tax Config** bo'limlarida amaldagi qonunchilik bilan tanishish."
            )
        else:
            return (
                f"По вашему запросу **«{query}»** проанализирована база регуляторных нормативов.\n\n"
                "Рекомендуется проверить соответствие учетной политики международным стандартам финансовой отчетности (IFRS) "
                "и локальным нормативным актам. Для выполнения автоматической трансформации или сверки выгрузите ОСВ из 1С в разделе **Transformation**."
            )

    response_text = f"### 📖 Regulatory Analysis Results: «{query}»\n\n" if lang == "en" else (
        f"### 📖 Normativ tahlil natijalari: «{query}»\n\n" if lang == "uz" else f"### 📖 Результаты регуляторного анализа по запросу: «{query}»\n\n"
    )
    for i, doc in enumerate(context_docs):
        code = doc.get("metadata", {}).get("code", f"REG-{i+1}")
        title = doc.get("metadata", {}).get("title", "")
        content_preview = doc["content"][:350] + "..." if len(doc["content"]) > 350 else doc["content"]

        response_text += f"#### {i+1}. {code}: {title}\n"
        response_text += f"> {content_preview}\n\n"

    if lang == "en":
        response_text += "💡 **Compliance Recommendation:** Ensure your company internal policies reflect these requirements to prevent audit non-compliance."
    elif lang == "uz":
        response_text += "💡 **Komplayens tavsiyasi:** Auditorlik tekshiruvlarida e'tirozlar kelib chiqmasligi uchun kompaniya ichki qoidalari mazkur talablarga mos kelishini ta'minlang."
    else:
        response_text += "💡 **Рекомендация по комплаенсу:** Убедитесь, что внутренние регламенты компании отражают указанные требования для предотвращения аудиторских замечаний."
    return response_text
