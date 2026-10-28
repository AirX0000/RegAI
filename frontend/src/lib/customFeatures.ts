/**
 * Axiaris / RegAI — Add-on Feature Modules Catalog & Helpers ("Функции вне тарифа")
 * Allows Superadmins and Organizations to activate specific modules independently of the base plan.
 */

export interface CustomFeatureDef {
    id: string;
    key: string;
    nameRu: string;
    nameEn: string;
    nameUz: string;
    descriptionRu: string;
    descriptionEn: string;
    descriptionUz: string;
    category: 'branding' | 'ai' | 'integration' | 'compliance' | 'security' | 'scale';
    recommendedTier?: string;
    badgeColor: string;
}

export const AVAILABLE_CUSTOM_FEATURES: CustomFeatureDef[] = [
    {
        id: 'white_label',
        key: 'white_label',
        nameRu: 'White-Label брендирование',
        nameEn: 'White-Label Branding',
        nameUz: 'White-Label brendlash',
        descriptionRu: 'Официальный фирменный логотип компании на PDF/Excel бланках и скрытие сторонних водяных знаков платформы.',
        descriptionEn: 'Custom corporate logo on all PDF/Excel reports, replacing platform branding on official documents.',
        descriptionUz: 'PDF/Excel hisobotlarida kompaniyaning shaxsiy logotipi va platforma belgilarini olib tashlash.',
        category: 'branding',
        recommendedTier: 'Enterprise',
        badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800'
    },
    {
        id: 'ai_auditor',
        key: 'ai_auditor',
        nameRu: 'AI Аудитор (ISA 700/701 & KAM)',
        nameEn: 'AI Auditor (ISA 700/701 & KAM)',
        nameUz: 'AI Auditor (XAS 700/701 va KAM)',
        descriptionRu: 'Генерация независимого аудиторского заключения, выявление ключевых вопросов аудита (KAM) и расчет существенности.',
        descriptionEn: 'Automated independent auditor memorandum, Key Audit Matters (KAM) risk detection, and materiality threshold.',
        descriptionUz: 'Mustaqil auditorlik xulosasini avtomatlashtirilgan tarzda tuzish va xatarlarni aniqlash.',
        category: 'ai',
        recommendedTier: 'Premium',
        badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
    },
    {
        id: 'onec_sync',
        key: 'onec_sync',
        nameRu: 'Прямая синхронизация 1C (OData API)',
        nameEn: '1C Direct Sync (OData API)',
        nameUz: '1C to\'g\'ridan-to\'g\'ri sinxronizatsiya',
        descriptionRu: 'Двусторонний обмен проводками, планом счетов и ОСВ с 1С:Бухгалтерия с шифрованием реквизитов Fernet.',
        descriptionEn: 'Two-way automated exchange of trial balances and entries with 1C:Enterprise via Fernet-encrypted credentials.',
        descriptionUz: '1C bilan xavfsiz Fernet shifrlash orqali to\'g\'ridan-to\'g\'ri ma\'lumotlar almashinuvi.',
        category: 'integration',
        recommendedTier: 'Premium',
        badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    },
    {
        id: 'ias12_tax',
        key: 'ias12_tax',
        nameRu: 'Налоговый модуль IAS 12 (ОНО / ОНА)',
        nameEn: 'IAS 12 Tax Module (DTA / DTL)',
        nameUz: 'IAS 12 Soliq moduli',
        descriptionRu: 'Расчет временных разниц, отложенных налоговых активов и обязательств с автосверкой со ставками НК РУз.',
        descriptionEn: 'Calculation of deferred tax assets and liabilities according to IAS 12 and national tax reconciliation.',
        descriptionUz: 'IAS 12 bo\'yicha kechiktirilgan soliq aktivlari va majburiyatlarini hisoblash.',
        category: 'compliance',
        recommendedTier: 'Premium',
        badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    },
    {
        id: 'rag_search',
        key: 'rag_search',
        nameRu: 'AI RAG Поиск нормативов (IFRS / ISA)',
        nameEn: 'AI RAG Standards Search (IFRS / ISA)',
        nameUz: 'AI RAG standartlar qidiruvi',
        descriptionRu: 'Семантический поиск по 100+ стандартам IFRS/IAS, ISA и lex.uz с цитированием конкретных пунктов учетной политики.',
        descriptionEn: 'Semantic search across 100+ IFRS, ISA standards and national laws with precise clause citation.',
        descriptionUz: '100+ IFRS va xalqaro audit standartlari bo\'yicha aqlli semantik qidiruv.',
        category: 'ai',
        recommendedTier: 'Enterprise',
        badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    },
    {
        id: 'multi_currency',
        key: 'multi_currency',
        nameRu: 'Мультивалютная трансформация (IAS 21)',
        nameEn: 'Multi-Currency Engine (IAS 21)',
        nameUz: 'Ko\'p valyutali transformatsiya (IAS 21)',
        descriptionRu: 'Автоматический пересчет сальдо в функциональную валюту (USD, EUR, UZS) по курсам ЦБ на отчетную дату.',
        descriptionEn: 'Automated conversion of balances and exchange differences into functional currency under IAS 21.',
        descriptionUz: 'IAS 21 bo\'yicha Markaziy bank kurslari bilan valyutani avtomat qayta hisoblash.',
        category: 'compliance',
        recommendedTier: 'Enterprise',
        badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800'
    },
    {
        id: 'consolidation',
        key: 'consolidation',
        nameRu: 'Консолидация холдинга (IFRS 10)',
        nameEn: 'Holding Consolidation (IFRS 10)',
        nameUz: 'Xolding konsolidatsiyasi (IFRS 10)',
        descriptionRu: 'Элиминация внутригрупповых оборотов, сведение балансов дочерних структур и расчет неконтролирующей доли.',
        descriptionEn: 'Intercompany balance eliminations, subsidiary aggregation, and Non-Controlling Interest calculations under IFRS 10.',
        descriptionUz: 'IFRS 10 bo\'yicha guruh ichidagi hisob-kitoblarni bartaraf etish va birlashgan balans.',
        category: 'scale',
        recommendedTier: 'Enterprise',
        badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-800'
    },
    {
        id: 'unlimited_users',
        key: 'unlimited_users',
        nameRu: 'Снятие лимита пользователей & SSO',
        nameEn: 'Unlimited Users & SSO/SAML',
        nameUz: 'Cheksiz foydalanuvchilar va SSO',
        descriptionRu: 'Неограниченное число рабочих мест бухгалтеров и аудиторов, интеграция с корпоративным Active Directory/SAML.',
        descriptionEn: 'No caps on accountant and auditor seats with Single Sign-On (SSO/SAML) directory integration.',
        descriptionUz: 'Foydalanuvchilar soniga cheklov yo\'qligi va korporativ SSO kirish.',
        category: 'scale',
        recommendedTier: 'Enterprise',
        badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
    },
    {
        id: 'custom_reports',
        key: 'custom_reports',
        nameRu: 'Конструктор персональных отчетов',
        nameEn: 'Custom Report Builder',
        nameUz: 'Shaxsiy hisobotlar konstruktori',
        descriptionRu: 'Создание произвольных таблиц раскрытий МСФО и собственных аналитических форм с сохранением корпоративных шаблонов.',
        descriptionEn: 'Custom disclosure tables and analytical statement templates with reusable corporate presets.',
        descriptionUz: 'Shaxsiy IFRS ochib berish jadvallari va andozalarini yaratish.',
        category: 'compliance',
        recommendedTier: 'Premium',
        badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800'
    },
    {
        id: 'audit_trail_immutable',
        key: 'audit_trail_immutable',
        nameRu: 'Криптографический аудит-след SHA-256',
        nameEn: 'Immutable SHA-256 Audit Trail',
        nameUz: 'O\'zgarmas SHA-256 audit izi',
        descriptionRu: 'Неизменяемое логирование всех модификаций отчетности с цифровыми контрольными суммами sha256 для Big 4.',
        descriptionEn: 'Tamper-proof audit logging of balance sheet adjustments with cryptographic SHA-256 validation for Big 4 audits.',
        descriptionUz: 'Big 4 auditi uchun SHA-256 nazorat summalari bilan xavfsiz jurnal.',
        category: 'security',
        recommendedTier: 'Enterprise',
        badgeColor: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200 dark:border-violet-800'
    }
];

/**
 * Checks if a specific feature is enabled for a company.
 * Returns true if:
 * 1. The company's plan inherently includes it, OR
 * 2. It has been enabled as a custom add-on feature outside the plan.
 */
export function hasCompanyFeature(company: any, featureKey: string): boolean {
    if (!company) return false;
    
    // Explicit add-on feature list overrides plan
    const customFeatures: string[] = Array.isArray(company.custom_features) 
        ? company.custom_features 
        : (typeof company.custom_features === 'string' ? JSON.parse(company.custom_features || '[]') : []);

    if (customFeatures.includes(featureKey)) {
        return true;
    }

    const plan = (company.plan || 'free').toLowerCase();

    // Enterprise tier natively includes all standard capabilities
    if (plan === 'enterprise') {
        return true;
    }

    // Premium tier natively includes ai_auditor, onec_sync, ias12_tax, custom_reports
    if (plan === 'premium') {
        const premiumFeatures = ['ai_auditor', 'onec_sync', 'ias12_tax', 'custom_reports'];
        return premiumFeatures.includes(featureKey);
    }

    return false;
}

/**
 * Returns localized title of a feature key.
 */
export function getFeatureTitle(featureKey: string, lang = 'ru'): string {
    const found = AVAILABLE_CUSTOM_FEATURES.find(f => f.key === featureKey);
    if (!found) {
        // Humanize arbitrary custom keys
        return featureKey
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }
    if (lang === 'en') return found.nameEn;
    if (lang === 'uz') return found.nameUz;
    return found.nameRu;
}

/**
 * Returns category badge styling
 */
export function getFeatureCategoryLabel(category: string, lang = 'ru'): string {
    switch (category) {
        case 'branding': return lang === 'en' ? 'Branding' : 'Брендинг';
        case 'ai': return lang === 'en' ? 'AI & Intelligence' : 'Искусственный интеллект';
        case 'integration': return lang === 'en' ? 'Integration' : 'Интеграция';
        case 'compliance': return lang === 'en' ? 'Compliance' : 'Комплаенс и налоги';
        case 'security': return lang === 'en' ? 'Security' : 'Безопасность';
        case 'scale': return lang === 'en' ? 'Scaling' : 'Масштабирование';
        default: return lang === 'en' ? 'Add-on' : 'Доп. опция';
    }
}
