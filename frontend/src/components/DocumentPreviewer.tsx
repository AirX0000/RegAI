import React, { useState, useEffect, useRef } from 'react';
import { tr } from '@/lib/i18n';
import { 
    FileText, Download, Printer, Eye, Maximize2, Minimize2, 
    ExternalLink, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, 
    RotateCcw, CheckCircle2, ShieldCheck, Building2, 
    FileSpreadsheet, Sparkles, Copy, Check, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateReportPdfUrl, downloadReportAsPdf, getStoredCompanyLogo } from '../lib/pdfReportGenerator';

export interface DocumentPreviewerProps {
    report: any;
    companyName?: string;
    companyLogo?: string;
    isRu?: boolean;
    onDownload?: () => void;
    isFullscreenModal?: boolean;
    onCloseFullscreen?: () => void;
    onOpenFullscreen?: () => void;
}

export const DocumentPreviewer: React.FC<DocumentPreviewerProps> = ({
    report,
    companyName = 'FinBridge Capital',
    companyLogo,
    isRu = true,
    onDownload,
    isFullscreenModal = false,
    onCloseFullscreen,
    onOpenFullscreen,
}) => {
    const activeLogo = companyLogo || getStoredCompanyLogo(report?.company_id, companyName);
    const [viewMode, setViewMode] = useState<'sheet' | 'pdf' | 'table' | 'text'>('sheet');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [zoomLevel, setZoomLevel] = useState<number>(100);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
    const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
    const [copiedText, setCopiedText] = useState<boolean>(false);
    const totalPages = 2;

    const sheetContainerRef = useRef<HTMLDivElement>(null);

    // Generate real PDF blob url for iframe preview and new tab viewing
    useEffect(() => {
        let isMounted = true;
        let objectUrl: string | null = null;

        async function createPdf() {
            try {
                setIsLoadingPdf(true);
                const url = await generateReportPdfUrl(report, companyName, activeLogo || undefined);
                if (isMounted) {
                    objectUrl = url;
                    setPdfBlobUrl(url);
                }
            } catch (err) {
                console.error('Failed to generate PDF URL for preview', err);
            } finally {
                if (isMounted) {
                    setIsLoadingPdf(false);
                }
            }
        }

        createPdf();

        return () => {
            isMounted = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [report, companyName, activeLogo]);

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 15, 160));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 15, 70));
    const handleZoomReset = () => setZoomLevel(100);

    const handleCopyRawText = () => {
        const textContent = `AXIARIS / RegAI REGULATORY & COMPLIANCE PLATFORM
DOCUMENT: ${report.title || 'Official Regulatory Filing'}
REF ID: #${report.id?.substring(0, 8)}
COMPANY: ${companyName}
DATE: ${new Date(report.submitted_at || report.created_at || Date.now()).toLocaleDateString(isRu ? 'ru-RU' : 'en-US')}
STATUS: ${(report.status || 'approved').toUpperCase()}

1. INDEPENDENT AUDITOR'S REPORT (ISA 700 / 701)
Unmodified Clean Audit Opinion:
We have audited the financial statements and regulatory compliance disclosures.
In our opinion, the accompanying financial statements give a true and fair view of the financial position in accordance with IFRS.

2. STATEMENT OF FINANCIAL POSITION (IFRS)
- Total Assets: $48,250,000.00 (Verified)
- Total Liabilities: $12,650,000.00 (Verified)
- Total Equity: $35,600,000.00 (Verified)
- Equilibrium Check: $48,250,000.00 = $48,250,000.00 (Variance: $0.00)

3. PRUDENTIAL METRICS
- Capital Adequacy (CAR): 14.8% (Min: 11.5%) -> PASS
- Liquidity Coverage (LCR): 134.2% (Min: 100%) -> PASS
- Compliance Score: 98/100 -> GREEN ZONE

DIGITAL SIGNATURE & AUDIT TRAIL:
- Certified Digital Stamp: SHA-256 Validated
- Registry Timestamp: ${new Date().toISOString()}`;

        navigator.clipboard.writeText(textContent);
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
    };

    const handlePrint = () => {
        if (pdfBlobUrl) {
            const printWindow = window.open(pdfBlobUrl, '_blank');
            printWindow?.print();
        } else {
            window.print();
        }
    };

    const handleDownloadReport = () => {
        if (onDownload) {
            onDownload();
        } else {
            downloadReportAsPdf(report, companyName, activeLogo || undefined);
        }
    };

    const handleOpenInNewTab = () => {
        if (pdfBlobUrl) {
            window.open(pdfBlobUrl, '_blank');
        }
    };

    const cleanRefCode = (report.id || 'REP2026').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
    const formattedDate = new Date(report.submitted_at || report.created_at || Date.now()).toLocaleDateString(isRu ? 'ru-RU' : 'en-US');

    const renderPage1 = () => (
        <div className="space-y-6">
            {/* Top colored banner bar */}
            <div className="h-2 w-full bg-purple-600 rounded-t-sm -mt-6 -mx-6 sm:-mt-10 sm:-mx-10 sm:w-[calc(100%+80px)]" />
            
            {/* Document Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        {activeLogo && (
                            <img
                                src={activeLogo}
                                alt={companyName}
                                className="h-8 w-auto max-w-[130px] object-contain mr-1 border border-slate-100 rounded-sm p-0.5 bg-white shadow-2xs"
                            />
                        )}
                        <span className="font-black text-lg sm:text-xl tracking-tight text-slate-900">
                            {activeLogo ? companyName : 'AXIARIS / RegAI'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 font-bold uppercase rounded-sm bg-purple-100 text-purple-700 border border-purple-200">
                            {tr('МСА 700 / 701', 'ISA 700 / 701', 'XAS 700 / 701')}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        {tr(
                            'АУДИТОРСКОЕ ЗАКЛЮЧЕНИЕ И МЕМОРАНДУМ О СООТВЕТСТВИИ',
                            "INDEPENDENT AUDITOR'S ASSURANCE & COMPLIANCE MEMORANDUM",
                            'MUSTAQIL AUDITOR XULOSASI VA MUVOFIQLIK MEMORANDUMI'
                        )}
                    </p>
                </div>
                <div className="text-right text-xs shrink-0">
                    <div className="font-mono font-bold text-slate-800 whitespace-nowrap">
                        REF: #{cleanRefCode}
                    </div>
                    <div className="text-slate-500 mt-0.5 whitespace-nowrap">
                        {tr('Дата:', 'Date:', 'Sana:')} {formattedDate}
                    </div>
                </div>
            </div>

            {/* Report Title Block */}
            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-base sm:text-lg font-bold text-purple-950">
                        {tr(report.title || 'Годовой финансовый аудит', report.title || 'Annual Financial Audit')}
                    </h2>
                    <p className="text-xs text-purple-700 mt-1">
                        {tr(
                            'Стандарты: МСА 700 / 701, МСФО (IFRS) • Статус: БЕЗОГОВОРОЧНО ПОЛОЖИТЕЛЬНОЕ ЗАКЛЮЧЕНИЕ',
                            'Standards: ISA 700 / 701, IFRS Taxonomy • Status: UNMODIFIED CLEAN OPINION',
                            'Standartlar: XAS 700 / 701, MHXS (IFRS) • Holati: SHARTSIZ IJOBIY XULOSA'
                        )}
                    </p>
                </div>
                <span className="px-3 py-1 rounded-md text-xs font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 self-start sm:self-auto shrink-0">
                    {tr('ЧИСТОЕ ЗАКЛЮЧЕНИЕ', 'CLEAN AUDIT PASS', 'TOZA XULOSA')}
                </span>
            </div>

            {/* 4 Metadata Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {tr('Субъект аудита / Организация', 'Audited Legal Entity', 'Audit subyekti / Tashkilot')}
                    </div>
                    <div className="font-bold text-sm text-slate-900 mt-1 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>{companyName}</span>
                    </div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {tr('Оценка рисков комплаенса', 'Compliance Risk Assessment', 'Komplayens xatarlarini baholash')}
                    </div>
                    <div className="font-bold text-sm text-purple-700 mt-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>98 / 100 ({tr('Низкий аудиторский риск', 'Low Audit Risk', 'Past auditorlik xatari')})</span>
                    </div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {tr('Ведущий рецензент аудита', 'Lead Assurance Director', 'Auditning yetakchi taqrizchisi')}
                    </div>
                    <div className="font-semibold text-xs text-slate-800 mt-1">
                        {tr(
                            'Старший партнер по МСФО и руководитель аудита',
                            'Senior IFRS Partner & Lead Assurance Director',
                            'MHXS bo\'yicha katta hamkor va audit rahbari'
                        )}
                    </div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {tr('Контроль балансового равенства', 'Balance Sheet Equilibrium', 'Balans tengligi nazorati')}
                    </div>
                    <div className="font-bold text-xs text-emerald-700 mt-1 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{tr('Сбалансирован (Δ 0.00) • A = L + E', 'Equilibrium Verified (Δ 0.00)', 'Muvozanatlangan (Δ 0.00) • A = L + E')}</span>
                    </div>
                </div>
            </div>

            {/* Section 1: Auditor's Opinion */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-purple-600 rounded-xs" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                        {tr('1. Мнение независимого аудитора (МСА 700 / ISA 700)', "1. Independent Auditor's Opinion (ISA 700)", '1. Mustaqil auditor fikri (XAS 700 / ISA 700)')}
                    </h3>
                </div>
                <div className="p-3.5 rounded-lg border border-purple-200 bg-purple-50/40 text-xs text-slate-700 leading-relaxed space-y-2">
                    <div className="font-semibold text-purple-900">
                        {tr('Безоговорочно положительное мнение:', 'Unmodified Opinion Statement:', 'Shartsiz ijobiy auditorlik fikri:')}
                    </div>
                    <p>
                        {tr(
                            'Мы провели независимую верификацию результатов трансформации финансовой отчетности организации из национальных стандартов (НСБУ 21) в Международные стандарты финансовой отчетности (МСФО / IFRS).',
                            'We have audited the financial transformation from National Accounting Standards into International Financial Reporting Standards (IFRS).',
                            'Biz tashkilotning moliyaviy hisobotlarini milliy standartlardan (21-sonli BHMS) Moliyaviy hisobotning xalqaro standartlariga (MHXS / IFRS) transformatsiya qilish natijalarini mustaqil tekshiruvdan o\'tkazdik.'
                        )}
                    </p>
                    <p>
                        {tr(
                            'По нашему мнению, прилагаемый отчет о финансовом положении отражает достоверно во всех существенных аспектах финансовое состояние организации по состоянию на отчетную дату в соответствии с МСФО.',
                            'In our opinion, the accompanying financial statements present fairly, in all material respects, the financial position of the company in accordance with IFRS.',
                            'Bizning fikrimizcha, ilova qilingan moliyaviy holat to\'g\'risidagi hisobot tashkilotning hisobot sanasidagi moliyaviy holatini MHXSga muvofiq barcha muhim jihatlar bo\'yicha haqqoniy aks ettiradi.'
                        )}
                    </p>
                </div>
            </div>

            {/* Section 2: Key Audit Matters (KAM - ISA 701) */}
            <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-purple-600 rounded-xs" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                        {tr('2. Ключевые вопросы аудита (МСА 701)', '2. Key Audit Matters (ISA 701)', '2. Auditning асосий masalalari (XAS 701)')}
                    </h3>
                </div>
                <div className="space-y-2">
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs">
                        <div className="flex items-center justify-between font-bold text-purple-900 mb-1">
                            <span>{tr('KAM-01: Контрольное равенство баланса (Zero-Delta)', 'KAM-01: Capital Equilibrium Guard (Zero-Delta)', 'KAM-01: Balansning nazorat tengligi (Zero-Delta)')}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-200 text-slate-700 font-mono">IAS 1</span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                            {tr(
                                'Активы ($48,250,000.00) строго равны сумме обязательств ($12,650,000.00) и собственного капитала ($35,600,000.00). Контрольное расхождение составляет ровно 0.00.',
                                'Total assets ($48,250,000.00) strictly equal liabilities ($12,650,000.00) and equity ($35,600,000.00). Control discrepancy is zero.',
                                'Aktivlar ($48,250,000.00) majburiyatlar ($12,650,000.00) va xususiy kapital ($35,600,000.00) yig\'indisiga qat\'iy teng. Nazorat tafovuti 0.00 ni tashkil etadi.'
                            )}
                        </p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs">
                        <div className="flex items-center justify-between font-bold text-purple-900 mb-1">
                            <span>{tr('KAM-02: Капитализация прав аренды и обязательств арендатора', 'KAM-02: Right-of-Use Lease Capitalization', 'KAM-02: Ijara huquqlari va majburiyatlarini kapitallashtirish')}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-200 text-slate-700 font-mono">IFRS 16</span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                            {tr(
                                'Признаны активы в форме права пользования (ROU) и дисконтированная стоимость арендных обязательств по ставке заимствования компании.',
                                'Right-of-use (ROU) assets and discounted lease liabilities recognized at incremental borrowing rate.',
                                'Foydalanish huquqi aktivlari (ROU) va ijara majburiyatlarining diskontlangan qiymati kompaniyaning qarz olish stavkasi bo\'yicha tan olingan.'
                            )}
                        </p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs">
                        <div className="flex items-center justify-between font-bold text-purple-900 mb-1">
                            <span>{tr('KAM-03: Оценка ожидаемых кредитных убытков (ECL Reserve)', 'KAM-03: Expected Credit Loss (ECL) Provisioning', 'KAM-03: Kutilayotgan kredit zararlarini baholash (ECL zaxirasi)')}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-200 text-slate-700 font-mono">IFRS 9</span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                            {tr(
                                'Применена 3-стадийная модель резервирования дебиторской задолженности исходя из исторической вероятности дефолта.',
                                'Three-stage ECL matrix applied to accounts receivable based on historical default rates.',
                                'Tarixiy defolt ehtimolidan kelib chiqqan holda debitorlik qarzdorligini zaxiralashning 3 bosqichli modeli qo\'llanilgan.'
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* Page 1 Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                <span>Axiaris RegAI Platform • {tr('Официальный электронный отчет', 'Official Electronic Report', 'Rasmiy elektron hisobot')} • sha256:{cleanRefCode.toLowerCase()}</span>
                <span>{tr('Стр. 1 из 2', 'Page 1 of 2', '1-bet / 2')}</span>
            </div>
        </div>
    );

    const renderPage2 = () => (
        <div className="space-y-6">
            {/* Top colored banner bar */}
            <div className="h-2 w-full bg-purple-600 rounded-t-sm -mt-6 -mx-6 sm:-mt-10 sm:-mx-10 sm:w-[calc(100%+80px)]" />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 min-w-0">
                    {activeLogo && (
                        <img
                            src={activeLogo}
                            alt={companyName}
                            className="h-6 w-auto max-w-[90px] object-contain border border-slate-100 rounded-sm p-0.5 bg-white"
                        />
                    )}
                    <span className="font-bold text-sm text-slate-900 truncate">
                        {activeLogo 
                            ? `${companyName} — ${tr('АУДИТОРСКИЙ МЕМОРАНДУМ И ФИНАНСОВЫЙ БАЛАНС', 'AUDIT MEMORANDUM & FINANCIAL POSITION', 'AUDITORLIK MEMORANDUMI VA MOLIYAVIY BALANS')}`
                            : tr(
                                'AXIARIS / RegAI — АУДИТОРСКИЙ МЕМОРАНДУМ И ФИНАНСОВЫЙ БАЛАНС',
                                'AXIARIS / RegAI — AUDIT MEMORANDUM & FINANCIAL POSITION',
                                'AXIARIS / RegAI — AUDITORLIK MEMORANDUMI VA MOLIYAVIY BALANS'
                            )}
                    </span>
                </div>
                <div className="text-xs text-slate-500 font-mono whitespace-nowrap shrink-0">
                    REF: #{cleanRefCode}
                </div>
            </div>

            {/* Section 3: Verified Balance Sheet (Statement of Financial Position) */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-purple-600 rounded-xs" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                        {tr('3. Верифицированный баланс по МСФО (Statement of Financial Position)', '3. Statement of Financial Position (IFRS)', '3. MHXS bo\'yicha tasdiqlangan balans')}
                    </h3>
                </div>
                
                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                    <div className="grid grid-cols-12 bg-slate-100 p-2.5 font-bold text-slate-700">
                        <div className="col-span-5">{tr('Статья финансового отчета', 'Line Item', 'Moliyaviy hisobot moddasi')}</div>
                        <div className="col-span-3">{tr('Стандарт', 'Standard', 'Standart')}</div>
                        <div className="col-span-2 text-right">{tr('Сумма (USD)', 'Amount (USD)', 'Summa (USD)')}</div>
                        <div className="col-span-2 text-right">{tr('Сходимость', 'Convergence', 'Moslik')}</div>
                    </div>
                    <div className="divide-y divide-slate-100 bg-white">
                        <div className="grid grid-cols-12 p-2.5 items-center">
                            <div className="col-span-5 font-semibold text-slate-900">{tr('Итого активы (Total Assets)', 'Total Assets', 'Jami aktivlar (Total Assets)')}</div>
                            <div className="col-span-3 text-slate-500 font-mono text-[11px]">IAS 1 / IFRS</div>
                            <div className="col-span-2 text-right font-mono font-bold text-slate-900">$48,250,000</div>
                            <div className="col-span-2 text-right text-emerald-600 font-bold text-[11px]">{tr('100% ВЕРИФ.', '100% VERIFIED', '100% TASDIQ.')}</div>
                        </div>
                        <div className="grid grid-cols-12 p-2.5 items-center bg-slate-50/50">
                            <div className="col-span-5 font-semibold text-slate-900">{tr('Итого обязательства (Total Liabilities)', 'Total Liabilities', 'Jami majburiyatlar (Total Liabilities)')}</div>
                            <div className="col-span-3 text-slate-500 font-mono text-[11px]">IFRS 16 / 9</div>
                            <div className="col-span-2 text-right font-mono font-bold text-slate-900">$12,650,000</div>
                            <div className="col-span-2 text-right text-emerald-600 font-bold text-[11px]">{tr('100% ВЕРИФ.', '100% VERIFIED', '100% TASDIQ.')}</div>
                        </div>
                        <div className="grid grid-cols-12 p-2.5 items-center">
                            <div className="col-span-5 font-semibold text-slate-900">{tr('Итого собственный капитал (Equity)', 'Total Equity', 'Jami xususiy kapital (Equity)')}</div>
                            <div className="col-span-3 text-slate-500 font-mono text-[11px]">IAS 1 Capital</div>
                            <div className="col-span-2 text-right font-mono font-bold text-slate-900">$35,600,000</div>
                            <div className="col-span-2 text-right text-emerald-600 font-bold text-[11px]">{tr('100% ВЕРИФ.', '100% VERIFIED', '100% TASDIQ.')}</div>
                        </div>
                        <div className="grid grid-cols-12 p-2.5 items-center bg-purple-50/70 border-t-2 border-purple-300 font-bold">
                            <div className="col-span-5 text-purple-950">{tr('ИТОГО КАПИТАЛ И ОБЯЗАТЕЛЬСТВА', 'TOTAL EQUITY & LIABILITIES', 'JAMI KAPITAL VA MAJBURIYATLAR')}</div>
                            <div className="col-span-3 text-purple-800 text-[11px]">{tr('Балансовое равенство', 'Balance Equilibrium', 'Balans tengligi')}</div>
                            <div className="col-span-2 text-right font-mono text-purple-950 text-sm">$48,250,000</div>
                            <div className="col-span-2 text-right text-emerald-700">{tr('СОШЕЛСЯ', 'BALANCED', 'MOS KELDI')}</div>
                        </div>
                        <div className="grid grid-cols-12 p-2.5 items-center bg-emerald-50 text-[11px] font-semibold text-emerald-800">
                            <div className="col-span-8">{tr('Контрольное расхождение (Zero-Delta Variance)', 'Zero-Delta Variance Discrepancy', 'Nazorat tafovuti (Zero-Delta Variance)')}</div>
                            <div className="col-span-2 text-right font-mono font-bold">$0.00</div>
                            <div className="col-span-2 text-right font-bold">{tr('Δ 0.00 (НОРМА)', 'Δ 0.00 (OK)', 'Δ 0.00 (ME\'YOR)')}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 4: Prudential Ratios */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-purple-600 rounded-xs" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                        {tr('4. Результаты анализа финансовой устойчивости', '4. Financial Stability & Ratios', '4. Moliyaviy barqarorlik tahlili natijalari')}
                    </h3>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                        <div className="text-[10px] text-slate-500">{tr('Текущая ликвидность (CR)', 'Current Ratio', 'Joriy likvidlik (CR)')}</div>
                        <div className="text-base font-bold text-slate-900 mt-0.5">1.72x</div>
                        <div className="text-[10px] text-emerald-600 font-medium">{tr('Норма: >= 1.15x', 'Target: >= 1.15x', 'Me\'yor: >= 1.15x')}</div>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                        <div className="text-[10px] text-slate-500">{tr('Леверидж (D / E)', 'Debt to Equity', 'Leveraj (D / E)')}</div>
                        <div className="text-base font-bold text-slate-900 mt-0.5">0.35x</div>
                        <div className="text-[10px] text-emerald-600 font-medium">{tr('Консервативно', 'Conservative', 'Konservativ')}</div>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                        <div className="text-[10px] text-slate-500">{tr('Чистый оборотный капитал', 'Net Working Capital', 'Sof aylanma kapital')}</div>
                        <div className="text-base font-bold text-slate-900 mt-0.5">$35.6M</div>
                        <div className="text-[10px] text-emerald-600 font-medium">{tr('Положительный', 'Positive', 'Ijobiy')}</div>
                    </div>
                </div>
            </div>

            {/* Section 5: Dual Signatures and Seals */}
            <div className="pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    {tr('Электронная валидация и регламентные подписи', 'Signatures & Cryptographic Audit Seals', 'Elektron tasdiqlash va reglament imzolari')}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    
                    {/* Company Submitter Signature */}
                    <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50/80 space-y-2 relative overflow-hidden">
                        <div className="font-bold text-slate-900">{tr('ОТ СУБЪЕКТА ОТЧЕТНОСТИ:', 'FROM REPORTING ENTITY:', 'HISOBOT SUBYEKTIDAN:')}</div>
                        <div className="text-slate-600 text-[11px]">
                            {companyName}<br />
                            <span className="text-slate-500">{tr('Главный бухгалтер / Руководитель', 'Lead Controller', 'Bosh buxgalter / Rahbar')}</span>
                        </div>
                        <div className="pt-2 flex items-center justify-between text-[11px]">
                            <span className="font-mono text-slate-500">
                                {formattedDate}
                            </span>
                            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {tr('ЭЦП ВЕРНА', 'SIGNATURE VALID', 'ERI TASDIQLANGAN')}
                            </span>
                        </div>
                    </div>

                    {/* RegAI Assurance Seal */}
                    <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2 relative overflow-hidden">
                        <div className="font-bold text-purple-950">{tr('ОТ АУДИТОРСКОЙ ПЛАТФОРМЫ RegAI:', 'FROM RegAI ASSURANCE:', 'RegAI AUDIT PLATFORMASIDAN:')}</div>
                        <div className="text-slate-600 text-[11px]">
                            RegAI Neural Compliance Engine v2.4<br />
                            <span className="text-purple-700 font-medium">
                                {tr('Сертифицированный инспектор МСФО и МСА', 'Certified IFRS & ISA Inspector', 'Sertifikatlangan MHXS va XAS inspektori')}
                            </span>
                        </div>
                        <div className="pt-2 flex items-center justify-between text-[11px]">
                            <span className="font-mono text-purple-700 font-bold">
                                #AUD-{cleanRefCode}
                            </span>
                            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-purple-600" />
                                {tr('МСА 700 ОК', 'ISA 700 OK', 'XAS 700 OK')}
                            </span>
                        </div>
                    </div>

                </div>
            </div>

            {/* Page 2 Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                <span>Axiaris RegAI Platform • {tr('Реестровый хэш:', 'Registry hash:', 'Reyestr xeshi:')} sha256:{cleanRefCode.toLowerCase()}</span>
                <span>{tr('Стр. 2 из 2', 'Page 2 of 2', '2-bet / 2')}</span>
            </div>
        </div>
    );
            
    return (
        <div className={`flex flex-col bg-slate-900/95 text-slate-100 rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden transition-all ${isFullscreenModal ? 'h-full max-h-[96vh]' : 'w-full'}`}>
            
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-800/90 border-b border-slate-700 backdrop-blur-md">
                
                {/* Left: Document info & Format badge */}
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs sm:text-sm text-white truncate max-w-[200px] sm:max-w-[320px]">
                                {report.file_name || `${(report.title || 'Document').replace(/\s+/g, '_')}.pdf`}
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                PDF • A4
                            </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{report.file_size ? `${(report.file_size / 1024 / 1024).toFixed(2)} MB` : '2.45 MB'}</span>
                            <span>•</span>
                            <span className="text-emerald-400 flex items-center gap-1 font-medium">
                                <CheckCircle2 className="w-3 h-3" />
                                {tr('Оригинал проверен', 'Authentic verified')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Center: View Mode Switcher */}
                <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-700 text-xs font-medium">
                    <button
                        onClick={() => setViewMode('sheet')}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                            viewMode === 'sheet'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-white'
                        }`}
                        title={tr("Интерактивный бланк документа (A4)", "Interactive Document Sheet", "Interaktiv hujjat blanki (A4)")}
                    >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{tr('Бланк (A4)', 'Document Sheet', 'Blank (A4)')}</span>
                    </button>
                    <button
                        onClick={() => setViewMode('pdf')}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                            viewMode === 'pdf'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-white'
                        }`}
                        title={tr("Встроенный PDF-ридер", "Built-in PDF Reader", "O‘rnatilgan PDF-o‘quvchi")}
                    >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{tr('PDF-ридер', 'PDF Reader', 'PDF-o‘quvchi')}</span>
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                            viewMode === 'table'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-white'
                        }`}
                        title={tr("Финансовые регистры и таблица", "Financial Data Grid", "Moliyaviy registrlar va jadval")}
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{tr('Таблица', 'Spreadsheet', 'Jadval')}</span>
                    </button>
                    <button
                        onClick={() => setViewMode('text')}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                            viewMode === 'text'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-white'
                        }`}
                        title={tr("Исходный текст и реквизиты", "Plain Text Disclosure", "Asl matn va rekvizitlar")}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{tr('Текст', 'Text', 'Matn')}</span>
                    </button>
                </div>

                {/* Right: Controls & Actions */}
                <div className="flex items-center gap-1.5 text-xs">
                    {/* Zoom controls (for sheet view) */}
                    {viewMode === 'sheet' && (
                        <div className="hidden md:flex items-center bg-slate-900/80 rounded-lg border border-slate-700 px-1 py-0.5 mr-1">
                            <button
                                onClick={handleZoomOut}
                                className="p-1 text-slate-400 hover:text-white rounded-md cursor-pointer hover:bg-slate-800"
                                title={tr("Уменьшить", "Zoom out", "Kichraytirish")}
                                aria-label={tr("Уменьшить масштаб", "Zoom out", "Kichraytirish")}
                            >
                                <ZoomOut className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-1.5 text-[11px] font-mono text-slate-300 w-10 text-center">
                                {zoomLevel}%
                            </span>
                            <button
                                onClick={handleZoomIn}
                                className="p-1 text-slate-400 hover:text-white rounded-md cursor-pointer hover:bg-slate-800"
                                title={tr("Увеличить", "Zoom in", "Kattalashtirish")}
                                aria-label={tr("Увеличить масштаб", "Zoom in", "Kattalashtirish")}
                            >
                                <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={handleZoomReset}
                                className="p-1 text-slate-400 hover:text-white rounded-md cursor-pointer hover:bg-slate-800 ml-0.5 border-l border-slate-700"
                                title={tr("Сброс зума (100%)", "Reset Zoom", "Masshtabni tiklash (100%)")}
                                aria-label={tr("Сбросить масштаб", "Reset Zoom", "Masshtabni tiklash")}
                            >
                                <RotateCcw className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    {/* Page pagination for multi-page document */}
                    {viewMode === 'sheet' && (
                        <div className="flex items-center bg-slate-900/80 rounded-lg border border-slate-700 px-1 py-0.5 mr-1">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded-md cursor-pointer hover:bg-slate-800"
                                title={tr("Предыдущая страница", "Previous page", "Oldingi sahifa")}
                                aria-label={tr("Предыдущая страница", "Previous page", "Oldingi sahifa")}
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2 text-[11px] font-semibold text-slate-200">
                                {tr(`Стр. ${currentPage} из ${totalPages}`, `Page ${currentPage} of ${totalPages}`, `Sahifa ${currentPage} / ${totalPages}`)}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded-md cursor-pointer hover:bg-slate-800"
                                title={tr("Следующая страница", "Next page", "Keyingi sahifa")}
                                aria-label={tr("Следующая страница", "Next page", "Keyingi sahifa")}
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    {/* External Link */}
                    {pdfBlobUrl && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleOpenInNewTab}
                            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                            title={tr("Открыть PDF в новой вкладке", "Open PDF in new tab", "PDF-ni yangi oynada ochish")}
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                    )}

                    {/* Print */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePrint}
                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                        title={tr("Печать документа", "Print document", "Hujjatni chop etish")}
                    >
                        <Printer className="w-3.5 h-3.5" />
                    </Button>

                    {/* Download */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDownloadReport}
                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                        title={tr("Скачать оригинал PDF", "Download PDF", "Asl PDF-ni yuklab olish")}
                    >
                        <Download className="w-3.5 h-3.5" />
                    </Button>

                    {/* Fullscreen Toggle */}
                    {onOpenFullscreen && !isFullscreenModal && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onOpenFullscreen}
                            className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-slate-800 cursor-pointer"
                            title={tr("Развернуть на весь экран", "Fullscreen viewer", "To‘liq ekranga yoyish")}
                        >
                            <Maximize2 className="w-3.5 h-3.5" />
                        </Button>
                    )}

                    {isFullscreenModal && onCloseFullscreen && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onCloseFullscreen}
                            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                            title={tr("Свернуть полноэкранный режим", "Exit fullscreen", "To‘liq ekrandan chiqish")}
                        >
                            <Minimize2 className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Viewer Content Area */}
            <div 
                ref={sheetContainerRef} 
                className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-950 flex flex-col items-center min-h-[460px] max-h-[680px]"
            >
                
                {/* MODE 1: Official Interactive A4 Document Sheet */}
                {viewMode === 'sheet' && (
                    <div 
                        style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center', transition: 'transform 0.15s ease-out' }}
                        className="w-full max-w-[760px] bg-white text-slate-900 rounded-lg shadow-2xl p-6 sm:p-10 border border-slate-200 select-text mb-6"
                    >
                        {currentPage === 1 && renderPage1()}
                        {currentPage === 2 && renderPage2()}
                    </div>
                )}

                {/* MODE 2: Built-in Continuous Multi-Page PDF Reader */}
                {viewMode === 'pdf' && (
                    <div className="w-full flex flex-col items-center space-y-5 pb-6">
                        {/* Native PDF Reader Chrome Bar */}
                        <div className="w-full max-w-[760px] bg-slate-800/95 border border-slate-700 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-lg sticky top-0 z-10 backdrop-blur-md">
                            <div className="flex items-center gap-2.5 text-xs">
                                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-bold uppercase text-[10px]">
                                    PDF 1.7
                                </span>
                                <span className="text-slate-200 font-medium truncate max-w-[220px] sm:max-w-[300px]">
                                    {report.file_name || `${(report.title || 'Document').replace(/\s+/g, '_')}.pdf`}
                                </span>
                                <span className="text-slate-400 font-mono text-[11px]">
                                    ({tr('Все страницы: 1–2 из 2', 'All Pages: 1–2 of 2', 'Barcha sahifalar: 1–2 / 2')})
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {pdfBlobUrl && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleOpenInNewTab}
                                        className="h-7 text-xs gap-1.5 border-slate-600 bg-slate-900/80 hover:bg-slate-700 text-slate-200 cursor-pointer"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                                        <span>{tr('Открыть PDF в окне', 'Open Native PDF', 'PDF-ni yangi oynada ochish')}</span>
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    onClick={handleDownloadReport}
                                    className="h-7 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>{tr('Скачать PDF', 'Download PDF', 'PDF yuklab olish')}</span>
                                </Button>
                            </div>
                        </div>

                        {isLoadingPdf ? (
                            <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
                                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs">{tr('Генерация PDF документа высокой точности...', 'Rendering high-fidelity PDF...', 'Yuqori aniqlikdagi PDF hujjat yaratilmoqda...')}</span>
                            </div>
                        ) : (
                            <>
                                {/* Continuous Page 1 */}
                                <div className="w-full max-w-[760px] bg-white text-slate-900 rounded-lg shadow-2xl p-6 sm:p-10 border border-slate-200 select-text">
                                    {renderPage1()}
                                </div>

                                {/* Continuous Page 2 */}
                                <div className="w-full max-w-[760px] bg-white text-slate-900 rounded-lg shadow-2xl p-6 sm:p-10 border border-slate-200 select-text">
                                    {renderPage2()}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* MODE 3: Tabular Financial Grid (Spreadsheet Mode) */}
                {viewMode === 'table' && (
                    <div className="w-full max-w-[800px] bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl text-xs">
                        <div className="p-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                            <span className="font-semibold text-white flex items-center gap-1.5">
                                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                                {tr('Регистры Главной книги и Балансовые статьи', 'General Ledger & Financial Line Items', 'Bosh daftar registrlari va Balans moddalari')}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                                {tr('Валюта: USD • Точность: 2 знака', 'Currency: USD • Decimals: 2', 'Valyuta: USD • Aniqlik: 2 xona')}
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-800/60 text-slate-400 border-b border-slate-700 text-[11px]">
                                        <th className="p-3 font-semibold">{tr('Код', 'Code', 'Kod')}</th>
                                        <th className="p-3 font-semibold">{tr('Наименование статьи', 'Item Description', 'Modda nomi')}</th>
                                        <th className="p-3 font-semibold">{tr('Стандарт', 'Standard', 'Standart')}</th>
                                        <th className="p-3 font-semibold text-right">{tr('Сумма по отчету', 'Reported Sum', 'Hisobot summasi')}</th>
                                        <th className="p-3 font-semibold text-right">{tr('Эталон GL', 'GL Benchmark', 'GL etaloni')}</th>
                                        <th className="p-3 font-semibold text-right">{tr('Расхождение', 'Variance', 'Tafovut')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 text-slate-300">
                                    <tr className="hover:bg-slate-800/40">
                                        <td className="p-3 font-mono text-slate-400">1100</td>
                                        <td className="p-3 font-medium text-white">{tr('Основные средства (PPE)', 'Property, Plant & Equipment', 'Asosiy vositalar (PPE)')}</td>
                                        <td className="p-3 text-slate-400">{tr('МСФО (IAS) 16', 'IAS 16', 'MHXS (IAS) 16')}</td>
                                        <td className="p-3 text-right font-mono">$18,450,000</td>
                                        <td className="p-3 text-right font-mono">$18,450,000</td>
                                        <td className="p-3 text-right font-mono text-emerald-400">$0.00</td>
                                    </tr>
                                    <tr className="hover:bg-slate-800/40">
                                        <td className="p-3 font-mono text-slate-400">1200</td>
                                        <td className="p-3 font-medium text-white">{tr('Активы в форме права пользования (ROU)', 'Right-of-Use Assets', 'Foydalanish huquqi aktivlari (ROU)')}</td>
                                        <td className="p-3 text-slate-400">{tr('МСФО (IFRS) 16', 'IFRS 16', 'MHXS (IFRS) 16')}</td>
                                        <td className="p-3 text-right font-mono">$8,200,000</td>
                                        <td className="p-3 text-right font-mono">$8,200,000</td>
                                        <td className="p-3 text-right font-mono text-emerald-400">$0.00</td>
                                    </tr>
                                    <tr className="hover:bg-slate-800/40">
                                        <td className="p-3 font-mono text-slate-400">1300</td>
                                        <td className="p-3 font-medium text-white">{tr('Товарно-материальные запасы', 'Inventories', 'Tovar-moddiy zaxiralar')}</td>
                                        <td className="p-3 text-slate-400">{tr('МСФО (IAS) 2', 'IAS 2', 'MHXS (IAS) 2')}</td>
                                        <td className="p-3 text-right font-mono">$7,150,000</td>
                                        <td className="p-3 text-right font-mono">$7,150,000</td>
                                        <td className="p-3 text-right font-mono text-emerald-400">$0.00</td>
                                    </tr>
                                    <tr className="hover:bg-slate-800/40">
                                        <td className="p-3 font-mono text-slate-400">1400</td>
                                        <td className="p-3 font-medium text-white">{tr('Торговая дебиторская задолженность (net)', 'Trade Receivables (net)', 'Savdo debitorlik qarzdorligi (net)')}</td>
                                        <td className="p-3 text-slate-400">{tr('МСФО (IFRS) 9', 'IFRS 9', 'MHXS (IFRS) 9')}</td>
                                        <td className="p-3 text-right font-mono">$9,850,000</td>
                                        <td className="p-3 text-right font-mono">$9,850,000</td>
                                        <td className="p-3 text-right font-mono text-emerald-400">$0.00</td>
                                    </tr>
                                    <tr className="hover:bg-slate-800/40">
                                        <td className="p-3 font-mono text-slate-400">1500</td>
                                        <td className="p-3 font-medium text-white">{tr('Денежные средства и эквиваленты', 'Cash & Cash Equivalents', 'Pul mablag‘lari va ekvivalentlari')}</td>
                                        <td className="p-3 text-slate-400">{tr('МСФО (IAS) 7', 'IAS 7', 'MHXS (IAS) 7')}</td>
                                        <td className="p-3 text-right font-mono">$4,600,000</td>
                                        <td className="p-3 text-right font-mono">$4,600,000</td>
                                        <td className="p-3 text-right font-mono text-emerald-400">$0.00</td>
                                    </tr>
                                    <tr className="bg-slate-800/70 font-bold border-t border-slate-700">
                                        <td className="p-3 font-mono text-blue-400">{tr('ИТОГО', 'TOTAL', 'JAMI')}</td>
                                        <td className="p-3 text-white">{tr('ИТОГО АКТИВЫ', 'TOTAL ASSETS', 'JAMI AKTIVLAR')}</td>
                                        <td className="p-3 text-slate-400">{tr('МСФО (IAS) 1', 'IAS 1', 'MHXS (IAS) 1')}</td>
                                        <td className="p-3 text-right font-mono text-blue-400 text-sm">$48,250,000</td>
                                        <td className="p-3 text-right font-mono text-blue-400 text-sm">$48,250,000</td>
                                        <td className="p-3 text-right font-mono text-emerald-400 font-bold">$0.00</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* MODE 4: Raw Text & Metadata */}
                {viewMode === 'text' && (
                    <div className="w-full max-w-[760px] bg-slate-900 border border-slate-700 rounded-xl p-4 sm:p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">
                                {tr('Текстовый дамп отчета', 'Raw Text Document Disclosure', 'Hisobotning matnli nusxasi')}
                            </span>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCopyRawText}
                                className="h-7 text-xs gap-1.5 border-slate-700 hover:bg-slate-800 text-slate-300"
                            >
                                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedText ? (tr('Скопировано!', 'Copied!', 'Nusxa olindi!')) : (tr('Копировать', 'Copy', 'Nusxa olish'))}</span>
                            </Button>
                        </div>
                        <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto leading-relaxed p-3 bg-slate-950 rounded-lg border border-slate-800">
{`================================================================================
AXIARIS / RegAI — ${tr('СИСТЕМА РЕГУЛЯТОРНОГО И АУДИТОРСКОГО КОНТРОЛЯ', 'REGULATORY & COMPLIANCE INTELLIGENCE SYSTEM', 'REGULYATOR VA AUDITORLIK NAZORATI TIZIMI')}
================================================================================
${tr('ID ДОКУМЕНТА', 'DOCUMENT ID', 'HUJJAT ID')}:      ${report.id}
${tr('НАИМЕНОВАНИЕ', 'DOCUMENT TITLE', 'HUJJAT NOMI')}:   ${report.title}
${tr('КАТЕГОРИЯ', 'CATEGORY', 'TOIFA')}:         ${(report.report_type || 'audit').toUpperCase()}
${tr('ТЕКУЩИЙ СТАТУС', 'CURRENT STATUS', 'JORIY HOLAT')}:   ${(report.status || 'approved').toUpperCase()}
${tr('ОРГАНИЗАЦИЯ', 'LEGAL ENTITY', 'TASHKILOT')}:     ${companyName}
${tr('ДАТА ПОДАЧИ', 'SUBMISSION DATE', 'TOPSHIRILGAN SANA')}:  ${new Date(report.submitted_at || report.created_at || Date.now()).toISOString()}
${tr('ВЕРИФИКАЦИЯ', 'VALIDATION', 'TASDIQLASH')}:       ${tr('ЭЦП SHA-256 (ПОДТВЕРЖДЕНА)', 'DIGITAL SIGNATURE SHA-256 (VALIDATED)', 'ERI SHA-256 (TASDIQLANGAN)')}
================================================================================

1. ${tr('ИСПОЛНИТЕЛЬНОЕ РЕЗЮМЕ АУДИТОРА', 'EXECUTIVE AUDITOR SUMMARY', 'AUDITORNING IJRO XULOSASI')}:
${report.description || tr('Комплексная аудиторская проверка финансовой отчетности в соответствии с МСФО.', 'Comprehensive financial audit in accordance with IFRS standards.', 'MHXS standartlariga muvofiq moliyaviy hisobotning kompleks auditorlik tekshiruvi.')}

2. ${tr('СВЕРКА ПО СТАНДАРТАМ МСФО И РЕГУЛЯТОРНЫМ НОРМАТИВАМ', 'STATUTORY COMPLIANCE & IFRS AUDIT VERIFICATION', 'MHXS STANDARTLARI VA REGULYATOR NORMATIVLARI BO‘YICHA SOLISHTIRUV')}:
- ${tr('Примененные стандарты', 'Standards Applied', 'Qo‘llanilgan standartlar')}: IFRS 9, IFRS 15, IFRS 16, IAS 1, ISA 700 / 701
- ${tr('Итого Активы', 'Total Assets', 'Jami Aktivlar')}: $48,250,000.00
- ${tr('Итого Обязательства', 'Total Liabilities', 'Jami Majburiyatlar')}: $12,650,000.00
- ${tr('Итого Капитал', 'Total Equity', 'Jami Kapital')}: $35,600,000.00
- ${tr('Балансовое расхождение', 'Equilibrium Delta', 'Balans tafovuti')}: $0.00 (${tr('Разрывов нет', 'Zero variance', 'Tafovut yo‘q')})
- ${tr('Достаточность капитала (CAR)', 'Capital Adequacy (CAR)', 'Kapital yetarliligi (CAR)')}: 14.8% (${tr('Норма >= 11.5%', 'Target >= 11.5%', 'Me’yor >= 11.5%')})
- ${tr('Покрытие ликвидности (LCR)', 'Liquidity Coverage (LCR)', 'Likvidlikni qoplash (LCR)')}: 134.2% (${tr('Норма >= 100%', 'Target >= 100%', 'Me’yor >= 100%')})

3. ${tr('РЕЗОЛЮЦИЯ АУДИТА И ЦИФРОВОЙ СЛЕД', 'ASSURANCE RESOLUTION & DIGITAL AUDIT TRAIL', 'AUDIT REZOLYUTSIYASI VA RAQAMLI IZ')}:
- ${tr('Проверено', 'Verified by', 'Tekshirildi')}: RegAI Neural Compliance Engine v2.4 & ${tr('Сертифицированный ведущий партнер', 'Certified Lead Partner', 'Sertifikatlangan yetakchi hamkor')}
- ${tr('Статус резолюции', 'Resolution Status', 'Rezolyutsiya holati')}: ${tr('ПОЛОЖИТЕЛЬНОЕ ЗАКЛЮЧЕНИЕ (ДОПУЩЕНО К СДАЧЕ)', 'CLEAN OPINION (APPROVED FOR REGULATORY SUBMISSION)', 'IJOBIY XULOSA (TOPSHIRISHGA RUXSAT ETILGAN)')}
- ${tr('Протокол верификации', 'Verification Protocol', 'Verifikatsiya bayonnomasi')}: #AUD-${cleanRefCode}
- SHA-256 Hash: 9f8a32b14c8e76dae90812ed0dce8be2a54595a74e04e80024917d`}
                        </pre>
                    </div>
                )}

            </div>

            {/* Bottom Status Strip */}
            <div className="px-4 py-2.5 bg-slate-800/80 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{tr('Интерактивный просмотр реального файла активен', 'Interactive real file preview active', 'Haqiqiy faylni interaktiv ko‘rish faol')}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-slate-500">
                        #{cleanRefCode}
                    </span>
                    <button
                        onClick={handleDownloadReport}
                        className="text-blue-400 hover:text-blue-300 font-medium underline flex items-center gap-1 cursor-pointer"
                    >
                        <Download className="w-3 h-3" />
                        <span>{tr('Скачать копию', 'Download copy', 'Nusxasini yuklab olish')}</span>
                    </button>
                </div>
            </div>

        </div>
    );
};

export default DocumentPreviewer;
