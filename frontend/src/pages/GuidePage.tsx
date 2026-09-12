import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    ChevronRight, 
    Home, 
    LogIn, 
    BarChart3, 
    FileText, 
    Shield, 
    AlertTriangle, 
    Upload, 
    Settings,
    CheckCircle2,
    Sparkles,
    Calculator
} from 'lucide-react';

export default function GuidePage() {
    const { i18n } = useTranslation();
    const isRu = (i18n.language || 'ru').toLowerCase().startsWith('ru');
    const [activeSection, setActiveSection] = useState('introduction');

    const sections = [
        { id: 'introduction', title: isRu ? '1. Введение' : '1. Introduction', icon: Home },
        { id: 'login', title: isRu ? '2. Вход в систему' : '2. System Login', icon: LogIn },
        { id: 'dashboard', title: isRu ? '3. Главная панель' : '3. Main Dashboard', icon: BarChart3 },
        { id: 'regulations', title: isRu ? '4. Нормативы' : '4. Regulations', icon: Shield },
        { id: 'compliance', title: isRu ? '5. Проверки соответствия' : '5. Compliance Checks', icon: AlertTriangle },
        { id: 'reports', title: isRu ? '6. Финансовые отчеты' : '6. Financial Reports', icon: FileText },
        { id: 'tax-analysis', title: isRu ? '7. AI Анализ налогов' : '7. AI Tax Analysis', icon: Calculator },
        { id: 'transformation', title: isRu ? '8. Трансформация балансов' : '8. Balance Transformation', icon: Upload },
        { id: 'documents', title: isRu ? '9. Документы' : '9. Documents', icon: FileText },
        { id: 'admin', title: isRu ? '10. Администрирование' : '10. Administration', icon: Settings },
    ];

    return (
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-slate-50">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-72 border-r bg-white p-4 shrink-0 shadow-sm">
                <div className="mb-4 pb-3 border-b">
                    <h2 className="text-lg font-bold text-slate-900">
                        {isRu ? 'Руководство пользователя' : 'User Guide'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {isRu ? 'Инструкции и справка по платформе' : 'Platform documentation and manuals'}
                    </p>
                </div>
                <nav className="space-y-1">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        const isActive = activeSection === section.id;
                        return (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all text-xs sm:text-sm font-medium ${
                                    isActive
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                        : 'hover:bg-slate-100 text-slate-700'
                                }`}
                            >
                                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                                <span className="truncate">{section.title}</span>
                                {isActive && <ChevronRight className="h-4 w-4 ml-auto shrink-0" />}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Section 1: Introduction */}
                    {activeSection === 'introduction' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                    {isRu ? 'RegAI Platform — Руководство пользователя' : 'RegAI Platform — User Guide'}
                                </h1>
                                <p className="text-sm text-slate-500 mt-1">
                                    {isRu ? 'Версия: 2.6 Enterprise • Автоматизация МСФО и НСБУ' : 'Version: 2.6 Enterprise • IFRS & NAS Automation'}
                                </p>
                            </div>

                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader className="bg-slate-50/50 border-b pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                                        <Sparkles className="h-5 w-5 text-blue-600" />
                                        {isRu ? 'Что такое RegAI?' : 'What is RegAI?'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-5 text-sm text-slate-700 leading-relaxed">
                                    <p>
                                        <strong>RegAI</strong> — {isRu 
                                            ? 'интеллектуальная FinTech-платформа корпоративного уровня для автоматизации финансовой отчетности, трансформации МСФО (IFRS) и контроля нормативного комплаенса.'
                                            : 'an enterprise-grade FinTech intelligence platform for financial reporting automation, IFRS transformation, and regulatory compliance monitoring.'
                                        }
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                        <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-2.5">
                                            <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                                            <span>{isRu ? 'Трансформация балансов из НСБУ в МСФО (IFRS 9, 16, IAS 36)' : 'Balance transformation from NAS into IFRS (9, 16, IAS 36)'}</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                                            <span>{isRu ? 'Синхронизация с 1С:Предприятие через двусторонний OData API' : 'Two-way synchronization with 1C:Enterprise via OData API'}</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 flex items-start gap-2.5">
                                            <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                                            <span>{isRu ? 'База из 120+ нормативов (МСФО, НСБУ, Базель III, Налоговый кодекс)' : '120+ normatives library (IFRS, NAS, Basel III, Tax Code)'}</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 flex items-start gap-2.5">
                                            <CheckCircle2 className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                            <span>{isRu ? 'AI Аудитор с формированием меморандума и КВА (ISA 701)' : 'AI Auditor with audit memorandum and KAM generation (ISA 701)'}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t mt-4">
                                        <h3 className="font-bold text-slate-900 mb-3">
                                            {isRu ? 'Роли пользователей и права доступа' : 'User Roles & Access Levels'}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="border rounded-xl p-3.5 bg-white shadow-xs">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-bold text-blue-600 text-sm">Superadmin</h4>
                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono">Global</span>
                                                </div>
                                                <p className="text-xs text-slate-600">
                                                    {isRu ? 'Полный системный доступ ко всем тенантам, компаниям и журналам аудита' : 'Full platform access across all tenants, companies and audit logs'}
                                                </p>
                                            </div>
                                            <div className="border rounded-xl p-3.5 bg-white shadow-xs">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-bold text-emerald-600 text-sm">Company Admin / Owner</h4>
                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono">Executive</span>
                                                </div>
                                                <p className="text-xs text-slate-600">
                                                    {isRu ? 'Управление компанией, добавление сотрудников и настройка интеграции с 1С' : 'Company management, employee invitation and 1C connection configuration'}
                                                </p>
                                            </div>
                                            <div className="border rounded-xl p-3.5 bg-white shadow-xs">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-bold text-purple-600 text-sm">Accountant</h4>
                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-mono">Ledger</span>
                                                </div>
                                                <p className="text-xs text-slate-600">
                                                    {isRu ? 'Загрузка ОСВ, проведение корректировок МСФО, экспорт 3-стороннего Excel' : 'Trial balance upload, IFRS adjustments, and 3-way Excel export'}
                                                </p>
                                            </div>
                                            <div className="border rounded-xl p-3.5 bg-white shadow-xs">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-bold text-amber-600 text-sm">Auditor</h4>
                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-mono">Audit</span>
                                                </div>
                                                <p className="text-xs text-slate-600">
                                                    {isRu ? 'Проверка отчетов, анализ сходимости баланса и генерация меморандума аудита' : 'Report verification, balance convergence review, and audit memo generation'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Section 2: Login */}
                    {activeSection === 'login' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                {isRu ? '2. Вход в систему и авторизация' : '2. System Authentication & Login'}
                            </h1>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                        {isRu ? 'Быстрый вход через готовые демо-профили (1 клик)' : '1-Click Quick Demo Profiles'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-3 text-slate-700">
                                    <p>
                                        {isRu 
                                            ? 'Для тестирования платформы на странице входа доступны предустановленные демо-профили всех ролей.'
                                            : 'Pre-configured demo profiles for all roles are available directly on the login page for rapid onboarding.'
                                        }
                                    </p>
                                    <div className="p-3.5 rounded-xl bg-slate-50 border space-y-2 text-xs font-mono">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Owner:</span>
                                            <span className="font-semibold text-slate-800">owner@regai.ai</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Accountant:</span>
                                            <span className="font-semibold text-slate-800">accountant@regai.ai</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Auditor:</span>
                                            <span className="font-semibold text-slate-800">auditor@regai.ai</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Demo Password:</span>
                                            <span className="font-semibold text-blue-600">RegAI2026! / FinBridge2026!</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {isRu 
                                            ? 'Нажмите на любую карточку — поля заполнятся автоматически, затем нажмите «Войти».'
                                            : 'Click on any profile card to automatically populate fields, then click "Sign In".'
                                        }
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Section 3: Dashboard */}
                    {activeSection === 'dashboard' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                {isRu ? '3. Главная панель (Dashboard)' : '3. Executive Dashboard'}
                            </h1>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Card className="p-4 bg-white border shadow-xs">
                                    <div className="text-xs text-slate-500 font-medium">{isRu ? 'Оценка соответствия' : 'Compliance Score'}</div>
                                    <div className="text-2xl font-bold text-emerald-600 mt-1">94%</div>
                                    <div className="text-[11px] text-slate-400 mt-1">{isRu ? 'МСФО и НСБУ' : 'IFRS & NAS'}</div>
                                </Card>
                                <Card className="p-4 bg-white border shadow-xs">
                                    <div className="text-xs text-slate-500 font-medium">{isRu ? 'Активные предупреждения' : 'Active Alerts'}</div>
                                    <div className="text-2xl font-bold text-amber-600 mt-1">3</div>
                                    <div className="text-[11px] text-slate-400 mt-1">{isRu ? 'Требуют внимания' : 'Require review'}</div>
                                </Card>
                                <Card className="p-4 bg-white border shadow-xs">
                                    <div className="text-xs text-slate-500 font-medium">{isRu ? 'Трансформировано отчетов' : 'Transformed Reports'}</div>
                                    <div className="text-2xl font-bold text-blue-600 mt-1">12</div>
                                    <div className="text-[11px] text-slate-400 mt-1">{isRu ? 'За текущий квартал' : 'This quarter'}</div>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                        {isRu ? 'Ключевые блоки главной панели' : 'Dashboard Core Components'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-3 text-slate-700">
                                    <ul className="list-disc ml-6 space-y-2">
                                        <li>
                                            <strong>{isRu ? 'Телеметрия сходимости:' : 'Convergence Telemetry:'}</strong> {isRu ? 'контроль формулы Баланс = Активы − (Обязательства + Капитал) в реальном времени с нулевой дельтой.' : 'Real-time validation of Assets = Liabilities + Equity formula with zero delta guard.'}
                                        </li>
                                        <li>
                                            <strong>{isRu ? 'Категории рисков:' : 'Risk Categories:'}</strong> {isRu ? 'быстрая фильтрация по стандартам IFRS 9 (кредитный риск), IFRS 16 (аренда), IAS 36 (обесценение).' : 'Fast filtering across IFRS 9 (credit risk), IFRS 16 (leases), IAS 36 (impairment).'}
                                        </li>
                                        <li>
                                            <strong>{isRu ? 'Прямой переход в разделы:' : 'Direct Deep-links:'}</strong> {isRu ? 'клик по любой метрике сразу открывает детальный реестр с преднастроенными фильтрами.' : 'Clicking any KPI widget instantly routes to the detailed view with applied filters.'}
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Section 4: Regulations */}
                    {activeSection === 'regulations' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                {isRu ? '4. Реестр нормативов и авто-синхронизация' : '4. Regulations Library & Auto-Sync'}
                            </h1>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                        {isRu ? 'База знаний нормативных актов (120+ стандартов)' : 'Regulatory Knowledge Base (120+ Standards)'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-3 text-slate-700">
                                    <p>
                                        {isRu 
                                            ? 'Платформа содержит полную коллекцию стандартов МСФО (IFRS 1–17, IAS 1–37), национальных стандартов Узбекистана (НСБУ 1–22), Базель III (CAR, LCR), Налогового кодекса РУз и стандартов аудита МСА.'
                                            : 'The platform houses a complete corpus of IFRS (1–17, IAS 1–37), Uzbekistan National Standards (NAS 1–22), Basel III (CAR, LCR), Tax Code, and ISA audit standards.'
                                        }
                                    </p>
                                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                                        <div className="font-bold text-blue-900 text-xs uppercase tracking-wide">
                                            {isRu ? 'Автоматическое пополнение 24/7:' : 'Automated 24/7 Seeding:'}
                                        </div>
                                        <p className="text-xs text-blue-800 leading-relaxed">
                                            {isRu 
                                                ? 'Каждые 6 часов и при каждом запуске система автоматически сверяет реестр нормативов и загружает новые акты без участия пользователя. Кнопка «Авто-пополнение базы» в шапке страницы позволяет запустить процесс вручную в 1 клик.'
                                                : 'Every 6 hours and upon system boot, the platform automatically reconciles the regulation catalog and loads missing standards. The "Auto-Sync Library" button in the header triggers manual sync on demand.'
                                            }
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Section 5: Compliance */}
                    {activeSection === 'compliance' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                {isRu ? '5. Проверки соответствия и риск-контроль' : '5. Compliance Checks & Risk Control'}
                            </h1>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                        {isRu ? 'Запуск и анализ аудиторских проверок' : 'Executing Compliance Audits'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-3 text-slate-700">
                                    <ol className="list-decimal ml-6 space-y-2">
                                        <li>{isRu ? 'Перейдите в раздел «Соблюдение норм» → «Проверки соответствия».' : 'Navigate to "Compliance" → "Compliance Checks".'}</li>
                                        <li>{isRu ? 'Нажмите кнопку «Запустить проверку» (Run Compliance Check).' : 'Click "Run Compliance Check".'}</li>
                                        <li>{isRu ? 'Система проанализирует данные компании и сформирует перечень несоответствий с градацией Critical / High / Medium / Low.' : 'The engine will analyze company filings and generate classified discrepancies (Critical, High, Medium, Low).'}</li>
                                        <li>{isRu ? 'Каждое предупреждение содержит пошаговые рекомендации по устранению (Action Items).' : 'Each alert is paired with actionable remediation guidance (Action Items).'}</li>
                                    </ol>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Section 6: Reports */}
                    {activeSection === 'reports' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                {isRu ? '6. Финансовые отчеты и выгрузка' : '6. Financial Reports & Exports'}
                            </h1>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                        {isRu ? 'Генерация 3-сторонней отчетности (НСБУ / Корректировки / МСФО)' : '3-Way Financial Statement Generation'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-3 text-slate-700">
                                    <p>
                                        {isRu 
                                            ? 'Платформа формирует аудированный отчет в трёх параллельных столбцах: баланс НСБУ, суммы корректировок МСФО и итоговый трансформированный баланс МСФО.'
                                            : 'The engine renders an audited 3-column statement: original NAS balance, IFRS adjustment journal, and the resulting IFRS converted balance.'
                                        }
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                                        <div className="p-3 bg-slate-50 border rounded-lg text-center">
                                            <div className="font-bold text-slate-800 text-xs">Excel (.xlsx)</div>
                                            <div className="text-[10px] text-slate-500 mt-1">{isRu ? 'Формулы SUM/SUMIF' : 'Formulas SUM/SUMIF'}</div>
                                        </div>
                                        <div className="p-3 bg-slate-50 border rounded-lg text-center">
                                            <div className="font-bold text-slate-800 text-xs">PDF Report</div>
                                            <div className="text-[10px] text-slate-500 mt-1">{isRu ? 'Для совета директоров' : 'Board-ready export'}</div>
                                        </div>
                                        <div className="p-3 bg-slate-50 border rounded-lg text-center">
                                            <div className="font-bold text-slate-800 text-xs">JSON API</div>
                                            <div className="text-[10px] text-slate-500 mt-1">{isRu ? 'Интеграция с ERP / 1C' : 'ERP / 1C Integration'}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Section 7: Tax Analysis */}
                    {activeSection === 'tax-analysis' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                {isRu ? '7. AI Анализ налогов и налоговая оптимизация' : '7. AI Tax Analysis & Optimization'}
                            </h1>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                        {isRu ? 'Интеллектуальная налоговая аналитика' : 'Intelligent Tax Health Check'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-3 text-slate-700">
                                    <ul className="list-disc ml-6 space-y-2">
                                        <li>{isRu ? 'Проверка корректности ставок налога на прибыль (15%) и НДС (12%) по НК РУз.' : 'Validation of corporate income tax (15%) and VAT (12%) rates against Tax Code.'}</li>
                                        <li>{isRu ? 'Выявление неиспользованных налоговых льгот и оптимизационных резервов.' : 'Detection of unapplied tax credits and optimization allowances.'}</li>
                                        <li>{isRu ? 'Автоматическая сверка сумм ЭСФ через систему e-INVOICE.' : 'Automatic cross-matching of e-INVOICE amounts.'}</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Section 8: Transformation */}
                    {activeSection === 'transformation' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                {isRu ? '8. Трансформация балансов (НСБУ → МСФО)' : '8. Balance Transformation (NAS → IFRS)'}
                            </h1>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                        {isRu ? 'Движок трансформации с защитой равенства баланса (Zero-Delta Guard)' : 'Transformation Engine with Zero-Delta Capital Guard'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-3 text-slate-700">
                                    <p>
                                        {isRu 
                                            ? 'При проведении трансформационных проводок движок автоматически соблюдает парность отражения в капитале (счет 84 «Нераспределенная прибыль»), гарантируя 100% сходимость баланса:'
                                            : 'During transformation adjustments, the engine strictly maintains dual-entry impact on retained earnings, guaranteeing 100% balance convergence:'
                                        }
                                    </p>
                                    <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs space-y-1">
                                        <div className="text-blue-400 font-bold">// IFRS 16 (Leases / Аренда):</div>
                                        <div>Дт 01 (ROU Актив) — Кт 67 (Обязательство)</div>
                                        <div className="text-blue-400 font-bold mt-2">// IAS 36 (Impairment / Обесценение ОС):</div>
                                        <div>Дт 84 (Капитал) — Кт 02/01 (Обесценение)</div>
                                        <div className="text-blue-400 font-bold mt-2">// IFRS 9 (ECL Credit Losses / Резерв сомнительных долгов):</div>
                                        <div>Дт 84 (Капитал) — Кт 63/62 (Резерв ECL)</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Section 9: Documents */}
                    {activeSection === 'documents' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                {isRu ? '9. Электронный документооборот и OCR' : '9. Documents & OCR Extraction'}
                            </h1>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                        {isRu ? 'Распознавание первичных документов (PDF / Excel / Сканы)' : 'Primary Document Extraction (PDF / Excel / Scans)'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-3 text-slate-700">
                                    <p>
                                        {isRu 
                                            ? 'Модуль OCR автоматически извлекает табличные данные, реквизиты договоров, акты сверок и оборотно-сальдовые ведомости из файлов любого формата с привязкой к счетам учета.'
                                            : 'The OCR subsystem extracts tabular data, contract terms, reconciliation statements, and trial balances from arbitrary file formats directly into ledger mappings.'
                                        }
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Section 10: Administration */}
                    {activeSection === 'admin' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                {isRu ? '10. Администрирование и безопасность' : '10. Administration & Governance'}
                            </h1>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                        {isRu ? 'Управление доступом (RBAC) и аудит операций' : 'Role-Based Access Control (RBAC) & Audit Logs'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-3 text-slate-700">
                                    <ul className="list-disc ml-6 space-y-2">
                                        <li>{isRu ? 'Изоляция данных на уровне тенанта (Tenant ID) исключает доступ к данным других организаций.' : 'Strict tenant data isolation (Tenant ID) eliminates cross-organizational data leakage.'}</li>
                                        <li>{isRu ? 'Журнал аудита фиксирует каждое действие: вход, изменения проводок, генерацию отчетов с временными метками UTC.' : 'Tamper-proof audit logging records every event: logins, entry updates, report generation with UTC timestamps.'}</li>
                                        <li>{isRu ? 'Шифрование данных AES-256 в состоянии покоя и TLS 1.3 при передаче.' : 'AES-256 encryption at rest and TLS 1.3 in transit.'}</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
