import seedData from './seedDatabase.json';

// ── Persistence Helpers ──────────────────────────────────────────────────────
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
    return getStored<any[]>('regai_mock_balance_sheets', seedData.balance_sheets);
}

function saveBalanceSheetsStore(sheets: any[]): void {
    setStored('regai_mock_balance_sheets', sheets);
}

function getAlertsStore(): any[] {
    return getStored<any[]>('regai_mock_alerts', seedData.alerts);
}

function saveAlertsStore(alerts: any[]): void {
    setStored('regai_mock_alerts', alerts);
}

function getAuditLogsStore(): any[] {
    return getStored<any[]>('regai_mock_audit_logs', seedData.audit_logs);
}

export function logAuditAction(action: string, details: string, userId: string = 'superadmin'): void {
    const logs = getAuditLogsStore();
    logs.unshift({
        id: 'log-' + Math.random().toString(36).substring(2, 9),
        action,
        user_id: userId,
        details,
        created_at: new Date().toISOString(),
    });
    setStored('regai_mock_audit_logs', logs);
}

function getDocumentsStore(): any[] {
    return getStored<any[]>('regai_mock_documents', seedData.documents);
}

function saveDocumentsStore(docs: any[]): void {
    setStored('regai_mock_documents', docs);
}

// ── JWT Helper ──────────────────────────────────────────────────────────────
export function createMockToken(user: any): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
        JSON.stringify({
            sub: user.email,
            email: user.email,
            role: user.role,
            tid: user.tenant_id,
            cid: user.company_id,
            exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600, // 30 days
        })
    );
    const signature = btoa('mock_signature_regai_2026');
    return `${header}.${payload}.${signature}`;
}

// ── Main Mock Handler ───────────────────────────────────────────────────────
export function handleMockApiRequest(config: any): any {
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
    }

    console.log(`[MockApi] ${method.toUpperCase()} ${cleanPath}`);

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Authentication
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath === '/auth/login' || cleanPath === '/auth/token') {
        let email = 'superadmin@regai.ai';
        if (body) {
            email = body.username || body.email || email;
        }
        email = String(email).trim().toLowerCase();

        const users = getUsersStore();
        const matchedUser =
            users.find((u: any) => u.email.toLowerCase() === email) ||
            users.find((u: any) => u.role === 'superadmin') ||
            users[0];

        const token = createMockToken(matchedUser);
        return {
            access_token: token,
            token_type: 'bearer',
            user: matchedUser,
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
        if (storedUser) {
            try {
                return JSON.parse(storedUser);
            } catch (e) {
                // ignore
            }
        }
        const users = getUsersStore();
        return users.find((u: any) => u.email === 'superadmin@regai.ai') || users[0];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Users Management
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath === '/users/invite' && method === 'post') {
        const users = getUsersStore();
        const newUser = {
            id: 'usr-' + Math.random().toString(36).substring(2, 9),
            email: body?.email || 'newuser@regai.ai',
            full_name: body?.full_name || 'New Team Member',
            role: body?.role || 'user',
            company_id: body?.company_id || null,
            is_company_owner: 0,
            is_active: 1,
            is_superuser: 0,
            created_at: new Date().toISOString(),
        };
        users.unshift(newUser);
        saveUsersStore(users);
        return { status: 'success', data: newUser };
    }

    if (cleanPath.startsWith('/users/') && method === 'put') {
        const userId = cleanPath.split('/')[2];
        const users = getUsersStore();
        const idx = users.findIndex((u: any) => u.id === userId);
        if (idx !== -1) {
            users[idx] = { ...users[idx], ...body };
            saveUsersStore(users);
            return { status: 'success', data: users[idx] };
        }
        return { status: 'success' };
    }

    if (cleanPath.startsWith('/users/') && method === 'delete') {
        const userId = cleanPath.split('/')[2];
        const users = getUsersStore().filter((u: any) => u.id !== userId);
        saveUsersStore(users);
        return { status: 'success', message: 'User deleted' };
    }

    if (cleanPath === '/users' || cleanPath === '/users/') {
        const users = getUsersStore();
        const companyId = config.params?.company_id;
        if (companyId) {
            return users.filter((u: any) => u.company_id === companyId);
        }
        return users;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Companies Management
    // ─────────────────────────────────────────────────────────────────────────
    if ((cleanPath === '/companies' || cleanPath === '/companies/') && method === 'post') {
        const companies = getCompaniesStore();
        const newComp = {
            id: 'comp-' + Math.random().toString(36).substring(2, 9),
            name: body?.name || 'Новая организация',
            inn: body?.inn || '123456789',
            industry: body?.industry || 'IT & Fintech',
            description: body?.description || '',
            website: body?.website || '',
            employee_count: body?.employee_count || 50,
            is_active: true,
            created_at: new Date().toISOString(),
        };
        companies.unshift(newComp);
        saveCompaniesStore(companies);
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
        return companies.find((c: any) => c.id === compId) || companies[0];
    }

    if (cleanPath === '/companies' || cleanPath === '/companies/') {
        return getCompaniesStore();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Organizational Hierarchy
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath.includes('/hierarchy/structure') || cleanPath.includes('/hierarchy')) {
        const users = getUsersStore();
        const companies = getCompaniesStore();
        const compMap = new Map(companies.map((c: any) => [c.id, c.name]));

        const toHierarchyUser = (u: any) => ({
            id: u.id,
            email: u.email,
            full_name: u.full_name || u.email,
            role: u.role,
            is_company_owner: Boolean(u.is_company_owner || u.role === 'company_owner'),
            company_id: u.company_id || null,
            company_name: compMap.get(u.company_id) || 'RegAI Holding',
        });

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
                display_name: 'Уровень 2 — Владельцы Компаний и Партнеры (Company Owners)',
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
            { code: 'UZ', name: 'Узбекистан (Uzbekistan)' },
            { code: 'KZ', name: 'Казахстан (Kazakhstan)' },
            { code: 'RU', name: 'Россия (Russia)' },
            { code: 'AE', name: 'ОАЭ (UAE)' },
            { code: 'TR', name: 'Турция (Turkey)' },
            { code: 'GLOBAL', name: 'Международные стандарты (Global)' },
        ];
    }

    if (cleanPath.includes('/tax-rates/types')) {
        return [
            { type: 'vat', name: 'НДС (VAT / QQS) — Налог на добавленную стоимость' },
            { type: 'corporate', name: 'Налог на прибыль (Corporate Income Tax)' },
            { type: 'corporate_small', name: 'Налог с оборота / МСП (Turnover Tax)' },
            { type: 'income', name: 'НДФЛ (Personal Income Tax)' },
            { type: 'income_top', name: 'НДФЛ повышенная ставка (PIT High Bracket)' },
            { type: 'social', name: 'Социальный налог (Social Tax / Payroll)' },
            { type: 'payroll', name: 'Страховые взносы работодателя (Payroll Contributions)' },
            { type: 'withholding', name: 'Налог у источника выплат (Withholding Tax / WHT)' },
            { type: 'property', name: 'Налог на имущество (Property Tax)' },
            { type: 'consumption', name: 'Цифровой налог (Digital Services Tax / DST)' },
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
                { id: "quick-actions", enabled: true, order: 3, settings: {} },
                { id: "recent-activity", enabled: true, order: 4, settings: {} },
            ],
        };
    }

    if (cleanPath === '/dashboard/data') {
        const sheets = getBalanceSheetsStore();
        return {
            compliance: { score: 96, status: "Good", pending_tasks: 2 },
            one_c_status: { connected: true, last_sync: "12 минут назад", errors: 0 },
            transformation: { total_processed: sheets.length, saved_hours: 42.5 },
            recent_activity: [
                { id: "act-1", action: "sync", timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), details: "1C:Enterprise Trial Balance синхронизирован (24 счёта, 120M ₽)" },
                { id: "act-2", action: "transform", timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), details: "IFRS 16 Капитализация арендных прав проведена успешно" },
                { id: "act-3", action: "review", timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), details: "IFRS 9 Резерв под обесценение ECL Stage 2 утвержден аудитором" },
                { id: "act-4", action: "compliance", timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), details: "Нормативная база актуализирована для юрисдикций UZ, KZ, RU" },
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
        return getAlertsStore();
    }

    if (cleanPath.includes('/compliance/stats')) {
        const alerts = getAlertsStore();
        const total = alerts.length;
        const critical = alerts.filter((a: any) => a.severity === 'critical').length;
        const high = alerts.filter((a: any) => a.severity === 'high').length;
        const medium = alerts.filter((a: any) => a.severity === 'medium').length;
        const low = alerts.filter((a: any) => a.severity === 'low').length;
        const open = alerts.filter((a: any) => a.status === 'open').length;
        const in_progress = alerts.filter((a: any) => a.status === 'in_progress').length;
        const resolved = alerts.filter((a: any) => a.status === 'resolved').length;
        const dismissed = alerts.filter((a: any) => a.status === 'dismissed').length;

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
            compliance_score: 94,
            score: 94,
            status: 'Compliant',
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
        const logs = getAuditLogsStore();
        return {
            total_actions: logs.length,
            today_actions: 14,
            unique_users: new Set(logs.map((l: any) => l.user_id)).size || 7,
            failed_actions: 0,
        };
    }

    if (cleanPath.includes('/audit-logs/export')) {
        const logs = getAuditLogsStore();
        const header = "id,action,user_id,details,created_at\n";
        const rows = logs.map((l: any) => `"${l.id}","${l.action}","${l.user_id}","${(l.details || '').replace(/"/g, '""')}","${l.created_at}"`).join('\n');
        return header + rows;
    }

    if (cleanPath.includes('/audit-logs')) {
        const logs = getAuditLogsStore();
        return {
            logs: logs,
            total: logs.length,
            items: logs,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 10. Regulations
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath.includes('/regulations/jurisdictions')) {
        return { jurisdictions: ['UZ', 'KZ', 'RU', 'GLOBAL', 'EU', 'US'] };
    }

    if (cleanPath.includes('/regulations/search') || cleanPath === '/regulations' || cleanPath === '/regulations/') {
        return seedData.regulations.map((r: any) => ({
            ...r,
            title: r.title || 'Untitled Regulation',
            code: r.code || 'REG',
            category: r.category || 'General',
            jurisdiction: r.jurisdiction || 'GLOBAL',
            effective_date: r.effective_date || '',
            source_url: r.source_url || '',
            content: r.content || '',
            metadata: {
                title: r.title || 'Untitled Regulation',
                code: r.code || 'REG',
                category: r.category || 'General',
                jurisdiction: r.jurisdiction || 'GLOBAL',
                effective_date: r.effective_date || '',
                source_url: r.source_url || '',
                content: r.content || '',
            },
        }));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 11. Balance Sheets & Transformation
    // ─────────────────────────────────────────────────────────────────────────
    if ((cleanPath === '/balance-sheets' || cleanPath === '/balance-sheets/') && method === 'post') {
        const sheets = getBalanceSheetsStore();
        const newSheet = {
            id: 'bs-' + Math.random().toString(36).substring(2, 9),
            company_id: body?.company_id || 'comp-1',
            period: body?.period || '2025-Q4',
            status: 'draft',
            created_at: new Date().toISOString(),
            items: body?.items || [],
        };
        sheets.unshift(newSheet);
        saveBalanceSheetsStore(sheets);
        return newSheet;
    }

    if (cleanPath.startsWith('/balance-sheets/') && method === 'delete') {
        const sheetId = cleanPath.split('/')[2];
        const sheets = getBalanceSheetsStore().filter((s: any) => s.id !== sheetId);
        saveBalanceSheetsStore(sheets);
        return { status: 'success', message: 'Balance sheet deleted' };
    }

    if (cleanPath === '/balance-sheets' || cleanPath === '/balance-sheets/') {
        return getBalanceSheetsStore();
    }

    if (cleanPath.includes('/transform')) {
        return {
            mcfo_statement: {
                transformed_data: {
                    period: '2025-12-31',
                    assets: {
                        current: [
                            { account_name: 'Денежные средства и эквиваленты', amount: 15400000, category: 'current' },
                            { account_name: 'Торговая дебиторская задолженность (net of ECL)', amount: 28900000, category: 'current' },
                            { account_name: 'Запасы сырья и материалов', amount: 12500000, category: 'current' },
                        ],
                        non_current: [
                            { account_name: 'Основные средства (IAS 16)', amount: 84000000, category: 'non_current' },
                            { account_name: 'Активы в форме права пользования (IFRS 16 ROU)', amount: 19500000, category: 'non_current' },
                            { account_name: 'Нематериальные активы', amount: 6200000, category: 'non_current' },
                        ],
                    },
                    liabilities: {
                        current: [
                            { account_name: 'Краткосрочные торговые обязательства', amount: 18400000, category: 'current' },
                            { account_name: 'Краткосрочные арендные обязательства (IFRS 16)', amount: 4800000, category: 'current' },
                        ],
                        non_current: [
                            { account_name: 'Долгосрочные займы и кредиты', amount: 42000000, category: 'non_current' },
                            { account_name: 'Долгосрочные арендные обязательства (IFRS 16)', amount: 14700000, category: 'non_current' },
                        ],
                    },
                    equity: {
                        items: [
                            { account_name: 'Уставный капитал', amount: 50000000 },
                            { account_name: 'Нераспределенная прибыль прошлых лет', amount: 36900000 },
                        ],
                    },
                },
            },
            ifrs_statement: {
                transformed_data: {
                    period: '2025-12-31',
                    assets: {
                        current: [
                            { account_name: 'Cash and Cash Equivalents', amount: 15400000, category: 'current' },
                            { account_name: 'Trade Receivables (IFRS 9 amortized cost)', amount: 28900000, category: 'current' },
                            { account_name: 'Inventories (IAS 2 lower of cost and NRV)', amount: 12500000, category: 'current' },
                        ],
                        non_current: [
                            { account_name: 'Property, Plant and Equipment (IAS 16)', amount: 84000000, category: 'non_current' },
                            { account_name: 'Right-of-Use Assets (IFRS 16)', amount: 19500000, category: 'non_current' },
                            { account_name: 'Intangible Assets (IAS 38)', amount: 6200000, category: 'non_current' },
                        ],
                    },
                    liabilities: {
                        current: [
                            { account_name: 'Trade and Other Payables', amount: 18400000, category: 'current' },
                            { account_name: 'Current Lease Liabilities', amount: 4800000, category: 'current' },
                        ],
                        non_current: [
                            { account_name: 'Long-term Borrowings', amount: 42000000, category: 'non_current' },
                            { account_name: 'Non-current Lease Liabilities', amount: 14700000, category: 'non_current' },
                        ],
                    },
                    equity: {
                        items: [
                            { account_name: 'Share Capital', amount: 50000000 },
                            { account_name: 'Retained Earnings', amount: 36900000 },
                        ],
                    },
                },
            },
        };
    }

    if (cleanPath.startsWith('/balance-sheets/')) {
        const parts = cleanPath.split('/');
        const id = parts[2];
        const sheets = getBalanceSheetsStore();
        const sheet: any = sheets.find((b: any) => b.id === id) || sheets[0] || {};
        const items = seedData.balance_sheet_items.filter((i: any) => i.balance_sheet_id === sheet.id);
        const adjustments = seedData.transformation_adjustments.filter((a: any) => a.balance_sheet_id === sheet.id);
        return {
            ...sheet,
            items: items.length > 0 ? items : [
                { id: '1', account_code: '1010', account_name: 'Денежные средства', amount: 12500000, category: 'assets' },
                { id: '2', account_code: '0100', account_name: 'Основные средства', amount: 84000000, category: 'assets' },
                { id: '3', account_code: '4000', account_name: 'Дебиторская задолженность', amount: 31000000, category: 'assets' },
                { id: '4', account_code: '6000', account_name: 'Краткосрочные обязательства', amount: 23200000, category: 'liabilities' },
                { id: '5', account_code: '8300', account_name: 'Уставный капитал', amount: 104300000, category: 'equity' },
            ],
            adjustments: adjustments.length > 0 ? adjustments : [
                { id: 'adj-1', description: 'IFRS 16 Lease recognition (ROU Asset)', adjustment_type: 'debit', adjustment_amount: 19500000 },
                { id: 'adj-2', description: 'IFRS 16 Lease liability capitalization', adjustment_type: 'credit', adjustment_amount: 19500000 },
                { id: 'adj-3', description: 'IFRS 9 Expected Credit Loss provision', adjustment_type: 'credit', adjustment_amount: 2100000 },
            ],
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
    // 13. Reports
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath === '/reports' || cleanPath === '/reports/') {
        return seedData.reports;
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
    if (cleanPath.includes('/validate')) {
        return {
            is_valid: true,
            error_count: 0,
            error_details: [],
            warnings: [],
        };
    }
    if (cleanPath.startsWith('/reports/')) {
        const parts = cleanPath.split('/');
        const id = parts[2];
        return seedData.reports.find((r: any) => r.id === id) || seedData.reports[0];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 14. Documents & Uploads
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath === '/documents/upload' && method === 'post') {
        const docs = getDocumentsStore();
        const newDoc = {
            id: 'doc-' + Math.random().toString(36).substring(2, 9),
            filename: 'Финансовый_отчет_' + new Date().toISOString().split('T')[0] + '.xlsx',
            document_type: 'balance_sheet',
            status: 'processed',
            file_size: 245000,
            created_at: new Date().toISOString(),
        };
        docs.unshift(newDoc);
        saveDocumentsStore(docs);
        return { status: 'success', data: newDoc };
    }

    if (cleanPath.includes('/documents')) {
        return getDocumentsStore();
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
    // 16. AI Report Analysis Engine
    // ─────────────────────────────────────────────────────────────────────────
    if (cleanPath.includes('/report-analysis/analyze') || cleanPath.includes('/tax-analysis')) {
        const country = (body?.country_code || 'UZ').toUpperCase();
        const types = Array.isArray(body?.tax_types) && body.tax_types.length > 0 ? body.tax_types : ['vat', 'corporate'];
        return {
            id: 'ana-' + Math.random().toString(36).substring(2, 9),
            report_id: body?.report_id || 'rep-1',
            country_code: country,
            overall_score: 95,
            summary: `Отчёт успешно верифицирован по налоговому законодательству ${country}. Выявлено 95% соответствия нормативам МСФО и местному налоговому кодексу.`,
            total_checks: 28,
            passed_checks: 26,
            errors: 1,
            warnings: 1,
            tax_types: types,
            error_details: [
                {
                    type: 'Зачёт НДС по инвестиционным затратам',
                    location: 'Раздел 4.1 «Зачётный НДС по приобретённым ОС и оборудованию»',
                    severity: 'warning',
                    expected: country === 'UZ' ? 12 : (country === 'RU' ? 20 : 12),
                    found: country === 'UZ' ? 12 : (country === 'RU' ? 20 : 12),
                    recommendation: 'Рекомендуется подкрепить электронные счета-фактуры (ЭСФ) поставщиков выпиской из личного кабинета налогоплательщика.',
                },
                {
                    type: 'Трансграничные лицензионные выплаты (WHT)',
                    location: 'Строка 140 «Лицензионные и технические платежи нерезидентам»',
                    severity: 'critical',
                    expected: 10,
                    found: 0,
                    recommendation: 'Предоставить апостилированный сертификат налогового резидентства лицензиара для подтверждения применения льготной ставки СИДН.',
                },
            ],
            findings: [
                'Корректно сформирована налогооблагаемая база по корпоративному налогу на прибыль.',
                'Ставки социального налога и взносов соответствуют нормативным актам текущего года.',
                'Налоговые регистры сверены и согласованы с данными Главной книги (1С:Предприятие).'
            ],
            created_at: new Date().toISOString(),
        };
    }

    if ((cleanPath === '/reports' || cleanPath === '/reports/') && method === 'post') {
        const newReport = {
            id: 'rep-' + Math.random().toString(36).substring(2, 9),
            title: body?.title || 'Tax Analysis Report',
            description: body?.description || 'Uploaded for AI analysis',
            report_type: body?.report_type || 'financial',
            status: 'approved',
            file_path: '/uploads/reports/analysis-report.pdf',
            company_id: body?.company_id || 'comp-1',
            created_at: new Date().toISOString(),
        };
        const currentReports = getStored<any[]>('regai_mock_reports', seedData.reports);
        currentReports.unshift(newReport);
        setStored('regai_mock_reports', currentReports);
        return newReport;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 17. RegAI Assistant AI Chat Engine (Multilingual: EN, RU, UZ)
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
            const hasUzbekSpecialChars = /[og][\'\‘\’\`\ʻ\ʼ]/i.test(lower);
            const words = lower.split(/[\s,?.!;:()\[\]{}'"`]+/);
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
                    { metadata: { code: 'IASB' }, title: 'RegAI IFRS Transformation Framework', url: '/transformation' }
                ];
            } else if (lang === 'uz') {
                reply = `### Moliyaviy hisobotning xalqaro standartlari (MHXS / IFRS) yangilanishlari\n\n` +
                    `* **IFRS 16 (Ijara):** barcha ijara shartnomalari bo'yicha balansda Foydalanish huquqi aktivlari (ROU Assets) va diskontlangan ijara majburiyatlarini majburiy aks ettirish.\n\n` +
                    `* **IFRS 9 (Moliyaviy instrumentlar):** debitorlik qarzlari va qarz vositalari bo'yicha kutilayotgan kredit zararlarini (ECL) 3 bosqichli baholash modeli.\n\n` +
                    `* **IFRS 18 (Moliyaviy hisobotda taqdim etish va oshkor qilish):** IAS 1 o'rnini egallab, foyda va zararlar to'g'risidagi hisobotni 3 ta aniq toifaga ajratadi: operatsion, investitsion va moliyaviy faoliyat.\n\n` +
                    `* **IAS 12 (Foyda soliqlari):** OECD Pillar Two bo'yicha 15% global minimal korporativ soliq talablari.`;
                sources = [
                    { metadata: { code: 'IFRS.org' }, title: 'MHXS xalqaro standartlar portali', url: 'https://www.ifrs.org' },
                    { metadata: { code: 'RegAI MHXS' }, title: 'RegAI MHXS transformatsiya qoidalari', url: '/transformation' }
                ];
            } else {
                reply = `### Ключевые требования и обновления МСФО (IFRS)\n\n` +
                    `* **IFRS 16 (Аренда):** обязательное признание активов в форме права пользования (ROU Assets) и дисконтированных арендных обязательств на балансе компании.\n\n` +
                    `* **IFRS 9 (Финансовые инструменты):** трёхстадийная модель оценки ожидаемых кредитных убытков (ECL) для дебиторской задолженности и долговых обязательств.\n\n` +
                    `* **IFRS 18 (Представление и раскрытие в финотчётности):** заменяет IAS 1, вводя три чёткие категории в отчёте о прибылях и убытках: операционная, инвестиционная и финансовая деятельность.\n\n` +
                    `* **IAS 12 (Налоги на прибыль):** реформа Pillar Two (OECD) по глобальному минимальному налогу 15%.`;
                sources = [
                    { metadata: { code: 'IFRS.org' }, title: 'Официальный портал стандартов МСФО', url: 'https://www.ifrs.org' },
                    { metadata: { code: 'IASB' }, title: 'Регламент трансформации отчётности RegAI', url: '/transformation' }
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
                    { metadata: { code: 'RegAI 1C' }, title: 'RegAI 1C Synchronization Module', url: '/transformation' }
                ];
            } else if (lang === 'uz') {
                reply = `### 1C:Korxona bilan ikki tomonlama integratsiya (OData v4 REST API)\n\n` +
                    `1. **Ma'lumotlar importi:** Aylanma-qoldiq vedomostini (OSV) \`AccountingRegister_Хозрасчетный/Balance\` orqali 01, 10, 50, 51, 60, 62, 80, 84 hisobvaraqlari bo'yicha avtomatik yuklash.\n\n` +
                    `2. **Xavfsizlik va shifrlash:** 1C ulanish parollari va OData tokenlari ma'lumotlar bazasida **AES-256 (Fernet)** simmetrik shifrlash bilan saqlanadi.\n\n` +
                    `3. **Tuzatishlarni eksport qilish:** RegAI tizimida hisoblangan MHXS tuzatishlari to'g'ridan-to'g'ri 1C dagi \`Document_ОперацияБух\` hujjatiga buxgalteriya provodkalari bilan yuboriladi.`;
                sources = [
                    { metadata: { code: '1C OData' }, title: '1C:Enterprise OData rasmiy yo\'riqnomasi', url: 'https://its.1c.ru' },
                    { metadata: { code: 'RegAI 1C' }, title: 'RegAI 1C integratsiya moduli', url: '/transformation' }
                ];
            } else {
                reply = `### Двусторонняя интеграция с 1С:Предприятие (OData v4 REST API)\n\n` +
                    `1. **Импорт (Ingestion):** Извлечение оборотно-сальдовой ведомости (ОСВ) через \`AccountingRegister_Хозрасчетный/Balance\` со счетами 01, 10, 50, 51, 60, 62, 80, 84.\n\n` +
                    `2. **Безопасность:** Пароли и токены OData шифруются симметричным шифром **AES-256 (Fernet)** на уровне БД.\n\n` +
                    `3. **Экспорт корректировок (Pushback):** Трансляция рассчитанных МСФО-корректировок напрямую в \`Document_ОперацияБух\` с генерацией бухгалтерских проводок.`;
                sources = [
                    { metadata: { code: '1C OData' }, title: 'Документация 1C:Enterprise OData', url: 'https://its.1c.ru' },
                    { metadata: { code: 'RegAI 1C' }, title: 'Коннектор 1C в RegAI', url: '/transformation' }
                ];
            }
        // 6. General / Fallback Question
        } else {
            if (lang === 'en') {
                reply = `### Regulatory Compliance Consultation: "${rawMsg || 'Regulatory Guidance'}"\n\n` +
                    `Thank you for your question: **"${rawMsg || 'Regulatory Guidance'}"**.\n\n` +
                    `The **RegAI Intelligence Engine** analyzed the regulatory and compliance databases. To maintain full adherence to IFRS and national tax legislation, we recommend:\n\n` +
                    `1. **Document Verification:** Verify reconciliation statements and supporting primary accounting documents.\n` +
                    `2. **AI Audit:** Run an automated audit and risk check in the **AI Tax Analysis** module.\n` +
                    `3. **Regulatory Review:** Review jurisdiction-specific legal standards in the **Regulations** and **Tax Config** sections.`;
                sources = [
                    { metadata: { code: 'RegAI Core' }, title: 'RegAI Compliance Knowledge Base', url: '/regulations' }
                ];
            } else if (lang === 'uz') {
                reply = `### Normativlar bo'yicha maslahat: "${rawMsg || 'Normativ tavsiyalar'}"\n\n` +
                    `Savolingiz uchun tashakkur: **«${rawMsg || 'Normativ tavsiyalar'}»**.\n\n` +
                    `**RegAI** intellektual yordamchisi normativ-huquqiy va komplayens ma'lumotlar bazasini tekshirdi. MHXS standartlari va mahalliy soliq qonunchiligiga to'liq rioya qilish uchun quyidagilar tavsiya etiladi:\n\n` +
                    `1. **Hujjatlarni taqqoslash:** Hisob-kitoblarni taqqoslash va tasdiqlovchi birlamchi buxgalteriya hujjatlarini tekshirish.\n` +
                    `2. **AI Tax tahlili:** **AI Tax Analysis** bo'limida hisobotlar bo'yicha avtomatik audit va soliq tahlilini ishga tushirish.\n` +
                    `3. **Me'yoriy baza:** **Regulations** hamda **Tax Config** bo'limlarida amaldagi qonunchilik va stavkalarni ko'rib chiqish.`;
                sources = [
                    { metadata: { code: 'RegAI Core' }, title: 'RegAI Compliance Engine bilimlar bazasi', url: '/regulations' }
                ];
            } else {
                reply = `### Консультация по нормативам: «${rawMsg || 'Консультация по нормативам'}»\n\n` +
                    `Благодарю за вопрос: **«${rawMsg || 'Консультация по нормативам'}»**.\n\n` +
                    `Интеллектуальный ассистент **RegAI** проверил нормативную базу комплаенса. Для поддержания соответствия нормативам МСФО и локального налогового законодательства рекомендуется:\n\n` +
                    `1. **Сверка документов:** Проверить сверку взаиморасчетов и подтверждающих первичных документов.\n` +
                    `2. **Анализ рисков:** Запустить анализ отчётности на странице **AI Tax Analysis**.\n` +
                    `3. **Нормативная база:** Ознакомиться с базой нормативно-правовых актов в разделах **Regulations** и **Tax Config**.`;
                sources = [
                    { metadata: { code: 'RegAI Core' }, title: 'База знаний RegAI Compliance Engine', url: '/regulations' }
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
