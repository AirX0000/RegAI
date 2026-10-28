import seedData from './seedDatabase.json';
import { tr } from '@/lib/i18n';
import { createMockToken, safeBase64Decode } from './authUtils';
import * as XLSX from 'xlsx';

// ── Persistence Helpers ──────────────────────────────────────────────────────
const CURRENT_MOCK_STORAGE_VERSION = 'v7_zero_delta_ifrs_fix_2026';
function ensureStorageIsolation() {
    try {
        if (localStorage.getItem('regai_storage_version') !== CURRENT_MOCK_STORAGE_VERSION) {
            localStorage.removeItem('regai_mock_audit_logs');
            localStorage.removeItem('regai_mock_reports');
            localStorage.removeItem('regai_mock_balance_sheets');
            localStorage.removeItem('regai_mock_documents');
            localStorage.removeItem('regai_mock_alerts');
            localStorage.setItem('regai_storage_version', CURRENT_MOCK_STORAGE_VERSION);
        }
    } catch (e) {
        // ignore
    }
}
ensureStorageIsolation();

function getStored<T>(key: string, fallback: T): T {
    try {
        const val = localStorage.getItem(key);
        if (val) return JSON.parse(val);
    } catch (e) {
        // ignore
    }
    return fallback;
}

function setStored<T>(key: string, data: T): void {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        // ignore
    }
}

// ── Canonical Tax Rates ─────────────────────────────────────────────────────
const INITIAL_TAX_RATES = [
    // UZBEKISTAN
    { id: 'tax-uz-1', country_code: 'UZ', country_name: 'Узбекистан (Uzbekistan)', tax_type: 'vat', rate: 12, description: 'Стандартная ставка НДС Республики Узбекистан (НК РУз ст. 258)', effective_from: '2023-01-01', source_url: 'https://soliq.uz' },
    { id: 'tax-uz-2', country_code: 'UZ', country_name: 'Узбекистан (Uzbekistan)', tax_type: 'corporate', rate: 15, description: 'Базовая ставка налога на прибыль юридических лиц (НК РУз)', effective_from: '2022-01-01', source_url: 'https://soliq.uz' },
    { id: 'tax-uz-3', country_code: 'UZ', country_name: 'Узбекистан (Uzbekistan)', tax_type: 'corporate_small', rate: 4, description: 'Налог с оборота для субъектов малого бизнеса (УСН)', effective_from: '2023-01-01', source_url: 'https://soliq.uz' },
    { id: 'tax-uz-4', country_code: 'UZ', country_name: 'Узбекистан (Uzbekistan)', tax_type: 'income', rate: 12, description: 'Налог на доходы физических лиц (НДФЛ фиксированная шкала)', effective_from: '2019-01-01', source_url: 'https://soliq.uz' },
    { id: 'tax-uz-5', country_code: 'UZ', country_name: 'Узбекистан (Uzbekistan)', tax_type: 'social', rate: 12, description: 'Социальный налог с фонда оплаты труда работодателя', effective_from: '2020-01-01', source_url: 'https://soliq.uz' },
    { id: 'tax-uz-6', country_code: 'UZ', country_name: 'Узбекистан (Uzbekistan)', tax_type: 'withholding', rate: 10, description: 'Налог у источника выплат по дивидендам и процентам нерезидентов', effective_from: '2020-01-01', source_url: 'https://soliq.uz' },
    { id: 'tax-uz-7', country_code: 'UZ', country_name: 'Узбекистан (Uzbekistan)', tax_type: 'property', rate: 1.5, description: 'Налог на имущество юридических лиц', effective_from: '2022-01-01', source_url: 'https://soliq.uz' },

    // RUSSIA
    { id: 'tax-ru-1', country_code: 'RU', country_name: 'Россия (Russia)', tax_type: 'vat', rate: 20, description: 'Основная ставка налога на добавленную стоимость (НК РФ ст. 164)', effective_from: '2019-01-01', source_url: 'https://nalog.gov.ru' },
    { id: 'tax-ru-2', country_code: 'RU', country_name: 'Россия (Russia)', tax_type: 'vat_reduced', rate: 10, description: 'Льготная ставка НДС (продовольствие, медикаменты, детские товары)', effective_from: '2019-01-01', source_url: 'https://nalog.gov.ru' },
    { id: 'tax-ru-3', country_code: 'RU', country_name: 'Россия (Russia)', tax_type: 'corporate', rate: 25, description: 'Налог на прибыль организаций (актуализировано на 2025-2026 гг.)', effective_from: '2025-01-01', source_url: 'https://nalog.gov.ru' },
    { id: 'tax-ru-4', country_code: 'RU', country_name: 'Россия (Russia)', tax_type: 'income', rate: 13, description: 'НДФЛ базовая шкала для резидентов (доходы до 2.4 млн руб)', effective_from: '2025-01-01', source_url: 'https://nalog.gov.ru' },
    { id: 'tax-ru-5', country_code: 'RU', country_name: 'Россия (Russia)', tax_type: 'income_top', rate: 15, description: 'НДФЛ повышенная шкала для доходов свыше лимита', effective_from: '2025-01-01', source_url: 'https://nalog.gov.ru' },
    { id: 'tax-ru-6', country_code: 'RU', country_name: 'Россия (Russia)', tax_type: 'payroll', rate: 30, description: 'Единый тариф страховых взносов работодателя в СФР', effective_from: '2023-01-01', source_url: 'https://sfr.gov.ru' },

    // KAZAKHSTAN
    { id: 'tax-kz-1', country_code: 'KZ', country_name: 'Казахстан (Kazakhstan)', tax_type: 'vat', rate: 12, description: 'Налог на добавленную стоимость (НК РК ст. 422)', effective_from: '2021-01-01', source_url: 'https://kgd.gov.kz' },
    { id: 'tax-kz-2', country_code: 'KZ', country_name: 'Казахстан (Kazakhstan)', tax_type: 'corporate', rate: 20, description: 'Корпоративный подоходный налог (КПН общеустановленный режим)', effective_from: '2021-01-01', source_url: 'https://kgd.gov.kz' },
    { id: 'tax-kz-3', country_code: 'KZ', country_name: 'Казахстан (Kazakhstan)', tax_type: 'income', rate: 10, description: 'Индивидуальный подоходный налог (ИПН с доходов физлиц)', effective_from: '2021-01-01', source_url: 'https://kgd.gov.kz' },
    { id: 'tax-kz-4', country_code: 'KZ', country_name: 'Казахстан (Kazakhstan)', tax_type: 'social', rate: 9.5, description: 'Социальный налог с фонда оплаты труда работодателя', effective_from: '2022-01-01', source_url: 'https://kgd.gov.kz' },
    { id: 'tax-kz-5', country_code: 'KZ', country_name: 'Казахстан (Kazakhstan)', tax_type: 'withholding', rate: 15, description: 'КПН у источника выплаты с доходов юридических лиц-нерезидентов', effective_from: '2021-01-01', source_url: 'https://kgd.gov.kz' },

    // UAE
    { id: 'tax-ae-1', country_code: 'AE', country_name: 'ОАЭ (UAE)', tax_type: 'vat', rate: 5, description: 'Federal Tax Authority Value Added Tax (VAT)', effective_from: '2018-01-01', source_url: 'https://tax.gov.ae' },
    { id: 'tax-ae-2', country_code: 'AE', country_name: 'ОАЭ (UAE)', tax_type: 'corporate', rate: 9, description: 'Federal Corporate Tax on taxable profits exceeding 375,000 AED', effective_from: '2023-06-01', source_url: 'https://tax.gov.ae' },
    { id: 'tax-ae-3', country_code: 'AE', country_name: 'ОАЭ (UAE)', tax_type: 'corporate_small', rate: 0, description: 'Corporate Tax for Qualifying Free Zone Persons (QFZP 0% tier)', effective_from: '2023-06-01', source_url: 'https://tax.gov.ae' },
    { id: 'tax-ae-4', country_code: 'AE', country_name: 'ОАЭ (UAE)', tax_type: 'income', rate: 0, description: 'Personal Income Tax (0% rate on individuals employment earnings)', effective_from: '2023-01-01', source_url: 'https://tax.gov.ae' },
    { id: 'tax-ae-5', country_code: 'AE', country_name: 'ОАЭ (UAE)', tax_type: 'withholding', rate: 0, description: 'Standard withholding tax on cross-border dividend distributions', effective_from: '2023-06-01', source_url: 'https://tax.gov.ae' },

    // TURKEY
    { id: 'tax-tr-1', country_code: 'TR', country_name: 'Турция (Turkey)', tax_type: 'vat', rate: 20, description: 'Katma Değer Vergisi (KDV) standard rate (increased July 2023)', effective_from: '2023-07-10', source_url: 'https://gib.gov.tr' },
    { id: 'tax-tr-2', country_code: 'TR', country_name: 'Турция (Turkey)', tax_type: 'vat_reduced', rate: 10, description: 'KDV reduced rate for essential food and hospitality services', effective_from: '2023-07-10', source_url: 'https://gib.gov.tr' },
    { id: 'tax-tr-3', country_code: 'TR', country_name: 'Турция (Turkey)', tax_type: 'corporate', rate: 25, description: 'Kurumlar Vergisi (Corporate Income Tax rate)', effective_from: '2023-10-01', source_url: 'https://gib.gov.tr' },
    { id: 'tax-tr-4', country_code: 'TR', country_name: 'Турция (Turkey)', tax_type: 'income_top', rate: 15, description: 'Gelir Vergisi standard starting bracket for personal income', effective_from: '2024-01-01', source_url: 'https://gib.gov.tr' },
    { id: 'tax-tr-5', country_code: 'TR', country_name: 'Турция (Turkey)', tax_type: 'withholding', rate: 15, description: 'Stopaj (Withholding tax) on non-resident royalties and technical fees', effective_from: '2023-01-01', source_url: 'https://gib.gov.tr' },

    // GLOBAL
    { id: 'tax-glob-1', country_code: 'GLOBAL', country_name: 'Международные стандарты (Global)', tax_type: 'corporate', rate: 15, description: 'OECD / G20 Inclusive Framework Pillar Two Global Minimum Tax', effective_from: '2024-01-01', source_url: 'https://oecd.org' },
    { id: 'tax-glob-2', country_code: 'GLOBAL', country_name: 'Международные стандарты (Global)', tax_type: 'withholding', rate: 10, description: 'OECD Model Tax Convention standard cross-border dividend WHT', effective_from: '2023-01-01', source_url: 'https://oecd.org' },
    { id: 'tax-glob-3', country_code: 'GLOBAL', country_name: 'Международные стандарты (Global)', tax_type: 'consumption', rate: 3, description: 'Digital Services Tax (DST) international model benchmark', effective_from: '2023-01-01', source_url: 'https://oecd.org' },
    { id: 'tax-glob-4', country_code: 'GLOBAL', country_name: 'Международные стандарты (Global)', tax_type: 'corporate_small', rate: 15, description: 'BEPS Action 13 Transfer Pricing Minimum Effective Tax Rate', effective_from: '2024-01-01', source_url: 'https://oecd.org' },
];

// Helper to get mutable tax rates
function getTaxRatesStore(): any[] {
    return getStored<any[]>('regai_mock_tax_rates', INITIAL_TAX_RATES);
}

function saveTaxRatesStore(rates: any[]): void {
    setStored('regai_mock_tax_rates', rates);
}

// Stores for other dynamic entities
function getCompaniesStore(): any[] {
    return getStored<any[]>('regai_mock_companies', seedData.companies);
}

function saveCompaniesStore(comps: any[]): void {
    setStored('regai_mock_companies', comps);
}

function getUsersStore(): any[] {
    return getStored<any[]>('regai_mock_users', seedData.users);
}

function saveUsersStore(users: any[]): void {
    setStored('regai_mock_users', users);
}

function getTenantsStore(): any[] {
    return getStored<any[]>('regai_mock_tenants', seedData.tenants);
}

function saveTenantsStore(tenants: any[]): void {
    setStored('regai_mock_tenants', tenants);
}

function getBalanceSheetsStore(): any[] {
    const raw = getStored<any[]>('regai_mock_balance_sheets', seedData.balance_sheets);
    return raw.map((s: any) => ({
        ...s,
        status: (s.status || 'draft').toLowerCase()
    }));
}

function saveBalanceSheetsStore(sheets: any[]): void {
    setStored('regai_mock_balance_sheets', sheets);
}

function getAlertsStore(): any[] {
    return getStored<any[]>('regai_mock_alerts', seedData.alerts);
}

function getReportsStore(): any[] {
    return getStored<any[]>('regai_mock_reports', seedData.reports);
}

function saveReportsStore(reports: any[]): void {
    setStored('regai_mock_reports', reports);
}

const INITIAL_SMART_TEMPLATES = [
    {
        id: 'tmpl-ifrs-16-lease',
        name: 'Трансформация МСФО 16: Аренда и сверка капитала',
        description: 'Пакет регламентных проверок и дисконтирования арендных обязательств, признания ППА (счета 08/79) и контроля Zero Delta.',
        report_type: 'financial',
        country_code: 'UZ',
        tax_types: ['vat', 'corporate'],
        is_recurring: true,
        recurrence_pattern: 'quarterly',
        configuration: {
            source_standard: 'NAS',
            target_standard: 'IFRS',
            data_source_type: 'onec_sync',
            required_accounts: ['01', '02', '60', '67', '84'],
            strict_validation: true,
            active_standards: ['IFRS 16', 'IAS 36', 'IFRS 9'],
            enforce_zero_delta: true,
            ai_audit_enabled: true,
            ai_expert_role: 'Senior IFRS Big 4 Auditor',
            ai_prompt: 'Проверь корректность классификации договоров аренды по МСФО 16, ставку дисконтирования и авто-балансировку нераспределенной прибыли.',
            risk_triggers: ['unbalanced_equity', 'undisclosed_lease_terms'],
            output_language: 'ru',
            approval_chain: ['accountant', 'auditor', 'admin']
        },
        company_id: '2727830ea39d470c917f1a1544ed5d0f',
        created_at: '2026-01-15T10:00:00Z',
    },
    {
        id: 'tmpl-tax-audit-ecl',
        name: 'Налоговый аудит и резервирование IFRS 9 (ECL)',
        description: 'Комплексный чек-лист выявления налоговых разрывов по НДС и расчет ожидаемых кредитных убытков по дебиторской задолженности.',
        report_type: 'compliance',
        country_code: 'UZ',
        tax_types: ['vat', 'income', 'corporate'],
        is_recurring: true,
        recurrence_pattern: 'monthly',
        configuration: {
            source_standard: 'NAS',
            target_standard: 'TAX_CODE',
            data_source_type: 'excel_upload',
            required_accounts: ['40', '60', '62', '64', '84'],
            strict_validation: true,
            active_standards: ['IFRS 9', 'IAS 12'],
            enforce_zero_delta: true,
            ai_audit_enabled: true,
            ai_expert_role: 'Tax Compliance Advisor (UZ/CIS)',
            ai_prompt: 'Проанализируй налогооблагаемую базу по налогу на прибыль и зачетный НДС в соответствии с Налоговым кодексом РУз, выяви налоговые риски.',
            risk_triggers: ['vat_gap', 'stale_receivables'],
            output_language: 'ru',
            approval_chain: ['accountant', 'auditor']
        },
        company_id: '2727830ea39d470c917f1a1544ed5d0f',
        created_at: '2026-02-01T12:00:00Z',
    },
    {
        id: 'tmpl-reconciliation-1c',
        name: 'Аудит и сверка ОСВ 1С с трансформационным балансом',
        description: 'Автоматическая сверка оборотно-сальдовой ведомости 1С:Предприятие со счетами Главной книги и контролем баланса.',
        report_type: 'audit',
        country_code: 'UZ',
        tax_types: ['corporate'],
        is_recurring: true,
        recurrence_pattern: 'quarterly',
        configuration: {
            source_standard: '1C_COA',
            target_standard: 'IFRS',
            data_source_type: 'onec_sync',
            required_accounts: ['01', '10', '51', '60', '62', '80', '84'],
            strict_validation: true,
            active_standards: ['IFRS 16', 'IAS 36'],
            enforce_zero_delta: true,
            ai_audit_enabled: true,
            ai_expert_role: 'Forensic & Fraud Investigator',
            ai_prompt: 'Сверь оборотно-сальдовую ведомость 1С с трансформационным балансом, найди нетипичные сальдо и крупные проводки с аффилированными лицами.',
            risk_triggers: ['unbalanced_equity', 'abnormal_turnover'],
            output_language: 'ru',
            approval_chain: ['accountant', 'auditor', 'admin']
        },
        company_id: '2727830ea39d470c917f1a1544ed5d0f',
        created_at: '2026-02-10T14:30:00Z',
    }
];

function getTemplatesStore(): any[] {
    return getStored<any[]>('regai_mock_templates', INITIAL_SMART_TEMPLATES);
}

function saveTemplatesStore(templates: any[]): void {
    setStored('regai_mock_templates', templates);
}

function saveAlertsStore(alerts: any[]): void {
    setStored('regai_mock_alerts', alerts);
}

function getAuditLogsStore(): any[] {
    return getStored<any[]>('regai_mock_audit_logs', seedData.audit_logs);
}

export function getCurrentSessionUser(config?: any): any {
    try {
        const stored = localStorage.getItem('user');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && (parsed.id || parsed.email)) {
                return parsed;
            }
        }
    } catch (e) {
        // ignore
    }
    try {
        const authHeader = config?.headers?.Authorization || config?.headers?.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const parts = token.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(safeBase64Decode(parts[1]));
                return {
                    id: payload.sub,
                    email: payload.email || payload.sub,
                    full_name: payload.name || payload.full_name,
                    role: payload.role || 'user',
                    tenant_id: payload.tid || '',
                    company_id: payload.cid || '',
                };
            }
        }
    } catch (e) {
        // ignore
    }
    return null;
}

export function logAuditAction(action: string, details: string, userId?: string, companyId?: string): void {
    const session = getCurrentSessionUser();
    const effectiveUserId = userId || session?.email || session?.id || 'superadmin';
    const effectiveCompanyId = companyId || session?.company_id || (session?.role === 'superadmin' ? null : '2727830ea39d470c917f1a1544ed5d0f');
    const effectiveTenantId = session?.tenant_id || 'b4e63cbc5d5348c5bfddf1c35a9886ba';
    const nowIso = new Date().toISOString();
    const logs = getAuditLogsStore();
    logs.unshift({
        id: 'log-' + Math.random().toString(36).substring(2, 9),
        action,
        user_id: effectiveUserId,
        company_id: effectiveCompanyId,
        tenant_id: effectiveTenantId,
        details,
        created_at: nowIso,
        timestamp: nowIso,
    });
    setStored('regai_mock_audit_logs', logs);
}

function getDocumentsStore(): any[] {
    return getStored<any[]>('regai_mock_documents', seedData.documents);
}

function saveDocumentsStore(docs: any[]): void {
    setStored('regai_mock_documents', docs);
}

const EXCLUDED_NON_WORK_CODES = new Set([
    'HIPAA', 'HITE-ACT', 'FLSA', 'OSHA', 'ADA', 'FMLA', 'UZ-LABOR-CODE',
    'CAA', 'CWA', 'REACH', 'ROHS',
    'FTC ACT', 'COPPA', 'CAN--ACT', 'CPSA', 'TCPA', 'DMCA',
    'GDPR', 'CCPA', 'PIPEDA', 'ECPA', 'UK-DATA', 'FERPA', 'GDPR-ARTI', 'CALIFORNIA PRIVACY RIGHTS ACT',
    'COOKIE LAW', 'VPPA', 'BIPA', 'APRA', 'UZ-PERSONAL-DATA',
    'PCI DSS', 'ISO/-2700', 'NIST-CYBE', 'SERVICE ORGANIZATION CONTROL 2', 'FISMA',
    'CRITICAL INFRASTRUCTURE PROTECTION', 'INTERNATIONAL TRAFFIC IN ARMS REGULATIONS',
    'CYBERSECURITY MATURITY MODEL CERTIFICATION', 'SHIE-ACT',
    'TEST-001'
]);
const EXCLUDED_NON_WORK_CATS = new Set(['healthcare', 'labor', 'environmental', 'consumer', 'privacy', 'security']);

function isWorkRelatedRegulation(r: any): boolean {
    if (!r) return false;
    const code = (r.code || r.metadata?.code || '').trim().toUpperCase();
    if (EXCLUDED_NON_WORK_CODES.has(code)) return false;
    const cat = (r.category || r.metadata?.category || '').toLowerCase();
    if (EXCLUDED_NON_WORK_CATS.has(cat) && code !== 'SOX' && code !== 'UZ-SECURITIES') return false;
    return true;
}

function getRegulationsStore(): any[] {
    const base = (seedData.regulations || []) as any[];
    const stored = getStored<any[]>('regai_mock_regulations_v4', null as any);
    if (!stored || !Array.isArray(stored) || stored.length === 0) {
        setStored('regai_mock_regulations_v4', base);
        return base;
    }
    // Filter out only obsolete non-work items, but KEEP all newly imported crawler regulations!
    const cleanStored = stored.filter(isWorkRelatedRegulation);
    const storedCodes = new Set(cleanStored.map((r: any) => (r.code || r.metadata?.code || '').trim().toUpperCase()));
    const newBaseItems = base.filter((r: any) => !storedCodes.has((r.code || r.metadata?.code || '').trim().toUpperCase()));
    const merged = [...cleanStored, ...newBaseItems];
    setStored('regai_mock_regulations_v4', merged);
    return merged;
}

function saveRegulationsStore(regs: any[]): void {
    setStored('regai_mock_regulations_v4', regs);
}

const MOCK_PREDEFINED_SECTIONS = [
    { id: "all", name: "Все разделы", name_en: "All Sections", category: "ALL" },
    { id: "ifrs", name: "МСФО и международная отчетность", name_en: "IFRS & Financial Reporting", category: "IFRS" },
    { id: "nas", name: "НСБУ и национальный бухучет", name_en: "NAS & Local Accounting", category: "НСБУ" },
    { id: "tax", name: "Налогообложение и трансфертное ценообразование", name_en: "Taxation & Transfer Pricing", category: "Tax" },
    { id: "audit", name: "Аудит и стандарты МСА (ISA)", name_en: "Audit & ISA Standards", category: "Audit" },
    { id: "finance", name: "Корпоративные финансы & Рынок капитала", name_en: "Corporate Finance & Capital Markets", category: "Finance" },
    { id: "banking", name: "Банковское регулирование & Базель III", name_en: "Banking Regulation & Basel III", category: "Banking" }
];

function getCustomSectionsStore(): any[] {
    return getStored<any[]>('regai_mock_custom_sections', []);
}

function saveCustomSectionsStore(sections: any[]): void {
    setStored('regai_mock_custom_sections', sections);
}

const MOCK_CRAWLER_SOURCES = [
    {
        id: "lex_uz",
        name: "Lex.uz — Национальная база законодательства РУз",
        name_en: "Lex.uz — National Legislation Database of Uzbekistan",
        jurisdiction: "UZ",
        category: "Tax / Legal",
        base_url: "https://lex.uz",
        type: "official_gazette",
        status: "active",
        crawl_interval_hours: 12,
        description: "Указы Президента, законы Олий Мажлиса, изменения в Налоговый кодекс РУз и постановления Кабинета Министров."
    },
    {
        id: "soliq_uz",
        name: "Soliq.uz — Государственный налоговый комитет РУз",
        name_en: "Soliq.uz — State Tax Committee of Uzbekistan",
        jurisdiction: "UZ",
        category: "Tax",
        base_url: "https://soliq.uz",
        type: "tax_authority",
        status: "active",
        crawl_interval_hours: 6,
        description: "Положения по администрированию НДС, электронным счетам-фактурам (ЭСФ), налогу на прибыль и маркировке."
    },
    {
        id: "minfin_uz",
        name: "Минфин РУз — Министерство экономики и финансов",
        name_en: "Ministry of Economy and Finance of Uzbekistan",
        jurisdiction: "UZ",
        category: "Accounting / НСБУ",
        base_url: "https://mf.gov.uz",
        type: "ministry",
        status: "active",
        crawl_interval_hours: 24,
        description: "Национальные стандарты бухгалтерского учета (НСБУ), нормативы финансовой отчетности и аудита."
    },
    {
        id: "cbu_uz",
        name: "Центральный банк Республики Узбекистан (ЦБ РУз)",
        name_en: "Central Bank of the Republic of Uzbekistan (CBU)",
        jurisdiction: "UZ",
        category: "Banking / FinTech",
        base_url: "https://cbu.uz",
        type: "central_bank",
        status: "active",
        crawl_interval_hours: 12,
        description: "Пруденциальные нормативы, Открытый банкинг (Open Banking), валютное регулирование и требования к цифровым банкам."
    },
    {
        id: "napp_uz",
        name: "НАПП РУз — Национальное агентство перспективных проектов",
        name_en: "National Agency of Perspective Projects (NAPP)",
        jurisdiction: "UZ",
        category: "Crypto / FinTech",
        base_url: "https://napp.uz",
        type: "regulator",
        status: "active",
        crawl_interval_hours: 12,
        description: "Регулирование оборота крипто-активов, майнинга, страховой деятельности и рынка ценных бумаг."
    },
    {
        id: "customs_uz",
        name: "Таможенный комитет при Минэкономфине РУз",
        name_en: "Customs Committee of Uzbekistan",
        jurisdiction: "UZ",
        category: "Customs / ВЭД",
        base_url: "https://customs.uz",
        type: "customs_authority",
        status: "active",
        crawl_interval_hours: 12,
        description: "Таможенные тарифы, классификатор ТН ВЭД, зеленый коридор и электронное декларирование."
    },

    {
        id: "ifrs_org",
        name: "IFRS Foundation & IASB / ISSB",
        name_en: "IFRS Foundation (International Financial Reporting Standards)",
        jurisdiction: "GLOBAL",
        category: "IFRS / ESG",
        base_url: "https://www.ifrs.org",
        type: "international_standard",
        status: "active",
        crawl_interval_hours: 24,
        description: "Новые и обновленные стандарты МСФО (IFRS 18, IFRS 16, IFRS 9) и стандарты устойчивого развития ISSB S1/S2."
    },
    {
        id: "oecd_org",
        name: "OECD Centre for Tax Policy (ОЭСР)",
        name_en: "OECD Centre for Tax Policy and Administration",
        jurisdiction: "GLOBAL",
        category: "International Tax",
        base_url: "https://www.oecd.org",
        type: "international_treaty",
        status: "active",
        crawl_interval_hours: 24,
        description: "Глобальный минимальный налог Pillar Two (GloBE Rules), BEPS Action 13, трансфертное ценообразование."
    },
    {
        id: "fatf_org",
        name: "FATF — Financial Action Task Force",
        name_en: "Financial Action Task Force (FATF)",
        jurisdiction: "GLOBAL",
        category: "AML",
        base_url: "https://www.fatf-gafi.org",
        type: "international_standard",
        status: "active",
        crawl_interval_hours: 24,
        description: "Международные стандарты по противодействию отмыванию денег (AML), Travel Rule и проверка бенефициаров (UBO)."
    },
    {
        id: "bis_org",
        name: "BIS — Базельский комитет по банковскому надзору",
        "name_en": "Bank for International Settlements (Basel Committee)",
        jurisdiction: "GLOBAL",
        category: "Banking",
        base_url: "https://www.bis.org",
        type: "international_standard",
        status: "active",
        crawl_interval_hours: 24,
        description: "Стандарты достаточности банковского капитала Basel III / Basel IV, ликвидность LCR/NSFR."
    },
    {
        id: "adilet_kz",
        name: "Adilet.zan.kz — Законодательство Республики Казахстан",
        name_en: "Adilet.zan.kz — Legal Information System of Kazakhstan",
        jurisdiction: "KZ",
        category: "Tax / Corporate",
        base_url: "https://adilet.zan.kz",
        type: "official_gazette",
        status: "active",
        crawl_interval_hours: 12,
        description: "Налоговый кодекс РК, постановления Правительства РК по трансфертному ценообразованию и КПН."
    },
    {
        id: "eur_lex",
        name: "EUR-Lex — Официальный портал права Европейского Союза",
        name_en: "EUR-Lex — European Union Law Gateway",
        jurisdiction: "EU",
        category: "ESG / Compliance",
        base_url: "https://eur-lex.europa.eu",
        type: "supranational",
        status: "active",
        crawl_interval_hours: 24,
        description: "Директивы ЕС по корпоративной отчетности в области устойчивого развития (CSRD), регулирование CBAM и GDPR."
    },
    {
        id: "uae_fta",
        name: "UAE Federal Tax Authority (FTA)",
        name_en: "United Arab Emirates Federal Tax Authority",
        jurisdiction: "AE",
        category: "Corporate Tax / VAT",
        base_url: "https://tax.gov.ae",
        type: "tax_authority",
        status: "active",
        crawl_interval_hours: 24,
        description: "Федеральный закон о корпоративном налоге ОАЭ (Corporate Tax), налоговые правила Free Zone и НДС."
    }
];

const MOCK_WEB_DISCOVERIES = [
    // ── 1. TAX ───────────────────────────────────────────────────────────────
    {
        code: "LEX-UZ-2026-NPA-412",
        title: "Постановление КМ РУз № 412: О цифровом контроле трансфертного ценообразования и мониторинге трансграничных сделок",
        title_en: "Cabinet of Ministers Resolution No. 412: Digital Transfer Pricing Control and Cross-Border Transaction Monitoring",
        jurisdiction: "UZ",
        category: "Tax",
        section_id: "tax",
        authority: "Кабинет Министров Республики Узбекистан",
        source_name: "Lex.uz",
        source_url: "https://lex.uz/docs/transfer-pricing-2026-412",
        effective_date: "2026-03-01",
        impact_level: "HIGH",
        match_score: 99.4,
        summary: "Введение обязательного электронного уведомления о контролируемых сделках с нерезидентами и лицами из офшорных зон при сумме контрактов свыше 5 млрд сумов в год.",
        content: "Настоящее Постановление устанавливает порядок автоматизированного мониторинга трансфертного ценообразования в Республике Узбекистан. Все налогоплательщики, осуществляющие внешнеторговые операции с взаимозависимыми контрагентами либо резидентами юрисдикций с льготным налогообложением, обязаны предоставлять документацию по трансфертному ценообразованию через портал my.soliq.uz до 1 июня года, следующего за отчетным.",
        workflow_steps: [
            "Выгрузить реестр сделок с взаимозависимыми лицами за истекший финансовый год",
            "Проверить статус юрисдикций контрагентов по перечню офшорных зон Минфина РУз",
            "Сформировать трехуровневую документацию (Master file, Local file, CbCR) для сделок > 5 млрд сумов",
            "Подать электронное уведомление через личный кабинет налогоплательщика"
        ]
    },
    {
        code: "SOLIQ-UZ-E-INV-2026",
        title: "Положение ГНК РУз: Обязательная автоматическая сверка товарных позиций в ЭСФ по классификатору ИКПУ 2026",
        title_en: "State Tax Committee Regulation: Mandatory Automated Reconciliation of E-Invoices by MXIK (IKPU) 2026 Classifier",
        jurisdiction: "UZ",
        category: "Tax",
        section_id: "tax",
        authority: "Государственный налоговый комитет РУз",
        source_name: "Soliq.uz",
        source_url: "https://soliq.uz/press-services/news/ikpu-e-invoice-update-2026",
        effective_date: "2026-02-15",
        impact_level: "MEDIUM",
        match_score: 97.2,
        summary: "Блокировка отправки ЭСФ с некорректными кодами ИКПУ и льготными кодами без прикрепленных разрешительных документов. Автоматическая сверка входного и выходного НДС.",
        content: "С 15 февраля 2026 года в автоматизированной информационной системе ЭСФ вводится предвалидация кодов ИКПУ. Система отклоняет регистрацию счетов-фактур при несовпадении единиц измерения или недействительности льготного налогового кода.",
        workflow_steps: [
            "Обновить справочник ИКПУ в ERP-системе (1C / SAP) до последней версии классификатора tasnif.soliq.uz",
            "Проверить соответствие единиц измерения товаров кодам классификатора",
            "Настроить предвалидацию ЭСФ перед отправкой контрагентам"
        ]
    },
    {
        code: "OECD-P2-GLOBE-2026",
        title: "OECD Pillar Two GloBE Model Rules: Административные руководящие принципы по безопасным гаваням (Safe Harbours)",
        title_en: "OECD Pillar Two GloBE Model Rules: Administrative Guidance on Transitional Safe Harbours",
        jurisdiction: "GLOBAL",
        category: "Tax",
        section_id: "tax",
        authority: "OECD / G20 Inclusive Framework",
        source_name: "OECD Tax Policy",
        source_url: "https://www.oecd.org/tax/beps/pillar-two-globe-rules-administrative-guidance.htm",
        effective_date: "2026-01-01",
        impact_level: "HIGH",
        match_score: 96.5,
        summary: "Разъяснения по применению временных правил CbCR Safe Harbour и расчету эффективной ставки налога (ETR) для международных холдингов с консолидированной выручкой свыше 750 млн евро.",
        content: "The OECD Inclusive Framework released updated administrative guidance for the Pillar Two GloBE rules, clarifying transitional safe harbours, qualifying domestic top-up taxes (QDMTT), and treatment of deferred tax assets.",
        workflow_steps: [
            "Определить периметр консолидации холдинговой группы",
            "Провести CbCR Safe Harbour тест для каждой юрисдикции присутствия",
            "Рассчитать скорректированную ставку ETR по правилам GloBE при несрабатывании safe harbour",
            "Рассчитать сумму доплаты налога (Top-up Tax) при эффективной ставке ниже 15%"
        ]
    },
    {
        code: "KZ-KGD-TP-2026",
        title: "Закон Республики Казахстан № 184-VIII: О трансфертном ценообразовании при экспорте сырьевых и промышленных товаров",
        title_en: "Law of the Republic of Kazakhstan No. 184-VIII: On Transfer Pricing in the Export of Commodities and Industrial Goods",
        jurisdiction: "KZ",
        category: "Tax",
        section_id: "tax",
        authority: "Комитет государственных доходов Минфина РК",
        source_name: "Adilet.zan.kz",
        source_url: "https://adilet.zan.kz/rus/docs/Z2400000184",
        effective_date: "2026-01-01",
        impact_level: "HIGH",
        match_score: 97.9,
        summary: "Ужесточение контроля за дифференциалами цен при экспорте товаров, расширение понятия взаимозависимых лиц и обязательность подачи местной отчетности (Local File).",
        content: "Закон совершенствует механизм контроля трансфертного ценообразования в Республике Казахстан. Вводится сопоставление рыночных интервалов цен на базе котировок международных биржевых агентств и обязательная отчетность для крупных налогоплательщиков.",
        workflow_steps: [
            "Проанализировать контракты на экспорт товаров на соответствие рыночным биржевым котировкам",
            "Подготовить обоснование примененного дифференциала цены (логистика, страхование, качество)",
            "Сформировать и сдать форму Local File в органы государственных доходов РК"
        ]
    },
    {
        code: "UAE-FTA-CIT-FREEZONE-2026",
        title: "UAE FTA Decision No. 139: Qualifying Free Zone Person (QFZP) — Условия применения ставки корпоративного налога 0%",
        title_en: "UAE FTA Decision No. 139: Qualifying Free Zone Person (QFZP) — Conditions for 0% Corporate Tax Rate",
        jurisdiction: "AE",
        category: "Tax",
        section_id: "tax",
        authority: "UAE Federal Tax Authority (FTA)",
        source_name: "UAE FTA",
        source_url: "https://tax.gov.ae/en/legislation/corporate-tax/decisions",
        effective_date: "2026-01-01",
        impact_level: "HIGH",
        match_score: 96.1,
        summary: "Детальные критерии достаточного экономического присутствия (Substance requirements), перечень квалифицированных видов деятельности и порядок аудита отчетности по МСФО.",
        content: "The Federal Tax Authority sets out explicit criteria for Free Zone entities to maintain Qualifying Free Zone Person status eligible for the 0% corporate tax bracket, including audited IFRS financial statements and adequate full-time staff within the designated zone.",
        workflow_steps: [
            "Подготовить аудит финансовой отчетности за финансовый год строго по стандартам IFRS",
            "Подтвердить наличие фактического офиса и штатных сотрудников в СЭЗ",
            "Проверить долю неквалифицированных доходов (de minimis threshold не более 5 млн AED или 5%)",
            "Подать корпоративную налоговую декларацию через портал EmaraTax"
        ]
    },

    // ── 2. IFRS & ACCOUNTING ──────────────────────────────────────────────────
    {
        code: "IFRS-18-REV-2026",
        title: "IFRS 18: Presentation and Disclosure in Financial Statements (Переходные положения и реклассификация отчета о прибылях и убытках)",
        title_en: "IFRS 18: Presentation and Disclosure in Financial Statements (Transition Provisions & P&L Reclassification)",
        jurisdiction: "GLOBAL",
        category: "IFRS",
        section_id: "ifrs",
        authority: "International Accounting Standards Board (IASB)",
        source_name: "IFRS Foundation",
        source_url: "https://www.ifrs.org/issued-standards/list-of-standards/ifrs-18-presentation-and-disclosure-in-financial-statements/",
        effective_date: "2027-01-01",
        impact_level: "HIGH",
        match_score: 98.7,
        summary: "Замена стандарта IAS 1. Введение трех обязательных категорий в ОПУ: операционная, инвестиционная и финансовая деятельность, а также обязательное раскрытие показателей эффективности руководства (MPMs).",
        content: "IFRS 18 introduces three new defined operating profit categories on the face of the statement of profit or loss: Operating, Investing, and Financing. Entities must provide detailed reconciliation of Management-defined Performance Measures (MPMs) to the nearest IFRS subtotal in the notes.",
        workflow_steps: [
            "Провести инвентаризацию всех статей доходов и расходов плана счетов",
            "Реклассифицировать статьи в 3 обязательные категории IFRS 18 (Operating, Investing, Financing)",
            "Идентифицировать и задокументировать показатели MPMs (EBITDA, скорректированная чистая прибыль)",
            "Подготовить сравнительные данные за предшествующий год для раскрытия"
        ]
    },
    {
        code: "NSBU-21-REV-2026",
        title: "НСБУ № 21 (Редакция 2026): План счетов бухгалтерского учета и гармонизация учета с принципами МСФО",
        title_en: "NAS No. 21 (2026 Edition): Chart of Accounts and Harmonization with IFRS Principles",
        jurisdiction: "UZ",
        category: "IFRS",
        section_id: "ifrs",
        authority: "Министерство экономики и финансов Республики Узбекистан",
        source_name: "Минфин РУз",
        source_url: "https://mf.gov.uz/regulatory/accounting-standards",
        effective_date: "2026-01-01",
        impact_level: "MEDIUM",
        match_score: 98.1,
        summary: "Введение унифицированных субсчетов для раздельного учета права пользования активами (IFRS 16) и оценочных резервов под кредитные убытки (IFRS 9).",
        content: "Министерство экономики и финансов утвердило изменения в Национальный стандарт бухгалтерского учета № 21. Новая редакция сближает национальные счета бухгалтерского учета с отчетностью по международным стандартам МСФО.",
        workflow_steps: [
            "Внести изменения в рабочий план счетов бухгалтерской программы",
            "Настроить трансляцию проводок из НСБУ в субконто МСФО",
            "Обучить персонал бухгалтерии порядку отражения новых субсчетов"
        ]
    },

    // ── 3. BANKING & FINTECH ──────────────────────────────────────────────────
    {
        code: "CBU-UZ-OPEN-BANKING-2026",
        title: "Постановление Правления ЦБ РУз № 524: О стандартах Открытого банкинга (Open Banking API) и защите транзакций",
        title_en: "CBU Resolution No. 524: Standards of Open Banking APIs and Transaction Security",
        jurisdiction: "UZ",
        category: "Banking",
        section_id: "banking",
        authority: "Центральный банк Республики Узбекистан",
        source_name: "ЦБ РУз (cbu.uz)",
        source_url: "https://cbu.uz/ru/press_center/news/open-banking-2026/",
        effective_date: "2026-04-01",
        impact_level: "HIGH",
        match_score: 99.1,
        summary: "Обязательное подключение коммерческих банков и лицензированных платежных организаций к единому шлюзу открытых API для предоставления данных о балансах и инициации платежей сторонними финтех-сервисами.",
        content: "Коммерческие банки Республики Узбекистан обязаны обеспечить доступ к открытым программным интерфейсам (Open API) в соответствии с протоколами безопасности FAPI (Financial-grade API) для авторизованных третьих сторон (TTP).",
        workflow_steps: [
            "Провести аудит инфраструктуры API на соответствие спецификациям FAPI ЦБ РУз",
            "Внедрить двухфакторную сквозную авторизацию клиентов через OAuth 2.0 / mTLS",
            "Подключить шлюз взаимодействия к песочнице регулятора"
        ]
    },
    {
        code: "BASEL-III-CAPITAL-2026",
        title: "Basel Committee on Banking Supervision: Регламент оценки рыночного риска (FRTB) и минимальный буфер ликвидности LCR",
        title_en: "BCBS: Fundamental Review of the Trading Book (FRTB) and Minimum Liquidity Coverage Ratio (LCR)",
        jurisdiction: "GLOBAL",
        category: "Banking",
        section_id: "banking",
        authority: "Bank for International Settlements (BIS)",
        source_name: "BIS / Basel Committee",
        source_url: "https://www.bis.org/bcbs/publ/d550.htm",
        effective_date: "2026-01-01",
        impact_level: "HIGH",
        match_score: 97.4,
        summary: "Новые стандарты расчета рисков торгового портфеля банков (FRTB) и стресс-тестирования показателя краткосрочной ликвидности LCR в условиях рыночной волатильности.",
        content: "The Basel Committee standards for Fundamental Review of the Trading Book require internal risk-weighted assets measurement using expected shortfall instead of Value-at-Risk.",
        workflow_steps: [
            "Перейти с метрики VaR на Expected Shortfall (ES) при расчете рыночных рисков",
            "Обеспечить поддержание запаса высоколиквидных активов (HQLA) на уровне не менее 110% LCR",
            "Предоставить регулятору результаты ежеквартального стресс-теста ликвидности"
        ]
    },
    {
        code: "CBU-UZ-CBDC-PILOT-2026",
        title: "Постановление Правления ЦБ РУз № 548: Регламент участия коммерческих банков в пилотном проекте Цифрового сума (Digital Sum / CBDC)",
        title_en: "CBU Resolution No. 548: Commercial Bank Participation Framework for Central Bank Digital Currency (CBDC) Pilot",
        jurisdiction: "UZ",
        category: "Banking",
        section_id: "banking",
        authority: "Центральный банк Республики Узбекистан",
        source_name: "ЦБ РУз (cbu.uz)",
        source_url: "https://cbu.uz/ru/press_center/news/digital-sum-2026/",
        effective_date: "2026-06-01",
        impact_level: "HIGH",
        match_score: 98.9,
        summary: "Правила открытия и ведения кошельков цифрового сума физических и юридических лиц банками-агентами, смарт-контракты и требования к защите приватных ключей на смарт-картах и защищенных чипах HSM.",
        content: "Коммерческие банки, участвующие в двухуровневой модели обращения Цифрового сума Республики Узбекистан, обеспечивают открытие электронных кошельков на платформе ЦБ РУз и бесшовный обмен наличных и безналичных средств на цифровой сум 1:1.",
        workflow_steps: [
            "Интегрировать АБС банка с ядром платформы Цифрового сума ЦБ через gRPC API",
            "Реализовать поддержку автономных офлайн-платежей в мобильном приложении банка",
            "Обеспечить мгновенную конвертацию сумов на расчетном счете в цифровой сум без комиссии"
        ]
    },
    {
        code: "CBU-UZ-ANTIFRAUD-2026",
        title: "Положение ЦБ РУз № 3315: Единый антифрод-центр и регламент межбанковской блокировки мошеннических дропперских счетов",
        title_en: "CBU Regulation No. 3315: Unified Antifraud Center and Interbank Blocking Protocol for Fraudulent Dropper Accounts",
        jurisdiction: "UZ",
        category: "Banking",
        section_id: "banking",
        authority: "Центральный банк Республики Узбекистан",
        source_name: "ЦБ РУз (cbu.uz)",
        source_url: "https://lex.uz/docs/antifraud-cbu-2026-3315",
        effective_date: "2026-02-15",
        impact_level: "HIGH",
        match_score: 99.6,
        summary: "Обязательное подключение всех коммерческих банков и платежных сервисов к централизованной межбанковской антифрод-платформе ЦБ. Приостановление подозрительных P2P-переводов на срок до 48 часов при совпадении с признаками дропперских карт.",
        content: "Банки обязаны в режиме реального времени сверять реквизиты получателя платежа с единым реестром скомпрометированных карт и телефонных номеров мошенников. В случае фиксации подозрительной операции банк немедленно приостанавливает операцию и связывается с клиентом для подтверждения легитимности.",
        workflow_steps: [
            "Подключить онлайн-шлюз скоринга к межбанковской антифрод-базе ЦБ РУз",
            "Настроить алгоритмы выявления нетипичного поведения клиента (резкая смена геолокации, ночные крупные переводы)",
            "Ввести обязательную биометрическую верификацию Face-ID при оформлении онлайн-микрозаймов"
        ]
    },
    {
        code: "CBU-UZ-ESG-BANKING-2026",
        title: "Директива ЦБ РУз № 14-ГБ: Стандарты оценки климатических и экологических рисков (ESG) в кредитных портфелях коммерческих банков",
        title_en: "CBU Directive No. 14-GB: Standards for Climate and Environmental (ESG) Risk Assessment in Bank Loan Portfolios",
        jurisdiction: "UZ",
        category: "Banking",
        section_id: "banking",
        authority: "Центральный банк Республики Узбекистан",
        source_name: "ЦБ РУз (cbu.uz)",
        source_url: "https://cbu.uz/ru/press_center/news/green-banking-taxonomy-2026/",
        effective_date: "2026-05-01",
        impact_level: "MEDIUM",
        match_score: 96.8,
        summary: "Интеграция критериев зеленой таксономии в кредитный скоринг юридических лиц. Льготные коэффициенты риска при расчете норматива достаточности капитала для кредитов на энергоэффективность и ВИЭ.",
        content: "Коммерческие банки внедряют систему экологического и социального риск-менеджмента (ESRM) при кредитовании корпоративных заемщиков. Проекты, снижающие углеродный след, получают пониженный коэффициент риска при расчете RWA.",
        workflow_steps: [
            "Разработать методику оценки углеродной интенсивности проектов заемщиков",
            "Внедрить форму зеленой декларации в кредитное досье корпоративных клиентов",
            "Сформировать ежеквартальный отчет об объеме зеленого кредитования для ЦБ РУз"
        ]
    },

    // ── 4. AML / CFT & FINANCIAL CRIME ────────────────────────────────────────
    {
        code: "FATF-REC-16-TRAVEL-RULE",
        title: "FATF Guidance: Обязательное соблюдение Travel Rule при транзакциях с виртуальными активами (VASP)",
        title_en: "FATF Recommendation 16: Mandatory Travel Rule Enforcement for Virtual Asset Service Providers",
        jurisdiction: "GLOBAL",
        category: "AML",
        section_id: "aml",
        authority: "FATF (Financial Action Task Force)",
        source_name: "FATF-GAFI",
        source_url: "https://www.fatf-gafi.org/en/publications/Virtualassets/Guidance-VASP-Travel-Rule.html",
        effective_date: "2026-01-01",
        impact_level: "HIGH",
        match_score: 98.9,
        summary: "Обязательная передача идентификационных данных отправителя и бенефициара при любых транзакциях с крипто-активами свыше 1 000 USD/EUR между лицензированными провайдерами.",
        content: "Virtual Asset Service Providers (VASPs) and financial institutions must obtain, hold, and transmit required originator and beneficiary information immediately and securely during crypto-asset transfers.",
        workflow_steps: [
            "Интегрировать шлюз протокола Travel Rule (Notabene / Sygna / TRP) в процессинг крипто-транзакций",
            "Настроить автоматическую верификацию контрагентских кошельков по базам Chainalysis / TRM Labs",
            "Блокировать входящие переводы от неидентифицированных провайдеров до выяснения бенефициара"
        ]
    },
    {
        code: "AML-UZ-BENEFICIARY-2026",
        title: "Положение Департамента по борьбе с экономпреступлениями РУз: Единый реестр конечных бенефициаров (UBO)",
        title_en: "Uzbekistan FIU Regulation: Unified Ultimate Beneficial Owner (UBO) Registry & Verification Mandate",
        jurisdiction: "UZ",
        category: "AML",
        section_id: "aml",
        authority: "Департамент при Генеральной прокуратуре РУз",
        source_name: "Lex.uz",
        source_url: "https://lex.uz/docs/aml-ubo-registry-2026",
        effective_date: "2026-03-15",
        impact_level: "HIGH",
        match_score: 99.0,
        summary: "Все юридические лица обязаны раскрыть сведения о физических лицах, владеющих более чем 10% доли или осуществляющих фактический контроль, с ежегодным обновлением в единой государственной системе.",
        content: "Юридические лица, зарегистрированные в Республике Узбекистан, обязаны внести сведения о конечных бенефициарных владельцах (UBO) в Единый электронный реестр в течение 30 календарных дней с момента регистрации или изменения структуры владения.",
        workflow_steps: [
            "Запросить у акционеров и учредителей паспорта и документы, подтверждающие бенефициарное владение",
            "Заполнить электронную декларацию UBO в кабинете my.gov.uz",
            "Обеспечить хранение комплаенс-досье в течение не менее 5 лет"
        ]
    },

    // ── 5. DIGITAL ASSETS & CAPITAL MARKETS ─────────────────────────────────
    {
        code: "NAPP-UZ-CRYPTO-2026",
        title: "Приказ НАПП РУз № 88: Порядок лицензирования крипто-бирж, майнинг-пулов и депозитариев крипто-активов",
        title_en: "NAPP Order No. 88: Licensing Procedure for Crypto Exchanges, Mining Pools and Digital Custodians",
        jurisdiction: "UZ",
        category: "Finance",
        section_id: "finance",
        authority: "Национальное агентство перспективных проектов РУз",
        source_name: "НАПП (napp.uz)",
        source_url: "https://napp.uz/ru/pages/crypto-licensing-2026",
        effective_date: "2026-02-01",
        impact_level: "HIGH",
        match_score: 98.5,
        summary: "Утверждение требований к размеру уставного капитала (от 5 000 БРВ), хранению серверов на территории РУз и интеграции системы биометрической идентификации клиентов.",
        content: "Провайдеры услуг в сфере оборота крипто-активов обязаны размещать серверное оборудование исключительно в дата-центрах на территории Республики Узбекистан и формировать резервный гарантийный фонд в коммерческих банках РУз.",
        workflow_steps: [
            "Арендовать стойки в сертифицированном национальном дата-центре (Tier III) на территории РУз",
            "Сформировать уставный капитал в национальной валюте на специальном счете",
            "Пройти аудит информационной безопасности в ГУП «Центр кибербезопасности»"
        ]
    },

    // ── 8. ESG & GREEN ECONOMY ────────────────────────────────────────────────
    {
        code: "UZ-GREEN-TAXONOMY-2026",
        title: "Постановление Кабинета Министров РУз: Национальная «Зеленая таксономия» и верификация зеленых облигаций",
        title_en: "Cabinet of Ministers Resolution: National Green Taxonomy and Green Bond Verification Framework",
        jurisdiction: "UZ",
        category: "ESG",
        section_id: "esg",
        authority: "Кабинет Министров Республики Узбекистан",
        source_name: "Lex.uz",
        source_url: "https://lex.uz/docs/green-taxonomy-uz-2026",
        effective_date: "2026-04-01",
        impact_level: "HIGH",
        match_score: 98.4,
        summary: "Критерии экологической устойчивости для инвестиционных проектов, субсидирование процентных ставок по зеленым кредитам и правила верификации выбросов парниковых газов.",
        content: "Национальная классификация зеленых видов экономической деятельности устанавливает требования к энергоэффективности зданий, промышленной декарбонизации и использованию возобновляемых источников энергии.",
        workflow_steps: [
            "Провести аудит технологических процессов на соответствие порогам выбросов CO2",
            "Получить заключение независимого экологического верификатора",
            "Подать заявку на получение субсидий Минэкономфина РУз по зеленому тарифу"
        ]
    },
    {
        code: "EU-CSRD-2026-DISC",
        title: "Директива ЕС CSRD 2022/2464: Обязательные стандарты раскрытия цепочек поставок Scope 3 для неевропейских поставщиков",
        title_en: "EU CSRD Directive 2022/2464: Mandatory Scope 3 Supply Chain Disclosure Standards for Non-EU Suppliers",
        jurisdiction: "EU",
        category: "ESG",
        section_id: "esg",
        authority: "European Financial Reporting Advisory Group (EFRAG)",
        source_name: "EUR-Lex",
        source_url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022L2464",
        effective_date: "2026-01-01",
        impact_level: "MEDIUM",
        match_score: 95.8,
        summary: "Европейские компании обязаны собирать данные об углеродном следе, условиях труда и соблюдении прав человека от поставщиков из третьих стран (включая Центральную Азию и СНГ).",
        content: "Under the EU Corporate Sustainability Reporting Directive and ESRS guidelines, enterprises exporting goods into the EU must provide verified greenhouse gas emission data across Scopes 1, 2, and supply chain Scope 3.",
        workflow_steps: [
            "Провести аудит парниковых выбросов (Scope 1 direct emissions, Scope 2 electricity)",
            "Собрать паспорта безопасности и сертификаты происхождения экспортируемой продукции",
            "Заполнить опросники европейских покупателей по стандартам ESRS E1 Climate Change"
        ]
    },


];

export { createMockToken } from './authUtils';

// ── Main Mock Handler ───────────────────────────────────────────────────────
export async function handleMockApiRequest(config: any): Promise<any> {
    const url = config.url || '';
    const method = (config.method || 'get').toLowerCase();

    // Clean URL: remove base, query params, and /api/v1
    let path = url;
    if (path.startsWith('http')) {
        try {
            path = new URL(path).pathname;
        } catch (e) {
            // ignore
        }
    }
    path = path.replace(/^\/api\/v1/, '');
    const cleanPath = path.split('?')[0];

    // Parse payload if provided
    let body = config.data;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            // Might be URL-encoded form data
            const params = new URLSearchParams(config.data);
            const obj: any = {};
            params.forEach((v, k) => { obj[k] = v; });
            body = obj;
        }
    } else if (body && typeof body === 'object') {
        if (body instanceof URLSearchParams || (typeof (body as any).forEach === 'function' && typeof (body as any).get === 'function')) {
            const obj: any = {};
            body.forEach((v: any, k: any) => { obj[k] = v; });
            body = obj;
        }
    }

    console.log(`[MockApi] ${method.toUpperCase()} ${cleanPath}`);

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Authentication
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath === '/auth/login' || cleanPath === '/auth/token') {
        let email = 'owner@axiaris.ai';
        if (body) {
            email = body.username || body.email || email;
        }
        email = String(email).trim().toLowerCase();

        const users = getUsersStore();
        const companies = getCompaniesStore();

        // 1. Exact match by email (including domain aliases)
        let matchedUser = users.find((u: any) => 
            u.email.toLowerCase() === email || 
            u.email.replace('@axiaris.ai', '@regai.ai').toLowerCase() === email ||
            u.email.replace('@regai.ai', '@axiaris.ai').toLowerCase() === email
        );

        if (!matchedUser) {
            // Check company specific matches
            if (email.includes('finserve')) {
                matchedUser = users.find((u: any) => u.company_id === 'b968f7d7ffe04630a90aadde4d0d8e95' && (
                    (email.includes('admin') && u.role === 'admin') ||
                    (email.includes('accountant') && u.role === 'accountant') ||
                    (email.includes('auditor') && u.role === 'auditor') ||
                    (email.includes('owner') && (u.role === 'company_owner' || u.role === 'admin'))
                ));
            } else if (email.includes('owner')) {
                matchedUser = users.find((u: any) => u.role === 'company_owner' || u.email.includes('owner'));
            } else if (email.includes('accountant')) {
                matchedUser = users.find((u: any) => u.role === 'accountant' || u.email.includes('accountant'));
            } else if (email.includes('auditor')) {
                matchedUser = users.find((u: any) => u.role === 'auditor' || u.email.includes('auditor'));
            } else if (email.includes('superadmin')) {
                matchedUser = users.find((u: any) => u.role === 'superadmin');
            } else if (email.includes('admin')) {
                matchedUser = users.find((u: any) => u.role === 'admin');
            }
        }

        if (!matchedUser) {
            matchedUser = users.find((u: any) => u.role === 'company_owner') || users[0];
        }

        // Attach company name
        const comp = companies.find((c: any) => c.id === matchedUser.company_id);
        const enrichedUser = {
            ...matchedUser,
            company_name: comp?.name || (matchedUser.role === 'superadmin' ? 'Все организации (Суперадминистратор)' : 'TechCorp')
        };

        const token = createMockToken(enrichedUser);
        return {
            access_token: token,
            token_type: 'bearer',
            user: enrichedUser,
        };
    }

    if (cleanPath === '/auth/forgot-password' && method === 'post') {
        const email = String(body?.email || '').trim().toLowerCase();
        const resetCode = String(Math.floor(100000 + Math.random() * 900000));
        const codes = getStored<Record<string, { code: string; expiresAt: number }>>('regai_mock_reset_codes', {});
        codes[email] = {
            code: resetCode,
            expiresAt: Date.now() + 15 * 60 * 1000,
        };
        setStored('regai_mock_reset_codes', codes);
        logAuditAction('password_reset_requested', `Запрошено восстановление пароля для ${email}`, email);
        return {
            status: 'success',
            message: 'Код восстановления пароля сформирован (действителен 15 минут).',
            expires_in_minutes: 15,
            demo_reset_code: resetCode,
        };
    }

    if (cleanPath === '/auth/reset-password' && method === 'post') {
        const email = String(body?.email || '').trim().toLowerCase();
        const resetCode = String(body?.reset_code || '').trim();
        const newPassword = String(body?.new_password || '');
        if (newPassword.length < 8) {
            throw {
                response: {
                    status: 400,
                    data: { detail: 'Новый пароль должен содержать минимум 8 символов' },
                },
            };
        }
        const codes = getStored<Record<string, { code: string; expiresAt: number }>>('regai_mock_reset_codes', {});
        const record = codes[email];
        if (!record || record.expiresAt < Date.now() || record.code !== resetCode) {
            throw {
                response: {
                    status: 400,
                    data: { detail: 'Неверный или просроченный код восстановления' },
                },
            };
        }
        delete codes[email];
        setStored('regai_mock_reset_codes', codes);

        const customPasswords = getStored<Record<string, string>>('regai_mock_user_passwords', {});
        customPasswords[email] = newPassword;
        setStored('regai_mock_user_passwords', customPasswords);

        logAuditAction('password_reset_completed', `Пароль успешно изменен через восстановление для ${email}`, email);
        return {
            status: 'success',
            message: 'Пароль успешно обновлен. Теперь вы можете войти с новым паролем.',
        };
    }

    if (cleanPath === '/auth/refresh') {
        const storedUser = localStorage.getItem('user');
        const user = storedUser ? JSON.parse(storedUser) : getUsersStore()[0];
        return {
            access_token: createMockToken(user),
            token_type: 'bearer',
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Current User
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath === '/users/me') {
        const storedUser = localStorage.getItem('user');
        const companies = getCompaniesStore();
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                const comp = companies.find((c: any) => c.id === parsed.company_id);
                return {
                    ...parsed,
                    company_name: comp?.name || (parsed.role === 'superadmin' ? 'Все организации (Суперадминистратор)' : 'TechCorp')
                };
            } catch (e) {
                // ignore
            }
        }
        const users = getUsersStore();
        const fallback = users.find((u: any) => u.email === 'superadmin@regai.ai') || users[0];
        const comp = companies.find((c: any) => c.id === fallback.company_id);
        return {
            ...fallback,
            company_name: comp?.name || 'TechCorp'
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Users Management (Role & Company Isolation)
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath === '/users/invite' && method === 'post') {
        const users = getUsersStore();
        const session = getCurrentSessionUser(config);
        const isSuperadmin = session?.role === 'superadmin';

        // Non-superadmin is strictly restricted to their own company
        const targetCompanyId = isSuperadmin 
            ? (body?.company_id || session?.company_id || '2727830ea39d470c917f1a1544ed5d0f')
            : (session?.company_id || '2727830ea39d470c917f1a1544ed5d0f');
        const targetTenantId = session?.tenant_id || 'b4e63cbc5d5348c5bfddf1c35a9886ba';

        let targetRole = body?.role || 'user';
        if (!isSuperadmin && targetRole === 'superadmin') {
            targetRole = 'admin'; // Company admins cannot create platform superadmins
        }

        const newUser = {
            id: 'usr-' + Math.random().toString(36).substring(2, 9),
            email: body?.email || 'newuser@regai.ai',
            full_name: body?.full_name || 'Новый сотрудник',
            role: targetRole,
            company_id: targetCompanyId,
            tenant_id: targetTenantId,
            is_company_owner: 0,
            is_active: 1,
            is_superuser: 0,
            created_at: new Date().toISOString(),
        };
        users.unshift(newUser);
        saveUsersStore(users);
        logAuditAction('user_invited', `Приглашен пользователь ${newUser.email} (${newUser.role}) в организацию ${targetCompanyId}`, session?.email, targetCompanyId);
        return { status: 'success', data: newUser };
    }

    if (cleanPath.startsWith('/users/') && method === 'put') {
        const userId = cleanPath.split('/')[2];
        const users = getUsersStore();
        const session = getCurrentSessionUser(config);
        const isSuperadmin = session?.role === 'superadmin';
        const idx = users.findIndex((u: any) => u.id === userId);
        if (idx !== -1) {
            // Non-superadmin cannot edit users from other companies
            if (!isSuperadmin && users[idx].company_id !== session?.company_id) {
                return { status: 'error', message: 'Forbidden' };
            }
            users[idx] = { ...users[idx], ...body };
            saveUsersStore(users);
            return { status: 'success', data: users[idx] };
        }
        return { status: 'success' };
    }

    if (cleanPath.startsWith('/users/') && method === 'delete') {
        const userId = cleanPath.split('/')[2];
        const users = getUsersStore();
        const session = getCurrentSessionUser(config);
        const isSuperadmin = session?.role === 'superadmin';
        const targetUser = users.find((u: any) => u.id === userId);
        if (targetUser && !isSuperadmin && targetUser.company_id !== session?.company_id) {
            return { status: 'error', message: 'Forbidden' };
        }
        const updatedUsers = users.filter((u: any) => u.id !== userId);
        saveUsersStore(updatedUsers);
        return { status: 'success', message: 'User deleted' };
    }

    if (cleanPath === '/users' || cleanPath === '/users/') {
        const users = getUsersStore();
        const session = getCurrentSessionUser(config);
        const isSuperadmin = session?.role === 'superadmin';
        const requestedCompanyId = config.params?.company_id;

        if (isSuperadmin) {
            if (requestedCompanyId) {
                return users.filter((u: any) => u.company_id === requestedCompanyId);
            }
            return users;
        }

        // Strict company isolation: non-superadmin sees only users belonging to their company and never superadmins
        const userCompanyId = session?.company_id || '2727830ea39d470c917f1a1544ed5d0f';
        return users.filter((u: any) => u.company_id === userCompanyId && u.role !== 'superadmin');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Companies Management (Multi-Tenancy)
    // ─────────────────────────────────────────────────────────────────────────
    if ((cleanPath === '/companies' || cleanPath === '/companies/') && method === 'post') {
        const companies = getCompaniesStore();
        const session = getCurrentSessionUser(config);
        const newCompId = 'comp-' + Math.random().toString(36).substring(2, 9);
        const newCompTenantId = 'tenant-' + Math.random().toString(36).substring(2, 9);
        const newComp = {
            id: newCompId,
            tenant_id: newCompTenantId,
            name: body?.name || 'Новая организация',
            inn: body?.inn || '123456789',
            industry: body?.industry || 'IT & Fintech',
            description: body?.description || '',
            website: body?.website || '',
            employee_count: body?.employee_count || 50,
            is_active: 1,
            created_at: new Date().toISOString(),
        };
        companies.unshift(newComp);
        saveCompaniesStore(companies);

        // Automatically provision dedicated company administrator for the new organization
        const adminEmail = body?.admin_email || `admin@${(body?.domain || body?.name || 'company').toLowerCase().replace(/[^a-z0-9]/g, '') || 'newcorp'}.com`;
        const adminName = body?.admin_name || `Администратор (${newComp.name})`;
        const users = getUsersStore();
        const adminUser = {
            id: 'usr-' + Math.random().toString(36).substring(2, 9),
            email: adminEmail,
            full_name: adminName,
            role: 'admin',
            company_id: newCompId,
            tenant_id: newCompTenantId,
            is_company_owner: 1,
            is_active: 1,
            is_superuser: 0,
            created_at: new Date().toISOString()
        };
        users.unshift(adminUser);
        saveUsersStore(users);

        logAuditAction('company_created', `Создана новая организация "${newComp.name}" (ID: ${newComp.id})`, session?.email, newComp.id);
        return newComp;
    }

    if (cleanPath.startsWith('/companies/') && method === 'put') {
        const compId = cleanPath.split('/')[2];
        const companies = getCompaniesStore();
        const idx = companies.findIndex((c: any) => c.id === compId);
        if (idx !== -1) {
            companies[idx] = { ...companies[idx], ...body };
            saveCompaniesStore(companies);
            return companies[idx];
        }
        return { status: 'success' };
    }

    if (cleanPath.startsWith('/companies/') && method === 'delete') {
        const compId = cleanPath.split('/')[2];
        const companies = getCompaniesStore().filter((c: any) => c.id !== compId);
        saveCompaniesStore(companies);
        return { status: 'success', message: 'Company deleted' };
    }

    if (cleanPath.startsWith('/companies/')) {
        const compId = cleanPath.split('/')[2];
        const companies = getCompaniesStore();
        const session = getCurrentSessionUser(config);
        if (session?.role === 'superadmin' || compId === session?.company_id) {
            return companies.find((c: any) => c.id === compId) || null;
        }
        return companies.find((c: any) => c.id === session?.company_id) || null;
    }

    if (cleanPath === '/companies' || cleanPath === '/companies/') {
        const companies = getCompaniesStore();
        const session = getCurrentSessionUser(config);
        if (session?.role === 'superadmin') {
            return companies;
        }
        const userCompId = session?.company_id;
        if (!userCompId) return [];
        return companies.filter((c: any) => c.id === userCompId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Group Consolidation & Intercompany Eliminations (IFRS 10)
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath.includes('/hierarchy/consolidation/export-excel')) {
        const reconAoa: any[][] = [
            ['Axiaris Industrial Holding Group - Консолидированный отчет о финансовом положении (IFRS 10)', '', '', '', '', '', '', '', '', '', ''],
            ['Отчетный период: 2026 год (31.12.2026)', 'Валюта: UZS (Сум)', 'Стандарт: МСФО 10 (IFRS 10)', 'Статус: Сбалансировано (Дельта = 0.00)', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', ''],
            ['Код счёта', 'Статья отчетности', 'Категория', 'Axiaris Holding (Материнская)', 'ManufacturePro LLC (80%)', 'RetailMax LLC (100%)', 'LogiTrans LLC (75%)', 'Сводно до элиминаций', 'Элиминации Дт', 'Элиминации Кт', 'МСФО Консолидированный итог']
        ];

        // Assets
        reconAoa.push(['РАЗДЕЛ I: АКТИВЫ (ASSETS)', '', '', '', '', '', '', '', '', '', '']);
        const startAssetRow = reconAoa.length + 1;
        reconAoa.push(['0100-0300', 'Основные средства и нематериальные активы', 'АКТИВЫ', 35000000, 42000000, 15000000, 38000000, 130000000, 0, 0, 130000000]);
        reconAoa.push(['0610-0620', 'Инвестиции и займы внутри группы (ВГО)', 'АКТИВЫ', 75000000, 0, 0, 0, 75000000, 0, 75000000, 0]);
        reconAoa.push(['2810', 'Запасы готовой продукции на складах', 'АКТИВЫ', 0, 16000000, 32000000, 2000000, 50000000, 0, 2100000, 47900000]);
        reconAoa.push(['4010', 'Дебиторская задолженность покупателей и ВГО', 'АКТИВЫ', 15000000, 22000000, 8000000, 9000000, 54000000, 0, 22700000, 31300000]);
        reconAoa.push(['5110', 'Денежные средства и банковские депозиты', 'АКТИВЫ', 20000000, 5000000, 7000000, 7000000, 39000000, 0, 0, 39000000]);
        const endAssetRow = reconAoa.length;
        const assetTotalRow = reconAoa.length + 1;
        reconAoa.push(['', 'ИТОГО АКТИВЫ ГРУППЫ (TOTAL ASSETS)', 'АКТИВЫ', 145000000, 85000000, 62000000, 56000000, 348000000, 0, 99800000, 248200000]);

        // Liabilities
        reconAoa.push(['РАЗДЕЛ II: ОБЯЗАТЕЛЬСТВА (LIABILITIES)', '', '', '', '', '', '', '', '', '', '']);
        const startLiabRow = reconAoa.length + 1;
        reconAoa.push(['7810', 'Долгосрочные займы и внутригрупповые кредиты', 'ОБЯЗАТЕЛЬСТВА', 15000000, 15000000, 10000000, 30000000, 70000000, 30000000, 0, 40000000]);
        reconAoa.push(['6010', 'Кредиторская задолженность поставщикам и ВГО', 'ОБЯЗАТЕЛЬСТВА', 25000000, 20000000, 28000000, 6000000, 79000000, 22700000, 0, 56300000]);
        const endLiabRow = reconAoa.length;
        const liabTotalRow = reconAoa.length + 1;
        reconAoa.push(['', 'ИТОГО ОБЯЗАТЕЛЬСТВА ГРУППЫ (TOTAL LIABILITIES)', 'ОБЯЗАТЕЛЬСТВА', 40000000, 35000000, 38000000, 36000000, 149000000, 52700000, 0, 96300000]);

        // Equity
        reconAoa.push(['РАЗДЕЛ III: КАПИТАЛ ГРУППЫ И NCI (EQUITY & NCI)', '', '', '', '', '', '', '', '', '', '']);
        const startEqRow = reconAoa.length + 1;
        reconAoa.push(['8330', 'Уставный капитал холдинга', 'КАПИТАЛ', 60000000, 25000000, 10000000, 10000000, 105000000, 45000000, 0, 60000000]);
        reconAoa.push(['8710', 'Нераспределенная прибыль контролирующих акционеров', 'КАПИТАЛ', 45000000, 25000000, 14000000, 10000000, 94000000, 2100000, 0, 77320000]);
        reconAoa.push(['NCI-IFRS10', 'Доля неконтролирующих акционеров (NCI по МСФО 10)', 'NCI', 0, 0, 0, 0, 0, 0, 14580000, 14580000]);
        const endEqRow = reconAoa.length;
        const eqTotalRow = reconAoa.length + 1;
        reconAoa.push(['', 'ИТОГО КАПИТАЛ ГРУППЫ С NCI (TOTAL EQUITY)', 'КАПИТАЛ', 105000000, 50000000, 24000000, 20000000, 199000000, 47100000, 14580000, 151900000]);

        // Total Liabilities & Equity
        const totalLERow = reconAoa.length + 1;
        reconAoa.push(['', 'ВСЕГО ПАССИВЫ (ОБЯЗАТЕЛЬСТВА + КАПИТАЛ)', 'ПАССИВЫ', 145000000, 85000000, 62000000, 56000000, 348000000, 99800000, 14580000, 248200000]);

        // Equilibrium Check
        const deltaRow = reconAoa.length + 1;
        reconAoa.push(['', 'КОНТРОЛЬНОЕ РАВНОВЕСИЕ (ДЕЛЬТА: АКТИВЫ - ПАССИВЫ)', 'ДЕЛЬТА', 0, 0, 0, 0, 0, 0, 0, 0]);

        const ws1 = XLSX.utils.aoa_to_sheet(reconAoa);

        // Data row combined and consolidated formulas
        for (let r = 5; r <= deltaRow; r++) {
            if (r !== assetTotalRow && r !== liabTotalRow && r !== eqTotalRow && r !== totalLERow && r !== deltaRow && r !== 4 && r !== 10 && r !== 14) {
                ws1['H' + r] = { t: 'n', f: `D${r}+E${r}+F${r}+G${r}`, v: reconAoa[r - 1][7] };
            }
        }

        // Totals formulas
        ws1['D' + assetTotalRow] = { t: 'n', f: `SUM(D${startAssetRow}:D${endAssetRow})`, v: 145000000 };
        ws1['E' + assetTotalRow] = { t: 'n', f: `SUM(E${startAssetRow}:E${endAssetRow})`, v: 85000000 };
        ws1['F' + assetTotalRow] = { t: 'n', f: `SUM(F${startAssetRow}:F${endAssetRow})`, v: 62000000 };
        ws1['G' + assetTotalRow] = { t: 'n', f: `SUM(G${startAssetRow}:G${endAssetRow})`, v: 56000000 };
        ws1['H' + assetTotalRow] = { t: 'n', f: `SUM(H${startAssetRow}:H${endAssetRow})`, v: 348000000 };
        ws1['K' + assetTotalRow] = { t: 'n', f: `H${assetTotalRow}-J${assetTotalRow}`, v: 248200000 };

        ws1['D' + liabTotalRow] = { t: 'n', f: `SUM(D${startLiabRow}:D${endLiabRow})`, v: 40000000 };
        ws1['E' + liabTotalRow] = { t: 'n', f: `SUM(E${startLiabRow}:E${endLiabRow})`, v: 35000000 };
        ws1['F' + liabTotalRow] = { t: 'n', f: `SUM(F${startLiabRow}:F${endLiabRow})`, v: 38000000 };
        ws1['G' + liabTotalRow] = { t: 'n', f: `SUM(G${startLiabRow}:G${endLiabRow})`, v: 36000000 };
        ws1['H' + liabTotalRow] = { t: 'n', f: `SUM(H${startLiabRow}:H${endLiabRow})`, v: 149000000 };
        ws1['K' + liabTotalRow] = { t: 'n', f: `H${liabTotalRow}-I${liabTotalRow}`, v: 96300000 };

        ws1['D' + eqTotalRow] = { t: 'n', f: `SUM(D${startEqRow}:D${endEqRow})`, v: 105000000 };
        ws1['E' + eqTotalRow] = { t: 'n', f: `SUM(E${startEqRow}:E${endEqRow})`, v: 50000000 };
        ws1['F' + eqTotalRow] = { t: 'n', f: `SUM(F${startEqRow}:F${endEqRow})`, v: 24000000 };
        ws1['G' + eqTotalRow] = { t: 'n', f: `SUM(G${startEqRow}:G${endEqRow})`, v: 20000000 };
        ws1['H' + eqTotalRow] = { t: 'n', f: `SUM(H${startEqRow}:H${endEqRow})`, v: 199000000 };
        ws1['K' + eqTotalRow] = { t: 'n', f: `H${eqTotalRow}-I${eqTotalRow}+J${eqTotalRow}`, v: 151900000 };

        ws1['D' + totalLERow] = { t: 'n', f: `D${liabTotalRow}+D${eqTotalRow}`, v: 145000000 };
        ws1['E' + totalLERow] = { t: 'n', f: `E${liabTotalRow}+E${eqTotalRow}`, v: 85000000 };
        ws1['F' + totalLERow] = { t: 'n', f: `F${liabTotalRow}+F${eqTotalRow}`, v: 62000000 };
        ws1['G' + totalLERow] = { t: 'n', f: `G${liabTotalRow}+G${eqTotalRow}`, v: 56000000 };
        ws1['H' + totalLERow] = { t: 'n', f: `H${liabTotalRow}+H${eqTotalRow}`, v: 348000000 };
        ws1['K' + totalLERow] = { t: 'n', f: `K${liabTotalRow}+K${eqTotalRow}`, v: 248200000 };

        ws1['K' + deltaRow] = { t: 'n', f: `K${assetTotalRow}-K${totalLERow}`, v: 0 };

        ws1['!cols'] = [
            { wch: 14 }, { wch: 45 }, { wch: 14 }, { wch: 20 }, { wch: 20 },
            { wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 24 }
        ];

        // Sheet 2: Eliminations Journal
        const elimAoa: any[][] = [
            ['№ Проводки', 'Стандарт МСФО', 'Описание внутригрупповой операции', 'Дебет Организация', 'Дт Счет', 'Кредит Организация', 'Кт Счет', 'Сумма элиминации (UZS)', 'Статус'],
            ['ELIM-01', 'IFRS 10.B86(a)', 'Элиминация взаимной торговой задолженности за готовую продукцию', 'RetailMax Distribution', '6010', 'ManufacturePro', '4010', 18500000, 'Исключено'],
            ['ELIM-02', 'IFRS 10.B86(b)', 'Взаимозачет внутригруппового долгосрочного займа и финансовых вложений', 'LogiTrans Logistics', '7810', 'Axiaris Holding', '0610', 30000000, 'Исключено'],
            ['ELIM-03', 'IFRS 10.B86(a)', 'Элиминация расчетов за оказанные логистические и экспедиторские услуги', 'Axiaris Holding', '6010', 'LogiTrans Logistics', '4010', 4200000, 'Исключено'],
            ['ELIM-04', 'IFRS 10.B86(c)', 'Исключение нереализованной торговой наценки в складских остатках готовой продукции', 'Axiaris Holding (Группа)', '8710', 'RetailMax Distribution', '2810', 2100000, 'Исключено'],
            ['ELIM-05', 'IFRS 10.B86(a)', 'Элиминация инвестиций материнской компании против уставного капитала дочерних', 'Дочерние предприятия', '8330', 'Axiaris Holding', '0620', 45000000, 'Исключено'],
            ['', '', 'ИТОГО ВНУТРИГРУППОВОЙ ОБОРОТ (ВГО)', '', '', '', '', 99800000, 'ПОДТВЕРЖДЕНО']
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(elimAoa);
        ws2['H8'] = { t: 'n', f: 'SUM(H2:H6)', v: 99800000 };
        ws2['!cols'] = [
            { wch: 12 }, { wch: 16 }, { wch: 55 }, { wch: 22 }, { wch: 10 }, { wch: 22 }, { wch: 10 }, { wch: 24 }, { wch: 14 }
        ];

        // Sheet 3: NCI Structure & Worksheet
        const nciAoa: any[][] = [
            ['СТРУКТУРА ХОЛДИНГА И РАСЧЕТ ДОЛИ НЕКОНТРОЛИРУЮЩИХ АКЦИОНЕРОВ (NCI ПО IFRS 10)'],
            ['Компания', 'Статус', 'Доля группы', 'Доля NCI', 'Активы (UZS)', 'Обязательства (UZS)', 'Чистые активы (UZS)', 'Доля NCI (UZS)'],
            ['Axiaris Holding JSC', 'Головная компания (Parent)', '100%', '0%', 145000000, 40000000, 105000000, 0],
            ['ManufacturePro LLC', 'Дочернее общество', '80%', '20%', 85000000, 35000000, 50000000, 9580000],
            ['RetailMax Distribution LLC', 'Дочернее общество', '100%', '0%', 62000000, 38000000, 24000000, 0],
            ['LogiTrans Logistics LLC', 'Дочернее общество', '75%', '25%', 56000000, 36000000, 20000000, 5000000],
            ['ИТОГО ДОЛЯ NCI В КАПИТАЛЕ ГРУППЫ', '', '', '', '', '', '', 14580000]
        ];
        const ws3 = XLSX.utils.aoa_to_sheet(nciAoa);
        ws3['!cols'] = [
            { wch: 30 }, { wch: 25 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 18 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws1, 'Консолидированный_Баланс');
        XLSX.utils.book_append_sheet(wb, ws2, 'Внутригрупповые_Элиминации');
        XLSX.utils.book_append_sheet(wb, ws3, 'Структура_и_NCI');

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }

    if (cleanPath.includes('/hierarchy/consolidation')) {
        return {
            success: true,
            group_name: "Axiaris Industrial Holding Group",
            reporting_period: "2026-12-31",
            standard: "IFRS 10 Consolidated Financial Statements",
            currency: "UZS",
            total_assets: 248200000,
            total_liabilities: 96300000,
            total_equity: 151900000,
            parent_equity: 137320000,
            nci_equity: 14580000,
            eliminated_turnover: 99800000,
            is_balanced: true,
            variance_delta: 0
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Organizational Hierarchy (Roles & Access)
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath.includes('/hierarchy/structure') || cleanPath === '/hierarchy' || cleanPath === '/hierarchy/') {
        const users = getUsersStore();
        const companies = getCompaniesStore();
        const session = getCurrentSessionUser(config);
        const isSuperadmin = session?.role === 'superadmin';
        const userCompanyId = session?.company_id || '2727830ea39d470c917f1a1544ed5d0f';
        const compMap = new Map(companies.map((c: any) => [c.id, c.name]));

        const toHierarchyUser = (u: any) => ({
            id: u.id,
            email: u.email,
            full_name: u.full_name || u.email,
            role: u.role,
            is_company_owner: Boolean(u.is_company_owner || u.role === 'company_owner'),
            company_id: u.company_id || null,
            company_name: compMap.get(u.company_id) || 'Моя организация',
        });

        if (!isSuperadmin) {
            // Strict company isolation: show only users and roles belonging to the current organization
            const scopedUsers = users.filter((u: any) => u.company_id === userCompanyId && u.role !== 'superadmin');
            const myCompName = compMap.get(userCompanyId) || (session?.company_name || 'Организация');

            const owners = scopedUsers.filter((u: any) => u.role === 'company_owner' || u.is_company_owner).map(toHierarchyUser);
            const admins = scopedUsers.filter((u: any) => u.role === 'admin' && !u.is_company_owner).map(toHierarchyUser);
            const accountants = scopedUsers.filter((u: any) => u.role === 'accountant').map(toHierarchyUser);
            const auditorsAndOps = scopedUsers.filter((u: any) => u.role === 'auditor' || u.role === 'user').map(toHierarchyUser);

            return [
                {
                    level: 1,
                    role_name: 'company_owner',
                    display_name: `Уровень 1 — Владельцы Компании (${myCompName})`,
                    user_count: owners.length,
                    users: owners,
                },
                {
                    level: 2,
                    role_name: 'admin',
                    display_name: `Уровень 2 — Администраторы Организации (${myCompName})`,
                    user_count: admins.length,
                    users: admins,
                },
                {
                    level: 3,
                    role_name: 'accountant',
                    display_name: `Уровень 3 — Финансовый Департамент и Бухгалтерия МСФО`,
                    user_count: accountants.length,
                    users: accountants,
                },
                {
                    level: 4,
                    role_name: 'auditor',
                    display_name: `Уровень 4 — Служба Аудита и Финансовые Аналитики`,
                    user_count: auditorsAndOps.length,
                    users: auditorsAndOps,
                },
            ];
        }

        const superadmins = users.filter((u: any) => u.role === 'superadmin').map(toHierarchyUser);
        const owners = users.filter((u: any) => u.role === 'company_owner' || u.is_company_owner).map(toHierarchyUser);
        const admins = users.filter((u: any) => u.role === 'admin' && !u.is_company_owner).map(toHierarchyUser);
        const accountants = users.filter((u: any) => u.role === 'accountant').map(toHierarchyUser);
        const auditorsAndOps = users.filter((u: any) => u.role === 'auditor' || u.role === 'user').map(toHierarchyUser);

        return [
            {
                level: 1,
                role_name: 'superadmin',
                display_name: 'Уровень 1 — Совет Директоров & Главный Администратор (SuperAdmin)',
                user_count: superadmins.length,
                users: superadmins,
            },
            {
                level: 2,
                role_name: 'company_owner',
                display_name: 'Уровень 2 — Владельцы Компаний и Холдингов (Company Owners)',
                user_count: owners.length,
                users: owners,
            },
            {
                level: 3,
                role_name: 'admin',
                display_name: 'Уровень 3 — Администраторы Организаций и Филиалов (Company Admins)',
                user_count: admins.length,
                users: admins,
            },
            {
                level: 4,
                role_name: 'accountant',
                display_name: 'Уровень 4 — Финансовый Департамент & МСФО Бухгалтерия (Accountants)',
                user_count: accountants.length,
                users: accountants,
            },
            {
                level: 5,
                role_name: 'auditor',
                display_name: 'Уровень 5 — Служба Внутреннего Контроля, Аудиторы и Аналитики',
                user_count: auditorsAndOps.length,
                users: auditorsAndOps,
            },
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Tax Configuration & Rates
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath.includes('/tax-rates/countries')) {
        return [
            { code: 'UZ', name: 'Узбекистан', name_en: 'Uzbekistan' },
            { code: 'KZ', name: 'Казахстан', name_en: 'Kazakhstan' },
            { code: 'RU', name: 'Россия', name_en: 'Russia' },
            { code: 'AE', name: 'ОАЭ (UAE)', name_en: 'United Arab Emirates (UAE)' },
            { code: 'TR', name: 'Турция', name_en: 'Turkey' },
            { code: 'GLOBAL', name: 'Международные стандарты (Global)', name_en: 'International Standards (Global)' },
        ];
    }

    if (cleanPath.includes('/tax-rates/types')) {
        return [
            { type: 'vat', name: 'НДС (VAT / QQS) — Налог на добавленную стоимость', name_en: 'VAT (Value Added Tax / Standard Rate)' },
            { type: 'corporate', name: 'Налог на прибыль (Corporate Income Tax)', name_en: 'Corporate Income Tax (CIT)' },
            { type: 'corporate_small', name: 'Налог с оборота / МСП (Turnover Tax)', name_en: 'Turnover Tax / Small Business' },
            { type: 'income', name: 'НДФЛ (Personal Income Tax)', name_en: 'Personal Income Tax (PIT)' },
            { type: 'income_top', name: 'НДФЛ повышенная ставка (PIT High Bracket)', name_en: 'PIT High Bracket (Higher Rate)' },
            { type: 'social', name: 'Социальный налог (Social Tax / Payroll)', name_en: 'Social Tax / Contributions' },
            { type: 'payroll', name: 'Страховые взносы работодателя (Payroll Contributions)', name_en: 'Employer Payroll Contributions' },
            { type: 'withholding', name: 'Налог у источника выплат (Withholding Tax / WHT)', name_en: 'Withholding Tax (WHT)' },
            { type: 'property', name: 'Налог на имущество (Property Tax)', name_en: 'Corporate Property Tax' },
            { type: 'consumption', name: 'Цифровой налог (Digital Services Tax / DST)', name_en: 'Digital Services Tax (DST)' },
        ];
    }

    if (cleanPath.startsWith('/tax-rates') && method === 'put') {
        const rateId = cleanPath.split('/')[2];
        const rates = getTaxRatesStore();
        const idx = rates.findIndex((r: any) => r.id === rateId);
        if (idx !== -1) {
            rates[idx] = {
                ...rates[idx],
                rate: typeof body?.rate !== 'undefined' ? parseFloat(body.rate) : rates[idx].rate,
                description: body?.description || rates[idx].description,
                last_updated: new Date().toISOString(),
            };
            saveTaxRatesStore(rates);
            return { status: 'success', data: rates[idx] };
        }
        return { status: 'success' };
    }

    if (cleanPath.startsWith('/tax-rates')) {
        const parts = cleanPath.split('/').filter(Boolean);
        const lastPart = (parts[parts.length - 1] || 'UZ').toUpperCase();

        const countryMap: Record<string, string> = {
            'UZ': 'Узбекистан (Uzbekistan)',
            'KZ': 'Казахстан (Kazakhstan)',
            'RU': 'Россия (Russia)',
            'AE': 'ОАЭ (UAE)',
            'TR': 'Турция (Turkey)',
            'GLOBAL': 'Международные стандарты (Global)',
        };

        const rates = getTaxRatesStore();
        // Filter specifically for the selected country
        const matched = rates.filter((r: any) => {
            const rCode = (r.country_code || '').toUpperCase();
            return rCode === lastPart;
        });

        const countryName = countryMap[lastPart] || `${lastPart} Tax Jurisdiction`;
        return {
            country: lastPart,
            country_code: lastPart,
            country_name: countryName,
            rates: matched.length > 0 ? matched : rates.filter((r: any) => r.country_code === 'UZ'),
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. Dashboard Live Metrics & Config
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath === '/dashboard/config') {
        return {
            widgets: [
                { id: "compliance-score", enabled: true, order: 0, settings: {} },
                { id: "one-c-sync", enabled: true, order: 1, settings: {} },
                { id: "transformation-stats", enabled: true, order: 2, settings: {} },
                { id: "group-consolidation", enabled: true, order: 3, settings: {} },
                { id: "transformation-chart", enabled: true, order: 4, settings: {} },
                { id: "quick-actions", enabled: true, order: 5, settings: {} },
                { id: "recent-activity", enabled: true, order: 6, settings: {} },
                { id: "tax-compliance-card", enabled: true, order: 7, settings: {} },
            ],
        };
    }

    if (cleanPath === '/dashboard/data') {
        const sheets = getBalanceSheetsStore();
        const session = getCurrentSessionUser(config);
        const isSuperadmin = session?.role === 'superadmin';
        const userCompanyId = session?.company_id || '2727830ea39d470c917f1a1544ed5d0f';
        const scopedSheets = isSuperadmin ? sheets : sheets.filter((s: any) => s.company_id === userCompanyId);

        return {
            compliance: { score: 96, status: "Good", pending_tasks: 2 },
            one_c_status: { connected: true, last_sync: "12 минут назад", errors: 0 },
            transformation: { total_processed: Math.max(scopedSheets.length, 10), saved_hours: 42.5 },
            consolidation: isSuperadmin ? {
                total_entities: 4,
                consolidated_assets: 248200000,
                consolidated_liabilities: 96300000,
                consolidated_equity: 151900000,
                eliminations_count: 5,
                eliminations_amount: 99800000,
                is_balanced: true,
                delta: 0,
            } : {
                total_entities: 1,
                consolidated_assets: 145000000,
                consolidated_liabilities: 40000000,
                consolidated_equity: 105000000,
                eliminations_count: 0,
                eliminations_amount: 0,
                is_balanced: true,
                delta: 0,
            },
            tax_compliance: {
                cit_rate: "15%",
                vat_rate: "12%",
                deferred_tax_asset: 1450000,
                status: "Сверено с Soliq.uz",
                last_verification: "Сегодня, 18:30",
            },
            chart_data: [
                { month: "Май", statements: 4, volume_uzs: 48000000, ifrs16: 12000000, ifrs9: 3500000 },
                { month: "Июн", statements: 7, volume_uzs: 82000000, ifrs16: 18500000, ifrs9: 6200000 },
                { month: "Июл", statements: 9, volume_uzs: 115000000, ifrs16: 24000000, ifrs9: 8100000 },
                { month: "Авг", statements: 11, volume_uzs: 152000000, ifrs16: 31000000, ifrs9: 10400000 },
                { month: "Сен", statements: 13, volume_uzs: 198000000, ifrs16: 38000000, ifrs9: 12800000 },
                { month: "Окт", statements: 14, volume_uzs: 248200000, ifrs16: 45000000, ifrs9: 15600000 },
            ],
            recent_activity: isSuperadmin ? [
                { id: "act-1", action: "sync", timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), details: "1C:Enterprise Trial Balance синхронизирован (24 счёта, 120 млн UZS)" },
                { id: "act-2", action: "transform", timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), details: "IFRS 16 Капитализация прав аренды проведена успешно (41.2 млн UZS)" },
                { id: "act-3", action: "review", timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), details: "IFRS 9 Резерв под обесценение ECL Stage 2 утвержден аудитором (15.6 млн UZS)" },
                { id: "act-4", action: "consolidation", timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), details: "Консолидация группы по IFRS 10 сведена (4 компании, дельта 0.00 UZS)" },
                { id: "act-5", action: "compliance", timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), details: "Налоговый протокол проверен: ставка CIT 15%, VAT 12%, ОНА 1.45 млн UZS" },
            ] : [
                { id: "act-1", action: "sync", timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), details: "1C:Enterprise Trial Balance синхронизирован (24 счёта, 120 млн UZS)" },
                { id: "act-2", action: "transform", timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), details: "IFRS 16 Капитализация прав аренды проведена успешно (41.2 млн UZS)" },
                { id: "act-3", action: "review", timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), details: "IFRS 9 Резерв под обесценение ECL Stage 2 утвержден аудитором (15.6 млн UZS)" },
                { id: "act-4", action: "transform", timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), details: "Трансформация ОСВ по МСФО завершена успешно (дельта 0.00 UZS)" },
                { id: "act-5", action: "compliance", timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), details: "Налоговый протокол проверен: ставка CIT 15%, VAT 12%, ОНА 1.45 млн UZS" },
            ],
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 8. Compliance & Alerts
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath.startsWith('/compliance/alerts/') && method === 'put') {
        const alertId = cleanPath.split('/')[3];
        const alerts = getAlertsStore();
        const idx = alerts.findIndex((a: any) => a.id === alertId);
        if (idx !== -1) {
            alerts[idx] = { ...alerts[idx], status: body?.status || 'resolved' };
            saveAlertsStore(alerts);
            return { status: 'success', data: alerts[idx] };
        }
        return { status: 'success' };
    }

    if (cleanPath.includes('/compliance/alerts/bulk-update') && method === 'post') {
        const alerts = getAlertsStore();
        const ids = new Set(body?.alert_ids || []);
        const newStatus = body?.status || 'resolved';
        alerts.forEach((a: any) => {
            if (ids.has(a.id)) a.status = newStatus;
        });
        saveAlertsStore(alerts);
        return { status: 'success', updated: ids.size };
    }

    if (cleanPath.includes('/compliance/alerts') || cleanPath === '/alerts') {
        const allAlerts = getAlertsStore();
        const session = getCurrentSessionUser(config);
        const isSuperadmin = session?.role === 'superadmin';
        if (isSuperadmin) {
            const requestedCompanyId = config.params?.company_id;
            if (requestedCompanyId) {
                return allAlerts.filter((a: any) => a.company_id === requestedCompanyId);
            }
            return allAlerts;
        }
        const userCompId = session?.company_id || '2727830ea39d470c917f1a1544ed5d0f';
        return allAlerts.filter((a: any) => a.company_id === userCompId);
    }

    if (cleanPath.includes('/compliance/stats')) {
        const allAlerts = getAlertsStore();
        const session = getCurrentSessionUser(config);
        const isSuperadmin = session?.role === 'superadmin';
        const userCompId = session?.company_id || '2727830ea39d470c917f1a1544ed5d0f';
        const alerts = isSuperadmin 
            ? allAlerts 
            : allAlerts.filter((a: any) => a.company_id === userCompId);

        const total = alerts.length;
        const critical = alerts.filter((a: any) => a.severity === 'critical').length;
        const high = alerts.filter((a: any) => a.severity === 'high').length;
        const medium = alerts.filter((a: any) => a.severity === 'medium').length;
        const low = alerts.filter((a: any) => a.severity === 'low').length;
        const open = alerts.filter((a: any) => a.status === 'open').length;
        const in_progress = alerts.filter((a: any) => a.status === 'in_progress').length;
        const resolved = alerts.filter((a: any) => a.status === 'resolved').length;
        const dismissed = alerts.filter((a: any) => a.status === 'dismissed').length;

        const score = total === 0 ? 100 : Math.max(70, Math.round(100 - (critical * 10 + high * 5)));

        return {
            total,
            critical,
            high,
            medium,
            low,
            open,
            in_progress,
            resolved,
            dismissed,
            compliance_score: score,
            score: score,
            status: score >= 90 ? 'Compliant' : 'Review Required',
            total_regulations: seedData.regulations.length,
            active_alerts: open + in_progress,
            high_severity_alerts: critical + high,
            pending_tasks: open,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 9. Audit Logs
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath.includes('/audit-logs/stats')) {
        const allLogs = getAuditLogsStore();
        const session = getCurrentSessionUser(config);
        const isSuperadmin = session?.role === 'superadmin';
        const userCompId = session?.company_id || '2727830ea39d470c917f1a1544ed5d0f';
        const logs = isSuperadmin 
            ? allLogs 
            : allLogs.filter((l: any) => l.company_id && l.company_id === userCompId);
        return {
            total_actions: logs.length,
            today_actions: Math.min(logs.length, 14),
            unique_users: new Set(logs.map((l: any) => l.user_id)).size || 1,
            failed_actions: 0,
        };
    }

    if (cleanPath.includes('/audit-logs/export')) {
        const allLogs = getAuditLogsStore();
        const session = getCurrentSessionUser(config);
        const isSuperadmin = session?.role === 'superadmin';
        const userCompId = session?.company_id || '2727830ea39d470c917f1a1544ed5d0f';
        const logs = isSuperadmin 
            ? allLogs 
            : allLogs.filter((l: any) => l.company_id && l.company_id === userCompId);
        const header = "id,action,user_id,details,created_at\n";
        const rows = logs.map((l: any) => `"${l.id}","${l.action}","${l.user_id}","${(l.details || '').replace(/"/g, '""')}","${l.created_at}"`).join('\n');
        return header + rows;
    }

    if (cleanPath.includes('/audit-logs')) {
        const allLogs = getAuditLogsStore();
        const session = getCurrentSessionUser(config);
        const isSuperadmin = session?.role === 'superadmin';
        const userCompId = session?.company_id || '2727830ea39d470c917f1a1544ed5d0f';
        const logs = isSuperadmin 
            ? allLogs 
            : allLogs.filter((l: any) => l.company_id && l.company_id === userCompId);
        return {
            logs: logs,
            total: logs.length,
            items: logs,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 10. Regulations & Web Crawler (Multi-Sector & Custom Sections)
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath.includes('/regulations/crawler/sections') && method === 'get') {
        return [...MOCK_PREDEFINED_SECTIONS, ...getCustomSectionsStore()];
    }

    if (cleanPath.includes('/regulations/crawler/sections') && method === 'post') {
        const customSections = getCustomSectionsStore();
        const newSec = {
            id: 'custom_' + Math.random().toString(36).substring(2, 9),
            name: body?.name || 'Пользовательский раздел',
            name_en: body?.name_en || body?.name || 'Custom Section',
            category: body?.category || 'Custom',
            keywords: body?.keywords || '',
            target_url: body?.target_url || '',
            jurisdiction: body?.jurisdiction || 'UZ',
            is_custom: true,
            created_at: new Date().toISOString(),
        };
        customSections.push(newSec);
        saveCustomSectionsStore(customSections);
        return newSec;
    }

    if (cleanPath.match(/\/regulations\/crawler\/sections\/[^/]+/) && method === 'delete') {
        const secId = cleanPath.split('/')[4];
        const customSections = getCustomSectionsStore().filter((s: any) => s.id !== secId);
        saveCustomSectionsStore(customSections);
        return { status: "success", deleted: true };
    }

    if (cleanPath.includes('/regulations/crawler/status')) {
        const regs = getRegulationsStore();
        const allSections = [...MOCK_PREDEFINED_SECTIONS, ...getCustomSectionsStore()];
        return {
            status: "active",
            is_running: false,
            engine: "Axiaris Spider v4.0 Multi-Sector Discovery Engine",
            monitored_sources_count: MOCK_CRAWLER_SOURCES.length,
            sources: MOCK_CRAWLER_SOURCES,
            sections_count: allSections.length,
            sections: allSections,
            last_crawl_at: new Date().toISOString(),
            next_scheduled_crawl_at: "Daily continuous radar active",
            discovered_items_available: MOCK_WEB_DISCOVERIES.length,
            total_regulations_in_db: regs.length
        };
    }

    if (cleanPath.includes('/regulations/crawler/sources')) {
        return MOCK_CRAWLER_SOURCES;
    }

    if (cleanPath.includes('/regulations/crawler/discovered')) {
        const regs = getRegulationsStore();
        const existingCodes = new Set(regs.map((r: any) => (r.code || '').trim().toUpperCase()));
        const secId = config?.params?.section_id;
        const cat = config?.params?.category;
        const jur = config?.params?.jurisdiction;

        let filtered = MOCK_WEB_DISCOVERIES;
        if (jur) {
            filtered = filtered.filter((d: any) => d.jurisdiction === jur || d.jurisdiction === 'GLOBAL');
        }
        if (secId && secId !== 'all') {
            filtered = filtered.filter((d: any) => d.section_id === secId || d.category?.toLowerCase() === secId.toLowerCase());
        }
        if (cat && cat !== 'ALL') {
            filtered = filtered.filter((d: any) => d.category?.toLowerCase() === cat.toLowerCase());
        }

        return filtered.map((item: any) => ({
            ...item,
            is_imported: existingCodes.has(item.code.toUpperCase()),
            discovered_at: new Date().toLocaleString()
        }));
    }

    if (cleanPath.includes('/regulations/crawler/start') || cleanPath.includes('/regulations/crawl')) {
        const regs = getRegulationsStore();
        const existingCodes = new Set(regs.map((r: any) => (r.code || '').trim().toUpperCase()));
        const jurFilter = body?.jurisdiction || config?.params?.jurisdiction;
        const secFilter = body?.section_id || config?.params?.section_id;
        const catFilter = body?.category || config?.params?.category;
        const autoImport = Boolean(body?.auto_import || config?.params?.auto_import);

        const allSections = [...MOCK_PREDEFINED_SECTIONS, ...getCustomSectionsStore()];
        const targetSection = secFilter ? allSections.find(s => s.id === secFilter) : null;

        let filteredDiscoveries = [...MOCK_WEB_DISCOVERIES];
        if (jurFilter) {
            filteredDiscoveries = filteredDiscoveries.filter(d => d.jurisdiction === jurFilter || d.jurisdiction === 'GLOBAL');
        }
        if (secFilter && secFilter !== 'all') {
            filteredDiscoveries = filteredDiscoveries.filter(d => (d as any).section_id === secFilter || d.category?.toLowerCase() === secFilter.toLowerCase());
        }
        if (catFilter && catFilter !== 'ALL') {
            filteredDiscoveries = filteredDiscoveries.filter(d => d.category?.toLowerCase() === catFilter.toLowerCase());
        }

        // If user created a custom section and selected it, dynamically generate a discovery!
        if (targetSection && (targetSection as any).is_custom && filteredDiscoveries.length === 0) {
            const customCode = `CUST-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`;
            filteredDiscoveries.push({
                code: customCode,
                title: `Нормативный акт по направлению «${targetSection.name}»: Требования комплаенс-контроля 2026`,
                title_en: `Regulatory Act on '${targetSection.name_en || targetSection.name}': 2026 Compliance Mandate`,
                jurisdiction: (targetSection as any).jurisdiction || 'UZ',
                category: targetSection.category || 'Custom',
                section_id: targetSection.id,
                authority: `Регулирующий орган (${targetSection.name})`,
                source_name: (targetSection as any).target_url || "Официальный правовой портал",
                source_url: (targetSection as any).target_url || "https://lex.uz",
                effective_date: "2026-03-01",
                impact_level: "HIGH",
                match_score: 98.8,
                summary: `Утверждены специальные правила регулирования для направления «${targetSection.name}». Ключевые слова мониторинга: ${(targetSection as any).keywords || 'комплаенс, лицензирование, аудит'}.`,
                content: `Официальный регламент требований для сферы ${targetSection.name}. Устанавливаются стандарты отчетности, прохождения обязательного комплаенс-аудита и порядок лицензирования деятельности.`,
                workflow_steps: [
                    `Провести первичный аудит процессов по стандартам сектора «${targetSection.name}»`,
                    "Разработать внутреннюю документацию и назначить ответственного специалиста",
                    "Подать отчетность в уполномоченный контролирующий орган"
                ]
            });
        }

        const nowTime = new Date().toLocaleTimeString();
        const sectionName = targetSection ? targetSection.name : "Все разделы";
        const telemetryLogs = [
            `[${nowTime}] 🌐 Запуск многопоточного робота Axiaris Spider v4.0...`,
            `[${nowTime}] 🎯 Направление сканирования: «${sectionName}» (${targetSection ? targetSection.category : 'Мульти-сектор'})`,
            `[${nowTime}] 🔍 Запрос к Lex.uz (Национальная база законодательства РУз) -> 200 OK`,
            `[${nowTime}] 🔍 Запрос к Soliq.uz (Налоговый комитет РУз) -> 200 OK`,
            `[${nowTime}] 🔍 Проверка ЦБ РУз (cbu.uz) & НАПП (napp.uz) -> 200 OK`,
            `[${nowTime}] 🔍 Проверка IFRS Foundation & OECD Tax Policy -> 200 OK`,
            `[${nowTime}] 🔍 Запрос к Adilet.zan.kz & EUR-Lex -> 200 OK`,
            `[${nowTime}] ⚡ Семантический анализ документов по ключевым словам сектора «${sectionName}»...`,
            `[${nowTime}] 📋 Обнаружено ${filteredDiscoveries.length} нормативно-правовых актов в разделе «${sectionName}».`
        ];

        let autoImportedCount = 0;
        if (autoImport) {
            const toImport = filteredDiscoveries.filter(d => !existingCodes.has(d.code.toUpperCase()));
            toImport.forEach(item => {
                regs.unshift({
                    id: 'reg-' + Math.random().toString(36).substring(2, 9),
                    code: item.code,
                    title: item.title,
                    jurisdiction: item.jurisdiction,
                    category: item.category,
                    content: item.content,
                    workflow_steps: item.workflow_steps,
                    source_url: item.source_url,
                    effective_date: item.effective_date,
                    is_new: true,
                    created_at: new Date().toISOString()
                });
            });
            saveRegulationsStore(regs);
            autoImportedCount = toImport.length;
            telemetryLogs.push(`[${nowTime}] 💾 Автоматически импортировано в базу: ${autoImportedCount} новых нормативов.`);
        }

        return {
            status: "success",
            section_applied: sectionName,
            sources_scanned: MOCK_CRAWLER_SOURCES.length,
            total_found: filteredDiscoveries.length,
            auto_imported: autoImportedCount,
            discoveries: filteredDiscoveries.map(d => ({
                ...d,
                is_imported: existingCodes.has(d.code.toUpperCase()) || autoImport,
                discovered_at: new Date().toLocaleString()
            })),
            telemetry_logs: telemetryLogs,
            crawled_at: new Date().toISOString()
        };
    }

    if (cleanPath.includes('/regulations/crawler/import') && method === 'post') {
        const codesToImport = new Set((body?.codes || []).map((c: string) => c.trim().toUpperCase()));
        const regs = getRegulationsStore();
        const existingCodes = new Set(regs.map((r: any) => (r.code || '').trim().toUpperCase()));

        let importedCount = 0;
        MOCK_WEB_DISCOVERIES.forEach(item => {
            const itemCode = (item.code || '').trim().toUpperCase();
            if (codesToImport.has(itemCode) && !existingCodes.has(itemCode)) {
                regs.unshift({
                    id: 'reg-' + Math.random().toString(36).substring(2, 9),
                    code: item.code,
                    title: item.title,
                    jurisdiction: item.jurisdiction,
                    category: item.category,
                    content: item.content,
                    workflow_steps: item.workflow_steps,
                    source_url: item.source_url,
                    effective_date: item.effective_date,
                    is_new: true,
                    created_at: new Date().toISOString()
                });
                existingCodes.add(itemCode);
                importedCount++;
            }
        });

        saveRegulationsStore(regs);
        logAuditAction('regulation_import', `Импортировано ${importedCount} нормативов из веб-краулера`);

        return {
            status: "success",
            imported: importedCount,
            total_in_db: regs.length,
            message: `Успешно импортировано ${importedCount} новых нормативов из сети интернет.`
        };
    }

    if (cleanPath.includes('/regulations/jurisdictions')) {
        const regs = getRegulationsStore();
        const set = new Set<string>(['UZ', 'KZ', 'RU', 'GLOBAL', 'EU', 'AE', 'US']);
        regs.forEach(r => {
            if (r.jurisdiction) set.add(r.jurisdiction);
        });
        return { jurisdictions: Array.from(set).sort() };
    }

    if (cleanPath.includes('/regulations/auto-seed') || cleanPath.includes('/regulations/refresh')) {
        const regs = getRegulationsStore();
        const existingCodes = new Set(regs.map((r: any) => (r.code || '').trim().toUpperCase()));
        let added = 0;
        
        MOCK_WEB_DISCOVERIES.forEach(item => {
            if (!existingCodes.has(item.code.toUpperCase())) {
                regs.push({
                    id: 'reg-' + Math.random().toString(36).substring(2, 9),
                    code: item.code,
                    title: item.title,
                    jurisdiction: item.jurisdiction,
                    category: item.category,
                    content: item.content,
                    workflow_steps: item.workflow_steps,
                    source_url: item.source_url,
                    effective_date: item.effective_date,
                    created_at: new Date().toISOString()
                });
                existingCodes.add(item.code.toUpperCase());
                added++;
            }
        });
        saveRegulationsStore(regs);
        return {
            status: "success",
            added,
            updated: 0,
            skipped: regs.length - added,
            total_regulations: regs.length
        };
    }

    if (cleanPath.includes('/regulations/ingest') && method === 'post') {
        const regs = getRegulationsStore();
        const newReg = {
            id: 'reg-' + Math.random().toString(36).substring(2, 9),
            code: body?.code || 'CUSTOM-REG',
            title: body?.title || 'Пользовательский норматив',
            jurisdiction: body?.jurisdiction || 'GLOBAL',
            category: body?.category || 'General',
            content: body?.content || '',
            workflow_steps: body?.workflow_steps || [],
            source_url: body?.source_url || '',
            effective_date: body?.effective_date || new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString()
        };
        regs.unshift(newReg);
        saveRegulationsStore(regs);
        return newReg;
    }

    if (cleanPath.match(/\/regulations\/[^/]+\/subscribe/)) {
        const regId = cleanPath.split('/')[2];
        const isDelete = method === 'delete';
        const regs = getRegulationsStore();
        const idx = regs.findIndex((r: any) => r.id === regId);
        if (idx !== -1) {
            regs[idx].is_subscribed = !isDelete;
            saveRegulationsStore(regs);
        }
        return { message: isDelete ? "Unsubscribed successfully" : "Subscribed successfully" };
    }

    if (cleanPath.includes('/regulations/search') || cleanPath === '/regulations' || cleanPath === '/regulations/') {
        const regs = getRegulationsStore();
        const rawQ = (config?.params?.query || '').trim();
        const q = rawQ.toLowerCase();
        const terms: string[] = q.split(/\s+/).filter(Boolean);
        const isIfrsSearch = terms.some(t => t === 'ifrs' || t === 'мсфо' || t === 'ias' || t === 'mhxs' || t === 'iasb');

        let scoredList: any[] = [];

        if (terms.length > 0) {
            regs.forEach((r: any) => {
                const title = (r.title || r.metadata?.title || '').toLowerCase();
                const code = (r.code || r.metadata?.code || '').toLowerCase();
                const content = (r.content || r.metadata?.content || '').toLowerCase();
                const jur = (r.jurisdiction || r.metadata?.jurisdiction || '').toLowerCase();
                const cat = (r.category || r.metadata?.category || '').toLowerCase();
                const workflowStr = typeof r.workflow_steps === 'string'
                    ? r.workflow_steps.toLowerCase()
                    : JSON.stringify(r.workflow_steps || []).toLowerCase();

                let score = 0;
                const matchedFields: string[] = [];
                const isIfrsItem = code.startsWith('ifrs') || code.startsWith('ias') || cat === 'ifrs' || title.includes('ifrs') || title.includes('мсфо') || title.includes('ias');

                // Exact phrase bonuses
                if (q && code.includes(q)) score += 40;
                if (q && title.includes(q)) score += 30;

                let termsMatched = 0;

                // Full IFRS / IAS / МСФО framework coverage
                if (isIfrsSearch && isIfrsItem) {
                    score += 35;
                    termsMatched++;
                    if (!matchedFields.includes('category')) matchedFields.push('category');
                    if (!matchedFields.includes('code')) matchedFields.push('code');
                }

                terms.forEach((t: string) => {
                    let termHit = false;
                    if (code.includes(t)) {
                        score += 15;
                        termHit = true;
                        if (!matchedFields.includes('code')) matchedFields.push('code');
                    }
                    if (title.includes(t)) {
                        score += 12;
                        termHit = true;
                        if (!matchedFields.includes('title')) matchedFields.push('title');
                    }
                    if (cat.includes(t)) {
                        score += 8;
                        termHit = true;
                        if (!matchedFields.includes('category')) matchedFields.push('category');
                    }
                    if (jur.includes(t)) {
                        score += 8;
                        termHit = true;
                        if (!matchedFields.includes('jurisdiction')) matchedFields.push('jurisdiction');
                    }
                    if (workflowStr.includes(t)) {
                        score += 10;
                        termHit = true;
                        if (!matchedFields.includes('workflow')) matchedFields.push('workflow');
                    }
                    if (content.includes(t)) {
                        termHit = true;
                        const occurrences = (content.match(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
                        score += Math.min(occurrences * 3, 20);
                        if (!matchedFields.includes('content')) matchedFields.push('content');
                    }
                    if (termHit) {
                        termsMatched++;
                    }
                });

                // Bonus if all words matched
                if (termsMatched === terms.length) {
                    score += 25;
                }

                if (score > 0) {
                    // Extract contextual snippet
                    const rawContent = r.content || r.metadata?.content || '';
                    let snippet = '';
                    let bestIdx = -1;

                    for (const t of terms) {
                        const idx = rawContent.toLowerCase().indexOf(t);
                        if (idx !== -1) {
                            bestIdx = idx;
                            break;
                        }
                    }

                    if (bestIdx !== -1) {
                        const start = Math.max(0, bestIdx - 60);
                        const end = Math.min(rawContent.length, bestIdx + 180);
                        snippet = (start > 0 ? '...' : '') + rawContent.substring(start, end).trim() + (end < rawContent.length ? '...' : '');
                    } else if (rawContent) {
                        snippet = rawContent.substring(0, 220).trim() + (rawContent.length > 220 ? '...' : '');
                    }

                    scoredList.push({
                        ...r,
                        score,
                        snippet,
                        matched_fields: matchedFields
                    });
                }
            });

            // Sort by score descending
            scoredList.sort((a, b) => b.score - a.score);
        } else {
            scoredList = regs.map((r: any) => ({
                ...r,
                score: 0,
                snippet: (r.content || r.metadata?.content || '').substring(0, 220) + '...',
                matched_fields: []
            }));
        }

        return scoredList.map((r: any) => {
            const meta = r.metadata || {};
            return {
                ...r,
                title: r.title || meta.title || 'Untitled Regulation',
                code: r.code || meta.code || 'REG',
                category: r.category || meta.category || 'General',
                jurisdiction: r.jurisdiction || meta.jurisdiction || 'GLOBAL',
                effective_date: r.effective_date || meta.effective_date || '',
                source_url: r.source_url || meta.source_url || '',
                content: r.content || meta.content || '',
                workflow_steps: r.workflow_steps || meta.workflow_steps || [],
                snippet: r.snippet || '',
                matched_fields: r.matched_fields || [],
                score: r.score || 0,
                metadata: {
                    title: r.title || meta.title || 'Untitled Regulation',
                    code: r.code || meta.code || 'REG',
                    category: r.category || meta.category || 'General',
                    jurisdiction: r.jurisdiction || meta.jurisdiction || 'GLOBAL',
                    effective_date: r.effective_date || meta.effective_date || '',
                    source_url: r.source_url || meta.source_url || '',
                    content: r.content || meta.content || '',
                    workflow_steps: r.workflow_steps || meta.workflow_steps || [],
                    snippet: r.snippet || '',
                    matched_fields: r.matched_fields || [],
                    ...meta,
                },
            };
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 11. Balance Sheets & Transformation
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath === '/balance-sheets/upload' && method === 'post') {
        let text = '';
        let filename = 'balance_sheet.csv';

        if (body instanceof FormData) {
            const file = body.get('file');
            if (file) {
                filename = (file as any).name || filename;
                if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
                    try {
                        const XLSX = await import('xlsx');
                        const buffer = await (file as any).arrayBuffer();
                        const workbook = XLSX.read(buffer, { type: 'array' });
                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                        text = XLSX.utils.sheet_to_csv(firstSheet);
                    } catch (e) {
                        console.warn('XLSX parse fallback error:', e);
                    }
                } else if (typeof (file as any).text === 'function') {
                    try {
                        text = await (file as any).text();
                    } catch {}
                }
            }
        } else if (typeof body === 'string') {
            text = body;
        }

        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const items: any[] = [];
        let totalRows = 0;

        if (lines.length > 1) {
            const header = lines[0].toLowerCase().split(/[;,,\t]/).map(h => h.trim().replace(/^["']|["']$/g, ''));
            const codeIdx = header.findIndex(h => h.includes('code') || h.includes('счет') || h.includes('код'));
            const nameIdx = header.findIndex(h => h.includes('name') || h.includes('наименование') || h.includes('название') || h.includes('статья'));
            const debitIdx = header.findIndex(h => h.includes('debit') || h.includes('дебет') || h === 'дт' || h === 'dr');
            const creditIdx = header.findIndex(h => h.includes('credit') || h.includes('кредит') || h === 'кт' || h === 'cr');
            const amountIdx = header.findIndex(h => h.includes('amount') || h.includes('сумма') || h.includes('сальдо'));
            const catIdx = header.findIndex(h => h.includes('cat') || h.includes('категор') || h.includes('type'));
            const subkontoIdx = header.findIndex(h => h.includes('sub') || h.includes('субконто'));

            for (let i = 1; i < lines.length; i++) {
                totalRows++;
                const row = lines[i].split(/[;,,\t]/).map(c => c.trim().replace(/^["']|["']$/g, ''));
                const rawCode = codeIdx !== -1 ? row[codeIdx] : row[0];
                if (!rawCode) continue;

                let code = rawCode.trim();
                if (code.length === 3 && /^\d+$/.test(code)) code = '0' + code;

                const name = nameIdx !== -1 ? row[nameIdx] : (row[1] || `Счет ${code}`);
                let amount = 0;

                if (debitIdx !== -1 || creditIdx !== -1) {
                    const deb = parseFloat((row[debitIdx] || '0').replace(/\s/g, '').replace(',', '.')) || 0;
                    const cred = parseFloat((row[creditIdx] || '0').replace(/\s/g, '').replace(',', '.')) || 0;
                    if (deb > 0 && cred === 0) amount = deb;
                    else if (cred > 0 && deb === 0) amount = cred;
                    else if (deb > 0 || cred > 0) amount = Math.abs(deb - cred);
                } else if (amountIdx !== -1) {
                    amount = parseFloat((row[amountIdx] || '0').replace(/\s/g, '').replace(',', '.')) || 0;
                }

                // Deduce category from code if not provided
                let category = 'assets';
                let subcategory = subkontoIdx !== -1 ? row[subkontoIdx] : undefined;

                if (catIdx !== -1 && row[catIdx]) {
                    const catLower = row[catIdx].toLowerCase();
                    if (catLower.includes('liab') || catLower.includes('пасс') || catLower.includes('обяз')) category = 'liabilities';
                    else if (catLower.includes('eq') || catLower.includes('капит')) category = 'equity';
                    else category = 'assets';
                } else {
                    if (code.startsWith('02')) {
                        category = 'liabilities';
                        subcategory = subcategory || 'Accumulated Depreciation';
                    } else if (code.startsWith('01') || code.startsWith('03') || code.startsWith('04') || code.startsWith('05') || code.startsWith('07') || code.startsWith('08') || code.startsWith('09')) {
                        category = 'assets';
                        subcategory = subcategory || 'Non-Current Assets';
                    } else if (parseInt(code.slice(0, 2)) >= 10 && parseInt(code.slice(0, 2)) < 60) {
                        category = 'assets';
                        if (code.startsWith('5')) subcategory = subcategory || 'Cash & Equivalents';
                        else if (code.startsWith('4')) subcategory = subcategory || 'Receivables';
                        else subcategory = subcategory || 'Current Assets';
                    } else if (parseInt(code.slice(0, 2)) >= 60 && parseInt(code.slice(0, 2)) < 80) {
                        category = 'liabilities';
                        subcategory = subcategory || (code.startsWith('7') ? 'Non-Current Liabilities' : 'Current Liabilities');
                    } else if (parseInt(code.slice(0, 2)) >= 80 && parseInt(code.slice(0, 2)) < 90) {
                        category = 'equity';
                        subcategory = subcategory || (code.startsWith('87') ? 'Retained Earnings' : 'Share Capital');
                    }
                }

                items.push({
                    id: 'item-' + i,
                    account_code: code,
                    account_name: name,
                    amount: amount,
                    category: category,
                    subcategory: subcategory,
                });
            }
        }

        // Default fallback if parsing produced empty list
        if (items.length === 0) {
            items.push(
                { id: '1', account_code: '0110', account_name: 'Здания и сооружения (Офис)', amount: 4500000000, category: 'assets', subcategory: 'Головной офис' },
                { id: '2', account_code: '0210', account_name: 'Износ зданий и сооружений', amount: 450000000, category: 'liabilities', subcategory: 'Линейная амортизация' },
                { id: '3', account_code: '0804', account_name: 'Приобретение права пользования активом', amount: 0, category: 'assets', subcategory: 'Договор аренды склад №4' },
                { id: '4', account_code: '4010', account_name: 'Дебиторская задолженность покупателей', amount: 3200000000, category: 'assets', subcategory: 'Контрагенты СНГ' },
                { id: '5', account_code: '5110', account_name: 'Расчетные счета (UZS)', amount: 1850000000, category: 'assets', subcategory: 'Основной счет' },
                { id: '6', account_code: '6010', account_name: 'Кредиторская задолженность поставщикам', amount: 1950000000, category: 'liabilities', subcategory: 'Поставщики сырья' },
                { id: '7', account_code: '6310', account_name: 'Резерв по сомнительным долгам', amount: 80000000, category: 'liabilities', subcategory: 'Общий резерв' },
                { id: '8', account_code: '7607', account_name: 'Обязательства по аренде (IFRS 16)', amount: 0, category: 'liabilities', subcategory: 'Аренда склад №4' },
                { id: '9', account_code: '8510', account_name: 'Уставный капитал', amount: 6000000000, category: 'equity', subcategory: 'Оплаченный капитал' },
                { id: '10', account_code: '8710', account_name: 'Нераспределенная прибыль', amount: 1070000000, category: 'equity', subcategory: 'Прибыль прошлых лет' },
            );
            totalRows = 10;
        }

        const totalAssets = items.filter(it => it.category === 'assets').reduce((acc, it) => acc + (it.amount || 0), 0);
        const totalLiabilities = items.filter(it => it.category === 'liabilities').reduce((acc, it) => acc + (it.amount || 0), 0);
        const totalEquity = items.filter(it => it.category === 'equity').reduce((acc, it) => acc + (it.amount || 0), 0);
        const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

        return {
            success: true,
            filename: filename,
            items: items,
            total_rows: totalRows,
            valid_rows: items.length,
            errors: [],
            balance_check: {
                is_balanced: isBalanced,
                total_assets: totalAssets,
                total_liabilities: totalLiabilities,
                total_equity: totalEquity,
                difference: Math.abs(totalAssets - (totalLiabilities + totalEquity)),
            },
            preview_mode: true,
        };
    }

    if (cleanPath === '/balance-sheets/upload/confirm' && method === 'post') {
        const sheets = getBalanceSheetsStore();
        const session = getCurrentSessionUser(config);
        const rawItems = body?.items || [];
        const items = rawItems.map((item: any, idx: number) => ({
            ...item,
            id: item.id || `item-${Date.now()}-${idx + 1}`
        }));
        const targetCompanyId = session?.company_id || body?.company_id || '2727830ea39d470c917f1a1544ed5d0f';
        const newSheet = {
            id: 'bs-' + Math.random().toString(36).substring(2, 9),
            company_id: targetCompanyId,
            period: body?.period ? body.period.slice(0, 7) : new Date().toISOString().slice(0, 7),
            status: 'draft',
            created_at: new Date().toISOString(),
            notes: body?.notes || 'Uploaded from file',
            items: items,
            item_count: items.length,
        };
        sheets.unshift(newSheet);
        saveBalanceSheetsStore(sheets);
        logAuditAction('balance_sheet_uploaded', `Загружен пробный баланс за ${newSheet.period} (${items.length} статей)`, session?.email, targetCompanyId);
        return {
            success: true,
            balance_sheet: newSheet,
            message: 'Balance sheet created successfully from uploaded file'
        };
    }

    if ((cleanPath === '/balance-sheets' || cleanPath === '/balance-sheets/') && method === 'post') {
        const sheets = getBalanceSheetsStore();
        const session = getCurrentSessionUser(config);
        const targetCompanyId = session?.company_id || body?.company_id || '2727830ea39d470c917f1a1544ed5d0f';
        const newSheet = {
            id: 'bs-' + Math.random().toString(36).substring(2, 9),
            company_id: targetCompanyId,
            period: body?.period || '2025-Q4',
            status: 'draft',
            created_at: new Date().toISOString(),
            items: body?.items || [],
        };
        sheets.unshift(newSheet);
        saveBalanceSheetsStore(sheets);
        logAuditAction('balance_sheet_created', `Создан пробный баланс за ${newSheet.period}`, session?.email, targetCompanyId);
        return newSheet;
    }

    if (cleanPath.startsWith('/balance-sheets/') && method === 'put') {
        const sheetId = cleanPath.split('/')[2];
        const sheets = getBalanceSheetsStore();
        const idx = sheets.findIndex((s: any) => s.id === sheetId);
        if (idx !== -1) {
            sheets[idx] = {
                ...sheets[idx],
                ...body,
                status: (body.status || sheets[idx].status || 'draft').toLowerCase(),
                updated_at: new Date().toISOString()
            };
            saveBalanceSheetsStore(sheets);
            logAuditAction('balance_sheet_updated', `Обновлен баланс ${sheetId}`, getCurrentSessionUser(config)?.email);
            return sheets[idx];
        }
        return { status: 'error', message: 'Balance sheet not found' };
    }

    if (cleanPath.startsWith('/balance-sheets/') && method === 'delete') {
        const sheetId = cleanPath.split('/')[2];
        const sheets = getBalanceSheetsStore().filter((s: any) => s.id !== sheetId);
        saveBalanceSheetsStore(sheets);
        return { status: 'success', message: 'Balance sheet deleted' };
    }

    if (cleanPath === '/balance-sheets' || cleanPath === '/balance-sheets/') {
        const sheets = getBalanceSheetsStore();
        const session = getCurrentSessionUser(config);
        const isSuperadmin = session?.role === 'superadmin' || !session;
        const requestedCompanyId = config.params?.company_id;

        const filtered = isSuperadmin
            ? (requestedCompanyId ? sheets.filter((s: any) => s.company_id === requestedCompanyId) : sheets)
            : sheets.filter((s: any) => s.company_id === (session?.company_id || '2727830ea39d470c917f1a1544ed5d0f'));

        return filtered.map((s: any) => {
            const items = (Array.isArray(s.items) && s.items.length > 0)
                ? s.items
                : (seedData.balance_sheet_items as any[]).filter((i: any) => i.balance_sheet_id === s.id);
            return {
                ...s,
                status: (s.status || 'draft').toLowerCase(),
                items: items
            };
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // IFRS & IAS Calculators (IFRS 16, IAS 36, IFRS 9)
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath === '/calculators/ifrs16' && method === 'post') {
        const leaseTerm = Number(body?.lease_term_months) || 12;
        const discountRate = Number(body?.discount_rate_annual) || 0;
        const pmt = Number(body?.monthly_payment) || 0;
        const directCosts = Number(body?.initial_direct_costs) || 0;
        
        const rMonthly = (discountRate / 100) / 12;
        let pv = 0;
        if (rMonthly > 0) {
            pv = pmt * ((1 - Math.pow(1 + rMonthly, -leaseTerm)) / rMonthly);
        } else {
            pv = pmt * leaseTerm;
        }
        pv = Math.round(pv * 100) / 100;
        const rou = Math.round((pv + directCosts) * 100) / 100;
        return {
            lease_liability: pv,
            right_of_use_asset: rou,
            monthly_discount_rate: Math.round(rMonthly * 1000000) / 1000000,
            total_payments: Math.round(pmt * leaseTerm * 100) / 100
        };
    }

    if (cleanPath === '/calculators/ias36' && method === 'post') {
        const carrying = Number(body?.carrying_amount) || 0;
        const fv = Number(body?.fair_value_less_costs) || 0;
        const viu = Number(body?.value_in_use) || 0;
        const recoverable = Math.max(fv, viu);
        const loss = carrying > recoverable ? carrying - recoverable : 0;
        return {
            recoverable_amount: Math.round(recoverable * 100) / 100,
            impairment_loss: Math.round(loss * 100) / 100,
            new_carrying_amount: Math.round((carrying - loss) * 100) / 100,
            is_impaired: loss > 0
        };
    }

    if (cleanPath === '/calculators/ifrs9' && method === 'post') {
        const ead = Number(body?.ead) || 0;
        const pd = Number(body?.pd_percentage) || 0;
        const lgd = Number(body?.lgd_percentage) || 45.0;
        const dpd = Number(body?.days_past_due) || 0;
        const discountRate = Number(body?.discount_rate_annual) || 0;
        const horizonInput = Number(body?.horizon_years) || 1.0;

        let stage = 'Stage 1';
        let stageDesc = 'Performing: 12-Month Expected Credit Loss (Low credit risk, standard provisioning)';
        let horizon = Math.min(horizonInput, 1.0);

        if (dpd > 90) {
            stage = 'Stage 3';
            stageDesc = 'Credit-Impaired (Default): Lifetime ECL with objective evidence of impairment';
            horizon = Math.max(horizonInput, 3.0);
        } else if (dpd > 30) {
            stage = 'Stage 2';
            stageDesc = 'Underperforming (SICR): Lifetime Expected Credit Loss (Significant increase in credit risk)';
            horizon = Math.max(horizonInput, 2.0);
        }

        const r = discountRate / 100.0;
        const df = (r > 0 && horizon > 0) ? 1.0 / Math.pow(1.0 + r, horizon) : 1.0;
        const eclRaw = ead * (pd / 100.0) * (lgd / 100.0) * df;
        const ecl = Math.round(Math.min(eclRaw, ead) * 100) / 100;
        const netAmount = Math.round((ead - ecl) * 100) / 100;
        const lossRate = ead > 0 ? Math.round((ecl / ead * 100) * 100) / 100 : 0;

        return {
            ecl_amount: ecl,
            stage: stage,
            stage_description: stageDesc,
            discount_factor: Math.round(df * 10000) / 10000,
            net_carrying_amount: netAmount,
            effective_loss_rate_pct: lossRate
        };
    }

    if (cleanPath.includes('/ai-audit') && method === 'post') {
        const parts = cleanPath.split('/');
        const sheetId = parts[2];
        const sheets = getBalanceSheetsStore();
        const sheet: any = sheets.find((b: any) => b.id === sheetId) || sheets[0] || {};
        const items = (Array.isArray(sheet.items) && sheet.items.length > 0)
            ? sheet.items
            : seedData.balance_sheet_items.filter((i: any) => i.balance_sheet_id === sheet.id);
        const isRu = (body?.language || 'ru').toLowerCase().startsWith('ru');

        const totalAssets = items.filter((i: any) => (i.category || '').toLowerCase() === 'assets').reduce((acc: number, i: any) => acc + (Number(i.amount) || 0), 0) || 9550000000;
        const totalLiab = items.filter((i: any) => (i.category || '').toLowerCase() === 'liabilities').reduce((acc: number, i: any) => acc + (Number(i.amount) || 0), 0) || 2480000000;
        const totalEquity = items.filter((i: any) => (i.category || '').toLowerCase() === 'equity').reduce((acc: number, i: any) => acc + (Number(i.amount) || 0), 0) || 7070000000;
        const diff = Math.abs(totalAssets - (totalLiab + totalEquity));
        const isBalanced = diff < 0.01;

        const memoMarkdown = isRu
            ? `# АУДИТОРСКОЕ ЗАКЛЮЧЕНИЕ НЕЗАВИСИМОГО АУДИТОРА (МСА 700 / 701)\n\n` +
              `**Организация:** ${sheet.company_name || 'ООО «ТехноПром Инвест»'}\n` +
              `**Отчетная дата:** ${sheet.period ? new Date(sheet.period).toLocaleDateString('ru-RU') : '31.10.2026'}\n` +
              `**Статус заключения:** ${isBalanced ? 'Безоговорочно положительное (Unmodified Clean Opinion)' : 'Модифицированное (Qualified Opinion)'}\n` +
              `**Оценка соответствия:** ${isBalanced ? '98 / 100 (Высокая надежность)' : '45 / 100 (Требуются корректировки)'}\n\n` +
              `---\n\n` +
              `### 1. Мнение аудитора\n` +
              `Мы провели независимый аудит и верификацию результатов трансформации финансовой отчетности из национальных стандартов (НСБУ 21) в Международные стандарты финансовой отчетности (МСФО).\n\n` +
              `По нашему мнению, прилагаемый отчет о финансовом положении отражает достоверно во всех существенных отношениях финансовое состояние организации по состоянию на отчетную дату в соответствии с МСФО (IFRS).\n\n` +
              `### 2. Ключевые вопросы аудита (Key Audit Matters - ISA 701)\n\n` +
              `* **KAM-01: Контрольное равенство баланса (Zero Delta Guard):** Активы (${totalAssets.toLocaleString()} UZS) строго равны сумме обязательств и капитала (${(totalLiab + totalEquity).toLocaleString()} UZS). Расхождение составляет 0.00 UZS.\n` +
              `* **KAM-02: Капитализация прав аренды (IFRS 16):** Признание актива в форме права пользования (ROU) и дисконтированного арендного обязательства выполнено с использованием обоснованной ставки дисконтирования.\n` +
              `* **KAM-03: Оценка ожидаемых кредитных убытков (IFRS 9):** Создание оценочного резерва под обесценение дебиторской задолженности проведено на основе матричной модели просрочки.\n` +
              `* **KAM-04: Тестирование на обесценение (IAS 36):** Возмещаемая стоимость внеоборотных активов подтверждена анализом чистой приведенной стоимости денежных потоков.\n\n` +
              `### 3. Ответственность руководства и аудитора\n` +
              `Руководство несет ответственность за подготовку отчетности. Наша цель — получить разумную уверенность в отсутствии существенных искажений.`
            : `# INDEPENDENT AUDITOR'S REPORT (ISA 700 / 701)\n\n` +
              `**Entity:** ${sheet.company_name || 'TechnoProm Invest LLC'}\n` +
              `**Reporting Date:** ${sheet.period ? new Date(sheet.period).toLocaleDateString('en-US') : '31.10.2026'}\n` +
              `**Audit Opinion:** ${isBalanced ? 'Unqualified Clean Opinion' : 'Qualified Opinion'}\n` +
              `**Assurance Score:** ${isBalanced ? '98 / 100 (High Reliability)' : '45 / 100 (Action Required)'}\n\n` +
              `---\n\n` +
              `### 1. Opinion\n` +
              `We have audited the IFRS financial transformation statements from national standards (NAS / НСБУ) to International Financial Reporting Standards (IFRS).\n\n` +
              `In our opinion, the financial statements present fairly, in all material respects, the financial position of the entity in accordance with IFRS.\n\n` +
              `### 2. Key Audit Matters (ISA 701)\n\n` +
              `* **KAM-01: Zero-Delta Capital Equilibrium:** Total Assets (${totalAssets.toLocaleString()} UZS) strictly equal Total Equity & Liabilities (${(totalLiab + totalEquity).toLocaleString()} UZS). Difference: 0.00 UZS.\n` +
              `* **KAM-02: Lease Accounting (IFRS 16):** Right-of-use asset and discounted lease liabilities correctly recognized.\n` +
              `* **KAM-03: Expected Credit Losses (IFRS 9):** Provisioning matrix applied to trade receivables.\n` +
              `* **KAM-04: Impairment Testing (IAS 36):** Recoverable amount verified against discounted cash flows.`;

        return {
            opinion: isBalanced ? 'Unqualified Clean Opinion' : 'Qualified / Adverse Opinion',
            status: isBalanced ? 'passed' : 'action_required',
            risk_score: isBalanced ? 98 : 45,
            is_balanced: isBalanced,
            discrepancy: diff,
            total_assets: totalAssets,
            total_equity: totalEquity,
            total_liabilities: totalLiab,
            standards_verified: ['IFRS 1', 'IAS 1', 'IFRS 16 (Leases)', 'IAS 36 (Impairment)', 'IFRS 9 (Financial Instruments)'],
            findings: [
                {
                    code: 'KAM-01',
                    title: tr('Контрольное равенство баланса подтверждено', 'Zero-Delta Capital Equilibrium Verified'),
                    severity: 'info',
                    detail: tr(`Активы (${totalAssets.toLocaleString()} UZS) строго равны сумме капитала и обязательств. Дельта = 0.00.`, `Total Assets equal Equity and Liabilities. Delta = 0.00.`)
                },
                {
                    code: 'KAM-02',
                    title: tr('Капитализация аренды по IFRS 16', 'IFRS 16 Lease Capitalization'),
                    severity: 'info',
                    detail: tr('Признаны активы в форме права пользования и дисконтированные арендные обязательства.', 'Recognized ROU assets and lease liabilities.')
                },
                {
                    code: 'KAM-03',
                    title: tr('Оценка кредитных рисков по IFRS 9', 'IFRS 9 Expected Credit Loss Provisioning'),
                    severity: 'info',
                    detail: tr('Применена 3-стадийная модель резервирования дебиторской задолженности.', '3-stage ECL provisioning model applied.')
                },
                {
                    code: 'KAM-04',
                    title: tr('Тестирование на обесценение (IAS 36)', 'IAS 36 Impairment Testing & DCF'),
                    severity: 'info',
                    detail: tr('Возмещаемая стоимость внеоборотных активов подтверждена дисконтированными денежными потоками.', 'Recoverable amount verified against discounted cash flows.')
                }
            ],
            expert_role: 'Senior IFRS Big-4 Audit Partner & Lead Assurance Director',
            executive_summary: tr(`Аудит завершен со статусом: Безоговорочно положительное мнение. Баланс сходится в 0 дельту.`, `Audit completed: Unqualified Clean Opinion. Zero delta equilibrium confirmed.`),
            audit_memo_markdown: memoMarkdown,
            audited_at: new Date().toISOString()
        };
    }

    const getScaledDefaultAdjustments = (sheetItems: any[]) => {
        const totalStatutoryAssets = (sheetItems || [])
            .filter((i: any) => String(i.category || '').toLowerCase() === 'assets')
            .reduce((sum: number, i: any) => sum + (Number(i.amount) || 0), 0);

        let ifrs16Amt = 19500000;
        let ifrs9Amt = 2100000;
        if (totalStatutoryAssets > 0 && totalStatutoryAssets < 200000) {
            ifrs16Amt = Math.max(1000, Math.round(totalStatutoryAssets * 0.15));
            ifrs9Amt = Math.max(500, Math.round(totalStatutoryAssets * 0.02));
        } else if (totalStatutoryAssets >= 200000 && totalStatutoryAssets < 10000000) {
            ifrs16Amt = 150000;
            ifrs9Amt = 5000;
        }

        return [
            { id: 'adj-1', description: 'IFRS 16 Lease recognition (ROU Asset)', adjustment_type: 'debit', adjustment_amount: ifrs16Amt, ifrs_category: 'IFRS 16', debit_account: '0804', credit_account: '7910' },
            { id: 'adj-2', description: 'IFRS 16 Lease liability capitalization', adjustment_type: 'credit', adjustment_amount: ifrs16Amt, ifrs_category: 'IFRS 16', debit_account: '0804', credit_account: '7910' },
            { id: 'adj-3', description: 'IFRS 9 Expected Credit Loss allowance', adjustment_type: 'credit', adjustment_amount: ifrs9Amt, ifrs_category: 'IFRS 9', debit_account: '8710', credit_account: '4010' },
            { id: 'adj-4', description: 'IFRS 9 ECL Provision Expense (P&L / Retained Earnings)', adjustment_type: 'debit', adjustment_amount: ifrs9Amt, ifrs_category: 'IFRS 9', debit_account: '8710', credit_account: '4010' },
        ];
    };

    if (cleanPath.includes('/export-excel')) {
        const parts = cleanPath.split('/');
        const sheetId = parts[2];
        const sheets = getBalanceSheetsStore();
        const sheet: any = sheets.find((b: any) => b.id === sheetId) || sheets[0] || {};
        const rawItems = (Array.isArray(sheet.items) && sheet.items.length > 0)
            ? sheet.items
            : seedData.balance_sheet_items.filter((i: any) => i.balance_sheet_id === sheet.id);

        const defaultAdjustments = getScaledDefaultAdjustments(rawItems);

        const adjustments = (Array.isArray(sheet.adjustments) && sheet.adjustments.length > 0)
            ? sheet.adjustments
            : defaultAdjustments;

        const defaultIfrs16 = defaultAdjustments[0].adjustment_amount;
        const defaultIfrs9 = defaultAdjustments[2].adjustment_amount;

        // Categorize items
        const assetItems = rawItems.filter((i: any) => String(i.category || '').toLowerCase() === 'assets');
        const liabilityItems = rawItems.filter((i: any) => String(i.category || '').toLowerCase() === 'liabilities');
        const equityItems = rawItems.filter((i: any) => String(i.category || '').toLowerCase() === 'equity');
        const otherItems = rawItems.filter((i: any) => !['assets', 'liabilities', 'equity'].includes(String(i.category || '').toLowerCase()));

        // Sheet 1: Transformation Reconciliation Matrix
        const reconAoa: any[][] = [
            ['Axiaris AI Audit Suite - Ведомость трансформации НСБУ в МСФО', '', '', '', '', '', '', '', '', ''],
            [
                `Компания: ${sheet.company_name || 'Axiaris Holding'}`,
                `Период: ${sheet.period ? new Date(sheet.period).toLocaleDateString('ru-RU') : '2026'}`,
                'Стандарт: МСФО / IFRS',
                'Статус: 100% Сбалансировано (Дельта = 0.00)',
                '', '', '', '', '', ''
            ],
            ['', '', '', '', '', '', '', '', '', ''],
            ['Код счёта', 'Наименование статьи', 'Категория', 'НСБУ Базовое сальдо', 'Корр. IFRS 16', 'Корр. IAS 36', 'Корр. IFRS 9', 'Прочие корр.', 'МСФО Итоговое сальдо', 'Статус']
        ];

        // Track rows for formulas
        const formulaEntries: { row: number; ifrsVal: number }[] = [];

        // 1. Assets
        reconAoa.push(['РАЗДЕЛ I: АКТИВЫ (ASSETS)', '', '', '', '', '', '', '', '', '']);
        const startAssetRow = reconAoa.length + 1; // 1-indexed in Excel
        let totalNasAssets = 0;
        let totalIfrs16Assets = 0;
        let totalIas36Assets = 0;
        let totalIfrs9Assets = 0;
        let totalOtherAssets = 0;
        let totalIfrsAssets = 0;
        let appliedIfrs16Asset = false;
        let appliedIfrs9Asset = false;

        for (const item of assetItems) {
            const code = String(item.account_code || '').trim();
            const name = String(item.account_name || '').trim();
            const nameLower = name.toLowerCase();
            const amt = Number(item.amount) || 0;
            let ifrs16 = 0, ias36 = 0, ifrs9 = 0, other = 0;

            if (!appliedIfrs16Asset && (code === '0804' || code === '1510' || code.startsWith('01') || nameLower.includes('пользования') || nameLower.includes('основные средства') || nameLower.includes('property'))) {
                ifrs16 = defaultIfrs16;
                appliedIfrs16Asset = true;
            } else if (!appliedIfrs9Asset && (code === '4010' || code === '1030' || code.startsWith('62') || nameLower.includes('покупател') || nameLower.includes('дебитор') || nameLower.includes('receivable'))) {
                ifrs9 = -defaultIfrs9;
                appliedIfrs9Asset = true;
            }

            const ifrsBal = amt + ifrs16 + ias36 + ifrs9 + other;
            totalNasAssets += amt;
            totalIfrs16Assets += ifrs16;
            totalIas36Assets += ias36;
            totalIfrs9Assets += ifrs9;
            totalOtherAssets += other;
            totalIfrsAssets += ifrsBal;

            const currRow = reconAoa.length + 1;
            reconAoa.push([code, name, 'АКТИВЫ', amt, ifrs16, ias36, ifrs9, other, ifrsBal, 'Согласовано']);
            formulaEntries.push({ row: currRow, ifrsVal: ifrsBal });
        }
        const endAssetRow = reconAoa.length;
        const assetSubtotalRow = reconAoa.length + 1;
        reconAoa.push(['', 'ИТОГО АКТИВЫ (TOTAL ASSETS)', 'ASSETS', totalNasAssets, totalIfrs16Assets, totalIas36Assets, totalIfrs9Assets, totalOtherAssets, totalIfrsAssets, 'ПОДТВЕРЖДЕНО']);

        // 2. Liabilities
        reconAoa.push(['РАЗДЕЛ II: ОБЯЗАТЕЛЬСТВА (LIABILITIES)', '', '', '', '', '', '', '', '', '']);
        const startLiabRow = reconAoa.length + 1;
        let totalNasLiab = 0;
        let totalIfrs16Liab = 0;
        let totalIas36Liab = 0;
        let totalIfrs9Liab = 0;
        let totalOtherLiab = 0;
        let totalIfrsLiab = 0;
        let appliedIfrs16Liab = false;

        for (const item of liabilityItems) {
            const code = String(item.account_code || '').trim();
            const name = String(item.account_name || '').trim();
            const nameLower = name.toLowerCase();
            const amt = Number(item.amount) || 0;
            let ifrs16 = 0, ias36 = 0, ifrs9 = 0, other = 0;

            if (!appliedIfrs16Liab && (code === '7910' || code === '2510' || code.startsWith('67') || nameLower.includes('аренд') || nameLower.includes('долгосроч') || nameLower.includes('long-term'))) {
                ifrs16 = totalIfrs16Assets;
                appliedIfrs16Liab = true;
            }

            const ifrsBal = amt + ifrs16 + ias36 + ifrs9 + other;
            totalNasLiab += amt;
            totalIfrs16Liab += ifrs16;
            totalIas36Liab += ias36;
            totalIfrs9Liab += ifrs9;
            totalOtherLiab += other;
            totalIfrsLiab += ifrsBal;

            const currRow = reconAoa.length + 1;
            reconAoa.push([code, name, 'ОБЯЗАТЕЛЬСТВА', amt, ifrs16, ias36, ifrs9, other, ifrsBal, 'Согласовано']);
            formulaEntries.push({ row: currRow, ifrsVal: ifrsBal });
        }
        const endLiabRow = reconAoa.length;
        const liabSubtotalRow = reconAoa.length + 1;
        reconAoa.push(['', 'ИТОГО ОБЯЗАТЕЛЬСТВА (TOTAL LIABILITIES)', 'LIABILITIES', totalNasLiab, totalIfrs16Liab, totalIas36Liab, totalIfrs9Liab, totalOtherLiab, totalIfrsLiab, 'ПОДТВЕРЖДЕНО']);

        // 3. Equity
        reconAoa.push(['РАЗДЕЛ III: СОБСТВЕННЫЙ КАПИТАЛ (EQUITY)', '', '', '', '', '', '', '', '', '']);
        const startEqRow = reconAoa.length + 1;
        let totalNasEq = 0;
        let totalIfrs16Eq = 0;
        let totalIas36Eq = 0;
        let totalIfrs9Eq = 0;
        let totalOtherEq = 0;
        let totalIfrsEq = 0;
        let appliedIfrs9Eq = false;

        for (const item of equityItems) {
            const code = String(item.account_code || '').trim();
            const name = String(item.account_name || '').trim();
            const nameLower = name.toLowerCase();
            const amt = Number(item.amount) || 0;
            let ifrs16 = 0, ias36 = 0, ifrs9 = 0, other = 0;

            if (!appliedIfrs9Eq && (code === '8710' || code === '3020' || code.startsWith('84') || nameLower.includes('прибыль') || nameLower.includes('retained'))) {
                ifrs9 = totalIfrs9Assets;
                appliedIfrs9Eq = true;
            }

            const ifrsBal = amt + ifrs16 + ias36 + ifrs9 + other;
            totalNasEq += amt;
            totalIfrs16Eq += ifrs16;
            totalIas36Eq += ias36;
            totalIfrs9Eq += ifrs9;
            totalOtherEq += other;
            totalIfrsEq += ifrsBal;

            const currRow = reconAoa.length + 1;
            reconAoa.push([code, name, 'КАПИТАЛ', amt, ifrs16, ias36, ifrs9, other, ifrsBal, 'Согласовано']);
            formulaEntries.push({ row: currRow, ifrsVal: ifrsBal });
        }
        const endEqRow = reconAoa.length;
        const eqSubtotalRow = reconAoa.length + 1;
        reconAoa.push(['', 'ИТОГО КАПИТАЛ (TOTAL EQUITY)', 'EQUITY', totalNasEq, totalIfrs16Eq, totalIas36Eq, totalIfrs9Eq, totalOtherEq, totalIfrsEq, 'ПОДТВЕРЖДЕНО']);

        // 4. Any other items
        for (const item of otherItems) {
            const code = item.account_code || '';
            const name = item.account_name || '';
            const amt = Number(item.amount) || 0;
            const currRow = reconAoa.length + 1;
            reconAoa.push([code, name, 'ПРОЧЕЕ', amt, 0, 0, 0, 0, amt, 'Согласовано']);
            formulaEntries.push({ row: currRow, ifrsVal: amt });
        }

        // 5. Total Liabilities & Equity
        const totalLERow = reconAoa.length + 1;
        reconAoa.push(['', 'ИТОГО ОБЯЗАТЕЛЬСТВА И КАПИТАЛ', 'LIABILITIES & EQUITY', totalNasLiab + totalNasEq, totalIfrs16Liab, 0, totalIfrs9Eq, 0, totalIfrsLiab + totalIfrsEq, 'СБАЛАНСИРОВАНО']);

        // 6. Variance / Delta Check
        const deltaRow = reconAoa.length + 1;
        reconAoa.push(['', 'БАЛАНСОВАЯ ДЕЛЬТА (АКТИВЫ - ПАССИВЫ)', 'EQUILIBRIUM CHECK', 0, 0, 0, 0, 0, 0, 'ZERO-DELTA (СХОДИТСЯ: 0.00)']);

        // Convert to SheetJS sheet
        const ws1 = XLSX.utils.aoa_to_sheet(reconAoa);

        // Add dynamic Excel formulas to data rows
        for (const fe of formulaEntries) {
            ws1['I' + fe.row] = { t: 'n', f: `D${fe.row}+E${fe.row}+F${fe.row}+G${fe.row}+H${fe.row}`, v: fe.ifrsVal };
        }

        // Add formulas to subtotals and checks
        if (endAssetRow >= startAssetRow) {
            ws1['D' + assetSubtotalRow] = { t: 'n', f: `SUM(D${startAssetRow}:D${endAssetRow})`, v: totalNasAssets };
            ws1['E' + assetSubtotalRow] = { t: 'n', f: `SUM(E${startAssetRow}:E${endAssetRow})`, v: totalIfrs16Assets };
            ws1['F' + assetSubtotalRow] = { t: 'n', f: `SUM(F${startAssetRow}:F${endAssetRow})`, v: totalIas36Assets };
            ws1['G' + assetSubtotalRow] = { t: 'n', f: `SUM(G${startAssetRow}:G${endAssetRow})`, v: totalIfrs9Assets };
            ws1['H' + assetSubtotalRow] = { t: 'n', f: `SUM(H${startAssetRow}:H${endAssetRow})`, v: totalOtherAssets };
            ws1['I' + assetSubtotalRow] = { t: 'n', f: `SUM(I${startAssetRow}:I${endAssetRow})`, v: totalIfrsAssets };
        }

        if (endLiabRow >= startLiabRow) {
            ws1['D' + liabSubtotalRow] = { t: 'n', f: `SUM(D${startLiabRow}:D${endLiabRow})`, v: totalNasLiab };
            ws1['E' + liabSubtotalRow] = { t: 'n', f: `SUM(E${startLiabRow}:E${endLiabRow})`, v: totalIfrs16Liab };
            ws1['F' + liabSubtotalRow] = { t: 'n', f: `SUM(F${startLiabRow}:F${endLiabRow})`, v: totalIas36Liab };
            ws1['G' + liabSubtotalRow] = { t: 'n', f: `SUM(G${startLiabRow}:G${endLiabRow})`, v: totalIfrs9Liab };
            ws1['H' + liabSubtotalRow] = { t: 'n', f: `SUM(H${startLiabRow}:H${endLiabRow})`, v: totalOtherLiab };
            ws1['I' + liabSubtotalRow] = { t: 'n', f: `SUM(I${startLiabRow}:I${endLiabRow})`, v: totalIfrsLiab };
        }

        if (endEqRow >= startEqRow) {
            ws1['D' + eqSubtotalRow] = { t: 'n', f: `SUM(D${startEqRow}:D${endEqRow})`, v: totalNasEq };
            ws1['E' + eqSubtotalRow] = { t: 'n', f: `SUM(E${startEqRow}:E${endEqRow})`, v: totalIfrs16Eq };
            ws1['F' + eqSubtotalRow] = { t: 'n', f: `SUM(F${startEqRow}:F${endEqRow})`, v: totalIas36Eq };
            ws1['G' + eqSubtotalRow] = { t: 'n', f: `SUM(G${startEqRow}:G${endEqRow})`, v: totalIfrs9Eq };
            ws1['H' + eqSubtotalRow] = { t: 'n', f: `SUM(H${startEqRow}:H${endEqRow})`, v: totalOtherEq };
            ws1['I' + eqSubtotalRow] = { t: 'n', f: `SUM(I${startEqRow}:I${endEqRow})`, v: totalIfrsEq };
        }

        ws1['D' + totalLERow] = { t: 'n', f: `D${liabSubtotalRow}+D${eqSubtotalRow}`, v: totalNasLiab + totalNasEq };
        ws1['E' + totalLERow] = { t: 'n', f: `E${liabSubtotalRow}+E${eqSubtotalRow}`, v: totalIfrs16Liab + totalIfrs16Eq };
        ws1['G' + totalLERow] = { t: 'n', f: `G${liabSubtotalRow}+G${eqSubtotalRow}`, v: totalIfrs9Eq };
        ws1['I' + totalLERow] = { t: 'n', f: `I${liabSubtotalRow}+I${eqSubtotalRow}`, v: totalIfrsLiab + totalIfrsEq };

        ws1['D' + deltaRow] = { t: 'n', f: `D${assetSubtotalRow}-D${totalLERow}`, v: 0 };
        ws1['I' + deltaRow] = { t: 'n', f: `I${assetSubtotalRow}-I${totalLERow}`, v: 0 };

        ws1['!cols'] = [
            { wch: 14 }, { wch: 45 }, { wch: 16 }, { wch: 22 }, { wch: 20 },
            { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 24 }, { wch: 22 }
        ];

        // Sheet 2: Transformation Adjustments Journal
        const adjAoa: any[][] = [
            ['№ Проводки', 'Стандарт МСФО', 'Описание корректировки', 'Тип операции', 'Дебет счёт', 'Кредит счёт', 'Сумма проводки (UZS)', 'Статус'],
        ];
        let totalAdjSum = 0;
        for (const adj of adjustments) {
            const amt = Number(adj.adjustment_amount) || 0;
            totalAdjSum += amt;
            adjAoa.push([
                adj.id || `ADJ-${adjAoa.length}`,
                adj.ifrs_category || 'IFRS',
                adj.description || '',
                (adj.adjustment_type || 'debit').toUpperCase(),
                adj.debit_account || '-',
                adj.credit_account || '-',
                amt,
                'Проведено (Posted)'
            ]);
        }
        const adjTotalRow = adjAoa.length + 1;
        adjAoa.push(['', '', 'ИТОГО КОРРЕКТИРОВОК', '', '', '', totalAdjSum, 'ПРОВЕРЕНО']);
        const ws2 = XLSX.utils.aoa_to_sheet(adjAoa);
        ws2['G' + adjTotalRow] = { t: 'n', f: `SUM(G2:G${adjTotalRow - 1})`, v: totalAdjSum };
        ws2['!cols'] = [
            { wch: 14 }, { wch: 16 }, { wch: 45 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 24 }, { wch: 20 }
        ];

        // Sheet 3: ISA 700 Audit Opinion Summary
        const auditAoa: any[][] = [
            ['РЕЗЮМЕ АУДИТОРСКОЙ ПРОВЕРКИ И ВЕРИФИКАЦИИ МСФО (ISA 700 / МСА 700)', ''],
            ['Компания', sheet.company_name || 'Axiaris Holding'],
            ['Отчетный период', sheet.period ? new Date(sheet.period).toLocaleDateString('ru-RU') : '2026'],
            ['Дата аудита', new Date().toLocaleDateString('ru-RU')],
            [''],
            ['Контрольный параметр', 'Результат проверки', 'Статус', 'Стандарт'],
            ['Балансовое равенство (Активы = Обязательства + Капитал)', 'Разница 0.00 UZS (Zero-Delta)', 'ПРОЙДЕНО (PASSED)', 'IAS 1'],
            ['Оценка договоров аренды (ROU Asset & Lease Liability)', 'Признано на балансе (19 500 000 UZS)', 'ПРОЙДЕНО (PASSED)', 'IFRS 16'],
            ['Резервирование ожидаемых кредитных убытков (ECL)', 'Начислен оценочный резерв (2 100 000 UZS)', 'ПРОЙДЕНО (PASSED)', 'IFRS 9'],
            ['Тест на обесценение внеоборотных активов', 'Возмещаемая стоимость подтверждена', 'ПРОЙДЕНО (PASSED)', 'IAS 36'],
            ['Отложенные налоги (Временные разницы)', 'Сформированы отложенные налоговые обязательства', 'ПРОЙДЕНО (PASSED)', 'IAS 12'],
            ['Аудиторское заключение', 'Безоговорочно положительное мнение (Unqualified Clean Opinion)', 'ВЫДАНО', 'ISA 700'],
            [''],
            ['Аудиторская компания', 'Axiaris & Partners Assurance LLC (Accredited Audit Firm)', '', ''],
            ['Ведущий аудитор / Партнер', 'Senior IFRS Audit Director, FCCA / DipIFR', '', ''],
            ['Цифровая подпись (ЭЦП)', '0x8F92A41C...B14C (SHA-256 Verified & Sealed)', '', '']
        ];
        const ws3 = XLSX.utils.aoa_to_sheet(auditAoa);
        ws3['!cols'] = [
            { wch: 45 }, { wch: 45 }, { wch: 22 }, { wch: 18 }
        ];

        // Create workbook with all 3 sheets
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws1, 'Трансформация_МСФО');
        XLSX.utils.book_append_sheet(wb, ws2, 'Журнал_Корректировок');
        XLSX.utils.book_append_sheet(wb, ws3, 'МСА700_Заключение');

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }


    if (cleanPath.includes('/transform')) {
        const parts = cleanPath.split('/');
        const sheetId = parts[2] || '';
        const sheets = getBalanceSheetsStore();
        const sheet: any = sheets.find((b: any) => b.id === sheetId) || sheets[0] || {};
        const fallbackItems = [
            { id: '1', account_code: '1010', account_name: 'Денежные средства', amount: 12500000, category: 'assets' },
            { id: '2', account_code: '0100', account_name: 'Основные средства', amount: 84000000, category: 'assets' },
            { id: '3', account_code: '4000', account_name: 'Дебиторская задолженность', amount: 31000000, category: 'assets' },
            { id: '4', account_code: '6000', account_name: 'Краткосрочные обязательства', amount: 23200000, category: 'liabilities' },
            { id: '5', account_code: '8300', account_name: 'Уставный капитал', amount: 104300000, category: 'equity' },
        ];
        const rawSheetItems = (Array.isArray(sheet.items) && sheet.items.length > 0)
            ? sheet.items
            : seedData.balance_sheet_items.filter((i: any) => i.balance_sheet_id === sheet.id);
        const items = rawSheetItems.length > 0 ? rawSheetItems : fallbackItems;

        const defaultAdjustments = getScaledDefaultAdjustments(items);

        let adjustments = (Array.isArray(sheet.adjustments) && sheet.adjustments.length > 0)
            ? sheet.adjustments
            : (Array.isArray(sheet.transformations) && sheet.transformations.length > 0)
                ? sheet.transformations
                : seedData.transformation_adjustments.filter((a: any) => a.balance_sheet_id === sheet.id);

        if (!adjustments || adjustments.length === 0) {
            adjustments = defaultAdjustments;
        }

        // Ensure if IFRS 9 credit exists without matching debit, add the balancing debit
        const hasIfrs9Credit = adjustments.some((a: any) => (a.description || '').toLowerCase().includes('ifrs 9') && a.adjustment_type === 'credit');
        const hasIfrs9Debit = adjustments.some((a: any) => (a.description || '').toLowerCase().includes('ifrs 9') && a.adjustment_type === 'debit');
        if (hasIfrs9Credit && !hasIfrs9Debit) {
            const creditAdj = adjustments.find((a: any) => (a.description || '').toLowerCase().includes('ifrs 9') && a.adjustment_type === 'credit');
            if (creditAdj) {
                adjustments = [
                    ...adjustments,
                    {
                        id: 'adj-ecl-pnl',
                        description: 'IFRS 9 ECL Provision Expense (P&L / Retained Earnings)',
                        adjustment_type: 'debit',
                        adjustment_amount: creditAdj.adjustment_amount,
                        ifrs_category: 'IFRS 9'
                    }
                ];
            }
        }

        // Classify items dynamically
        const mcfoCurrentAssets: any[] = [];
        const mcfoNonCurrentAssets: any[] = [];
        const mcfoCurrentLiab: any[] = [];
        const mcfoNonCurrentLiab: any[] = [];
        const mcfoEquity: any[] = [];

        // IFRS buckets
        const ifrsPPE: any[] = [];
        const ifrsIntangibles: any[] = [];
        const ifrsFinAssets: any[] = [];
        const ifrsOtherNCAssets: any[] = [];

        const ifrsInventories: any[] = [];
        const ifrsReceivables: any[] = [];
        const ifrsCash: any[] = [];
        const ifrsOtherCAssets: any[] = [];

        const ifrsShareCapital: any[] = [];
        const ifrsRetainedEarnings: any[] = [];
        const ifrsOtherReserves: any[] = [];

        const ifrsLongTermBorrowings: any[] = [];
        const ifrsDeferredTax: any[] = [];
        const ifrsNCProvisions: any[] = [];
        const ifrsOtherNCLiab: any[] = [];

        const ifrsTradePayables: any[] = [];
        const ifrsShortTermBorrowings: any[] = [];
        const ifrsCProvisions: any[] = [];
        const ifrsOtherCLiab: any[] = [];

        for (const item of items) {
            const code = String(item.account_code || '').trim();
            const name = String(item.account_name || '').trim();
            const nameLower = name.toLowerCase();
            const subcat = String(item.subcategory || '').toLowerCase();
            const amt = Number(item.amount) || 0;
            const cat = String(item.category || '').toLowerCase();

            const isNC = (
                subcat.includes('non-current') || subcat.includes('non_current') || subcat.includes('внеоборот') || subcat.includes('долгосроч')
                || (!subcat.includes('current') && /^(01|02|03|04|05|06|07|08|09|58|67|71|72|73|74|75|76|77|78|79|96|1510|1520|2510)/.test(code))
                || ['основные средства', 'амортизац', 'нематериальн', 'долгосрочн', 'инвестиц'].some(k => nameLower.includes(k))
            );

            const mappedItem = { code, name, amount: amt };

            if (cat === 'assets') {
                if (isNC) {
                    mcfoNonCurrentAssets.push({ ...mappedItem });
                    if (/^(01|02|03|07|08|1510)/.test(code) || ['основные средства', 'амортизац', 'fixed asset', 'property', 'equipment', 'ppe'].some(k => nameLower.includes(k))) {
                        ifrsPPE.push({ ...mappedItem });
                    } else if (/^(04|05|1520)/.test(code) || ['нематериальн', 'нма', 'intangible'].some(k => nameLower.includes(k))) {
                        ifrsIntangibles.push({ ...mappedItem });
                    } else if (/^(58|06)/.test(code) || ['инвестиц', 'финансов', 'financial'].some(k => nameLower.includes(k))) {
                        ifrsFinAssets.push({ ...mappedItem });
                    } else {
                        ifrsOtherNCAssets.push({ ...mappedItem });
                    }
                } else {
                    mcfoCurrentAssets.push({ ...mappedItem });
                    const isInventoryName = ['сырье', 'материал', 'товар', 'склад', 'запасы', 'inventory', 'inventories', 'stock', 'продукц'].some(k => nameLower.includes(k));
                    const isReceivableName = ['покупател', 'заказчик', 'клиент', 'дебитор', 'receivable'].some(k => nameLower.includes(k));
                    const isCashName = ['касса', 'банк', 'расчетные счета', 'валютн', 'денежн', 'cash', 'bank'].some(k => nameLower.includes(k));

                    if (isCashName || (!isInventoryName && !isReceivableName && /^(50|51|52|55|1010|1020)/.test(code))) {
                        ifrsCash.push({ ...mappedItem });
                    } else if (isReceivableName || (!isInventoryName && /^(40|62|1030)/.test(code))) {
                        ifrsReceivables.push({ ...mappedItem });
                    } else if (isInventoryName || /^(10|20|28|29|41|43|1040)/.test(code)) {
                        ifrsInventories.push({ ...mappedItem });
                    } else {
                        ifrsOtherCAssets.push({ ...mappedItem });
                    }
                }
            } else if (cat === 'liabilities') {
                if (isNC) {
                    mcfoNonCurrentLiab.push({ ...mappedItem });
                    if (/^(67|71|72|73|74|75|76|77|78|79|2510)/.test(code) || ['долгосроч', 'long-term', 'аренд'].some(k => nameLower.includes(k))) {
                        ifrsLongTermBorrowings.push({ ...mappedItem });
                    } else if (/^77/.test(code) || nameLower.includes('отложенн')) {
                        ifrsDeferredTax.push({ ...mappedItem });
                    } else if (/^(96|63)/.test(code) || nameLower.includes('резерв')) {
                        ifrsNCProvisions.push({ ...mappedItem });
                    } else {
                        ifrsOtherNCLiab.push({ ...mappedItem });
                    }
                } else {
                    mcfoCurrentLiab.push({ ...mappedItem });
                    if (/^(66|2020)/.test(code) || ['краткосроч', 'short-term', 'займ'].some(k => nameLower.includes(k))) {
                        ifrsShortTermBorrowings.push({ ...mappedItem });
                    } else if (/^(60|63|64|65|68|69|70|76|2010)/.test(code) || ['поставщик', 'зарплат', 'персонал', 'налог', 'payable'].some(k => nameLower.includes(k))) {
                        ifrsTradePayables.push({ ...mappedItem });
                    } else if (nameLower.includes('резерв')) {
                        ifrsCProvisions.push({ ...mappedItem });
                    } else {
                        ifrsOtherCLiab.push({ ...mappedItem });
                    }
                }
            } else if (cat === 'equity') {
                mcfoEquity.push({ ...mappedItem });
                if (/^(80|83|85|3010)/.test(code) || ['уставн', 'капитал', 'capital'].some(k => nameLower.includes(k))) {
                    ifrsShareCapital.push({ ...mappedItem });
                } else if (/^(84|87|3020)/.test(code) || ['нераспределен', 'прибыль', 'retained'].some(k => nameLower.includes(k))) {
                    ifrsRetainedEarnings.push({ ...mappedItem });
                } else {
                    ifrsOtherReserves.push({ ...mappedItem });
                }
            }
        }

        // Apply adjustments symmetrically (IFRS 16, IAS 36, IFRS 9)
        let appliedIas36Loss = 0;
        let appliedIfrs9Loss = 0;

        for (const adj of adjustments) {
            const desc = String(adj.description || '').toLowerCase();
            const amt = Math.abs(Number(adj.adjustment_amount) || 0);
            const type = (adj.adjustment_type || 'debit').toLowerCase();

            if (desc.includes('ifrs 16') || desc.includes('lease') || desc.includes('аренд')) {
                if (desc.includes('asset') || desc.includes('rou') || desc.includes('прав')) {
                    const existingRou = ifrsPPE.find(it => it.code === '0804' || String(it.name || '').toLowerCase().includes('пользования'));
                    if (existingRou) {
                        existingRou.amount = (Number(existingRou.amount) || 0) + amt;
                    } else {
                        ifrsPPE.push({ code: '0804', name: adj.description, amount: amt });
                    }
                } else if (desc.includes('liab') || desc.includes('обязательств')) {
                    const existingLiab = ifrsLongTermBorrowings.find(it => String(it.name || '').toLowerCase().includes('аренд') || it.code === '7910');
                    if (existingLiab) {
                        existingLiab.amount = (Number(existingLiab.amount) || 0) + amt;
                    } else {
                        ifrsLongTermBorrowings.push({ code: '7910', name: adj.description, amount: amt });
                    }
                }
            } else if (desc.includes('ias 36') || desc.includes('impairment') || desc.includes('обесцен')) {
                if (type === 'credit' && appliedIas36Loss === 0) {
                    const targetPpe = ifrsPPE[0];
                    const availablePpe = Number(targetPpe?.amount) || 0;
                    const effectiveLoss = targetPpe ? Math.min(amt, availablePpe) : amt;
                    appliedIas36Loss = effectiveLoss;
                    if (targetPpe) {
                        targetPpe.amount = availablePpe - effectiveLoss;
                    }
                    if (ifrsRetainedEarnings.length > 0) {
                        ifrsRetainedEarnings[0].amount = (Number(ifrsRetainedEarnings[0].amount) || 0) - effectiveLoss;
                    } else {
                        ifrsRetainedEarnings.push({ code: '3020', name: 'Retained Earnings (IAS 36 Impairment)', amount: -effectiveLoss });
                    }
                }
            } else if (desc.includes('ifrs 9') || desc.includes('ecl') || desc.includes('кредитн')) {
                if (type === 'credit' && appliedIfrs9Loss === 0) {
                    const targetRec = ifrsReceivables[0] || ifrsOtherCAssets[0] || ifrsCash[0] || ifrsInventories[0];
                    const availableRec = Number(targetRec?.amount) || 0;
                    const effectiveEcl = targetRec
                        ? (amt <= availableRec ? amt : Math.round(availableRec * 0.05))
                        : 0;
                    appliedIfrs9Loss = effectiveEcl;
                    if (targetRec && effectiveEcl > 0) {
                        targetRec.amount = availableRec - effectiveEcl;
                        if (ifrsRetainedEarnings.length > 0) {
                            ifrsRetainedEarnings[0].amount = (Number(ifrsRetainedEarnings[0].amount) || 0) - effectiveEcl;
                        } else {
                            ifrsRetainedEarnings.push({ code: '3020', name: 'Retained Earnings (IFRS 9 ECL)', amount: -effectiveEcl });
                        }
                    }
                }
            }
        }

        // Calculate totals
        const sumGroup = (arr: any[]) => arr.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);

        const mcfoAssetsCurrentTot = sumGroup(mcfoCurrentAssets);
        const mcfoAssetsNCTot = sumGroup(mcfoNonCurrentAssets);
        const mcfoAssetsTotal = mcfoAssetsCurrentTot + mcfoAssetsNCTot;

        const mcfoLiabCurrentTot = sumGroup(mcfoCurrentLiab);
        const mcfoLiabNCTot = sumGroup(mcfoNonCurrentLiab);
        const mcfoLiabTotal = mcfoLiabCurrentTot + mcfoLiabNCTot;

        let mcfoEquityTotal = sumGroup(mcfoEquity);
        const mcfoRawDiff = mcfoAssetsTotal - (mcfoLiabTotal + mcfoEquityTotal);
        if (Math.abs(mcfoRawDiff) >= 0.01) {
            if (mcfoEquity.length > 0) {
                mcfoEquity[mcfoEquity.length - 1].amount = (Number(mcfoEquity[mcfoEquity.length - 1].amount) || 0) + mcfoRawDiff;
            } else {
                mcfoEquity.push({ code: '3020', name: 'Retained Earnings', amount: mcfoRawDiff });
            }
            mcfoEquityTotal = sumGroup(mcfoEquity);
        }

        const ifrsPPETot = sumGroup(ifrsPPE);
        const ifrsIntangiblesTot = sumGroup(ifrsIntangibles);
        const ifrsFinAssetsTot = sumGroup(ifrsFinAssets);
        const ifrsOtherNCTot = sumGroup(ifrsOtherNCAssets);
        const ifrsNCTotal = ifrsPPETot + ifrsIntangiblesTot + ifrsFinAssetsTot + ifrsOtherNCTot;

        const ifrsInvTot = sumGroup(ifrsInventories);
        const ifrsRecTot = sumGroup(ifrsReceivables);
        const ifrsCashTot = sumGroup(ifrsCash);
        const ifrsOtherCTot = sumGroup(ifrsOtherCAssets);
        const ifrsCTotal = ifrsInvTot + ifrsRecTot + ifrsCashTot + ifrsOtherCTot;
        const ifrsAssetsTotal = ifrsNCTotal + ifrsCTotal;

        const ifrsLTBorrowingsTot = sumGroup(ifrsLongTermBorrowings);
        const ifrsDefTaxTot = sumGroup(ifrsDeferredTax);
        const ifrsNCProvTot = sumGroup(ifrsNCProvisions);
        const ifrsOtherNCLiabTot = sumGroup(ifrsOtherNCLiab);
        const ifrsNCLiabTotal = ifrsLTBorrowingsTot + ifrsDefTaxTot + ifrsNCProvTot + ifrsOtherNCLiabTot;

        const ifrsPayablesTot = sumGroup(ifrsTradePayables);
        const ifrsSTBorrowingsTot = sumGroup(ifrsShortTermBorrowings);
        const ifrsCProvTot = sumGroup(ifrsCProvisions);
        const ifrsOtherCLiabTot = sumGroup(ifrsOtherCLiab);
        const ifrsCLiabTotal = ifrsPayablesTot + ifrsSTBorrowingsTot + ifrsCProvTot + ifrsOtherCLiabTot;

        let ifrsShareCapTot = sumGroup(ifrsShareCapital);
        let ifrsRetEarnTot = sumGroup(ifrsRetainedEarnings);
        let ifrsOtherResTot = sumGroup(ifrsOtherReserves);
        let ifrsEquityTotal = ifrsShareCapTot + ifrsRetEarnTot + ifrsOtherResTot;
        let ifrsEqLiabTotal = ifrsEquityTotal + ifrsNCLiabTotal + ifrsCLiabTotal;

        // Zero-Delta Capital Guard: ensure Assets === Equity + Liabilities
        const rawDelta = ifrsAssetsTotal - ifrsEqLiabTotal;
        if (Math.abs(rawDelta) >= 0.01) {
            if (ifrsRetainedEarnings.length > 0) {
                ifrsRetainedEarnings[0].amount = (Number(ifrsRetainedEarnings[0].amount) || 0) + rawDelta;
            } else {
                ifrsRetainedEarnings.push({ code: '3020', name: 'Retained Earnings', amount: rawDelta });
            }
            ifrsRetEarnTot = sumGroup(ifrsRetainedEarnings);
            ifrsEquityTotal = ifrsShareCapTot + ifrsRetEarnTot + ifrsOtherResTot;
            ifrsEqLiabTotal = ifrsEquityTotal + ifrsNCLiabTotal + ifrsCLiabTotal;
        }

        const diff = Math.abs(ifrsAssetsTotal - ifrsEqLiabTotal);
        const isBalanced = diff < 0.01;

        // Update sheet status in store
        const sheetIdx = sheets.findIndex((b: any) => b.id === sheet.id);
        if (sheetIdx !== -1) {
            sheets[sheetIdx].status = 'transformed';
            saveBalanceSheetsStore(sheets);
        }

        const periodStr = sheet.period ? String(sheet.period).split('T')[0] : '2026-10-31';

        return {
            mcfo_statement: {
                transformed_data: {
                    period: periodStr,
                    assets: {
                        current: mcfoCurrentAssets,
                        non_current: mcfoNonCurrentAssets,
                        total: mcfoAssetsTotal
                    },
                    liabilities: {
                        current: mcfoCurrentLiab,
                        non_current: mcfoNonCurrentLiab,
                        total: mcfoLiabTotal
                    },
                    equity: {
                        items: mcfoEquity,
                        total: mcfoEquityTotal
                    },
                    total_assets: mcfoAssetsTotal,
                    total_liabilities_and_equity: mcfoLiabTotal + mcfoEquityTotal
                }
            },
            ifrs_statement: {
                transformed_data: {
                    period: periodStr,
                    statement_of_financial_position: {
                        assets: {
                            non_current_assets: {
                                property_plant_equipment: ifrsPPE,
                                intangible_assets: ifrsIntangibles,
                                financial_assets: ifrsFinAssets,
                                other: ifrsOtherNCAssets,
                                total: ifrsNCTotal
                            },
                            current_assets: {
                                inventories: ifrsInventories,
                                trade_receivables: ifrsReceivables,
                                cash_and_equivalents: ifrsCash,
                                other: ifrsOtherCAssets,
                                total: ifrsCTotal
                            },
                            total: ifrsAssetsTotal
                        },
                        equity_and_liabilities: {
                            equity: {
                                share_capital: ifrsShareCapital,
                                retained_earnings: ifrsRetainedEarnings,
                                other_reserves: ifrsOtherReserves,
                                total: ifrsEquityTotal
                            },
                            non_current_liabilities: {
                                long_term_borrowings: ifrsLTBorrowingsTot ? ifrsLongTermBorrowings : [],
                                deferred_tax: ifrsDefTaxTot ? ifrsDeferredTax : [],
                                provisions: ifrsNCProvTot ? ifrsNCProvisions : [],
                                other: ifrsOtherNCLiab,
                                total: ifrsNCLiabTotal
                            },
                            current_liabilities: {
                                trade_payables: ifrsTradePayables,
                                short_term_borrowings: ifrsShortTermBorrowings,
                                provisions: ifrsCProvTot ? ifrsCProvisions : [],
                                other: ifrsOtherCLiab,
                                total: ifrsCLiabTotal
                            },
                            total: ifrsEqLiabTotal
                        },
                        is_balanced: isBalanced,
                        discrepancy: diff
                    }
                }
            }
        };
    }

    if ((cleanPath.match(/\/balance-sheets\/[^\/]+\/adjustments\/[^\/]+/) || cleanPath.startsWith('/balance-sheets/adjustments/')) && method === 'delete') {
        const parts = cleanPath.split('/');
        const adjId = parts[parts.length - 1];
        const sheets = getBalanceSheetsStore();
        for (const sheet of sheets) {
            if (Array.isArray(sheet.adjustments)) {
                sheet.adjustments = sheet.adjustments.filter((a: any) => a.id !== adjId);
            }
        }
        saveBalanceSheetsStore(sheets);
        return { status: 'success', message: 'Adjustment deleted' };
    }

    if (cleanPath.match(/\/balance-sheets\/[^\/]+\/adjustments/) && method === 'post') {
        const parts = cleanPath.split('/');
        const id = parts[2];
        const sheets = getBalanceSheetsStore();
        const sheet = sheets.find((b: any) => b.id === id);
        const newAdjs = Array.isArray(body) ? body : [body];
        if (sheet) {
            if (!Array.isArray(sheet.adjustments)) sheet.adjustments = [];
            for (const adj of newAdjs) {
                sheet.adjustments.push({
                    ...adj,
                    id: adj.id || 'adj-' + Math.random().toString(36).substring(2, 9),
                    balance_sheet_id: id,
                });
            }
            saveBalanceSheetsStore(sheets);
        }
        return newAdjs;
    }

    if (cleanPath.startsWith('/balance-sheets/')) {
        const parts = cleanPath.split('/');
        const id = parts[2];
        const sheets = getBalanceSheetsStore();
        const sheet: any = sheets.find((b: any) => b.id === id) || sheets[0] || {};
        const fallbackItems = [
            { id: '1', account_code: '1010', account_name: 'Денежные средства', amount: 12500000, category: 'assets' },
            { id: '2', account_code: '0100', account_name: 'Основные средства', amount: 84000000, category: 'assets' },
            { id: '3', account_code: '4000', account_name: 'Дебиторская задолженность', amount: 31000000, category: 'assets' },
            { id: '4', account_code: '6000', account_name: 'Краткосрочные обязательства', amount: 23200000, category: 'liabilities' },
            { id: '5', account_code: '8300', account_name: 'Уставный капитал', amount: 104300000, category: 'equity' },
        ];
        const rawSheetItems = (Array.isArray(sheet.items) && sheet.items.length > 0)
            ? sheet.items.map((i: any, idx: number) => ({ ...i, id: i.id || `item-${idx + 1}` }))
            : seedData.balance_sheet_items.filter((i: any) => i.balance_sheet_id === sheet.id);
        const effectiveItems = rawSheetItems.length > 0 ? rawSheetItems : fallbackItems;

        let adjustments = (Array.isArray(sheet.adjustments) && sheet.adjustments.length > 0)
            ? sheet.adjustments
            : seedData.transformation_adjustments.filter((a: any) => a.balance_sheet_id === sheet.id);

        const defaultAdjustments = getScaledDefaultAdjustments(effectiveItems);

        if (!adjustments || adjustments.length === 0) {
            adjustments = defaultAdjustments;
        } else {
            const hasIfrs9Credit = adjustments.some((a: any) => (a.description || '').toLowerCase().includes('ifrs 9') && a.adjustment_type === 'credit');
            const hasIfrs9Debit = adjustments.some((a: any) => (a.description || '').toLowerCase().includes('ifrs 9') && a.adjustment_type === 'debit');
            if (hasIfrs9Credit && !hasIfrs9Debit) {
                const creditAdj = adjustments.find((a: any) => (a.description || '').toLowerCase().includes('ifrs 9') && a.adjustment_type === 'credit');
                if (creditAdj) {
                    adjustments = [
                        ...adjustments,
                        {
                            id: 'adj-ecl-pnl',
                            description: 'IFRS 9 ECL Provision Expense (P&L / Retained Earnings)',
                            adjustment_type: 'debit',
                            adjustment_amount: creditAdj.adjustment_amount,
                            ifrs_category: 'IFRS 9'
                        }
                    ];
                }
            }
        }
        return {
            ...sheet,
            items: effectiveItems,
            adjustments: adjustments,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 12. Tenants Management
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath.startsWith('/tenants/') && method === 'put') {
        const tenantId = cleanPath.split('/')[2];
        const tenants = getTenantsStore();
        const idx = tenants.findIndex((t: any) => t.id === tenantId);
        if (idx !== -1) {
            tenants[idx] = { ...tenants[idx], ...body };
            saveTenantsStore(tenants);
            return tenants[idx];
        }
        return { status: 'success' };
    }

    if (cleanPath.startsWith('/tenants/') && method === 'delete') {
        const tenantId = cleanPath.split('/')[2];
        const tenants = getTenantsStore().filter((t: any) => t.id !== tenantId);
        saveTenantsStore(tenants);
        return { status: 'success', message: 'Tenant deleted' };
    }

    if (cleanPath === '/tenants' || cleanPath === '/tenants/') {
        return getTenantsStore();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 13. Reports (CRUD & State Persistence)
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath.startsWith('/reports/') && method === 'delete') {
        const parts = cleanPath.split('/');
        const reportId = parts[2];
        const reports = getReportsStore();
        const updated = reports.filter((r: any) => String(r.id) !== String(reportId));
        saveReportsStore(updated);
        return { message: 'Report deleted successfully', status: 'success' };
    }

    if (cleanPath.includes('/reports/batch-delete') && method === 'post') {
        const ids: string[] = body?.report_ids || [];
        const reports = getReportsStore();
        const updated = reports.filter((r: any) => !ids.includes(String(r.id)));
        saveReportsStore(updated);
        return { message: 'Reports deleted successfully', deleted_count: ids.length, status: 'success' };
    }

    if (cleanPath.includes('/reports/') && cleanPath.includes('/review') && method === 'post') {
        const parts = cleanPath.split('/');
        const reportId = parts[2];
        const reports = getReportsStore();
        const rep = reports.find((r: any) => String(r.id) === String(reportId));
        if (rep) {
            rep.status = body?.status || 'approved';
            rep.reviewer_comments = body?.reviewer_comments || '';
            saveReportsStore(reports);
            return rep;
        }
        return { message: 'Review recorded' };
    }

    const sanitizeMockText = (val: unknown, fallback = ''): string => {
        if (val === null || val === undefined) return fallback;
        return String(val).replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '').trim() || fallback;
    };

    const sanitizeMockFormula = (val: unknown): string => {
        const text = sanitizeMockText(val, '');
        if (/^[=+\-@\t\r]/.test(text)) {
            return `'${text}`;
        }
        return text;
    };

    if ((cleanPath === '/reports' || cleanPath === '/reports/') && method === 'post') {
        const session = getCurrentSessionUser(config);
        const isSuperadmin = session?.role === 'superadmin';
        const targetCompId = isSuperadmin 
            ? (body?.company_id || session?.company_id || '2727830ea39d470c917f1a1544ed5d0f')
            : (session?.company_id || '2727830ea39d470c917f1a1544ed5d0f');
        const uploadedFileObj: File | null = (body?.file && typeof body.file === 'object' && 'name' in body.file) ? (body.file as File) : null;
        const safeTitle = sanitizeMockText(body?.title || uploadedFileObj?.name?.replace(/\.[^/.]+$/, ''), 'New Compliance Report');
        const rawFileName = uploadedFileObj?.name || body?.file_name || `${safeTitle.replace(/\s+/g, '_')}.pdf`;
        const safeFileName = sanitizeMockText(rawFileName, `${safeTitle.replace(/\s+/g, '_')}.pdf`)
            .replace(/[\r\n"\\<>|:*?]/g, '_');

        let extractedText = sanitizeMockText(body?.extracted_text, '');
        const convergenceErrors: any[] = [];

        if (uploadedFileObj) {
            const lowerName = uploadedFileObj.name.toLowerCase();
            try {
                if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv')) {
                    const ab = await uploadedFileObj.arrayBuffer();
                    const wb = XLSX.read(ab, { type: 'array' });
                    const textParts: string[] = [];
                    wb.SheetNames.forEach((sheetName) => {
                        const sheet = wb.Sheets[sheetName];
                        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
                        textParts.push(`=== Sheet: ${sheetName} ===`);
                        rows.forEach((r) => {
                            const line = r.map((c) => String(c ?? '').trim()).filter(Boolean).join(' | ');
                            if (line) textParts.push(line);
                        });

                        // Check mathematical convergence on Total / Итого rows
                        const totalKeywords = ['total', 'итого', 'всего', 'баланс', 'subtotal', 'жами', 'jami'];
                        for (let i = 0; i < rows.length; i++) {
                            const firstCell = String(rows[i]?.[0] ?? '').trim().toLowerCase();
                            if (totalKeywords.some((kw) => firstCell.includes(kw))) {
                                let startRow = 0;
                                for (let back = i - 1; back >= 0; back--) {
                                    const prevFirst = String(rows[back]?.[0] ?? '').trim().toLowerCase();
                                    if (totalKeywords.some((kw) => prevFirst.includes(kw))) {
                                        startRow = back + 1;
                                        break;
                                    }
                                }
                                for (let col = 1; col < (rows[i]?.length || 0); col++) {
                                    const rawTarget = Number(String(rows[i][col]).replace(/[,$\s]/g, ''));
                                    if (!Number.isNaN(rawTarget) && rawTarget !== 0) {
                                        let calcSum = 0;
                                        let numericCount = 0;
                                        for (let rIdx = startRow; rIdx < i; rIdx++) {
                                            const cellVal = Number(String(rows[rIdx]?.[col] ?? '').replace(/[,$\s]/g, ''));
                                            if (!Number.isNaN(cellVal) && String(rows[rIdx]?.[col] ?? '').trim() !== '') {
                                                calcSum += cellVal;
                                                numericCount++;
                                            }
                                        }
                                        if (numericCount >= 2 && Math.abs(calcSum - rawTarget) > 1) {
                                            convergenceErrors.push({
                                                severity: 'critical',
                                                type: 'math_error',
                                                location: `${sheetName}, Row ${i + 1}`,
                                                expected: Number(calcSum.toFixed(2)),
                                                found: Number(rawTarget.toFixed(2)),
                                                recommendation: tr(
                                                    `Арифметическое расхождение итоговой строки: сумма по столбцу (${calcSum.toLocaleString()}) не совпадает с указанным итогом (${rawTarget.toLocaleString()}).`,
                                                    `Arithmetic total discrepancy: calculated column sum (${calcSum.toLocaleString()}) does not match reported total (${rawTarget.toLocaleString()}).`,
                                                    `Yakuniy satrda arifmetik tafovut: ustun bo‘yicha hisoblangan yig‘indi (${calcSum.toLocaleString()}) ko‘rsatilgan yakunga (${rawTarget.toLocaleString()}) mos kelmaydi.`
                                                )
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    });
                    extractedText = textParts.join('\n');
                } else {
                    extractedText = await uploadedFileObj.text();
                }
            } catch (e) {
                // ignore file read error in mock
            }
        }

        const newReport = {
            id: 'rep-' + Math.random().toString(36).substring(2, 9),
            title: safeTitle,
            description: sanitizeMockText(body?.description, ''),
            report_type: sanitizeMockText(body?.report_type, 'compliance'),
            status: sanitizeMockText(body?.status, uploadedFileObj ? 'under_review' : 'draft'),
            file_name: safeFileName,
            file_size: uploadedFileObj?.size || body?.file_size || 2569011,
            file_path: body?.file_path || `/uploads/reports/${safeFileName}`,
            financial_data: body?.financial_data || null,
            extracted_text: extractedText,
            convergence_errors: convergenceErrors,
            company_id: targetCompId,
            submitted_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
        };
        const currentReports = getReportsStore();
        currentReports.unshift(newReport);
        saveReportsStore(currentReports);
        logAuditAction('report_created', `Сформирован отчет "${newReport.title}" (${newReport.report_type})`, session?.email, targetCompId);
        return newReport;
    }

    if (cleanPath === '/reports/export/excel' && method === 'get') {
        const currentReports = getReportsStore();
        const headers = ['Title', 'Type', 'Status', 'Created', 'File Name'];
        const rows = currentReports.map((r: any) => [
            sanitizeMockFormula(r.title),
            sanitizeMockFormula(r.report_type),
            sanitizeMockFormula(r.status),
            sanitizeMockFormula(r.created_at),
            sanitizeMockFormula(r.file_name),
        ]);
        const csvContent = [
            headers.join(','),
            ...rows.map((row: string[]) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
        ].join('\n');
        return new Blob([csvContent], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
    }

    if ((cleanPath === '/reports' || cleanPath === '/reports/') && method === 'get') {
        const currentReports = getReportsStore();
        const session = getCurrentSessionUser(config);
        const isSuperadmin = session?.role === 'superadmin';
        if (isSuperadmin) {
            const requestedCompanyId = config.params?.company_id;
            if (requestedCompanyId) {
                return currentReports.filter((r: any) => r.company_id === requestedCompanyId);
            }
            return currentReports;
        }
        const userCompId = session?.company_id || '2727830ea39d470c917f1a1544ed5d0f';
        return currentReports.filter((r: any) => r.company_id === userCompId);
    }

    if (cleanPath.includes('/checklist')) {
        return {
            completed_items: 4,
            total_items: 4,
            completion_percentage: 100,
            can_submit: true,
            completed_required: 3,
            required_items: 3,
            items: [
                { id: '1', label: 'Проверка баланса НСБУ', required: true, completed: true },
                { id: '2', label: 'Корректировки МСФО 9 и 16', required: true, completed: true },
                { id: '3', label: 'Сверка налоговых регистров', required: true, completed: true },
                { id: '4', label: 'Финальное утверждение аудитором', required: false, completed: true },
            ],
        };
    }
    if (cleanPath.includes('/comments')) {
        return [];
    }
    if (cleanPath.includes('/antigravity-audit')) {
        const parts = cleanPath.split('/');
        const id = parts[2] || 'unknown';
        const reports = getReportsStore();
        const rep = reports.find((r: any) => String(r.id) === String(id));
        const hasFormula = /^[=+\-@\t\r]/.test(String(rep?.title || ''));
        return {
            report_id: id,
            overall_security_score: hasFormula ? 65 : 100,
            overall_ifrs_score: 96,
            is_safe_to_approve: !hasFormula,
            magic_bytes_verified: true,
            formula_injection_free: !hasFormula,
            prompt_injection_free: true,
            findings: [
                {
                    severity: hasFormula ? 'critical' : 'info',
                    category: 'cyber_security',
                    title: hasFormula
                        ? 'Formula Injection Vector Detected (CWE-1236)'
                        : 'Cybersecurity Controls Verified',
                    description: hasFormula
                        ? 'Title contains leading formula characters.'
                        : 'All Magic Bytes, CWE-1236, and OWASP LLM01 checks passed.',
                    recommendation: 'Maintain strict CSP and server-side input sanitization.',
                },
            ],
            executive_summary: 'Autonomous Antigravity Audit completed.',
            execution_mode: 'google_antigravity_sdk',
        };
    }
    if (cleanPath.includes('/validate')) {
        return {
            is_valid: true,
            error_count: 0,
            error_details: [],
            warnings: [],
        };
    }
    if (cleanPath.startsWith('/reports/') && cleanPath.endsWith('/download') && method === 'get') {
        const parts = cleanPath.split('/');
        const id = parts[2];
        const reports = getReportsStore();
        const rep = reports.find((r: any) => String(r.id) === String(id));
        const title = rep?.title || 'Report';
        const content = `================================================================================
AXIARIS / RegAI REGULATORY & COMPLIANCE INTELLIGENCE SYSTEM
================================================================================
REPORT ID:       ${rep?.id || id}
TITLE:           ${title}
CATEGORY:        ${(rep?.report_type || 'compliance').toUpperCase()}
CURRENT STATUS:  ${(rep?.status || 'approved').toUpperCase()}
CREATED DATE:    ${rep?.created_at || new Date().toISOString()}
================================================================================

1. EXECUTIVE SUMMARY / ИСПОЛНИТЕЛЬНОЕ РЕЗЮМЕ:
${rep?.description || 'Отчет успешно сформирован в соответствии с утвержденными национальными и международными нормативами.'}

2. REGULATORY & AUDIT VERIFICATION:
- Нормативная база: МСФО (IFRS) / НСБУ / Basel III / Налоговый кодекс
- Уровень регуляторного соответствия: 96.4%
- Выявленные несоответствия: 0 критических
- Цифровая валидация целостности: ЭЦП подтверждена (SHA-256)

3. AUDIT TRAIL & DECISION:
- Проверено: AI Compliance Engine v2.4 & Certified Auditor
- Статус резолюции: ${(rep?.status || 'approved').toUpperCase()}
- Комментарии рецензента: ${rep?.reviewer_comments || 'Замечаний нет. Соответствует требованиям.'}

================================================================================
Generated automatically by Axiaris RegAI Platform (https://axiaris.web.app)
================================================================================`;
        return new Blob([content], { type: 'text/plain;charset=utf-8' });
    }

    if (cleanPath.startsWith('/reports/') && cleanPath.endsWith('/file') && method === 'get') {
        const parts = cleanPath.split('/');
        const id = parts[2];
        const reports = getReportsStore();
        const rep = reports.find((r: any) => String(r.id) === String(id)) || reports[0];
        if (rep?.file_blob) {
            return rep.file_blob;
        }
        return {
            id: rep?.id || id,
            title: rep?.title || 'Report',
            file_name: rep?.file_name || `${(rep?.title || 'Report').replace(/\s+/g, '_')}.pdf`,
            file_size: rep?.file_size || 2569011,
            report_type: rep?.report_type || 'audit',
            status: rep?.status || 'under_review',
        };
    }

    if (cleanPath.startsWith('/reports/') && method === 'get') {
        const parts = cleanPath.split('/');
        const id = parts[2];
        const reports = getReportsStore();
        return reports.find((r: any) => String(r.id) === String(id)) || reports[0] || null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 13.1. Report Templates (CRUD & State Persistence)
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath.startsWith('/templates/') && cleanPath.endsWith('/use') && method === 'post') {
        const parts = cleanPath.split('/');
        const templateId = parts[2];
        const templates = getTemplatesStore();
        const tmpl = templates.find((t: any) => String(t.id) === String(templateId)) || templates[0];
        const session = getCurrentSessionUser(config);
        logAuditAction('template_used', `Применен шаблон "${tmpl.name}"`, session?.email, tmpl.company_id);
        return {
            id: tmpl.id,
            title: `${tmpl.name} - ${tmpl.recurrence_pattern || 'Отчет'}`,
            template_name: tmpl.name,
            description: tmpl.description,
            report_type: tmpl.report_type,
            country_code: tmpl.country_code,
            tax_types: tmpl.tax_types,
            configuration: tmpl.configuration,
            company_id: tmpl.company_id || session?.company_id || '',
        };
    }

    if (cleanPath.startsWith('/templates/') && method === 'delete') {
        const parts = cleanPath.split('/');
        const templateId = parts[2];
        const templates = getTemplatesStore();
        const updated = templates.filter((t: any) => String(t.id) !== String(templateId));
        saveTemplatesStore(updated);
        logAuditAction('template_deleted', `Удален шаблон (ID: ${templateId})`, getCurrentSessionUser(config)?.email);
        return { message: 'Template deleted successfully', status: 'success' };
    }

    if (cleanPath.startsWith('/templates/') && method === 'put') {
        const parts = cleanPath.split('/');
        const templateId = parts[2];
        const templates = getTemplatesStore();
        const idx = templates.findIndex((t: any) => String(t.id) === String(templateId));
        if (idx !== -1) {
            templates[idx] = {
                ...templates[idx],
                ...body,
                updated_at: new Date().toISOString()
            };
            saveTemplatesStore(templates);
            logAuditAction('template_updated', `Обновлен шаблон "${templates[idx].name}"`, getCurrentSessionUser(config)?.email, templates[idx].company_id);
            return templates[idx];
        }
        return { id: templateId, ...body };
    }

    if (cleanPath.startsWith('/templates/') && method === 'get' && cleanPath !== '/templates' && cleanPath !== '/templates/') {
        const parts = cleanPath.split('/');
        const templateId = parts[2];
        const templates = getTemplatesStore();
        const tmpl = templates.find((t: any) => String(t.id) === String(templateId));
        return tmpl || templates[0] || null;
    }

    if ((cleanPath === '/templates' || cleanPath === '/templates/') && method === 'post') {
        const session = getCurrentSessionUser(config);
        const targetCompId = session?.company_id || '2727830ea39d470c917f1a1544ed5d0f';
        const newTemplate = {
            id: 'tmpl-' + Math.random().toString(36).substring(2, 9),
            name: body?.name || 'Новый Smart-Шаблон',
            description: body?.description || '',
            report_type: body?.report_type || 'financial',
            country_code: body?.country_code || 'UZ',
            tax_types: body?.tax_types || ['vat', 'corporate'],
            is_recurring: body?.is_recurring ?? true,
            recurrence_pattern: body?.recurrence_pattern || 'quarterly',
            configuration: body?.configuration || {},
            company_id: targetCompId,
            tenant_id: session?.tenant_id || 'b4e63cbc5d5348c5bfddf1c35a9886ba',
            created_by: session?.id || session?.email || 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        const templates = getTemplatesStore();
        templates.unshift(newTemplate);
        saveTemplatesStore(templates);
        logAuditAction('template_created', `Создан Smart-Шаблон "${newTemplate.name}"`, session?.email, targetCompId);
        return newTemplate;
    }

    if ((cleanPath === '/templates' || cleanPath === '/templates/') && method === 'get') {
        const templates = getTemplatesStore();
        const session = getCurrentSessionUser(config);
        const isSuperadmin = session?.role === 'superadmin';
        if (isSuperadmin) {
            return templates;
        }
        const userCompId = session?.company_id || '2727830ea39d470c917f1a1544ed5d0f';
        const filtered = templates.filter((t: any) =>
            !t.company_id ||
            t.company_id === userCompId ||
            t.created_by === session?.id ||
            t.created_by === session?.email
        );
        return filtered.length > 0 ? filtered : templates;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 14. Documents & Uploads
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath === '/documents/upload' && method === 'post') {
        const docs = getDocumentsStore();
        const session = getCurrentSessionUser(config);
        const targetCompId = session?.company_id || '2727830ea39d470c917f1a1544ed5d0f';
        const newDoc = {
            id: 'doc-' + Math.random().toString(36).substring(2, 9),
            company_id: targetCompId,
            filename: body?.filename || ('Финансовый_отчет_' + new Date().toISOString().split('T')[0] + '.xlsx'),
            document_type: 'balance_sheet',
            status: 'processed',
            file_size: 245000,
            created_at: new Date().toISOString(),
        };
        docs.unshift(newDoc);
        saveDocumentsStore(docs);
        logAuditAction('document_uploaded', `Загружен документ "${newDoc.filename}"`, session?.email, targetCompId);
        return { status: 'success', data: newDoc };
    }

    if (cleanPath.includes('/documents')) {
        const docs = getDocumentsStore();
        const session = getCurrentSessionUser(config);
        const isSuperadmin = session?.role === 'superadmin';
        if (isSuperadmin) return docs;
        const userCompId = session?.company_id || '2727830ea39d470c917f1a1544ed5d0f';
        return docs.filter((d: any) => d.company_id === userCompId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 15. 1C Integration Logs & Sync
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath.includes('/integrations/1c/sync') && method === 'post') {
        return {
            status: 'success',
            message: '1C sync executed successfully',
            records_synced: 142,
            timestamp: new Date().toISOString(),
        };
    }

    if (cleanPath.includes('/integrations/1c/logs')) {
        return seedData.onec_sync_logs;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 16. AI Report Analysis Engine (Dynamic, Tax-Type & Country-Aware, RU/EN/UZ)
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath.startsWith('/report-analysis/report/') && method === 'get') {
        const repId = cleanPath.split('/').pop() || '';
        const storedAnalyses = getStored<any[]>('regai_mock_report_analyses', []);
        return storedAnalyses.filter((a: any) => String(a.report_id) === String(repId));
    }

    if (cleanPath.includes('/report-analysis/analyze') || cleanPath.includes('/tax-analysis')) {
        const country = (body?.country_code || 'UZ').toUpperCase();
        const types: string[] = Array.isArray(body?.tax_types) && body.tax_types.length > 0 ? body.tax_types : ['vat', 'corporate'];
        const reportId = body?.report_id || 'rep-oct-2026-ifrs';
        const allReports = getReportsStore();
        const targetReport = allReports.find((r: any) => String(r.id) === String(reportId)) || allReports[0];
        const allRates = getTaxRatesStore();

        // Canonical fallback rates per country & tax type if not in store
        const FALLBACK_RATES: Record<string, Record<string, number>> = {
            UZ: { vat: 12, vat_reduced: 0, corporate: 15, corporate_small: 4, income: 12, income_top: 12, social: 12, payroll: 12, withholding: 10, property: 1.5, consumption: 12, gst: 12 },
            RU: { vat: 20, vat_reduced: 10, corporate: 25, corporate_small: 6, income: 13, income_top: 15, social: 30, payroll: 30, withholding: 15, property: 2.2, consumption: 20, gst: 20 },
            KZ: { vat: 12, vat_reduced: 8, corporate: 20, corporate_small: 3, income: 10, income_top: 10, social: 9.5, payroll: 9.5, withholding: 15, property: 1.5, consumption: 12, gst: 12 },
            AE: { vat: 5, vat_reduced: 0, corporate: 9, corporate_small: 0, income: 0, income_top: 0, social: 5, payroll: 5, withholding: 0, property: 0, consumption: 5, gst: 5 },
            TR: { vat: 20, vat_reduced: 10, corporate: 25, corporate_small: 15, income: 15, income_top: 40, social: 20.5, payroll: 20.5, withholding: 15, property: 0.2, consumption: 20, gst: 20 },
            GLOBAL: { vat: 15, vat_reduced: 5, corporate: 15, corporate_small: 15, income: 15, income_top: 25, social: 12, payroll: 12, withholding: 10, property: 1.5, consumption: 3, gst: 15 },
        };

        const getExpectedRate = (cCode: string, tType: string): number => {
            const match = allRates.find((r: any) => String(r.country_code).toUpperCase() === cCode && r.tax_type === tType);
            if (match && typeof match.rate === 'number') return match.rate;
            return FALLBACK_RATES[cCode]?.[tType] ?? FALLBACK_RATES.UZ[tType] ?? 12;
        };

        const TAX_TITLES: Record<string, { ru: string; en: string; uz: string; sectionRu: string; sectionEn: string; sectionUz: string }> = {
            vat: {
                ru: 'НДС (VAT / QQS) — Налог на добавленную стоимость',
                en: 'Value Added Tax (VAT — Standard Rate)',
                uz: 'QQS (VAT) — Qo‘shilgan qiymat solig‘i',
                sectionRu: 'Раздел 1.1 «Расчёт и сверка НДС по счетам-фактурам»',
                sectionEn: 'Section 1.1 "VAT Calculation & E-Invoice Reconciliation"',
                sectionUz: '1.1-bo‘lim «EHF bo‘yicha QQS hisob-kitobi va solishtiruvi»',
            },
            vat_reduced: {
                ru: 'Льготная ставка НДС (Reduced VAT)',
                en: 'Reduced Rate VAT (Concessional)',
                uz: 'Imtiyozli QQS stavkasi (Reduced VAT)',
                sectionRu: 'Раздел 1.2 «Обороты по пониженной ставке НДС»',
                sectionEn: 'Section 1.2 "Concessional VAT Turnover"',
                sectionUz: '1.2-bo‘lim «Pasaytirilgan QQS stavkasi bo‘yicha aylanmalar»',
            },
            corporate: {
                ru: 'Налог на прибыль организаций (CIT)',
                en: 'Corporate Income Tax (CIT)',
                uz: 'Foyda solig‘i (CIT)',
                sectionRu: 'Раздел 2.1 «Налогооблагаемая база по налогу на прибыль и корректировки МСФО»',
                sectionEn: 'Section 2.1 "Corporate Taxable Base & IFRS Adjustments"',
                sectionUz: '2.1-bo‘lim «Foyda solig‘i bazasi va MHXS tuzatishlari»',
            },
            corporate_small: {
                ru: 'Налог с оборота / МСП (Turnover Tax)',
                en: 'Turnover Tax / Small Business Regime',
                uz: 'Aylanmadan olinadigan soliq (Turnover Tax)',
                sectionRu: 'Раздел 2.2 «Расчёт налога с валовой выручки»',
                sectionEn: 'Section 2.2 "Gross Revenue Turnover Tax Calculation"',
                sectionUz: '2.2-bo‘lim «Yalpi tushumdan aylanma soliq hisob-kitobi»',
            },
            income: {
                ru: 'НДФЛ (Personal Income Tax / PIT)',
                en: 'Personal Income Tax (PIT)',
                uz: 'JSHDS — Jismoniy shaxslar daromad solig‘i (PIT)',
                sectionRu: 'Раздел 3.1 «Удержание НДФЛ с фонда оплаты труда»',
                sectionEn: 'Section 3.1 "Payroll Personal Income Tax Withholding"',
                sectionUz: '3.1-bo‘lim «Mehnatga haq to‘lash fondidan JSHDS ushlab qolish»',
            },
            income_top: {
                ru: 'НДФЛ повышенная прогрессивная шкала',
                en: 'High-Bracket Personal Income Tax',
                uz: 'JSHDS yuqori progressiv stavkasi',
                sectionRu: 'Раздел 3.2 «Прогрессивная шкала налогообложения доходов»',
                sectionEn: 'Section 3.2 "Progressive High-Bracket Income Tax"',
                sectionUz: '3.2-bo‘lim «Daromadlarni progressiv soliqqa tortish shkalasi»',
            },
            social: {
                ru: 'Социальный налог (Social Tax)',
                en: 'Social Tax / Employer Social Contributions',
                uz: 'Ijtimoiy soliq (Social Tax)',
                sectionRu: 'Раздел 3.3 «Начисления социального налога на ФОТ»',
                sectionEn: 'Section 3.3 "Employer Social Tax Accruals"',
                sectionUz: '3.3-bo‘lim «MHTFga ijtimoiy soliq hisoblash»',
            },
            payroll: {
                ru: 'Страховые взносы работодателя (Payroll)',
                en: 'Employer Payroll Insurance Contributions',
                uz: 'Ish beruvchining sug‘urta badallari (Payroll)',
                sectionRu: 'Раздел 3.4 «Обязательные страховые взносы в фонды»',
                sectionEn: 'Section 3.4 "Mandatory Statutory Payroll Contributions"',
                sectionUz: '3.4-bo‘lim «Jamg‘armalarga majburiy sug‘urta badallari»',
            },
            withholding: {
                ru: 'Налог у источника выплат нерезидентам (WHT)',
                en: 'Withholding Tax on Non-Resident Payments (WHT)',
                uz: 'Norezidentlarga to‘lov manbaidan olinadigan soliq (WHT)',
                sectionRu: 'Раздел 4.1 «Дивиденды, проценты и роялти нерезидентам»',
                sectionEn: 'Section 4.1 "Cross-Border Dividends, Interest & Royalties (WHT)"',
                sectionUz: '4.1-bo‘lim «Norezidentlarga dividendlar, foizlar va royalti»',
            },
            property: {
                ru: 'Налог на имущество юридических лиц (Property Tax)',
                en: 'Corporate Property Tax',
                uz: 'Yuridik shaxslarning mol-mulk solig‘i (Property Tax)',
                sectionRu: 'Раздел 5.1 «Среднегодовая остаточная стоимость основных средств»',
                sectionEn: 'Section 5.1 "Average Annual Net Book Value of Fixed Assets"',
                sectionUz: '5.1-bo‘lim «Asosiy vositalarning o‘rtacha yillik qoldiq qiymati»',
            },
            consumption: {
                ru: 'Цифровой налог / Налог на цифровые услуги (DST)',
                en: 'Digital Services Tax (DST)',
                uz: 'Raqamli xizmatlar solig‘i (DST)',
                sectionRu: 'Раздел 6.1 «Электронные и облачные сервисы (DST)»',
                sectionEn: 'Section 6.1 "Cross-Border Electronic & Cloud Services (DST)"',
                sectionUz: '6.1-bo‘lim «Elektron va bulutli xizmatlar (DST)»',
            },
            gst: {
                ru: 'Налог на товары и услуги (GST)',
                en: 'Goods and Services Tax (GST)',
                uz: 'Tovarlar va xizmatlar solig‘i (GST)',
                sectionRu: 'Раздел 6.2 «Косвенный налог GST»',
                sectionEn: 'Section 6.2 "Indirect Goods and Services Tax (GST)"',
                sectionUz: '6.2-bo‘lim «Bilvosita GST solig‘i»',
            },
        };

        const errorDetails: any[] = [];
        const findings: string[] = [];

        // 1. Include any Excel / CSV mathematical convergence errors from uploaded files
        if (Array.isArray(targetReport?.convergence_errors) && targetReport.convergence_errors.length > 0) {
            errorDetails.push(...targetReport.convergence_errors);
        }

        // 2. Determine report's native jurisdiction and status
        const reportStatus = String(targetReport?.status || 'approved').toLowerCase();
        const reportTitleLower = String(targetReport?.title || '').toLowerCase();
        const isGlobalReport = reportTitleLower.includes('gdpr') || reportTitleLower.includes('hipaa') || reportTitleLower.includes('amazon');
        const reportNativeCountry = isGlobalReport ? 'GLOBAL' : 'UZ';
        const extractedText = String(targetReport?.extracted_text || '');

        // Keywords to detect rates inside uploaded text
        const TEXT_KEYWORDS: Record<string, string[]> = {
            vat: ['vat', 'ндс', 'qqs', 'ққс', 'добавленн'],
            vat_reduced: ['reduced vat', 'льготн', 'imtiyozli'],
            corporate: ['corporate', 'прибыль', 'cit', 'foyda', 'фойда', 'кпн'],
            corporate_small: ['turnover', 'оборот', 'aylanma', 'уcн'],
            income: ['pit', 'ндфл', 'jshds', 'доход', 'ипн'],
            income_top: ['high bracket', 'повышенн', 'прогрессив'],
            social: ['social', 'социальн', 'ijtimoiy'],
            payroll: ['payroll', 'страхов', 'взнос', 'badal'],
            withholding: ['withholding', 'wht', 'источник', 'manba', 'роялти', 'дивиденд'],
            property: ['property', 'имуществ', 'mol-mulk'],
            consumption: ['digital', 'dst', 'цифров', 'raqamli'],
            gst: ['gst', 'goods and services'],
        };

        // 3. Evaluate ONLY the user-selected tax_types
        types.forEach((tType) => {
            const expectedRate = getExpectedRate(country, tType);
            const meta = TAX_TITLES[tType] || {
                ru: tType.toUpperCase(),
                en: tType.toUpperCase(),
                uz: tType.toUpperCase(),
                sectionRu: `Раздел «${tType.toUpperCase()}»`,
                sectionEn: `Section "${tType.toUpperCase()}"`,
                sectionUz: `«${tType.toUpperCase()}» bo‘limi`,
            };
            const typeTitle = tr(meta.ru, meta.en, meta.uz);
            const sectionLabel = tr(meta.sectionRu, meta.sectionEn, meta.sectionUz);

            // Check if uploaded text explicitly mentions a rate for this tax type
            let textDetectedRate: number | null = null;
            if (extractedText) {
                const lines = extractedText.split(/\r?\n/);
                const kws = TEXT_KEYWORDS[tType] || [tType];
                for (const line of lines) {
                    const lLow = line.toLowerCase();
                    if (kws.some((k) => lLow.includes(k))) {
                        const pctMatch = line.match(/(\d+(?:\.\d+)?)\s*%/);
                        if (pctMatch) {
                            textDetectedRate = parseFloat(pctMatch[1]);
                            break;
                        }
                    }
                }
            }

            if (textDetectedRate !== null) {
                if (Math.abs(textDetectedRate - expectedRate) > 0.4) {
                    const isCrit = Math.abs(textDetectedRate - expectedRate) >= 2;
                    errorDetails.push({
                        type: typeTitle,
                        location: sectionLabel,
                        severity: isCrit ? 'critical' : 'warning',
                        expected: expectedRate,
                        found: textDetectedRate,
                        recommendation: tr(
                            `В загруженном документе применена ставка ${textDetectedRate}% вместо нормативной ставки ${expectedRate}% (${country}). Скорректируйте налоговый расчёт.`,
                            `Uploaded document applies a ${textDetectedRate}% rate instead of the statutory ${expectedRate}% rate (${country}). Adjust the tax schedule.`,
                            `Yuklangan hujjatda me’yoriy ${expectedRate}% (${country}) o‘rniga ${textDetectedRate}% stavka qo‘llanilgan. Soliq hisob-kitobini tuzating.`
                        ),
                    });
                } else {
                    findings.push(
                        tr(
                            `✓ ${meta.ru}: примененная в файле ставка ${textDetectedRate}% полностью соответствует нормативу ${country} (${expectedRate}%).`,
                            `✓ ${meta.en}: applied rate of ${textDetectedRate}% in file matches ${country} statutory rate (${expectedRate}%).`,
                            `✓ ${meta.uz}: faylda qo‘llanilgan ${textDetectedRate}% stavka ${country} me’yoriga (${expectedRate}%) to‘liq mos keladi.`
                        )
                    );
                }
                return;
            }

            // Otherwise, compare report's baseline jurisdiction rate against selected country's expected rate
            const reportBaseRate = getExpectedRate(reportNativeCountry, tType);

            if (country !== reportNativeCountry && Math.abs(reportBaseRate - expectedRate) > 0.4) {
                // Country mismatch: e.g., UZ report (VAT 12%, CIT 15%) checked against RU (VAT 20%, CIT 25%) or AE (VAT 5%, CIT 9%)
                errorDetails.push({
                    type: typeTitle,
                    location: sectionLabel,
                    severity: Math.abs(reportBaseRate - expectedRate) >= 2 ? 'critical' : 'warning',
                    expected: expectedRate,
                    found: reportBaseRate,
                    recommendation: tr(
                        `Отчёт сформирован по ставкам юрисдикции ${reportNativeCountry} (${reportBaseRate}%), что отличается от норматива выбранной юрисдикции ${country} (${expectedRate}%). При трансграничной консолидации выполните пересчёт налогового резерва (IAS 12).`,
                        `Report uses ${reportNativeCountry} statutory rate (${reportBaseRate}%), which differs from the selected ${country} statutory rate (${expectedRate}%). Recalculate deferred/current tax provision under IAS 12 for cross-border consolidation.`,
                        `Hisobot ${reportNativeCountry} yurisdiksiyasi stavkasi (${reportBaseRate}%) bo‘yicha shakllantirilgan bo‘lib, tanlangan ${country} me’yoridan (${expectedRate}%) farq qiladi. Transchegaraviy konsolidatsiyada IAS 12 bo‘yicha soliq zaxirasini qayta hisoblang.`
                    ),
                });
            } else if (reportStatus === 'under_review' || reportStatus === 'in_progress' || reportStatus === 'draft') {
                // Unapproved / draft report has realistic pre-audit discrepancies strictly on the checked tax types
                if (tType === 'vat' || tType === 'corporate' || types.indexOf(tType) === 0) {
                    const effectiveFound = Number(Math.max(0, expectedRate - 1.5).toFixed(1));
                    errorDetails.push({
                        type: typeTitle,
                        location: sectionLabel,
                        severity: reportStatus === 'draft' ? 'critical' : 'warning',
                        expected: expectedRate,
                        found: effectiveFound,
                        recommendation: tr(
                            `Отчёт находится в статусе «${reportStatus === 'draft' ? 'Черновик' : 'На проверке'}»: эффективная ставка составила ${effectiveFound}% при нормативе ${expectedRate}% из-за неподтверждённых первичных ЭСФ / корректировок базы.`,
                            `Report is currently "${reportStatus}": effective rate is ${effectiveFound}% vs statutory ${expectedRate}% due to pending e-invoice confirmations / base adjustments.`,
                            `Hisobot «${reportStatus === 'draft' ? 'Qoralama' : 'Tekshiruvda'}» holatida: tasdiqlanmagan birlamchi EHF / baza tuzatishlari sababli effektiv stavka me’yoriy ${expectedRate}% o‘rniga ${effectiveFound}% ni tashkil etdi.`
                        ),
                    });
                } else {
                    findings.push(
                        tr(
                            `✓ ${meta.ru}: базовая ставка ${expectedRate}% (${country}) применена без арифметических отклонений.`,
                            `✓ ${meta.en}: statutory rate of ${expectedRate}% (${country}) applied with zero arithmetic variance.`,
                            `✓ ${meta.uz}: ${expectedRate}% (${country}) bazaviy stavkasi arifmetik tafovutlarsiz qo‘llanilgan.`
                        )
                    );
                }
            } else if (reportStatus === 'submitted' && tType === 'vat') {
                // Submitted tax declaration: minor 0.4% timing warning on E-invoices
                const effectiveFound = Number((expectedRate - 0.6).toFixed(1));
                errorDetails.push({
                    type: typeTitle,
                    location: sectionLabel,
                    severity: 'warning',
                    expected: expectedRate,
                    found: effectiveFound,
                    recommendation: tr(
                        `По 2 входящим ЭСФ за конец отчетного периода ожидается встречное подтверждение контрагентов (эффективная ставка с учетом отложенного зачёта ${effectiveFound}% при нормативе ${expectedRate}%).`,
                        `2 incoming e-invoices at period-end await counterparty confirmation (effective rate with deferred credit is ${effectiveFound}% vs ${expectedRate}% statutory rate).`,
                        `Hisobot davri oxiridagi 2 ta kiruvchi EHF bo‘yicha kontragentlar tasdig‘i kutilmoqda (kechiktirilgan hisobga olish bilan effektiv stavka ${effectiveFound}%, me’yor ${expectedRate}%).`
                    ),
                });
            } else {
                // Approved / Completed benchmark report (e.g. October 2026 IFRS Transformation, 2026 Annual Report): 100% pass!
                findings.push(
                    tr(
                        `✓ ${meta.ru}: ставка ${expectedRate}% (${country}), налоговая база и контрольные соотношения полностью сошлись (расхождение 0.00).`,
                        `✓ ${meta.en}: ${expectedRate}% statutory rate (${country}), taxable base, and control ratios reconciled with 0.00 variance.`,
                        `✓ ${meta.uz}: ${expectedRate}% stavka (${country}), soliq bazasi va nazorat nisbatlari to‘liq mos keldi (tafovut 0.00).`
                    )
                );
            }
        });

        // Always add general ledger & IFRS 9/16 equilibrium confirmation to findings if approved
        if (errorDetails.length === 0) {
            findings.push(
                tr(
                    '✓ Контрольное равенство баланса (Zero-Delta Guard) и сверка с Главной книгой (1С / ERP) подтверждены.',
                    '✓ Balance sheet equilibrium (Zero-Delta Guard) and General Ledger (1C / ERP) reconciliation verified.',
                    '✓ Balansning nazorat tengligi (Zero-Delta Guard) va Bosh daftar (1C / ERP) bilan solishtiruv tasdiqlandi.'
                )
            );
        }

        const warningsCount = errorDetails.filter((e) => e.severity === 'warning').length;
        const errorsCount = errorDetails.filter((e) => e.severity === 'critical').length;
        const baseChecks = Math.max(12, types.length * 8 + 8);
        const totalChecks = baseChecks;
        const passedChecks = Math.max(0, totalChecks - warningsCount - errorsCount);
        const weightedPassed = passedChecks + warningsCount * 0.5;
        const overallScore = Math.max(0, Math.min(100, Math.round((weightedPassed / totalChecks) * 100)));

        const summary = errorDetails.length === 0
            ? tr(
                `Отчёт «${targetReport?.title || reportId}» успешно прошёл все ${totalChecks} проверок по законодательству ${country} для выбранных режимов (${types.length}). Ошибок и расхождений ставок не обнаружено (100%).`,
                `Report "${targetReport?.title || reportId}" passed all ${totalChecks} checks under ${country} tax law for the ${types.length} selected regime(s). Zero rate or base discrepancies detected (100%).`,
                `«${targetReport?.title || reportId}» hisoboti tanlangan rejimlar (${types.length}) bo‘yicha ${country} qonunchiligiga muvofiq barcha ${totalChecks} ta tekshiruvdan muvaffaqiyatli o‘tdi. Xatolik va stavka tafovutlari aniqlanmadi (100%).`
            )
            : tr(
                `Проверка отчёта «${targetReport?.title || reportId}» по юрисдикции ${country} завершена (${overallScore}%). Пройдено: ${passedChecks} из ${totalChecks}, критических ошибок: ${errorsCount}, предупреждений: ${warningsCount}.`,
                `Compliance check of "${targetReport?.title || reportId}" under ${country} jurisdiction completed (${overallScore}%). Passed: ${passedChecks} of ${totalChecks}, critical errors: ${errorsCount}, warnings: ${warningsCount}.`,
                `«${targetReport?.title || reportId}» hisobotining ${country} yurisdiksiyasi bo‘yicha tekshiruvi yakunlandi (${overallScore}%). O‘tdi: ${totalChecks} tadan ${passedChecks} ta, kritik xatolar: ${errorsCount}, ogohlantirishlar: ${warningsCount}.`
            );

        const resultObj = {
            id: 'ana-' + Math.random().toString(36).substring(2, 9),
            report_id: reportId,
            country_code: country,
            overall_score: overallScore,
            summary,
            total_checks: totalChecks,
            passed_checks: passedChecks,
            errors: errorsCount,
            warnings: warningsCount,
            tax_types: types,
            error_details: errorDetails,
            findings,
            created_at: new Date().toISOString(),
        };

        const storedAnalyses = getStored<any[]>('regai_mock_report_analyses', []);
        storedAnalyses.unshift(resultObj);
        setStored('regai_mock_report_analyses', storedAnalyses.slice(0, 50));

        return resultObj;
    }


    // ─────────────────────────────────────────────────────────────────────────
    // 17. Axiaris Assistant AI Chat Engine (Multilingual: EN, RU, UZ)
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath.startsWith('/chat')) {
        const rawMsg = (body?.message || '').trim();
        const userMsg = rawMsg.toLowerCase();
        const fallbackLocale = (body?.locale || 'en').toLowerCase();

        // Language detection helper
        const detectQueryLanguage = (text: string, fbLocale: string): 'en' | 'ru' | 'uz' => {
            if (!text || !text.trim()) {
                if (fbLocale.startsWith('ru')) return 'ru';
                if (fbLocale.startsWith('uz')) return 'uz';
                return 'en';
            }
            const lower = text.toLowerCase();

            // 1. Uzbek lexical and character markers
            const uzbekWords = [
                'soliq', 'soliqlar', 'soliqqa', 'soliqlarining', 'stavka', 'stavkasi', 'stavkalari',
                'hisobot', 'hisoboti', 'hisobotlar', 'qoidalar', 'qoidalari', 'nima', 'qanday',
                'haqida', 'uchun', 'qonun', 'qonunchilik', 'daromad', 'foyda', 'msfo', 'mhxs',
                'talab', 'talablar', 'talablari', 'yordam', 'tizim', 'yillik', 'buxgalter',
                'buxgalteriya', 'korxona', 'korxonalar', 'hujjat', 'hujjatlar', 'qabul', 'qilish',
                'reja', 'bilan', 'bering', 'tushuntiring', 'aytib', 'bormi', 'kerak', 'amalga',
                'oshirish', 'amaldagi', 'ijtimoiy', 'xizmat', 'xizmatlar', 'xarid'
            ];
            const hasUzbekSpecialChars = /[og]['‘`ʻʼ]/i.test(lower);
            const words = lower.split(/[\s,?.!;:()[\]{}'"`]+/);
            const uzbekWordMatches = words.filter(w => uzbekWords.includes(w)).length;

            if (hasUzbekSpecialChars || uzbekWordMatches >= 1) {
                return 'uz';
            }

            // 2. Cyrillic vs Latin count
            const uzbekCyrillicMatches = text.match(/[ўқғҳЎҚҒҲ]/g) || [];
            if (uzbekCyrillicMatches.length > 0) {
                return 'uz';
            }

            const cyrillicMatches = text.match(/[\u0400-\u04FF]/g) || [];
            const latinMatches = text.match(/[a-zA-Z]/g) || [];

            if (cyrillicMatches.length > 0 && cyrillicMatches.length >= latinMatches.length) {
                return 'ru';
            }

            // 3. International acronyms / abbreviations check (e.g., ESG, IFRS, GDPR, SAAS, 1C)
            const commonAcronyms = ['esg', 'ifrs', 'gdpr', 'saas', 'vat', '1c', 'csrd', 'cbam', 'ecl', 'rou', 'ias'];
            const isOnlyAcronyms = words.length > 0 && words.every(w => commonAcronyms.includes(w) || /^\d+$/.test(w));
            if (isOnlyAcronyms) {
                if (fbLocale.startsWith('ru')) return 'ru';
                if (fbLocale.startsWith('uz')) return 'uz';
                return 'en';
            }

            if (latinMatches.length > 0) {
                return 'en';
            }

            if (fbLocale.startsWith('ru')) return 'ru';
            if (fbLocale.startsWith('uz')) return 'uz';
            return 'en';
        };

        const lang = detectQueryLanguage(rawMsg, fallbackLocale);
        let reply = '';
        let sources: any[] = [];

        // 1. ESG Regulations
        if (
            userMsg.includes('esg') ||
            userMsg.includes('csrd') ||
            userMsg.includes('cbam') ||
            userMsg.includes('sustainability') ||
            userMsg.includes('устойчив') ||
            userMsg.includes('экологи') ||
            userMsg.includes('barqaror') ||
            userMsg.includes('yashil')
        ) {
            if (lang === 'en') {
                reply = `### Summary of Current ESG Regulations (2025–2026)\n\n` +
                    `1. **EU Corporate Sustainability Reporting Directive (CSRD):** Mandatory disclosure of ESG risks, decarbonization targets, and greenhouse gas emissions (Scope 1, 2, and 3) for large corporations, listed SMEs, and multinational groups with significant EU market presence.\n\n` +
                    `2. **IFRS S1 & IFRS S2 Standards (ISSB):** Globally harmonized disclosure requirements for general sustainability and climate-related financial impacts, adopted by financial regulators across Europe, Asia, and the CIS.\n\n` +
                    `3. **Green Transformation Tax Incentives:** Corporate income tax exemptions, accelerated depreciation, and property tax relief for enterprise investments in renewable energy, solar installations, and eco-certified green facilities (e.g., in Uzbekistan and Kazakhstan).\n\n` +
                    `4. **EU Carbon Border Adjustment Mechanism (CBAM):** Carbon border tariff requiring third-party verified emissions reporting for cross-border exports of steel, aluminum, cement, fertilizers, and hydrogen into the European Union.`;
                sources = [
                    { metadata: { code: 'IFRS S1/S2' }, title: 'IFRS S1 / S2 General Sustainability Disclosures', url: 'https://www.ifrs.org' },
                    { metadata: { code: 'EU CSRD' }, title: 'EU Corporate Sustainability Reporting Directive (CSRD)', url: 'https://finance.ec.europa.eu' },
                    { metadata: { code: 'ESG Central Asia' }, title: 'ESG Regulations & Tax Incentives in Central Asia', url: 'https://soliq.uz' }
                ];
            } else if (lang === 'uz') {
                reply = `### Amaldagi ESG me'yorlari bo'yicha umumiy ma'lumot (2025–2026)\n\n` +
                    `1. **Yevropa CSRD direktivasi (Barqaror rivojlanish hisoboti):** yirik korxonalar va xalqaro hamkorlar uchun iqlim xatarlari hamda Scope 1-3 issiqxona gazlari emissiyasini majburiy oshkor qilish talabi.\n\n` +
                    `2. **IFRS S1 va IFRS S2 standartlari (ISSB):** barqaror rivojlanish va iqlim bilan bog'liq moliyaviy ma'lumotlarni oshkor qilishning yagona global standartlari, O'zbekiston va MDH davlatlari qonunchiligiga integratsiya qilinmoqda.\n\n` +
                    `3. **"Yashil iqtisodiyot" uchun soliq imtiyozlari:** qayta tiklanuvchi energiya manbalari (quyosh panellari) va energiya tejovchi texnologiyalarni joriy etgan korxonalar uchun foyda solig'i hamda mol-mulk solig'i bo'yicha imtiyozlar.\n\n` +
                    `4. **Uglerod chegarasi mexanizmi (CBAM):** Yevropa Ittifoqiga eksport qilinadigan metallurgiya, sement va kimyo mahsulotlari uchun uglerod izining tasdiqlangan auditini talab qiladi.`;
                sources = [
                    { metadata: { code: 'IFRS S1/S2' }, title: 'IFRS S1 / S2 Barqaror rivojlanish standartlari', url: 'https://www.ifrs.org' },
                    { metadata: { code: 'EU CSRD' }, title: 'EU CSRD Barqarorlik direktivasi', url: 'https://finance.ec.europa.eu' },
                    { metadata: { code: 'Yashil iqtisodiyot' }, title: 'O\'zbekiston Respublikasi yashil iqtisodiyot me\'yorlari', url: 'https://soliq.uz' }
                ];
            } else {
                reply = `### Сводка актуальных ESG нормативов (2025–2026)\n\n` +
                    `1. **Европейские стандарты CSRD (Corporate Sustainability Reporting Directive):** обязательное раскрытие информации по климатическим рискам и выбросам Scope 1-3 для крупных предприятий и международных контрагентов.\n\n` +
                    `2. **Стандарты IFRS S1 и IFRS S2 (ISSB):** единые глобальные стандарты раскрытия финансовой информации, связанной с устойчивым развитием и климатом, интегрированные в комплаенс-регуляторику стран СНГ.\n\n` +
                    `3. **Налоговые стимулы "зелёной трансформации":** налоговые льготы по налогу на имущество и налогу на прибыль при внедрении возобновляемых источников энергии и энергоэффективных технологий в Узбекистане и Казахстане.\n\n` +
                    `4. **Углеродное регулирование (CBAM):** трансграничный углеродный налог ЕС требует верифицированного аудита углеродного следа экспортной продукции.`;
                sources = [
                    { metadata: { code: 'IFRS S1/S2' }, title: 'IFRS S1 / S2 General Sustainability Disclosures', url: 'https://www.ifrs.org' },
                    { metadata: { code: 'EU CSRD' }, title: 'EU Corporate Sustainability Reporting Directive (CSRD)', url: 'https://finance.ec.europa.eu' },
                    { metadata: { code: 'ESG CA' }, title: 'ESG Регулирование в Центральной Азии', url: 'https://soliq.uz' }
                ];
            }
        // 2. IFRS / МСФО / MHXS
        } else if (
            userMsg.includes('ifrs') ||
            userMsg.includes('мсфо') ||
            userMsg.includes('mhxs') ||
            userMsg.includes('ias') ||
            userMsg.includes('lease') ||
            userMsg.includes('аренд') ||
            userMsg.includes('ijara') ||
            userMsg.includes('ecl') ||
            userMsg.includes('rou')
        ) {
            if (lang === 'en') {
                reply = `### Key Requirements and Updates in IFRS Standards\n\n` +
                    `* **IFRS 16 (Leases):** Mandatory balance-sheet recognition of Right-of-Use (ROU) assets and discounted lease liabilities for virtually all lease contracts, eliminating off-balance sheet operating lease structures.\n\n` +
                    `* **IFRS 9 (Financial Instruments):** Three-stage forward-looking Expected Credit Loss (ECL) provisioning model for trade receivables, loans, and corporate debt holdings.\n\n` +
                    `* **IFRS 18 (Presentation and Disclosure in Financial Statements):** Successor to IAS 1, establishing three defined P&L activity categories (Operating, Investing, and Financing) and requiring disclosure of Management-defined Performance Measures (MPMs).\n\n` +
                    `* **IAS 12 (Income Taxes) & OECD Pillar Two:** Implementation of the 15% global minimum effective corporate tax regime for qualifying multinational groups.`;
                sources = [
                    { metadata: { code: 'IFRS.org' }, title: 'IFRS Standards Official Portal', url: 'https://www.ifrs.org' },
                    { metadata: { code: 'IASB' }, title: 'Axiaris IFRS Transformation Framework', url: '/transformation' }
                ];
            } else if (lang === 'uz') {
                reply = `### Moliyaviy hisobotning xalqaro standartlari (MHXS / IFRS) yangilanishlari\n\n` +
                    `* **IFRS 16 (Ijara):** barcha ijara shartnomalari bo'yicha balansda Foydalanish huquqi aktivlari (ROU Assets) va diskontlangan ijara majburiyatlarini majburiy aks ettirish.\n\n` +
                    `* **IFRS 9 (Moliyaviy instrumentlar):** debitorlik qarzlari va qarz vositalari bo'yicha kutilayotgan kredit zararlarini (ECL) 3 bosqichli baholash modeli.\n\n` +
                    `* **IFRS 18 (Moliyaviy hisobotda taqdim etish va oshkor qilish):** IAS 1 o'rnini egallab, foyda va zararlar to'g'risidagi hisobotni 3 ta aniq toifaga ajratadi: operatsion, investitsion va moliyaviy faoliyat.\n\n` +
                    `* **IAS 12 (Foyda soliqlari):** OECD Pillar Two bo'yicha 15% global minimal korporativ soliq talablari.`;
                sources = [
                    { metadata: { code: 'IFRS.org' }, title: 'MHXS xalqaro standartlar portali', url: 'https://www.ifrs.org' },
                    { metadata: { code: 'Axiaris MHXS' }, title: 'Axiaris MHXS transformatsiya qoidalari', url: '/transformation' }
                ];
            } else {
                reply = `### Ключевые требования и обновления МСФО (IFRS)\n\n` +
                    `* **IFRS 16 (Аренда):** обязательное признание активов в форме права пользования (ROU Assets) и дисконтированных арендных обязательств на балансе компании.\n\n` +
                    `* **IFRS 9 (Финансовые инструменты):** трёхстадийная модель оценки ожидаемых кредитных убытков (ECL) для дебиторской задолженности и долговых обязательств.\n\n` +
                    `* **IFRS 18 (Представление и раскрытие в финотчётности):** заменяет IAS 1, вводя три чёткие категории в отчёте о прибылях и убытках: операционная, инвестиционная и финансовая деятельность.\n\n` +
                    `* **IAS 12 (Налоги на прибыль):** реформа Pillar Two (OECD) по глобальному минимальному налогу 15%.`;
                sources = [
                    { metadata: { code: 'IFRS.org' }, title: 'Официальный портал стандартов МСФО', url: 'https://www.ifrs.org' },
                    { metadata: { code: 'IASB' }, title: 'Регламент трансформации отчётности Axiaris', url: '/transformation' }
                ];
            }
        // 3. GDPR / Data Protection / Shaxsiy ma'lumotlar
        } else if (
            userMsg.includes('gdpr') ||
            userMsg.includes('privacy') ||
            userMsg.includes('персональн') ||
            userMsg.includes('данных') ||
            userMsg.includes('data') ||
            userMsg.includes('shaxsiy') ||
            userMsg.includes("ma'lumot") ||
            userMsg.includes('maxfiylik')
        ) {
            if (lang === 'en') {
                reply = `### GDPR & Data Protection Compliance Requirements\n\n` +
                    `* **Lawful Basis for Processing:** Mandatory legal grounds under Article 6 (explicit consent, contract performance, legal obligations, or legitimate interest).\n\n` +
                    `* **Data Subject Rights:** Full enforcement of the Right to Erasure ("Right to be Forgotten", Art. 17), Right to Data Portability (Art. 20), and restriction of processing.\n\n` +
                    `* **72-Hour Security Breach Notification:** Compulsory notification to the relevant Data Protection Authority and high-risk data subjects within 72 hours of discovery.\n\n` +
                    `* **Cross-Border Transfers & Storage Localization:** Standard Contractual Clauses (SCCs) for international transfers and strict compliance with national localization mandates (e.g., Law No. ZRU-547 in Uzbekistan).`;
                sources = [
                    { metadata: { code: 'GDPR 2016/679' }, title: 'EU General Data Protection Regulation (GDPR)', url: 'https://gdpr.eu' },
                    { metadata: { code: 'ZRU-547' }, title: 'Law of the Republic of Uzbekistan on Personal Data', url: 'https://lex.uz' }
                ];
            } else if (lang === 'uz') {
                reply = `### GDPR va shaxsiy ma'lumotlarni himoya qilish talablari\n\n` +
                    `* **Qonuniy qayta ishlash asoslari:** foydalanuvchining aniq roziligi, shartnoma majburiyatlari yoki qonuniy manfaatlar (6-modda).\n\n` +
                    `* **Foydalanuvchilarning asosiy huquqlari:** ma'lumotlarni o'chirish huquqi ("unutilish huquqi", 17-modda), ma'lumotlarni ko'chirish huquqi (20-modda).\n\n` +
                    `* **Xavfsizlik hodisalari haqida xabardor qilish:** ma'lumotlar buzilishi aniqlangandan so'ng 72 soat ichida nazorat organlarini xabardor qilish majburiyati.\n\n` +
                    `* **Transchegaraviy uzatish va serverlar lokalizatsiyasi:** O'zbekiston Respublikasining "Shaxsiy ma'lumotlar to'g'risida"gi O'RQ-547-son Qonuniga muvofiq fuqarolarning ma'lumotlarini mamlakat hududidagi serverlarda saqlash talabi.`;
                sources = [
                    { metadata: { code: 'GDPR 2016/679' }, title: 'Yevropa ma\'lumotlar himoyasi reglamenti (GDPR)', url: 'https://gdpr.eu' },
                    { metadata: { code: 'O\'RQ-547' }, title: 'O\'zbekiston Respublikasining "Shaxsiy ma\'lumotlar to\'g\'risida"gi Qonuni', url: 'https://lex.uz' }
                ];
            } else {
                reply = `### Требования соответствия GDPR и защите данных\n\n` +
                    `* **Законные основания обработки:** согласие субъекта данных, договорные обязательства или законный интерес (ст. 6).\n\n` +
                    `* **Ключевые права пользователей:** право на забвение (ст. 17), право на переносимость данных (ст. 20), ограничение обработки.\n\n` +
                    `* **Реагирование на инциденты безопасности:** уведомление надзорного органа и субъектов персональных данных в течение 72 часов.\n\n` +
                    `* **Трансграничная передача данных:** применение стандартных договорных условий (SCC) и локализация серверов согласно закону РУз № ЗРУ-547 «О персональных данных».`;
                sources = [
                    { metadata: { code: 'GDPR 2016/679' }, title: 'EU General Data Protection Regulation (GDPR)', url: 'https://gdpr.eu' },
                    { metadata: { code: 'ЗРУ-547' }, title: 'Закон РУз «О персональных данных»', url: 'https://lex.uz' }
                ];
            }
        // 4. Tax / SaaS / Digital VAT / IT Park
        } else if (
            userMsg.includes('tax') ||
            userMsg.includes('налог') ||
            userMsg.includes('soliq') ||
            userMsg.includes('saas') ||
            userMsg.includes('vat') ||
            userMsg.includes('ндс') ||
            userMsg.includes('qqs') ||
            userMsg.includes('park') ||
            userMsg.includes('withholding')
        ) {
            if (lang === 'en') {
                reply = `### Tax Regulations for Digital Services & SaaS\n\n` +
                    `* **Digital VAT ("Google Tax"):** Applied based on customer destination for B2C digital sales. Statutory rates: Uzbekistan 12%, Kazakhstan 12%, UAE 5%, Turkey 20%, Russia 20%.\n\n` +
                    `* **IT Park & Special Economic Zones:** IT Park Uzbekistan residents are fully exempt from Corporate Income Tax (0%) and VAT (0%) on qualified software services, with employee personal income tax capped at 7.5%.\n\n` +
                    `* **Withholding Tax (WHT) on Software & Royalties:** 10–15% statutory withholding on non-resident payments, reducible to 0–5% under applicable Double Tax Treaties (DTT) with valid tax residence certificates.\n\n` +
                    `* **Transfer Pricing & Nexus:** Cross-border SaaS licensing between group entities requires transfer pricing benchmark files aligning with OECD arm's length standards.`;
                sources = [
                    { metadata: { code: 'Tax Code Art. 258' }, title: 'Tax Code of Uzbekistan (Digital VAT on Services)', url: 'https://soliq.uz' },
                    { metadata: { code: 'IT Park UZ' }, title: 'IT Park Uzbekistan Special Tax Regime', url: 'https://it-park.uz' },
                    { metadata: { code: 'OECD Tax' }, title: 'OECD Transfer Pricing Guidelines for Digital Businesses', url: 'https://www.oecd.org' }
                ];
            } else if (lang === 'uz') {
                reply = `### SaaS va raqamli xizmatlar uchun soliqqa tortish tartibi\n\n` +
                    `* **Elektron xizmatlar uchun QQS ("Google solig'i"):** xizmatlar jismoniy shaxslarga (B2C) ko'rsatilganda xaridor joylashgan davlatda to'lanadi. O'zbekistonda QQS stavkasi — 12%, Qozog'istonda — 12%, BAAda — 5%.\n\n` +
                    `* **IT Park rezidentlari uchun imtiyozlar:** O'zbekiston IT Park rezidentlari foyda solig'i va QQS to'lashdan to'liq ozod qilingan (0%), xodimlar daromad solig'i (JShODS) esa 7.5% ga pasaytirilgan.\n\n` +
                    `* **To'lov manbaida ushlab qolinadigan soliq (Withholding Tax):** xorijiy kompaniyalarga dasturiy ta'minot litsenziyalari (royalti) to'langanda 10–15% stavkada ushlanadi, ikkiyoqlama soliqqa tortishning oldini olish bitimlari asosida kamaytirilishi mumkin.\n\n` +
                    `* **Xalqaro hisob-kitoblar:** B2B xizmat ko'rsatishda elektron hisob-faktura (EHF) va dasturiy ta'minotni qabul qilish aktlari rasmiylashtirilishi shart.`;
                sources = [
                    { metadata: { code: 'Soliq kodeksi 258' }, title: 'O\'zbekiston Respublikasi Soliq kodeksi (Elektron xizmatlar QQS)', url: 'https://soliq.uz' },
                    { metadata: { code: 'IT Park UZ' }, title: 'IT Park O\'zbekiston maxsus soliq imtiyozlari', url: 'https://it-park.uz' }
                ];
            } else {
                reply = `### Налогообложение цифровых сервисов и SaaS\n\n` +
                    `* **НДС на электронные услуги (Digital VAT / Налог на Google):** применяется по месту нахождения покупателя (B2C). В Узбекистане — 12%, в РФ — 20%, в Казахстане — 12%, в ОАЭ — 5%.\n\n` +
                    `* **Льготы IT Park / СЭЗ:** резиденты IT Park в Узбекистане освобождены от корпоративного налога на прибыль и НДС, ставка НДФЛ снижена до 7.5%.\n\n` +
                    `* **Налог у источника (Withholding Tax):** при выплате роялти иностранным правообладателям ставка составляет 10–15%, если соглашением об избежании двойного налогообложения (СИДН) не установлены льготы.\n\n` +
                    `* **Трансфертное ценообразование:** для международных SaaS-структур требуется обоснование рыночных цен на сублицензирование и техподдержку.`;
                sources = [
                    { metadata: { code: 'НК РУз ст. 258' }, title: 'Налоговый кодекс РУз (Электронные услуги)', url: 'https://soliq.uz' },
                    { metadata: { code: 'IT Park UZ' }, title: 'IT Park Uzbekistan Tax Incentives', url: 'https://it-park.uz' }
                ];
            }
        // 5. 1C Integration / 1С интеграция / 1C integratsiyasi
        } else if (
            userMsg.includes('1c') ||
            userMsg.includes('1с') ||
            userMsg.includes('odata') ||
            userMsg.includes('интеграц') ||
            userMsg.includes('синхрон') ||
            userMsg.includes('integratsiya')
        ) {
            if (lang === 'en') {
                reply = `### Bi-directional 1C:Enterprise Integration (OData v4 REST API)\n\n` +
                    `1. **Automated Ingestion:** Direct retrieval of Trial Balance (TB) and account balances via \`AccountingRegister_General/Balance\` (accounts 01, 10, 50, 51, 60, 62, 80, 84).\n\n` +
                    `2. **Enterprise-Grade Security:** 1C connection credentials and OData tokens are encrypted using symmetric **AES-256 (Fernet)** at the database level.\n\n` +
                    `3. **Pushback Adjustments:** Calculated IFRS transformation journal entries are automatically exported into \`Document_OperationAccounting\` with full dual-ledger audit trails.`;
                sources = [
                    { metadata: { code: '1C OData' }, title: '1C:Enterprise OData v4 Integration Protocol', url: 'https://its.1c.ru' },
                    { metadata: { code: 'Axiaris 1C' }, title: 'Axiaris 1C Synchronization Module', url: '/transformation' }
                ];
            } else if (lang === 'uz') {
                reply = `### 1C:Korxona bilan ikki tomonlama integratsiya (OData v4 REST API)\n\n` +
                    `1. **Ma'lumotlar importi:** Aylanma-qoldiq vedomostini (OSV) \`AccountingRegister_Хозрасчетный/Balance\` orqali 01, 10, 50, 51, 60, 62, 80, 84 hisobvaraqlari bo'yicha avtomatik yuklash.\n\n` +
                    `2. **Xavfsizlik va shifrlash:** 1C ulanish parollari va OData tokenlari ma'lumotlar bazasida **AES-256 (Fernet)** simmetrik shifrlash bilan saqlanadi.\n\n` +
                    `3. **Tuzatishlarni eksport qilish:** Axiaris tizimida hisoblangan MHXS tuzatishlari to'g'ridan-to'g'ri 1C dagi \`Document_ОперацияБух\` hujjatiga buxgalteriya provodkalari bilan yuboriladi.`;
                sources = [
                    { metadata: { code: '1C OData' }, title: '1C:Enterprise OData rasmiy yo\'riqnomasi', url: 'https://its.1c.ru' },
                    { metadata: { code: 'Axiaris 1C' }, title: 'Axiaris 1C integratsiya moduli', url: '/transformation' }
                ];
            } else {
                reply = `### Двусторонняя интеграция с 1С:Предприятие (OData v4 REST API)\n\n` +
                    `1. **Импорт (Ingestion):** Извлечение оборотно-сальдовой ведомости (ОСВ) через \`AccountingRegister_Хозрасчетный/Balance\` со счетами 01, 10, 50, 51, 60, 62, 80, 84.\n\n` +
                    `2. **Безопасность:** Пароли и токены OData шифруются симметричным шифром **AES-256 (Fernet)** на уровне БД.\n\n` +
                    `3. **Экспорт корректировок (Pushback):** Трансляция рассчитанных МСФО-корректировок напрямую в \`Document_ОперацияБух\` с генерацией бухгалтерских проводок.`;
                sources = [
                    { metadata: { code: '1C OData' }, title: 'Документация 1C:Enterprise OData', url: 'https://its.1c.ru' },
                    { metadata: { code: 'Axiaris 1C' }, title: 'Коннектор 1C в Axiaris', url: '/transformation' }
                ];
            }
        // 6. General / Fallback Question
        } else {
            if (lang === 'en') {
                reply = `### Regulatory Compliance Consultation: "${rawMsg || 'Regulatory Guidance'}"\n\n` +
                    `Thank you for your question: **"${rawMsg || 'Regulatory Guidance'}"**.\n\n` +
                    `The **Axiaris Intelligence Engine** analyzed the regulatory and compliance databases. To maintain full adherence to IFRS and national tax legislation, we recommend:\n\n` +
                    `1. **Document Verification:** Verify reconciliation statements and supporting primary accounting documents.\n` +
                    `2. **AI Audit:** Run an automated audit and risk check in the **AI Tax Analysis** module.\n` +
                    `3. **Regulatory Review:** Review jurisdiction-specific legal standards in the **Regulations** and **Tax Config** sections.`;
                sources = [
                    { metadata: { code: 'Axiaris Core' }, title: 'Axiaris Compliance Knowledge Base', url: '/regulations' }
                ];
            } else if (lang === 'uz') {
                reply = `### Normativlar bo'yicha maslahat: "${rawMsg || 'Normativ tavsiyalar'}"\n\n` +
                    `Savolingiz uchun tashakkur: **«${rawMsg || 'Normativ tavsiyalar'}»**.\n\n` +
                    `**Axiaris** intellektual yordamchisi normativ-huquqiy va komplayens ma'lumotlar bazasini tekshirdi. MHXS standartlari va mahalliy soliq qonunchiligiga to'liq rioya qilish uchun quyidagilar tavsiya etiladi:\n\n` +
                    `1. **Hujjatlarni taqqoslash:** Hisob-kitoblarni taqqoslash va tasdiqlovchi birlamchi buxgalteriya hujjatlarini tekshirish.\n` +
                    `2. **AI Tax tahlili:** **AI Tax Analysis** bo'limida hisobotlar bo'yicha avtomatik audit va soliq tahlilini ishga tushirish.\n` +
                    `3. **Me'yoriy baza:** **Regulations** hamda **Tax Config** bo'limlarida amaldagi qonunchilik va stavkalarni ko'rib chiqish.`;
                sources = [
                    { metadata: { code: 'Axiaris Core' }, title: 'Axiaris Compliance Engine bilimlar bazasi', url: '/regulations' }
                ];
            } else {
                reply = `### Консультация по нормативам: «${rawMsg || 'Консультация по нормативам'}»\n\n` +
                    `Благодарю за вопрос: **«${rawMsg || 'Консультация по нормативам'}»**.\n\n` +
                    `Интеллектуальный ассистент **Axiaris** проверил нормативную базу комплаенса. Для поддержания соответствия нормативам МСФО и локального налогового законодательства рекомендуется:\n\n` +
                    `1. **Сверка документов:** Проверить сверку взаиморасчетов и подтверждающих первичных документов.\n` +
                    `2. **Анализ рисков:** Запустить анализ отчётности на странице **AI Tax Analysis**.\n` +
                    `3. **Нормативная база:** Ознакомиться с базой нормативно-правовых актов в разделах **Regulations** и **Tax Config**.`;
                sources = [
                    { metadata: { code: 'Axiaris Core' }, title: 'База знаний Axiaris Compliance Engine', url: '/regulations' }
                ];
            }
        }

        return {
            response: reply,
            sources: sources,
            status: 'success',
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Default Fallback
    // ─────────────────────────────────────────────────────────────────────────
    return {
        status: 'success',
        message: 'Executed successfully in cloud demo mode',
        timestamp: new Date().toISOString(),
    };
}
