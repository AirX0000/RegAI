import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Home, LogIn, BarChart3, FileText, Shield, AlertTriangle, Upload, Settings } from 'lucide-react';

export default function GuidePage() {
    const [activeSection, setActiveSection] = useState('introduction');

    const sections = [
        { id: 'introduction', title: '1. Введение', icon: Home },
        { id: 'login', title: '2. Вход в систему', icon: LogIn },
        { id: 'dashboard', title: '3. Главная панель', icon: BarChart3 },
        { id: 'regulations', title: '4. Регуляции', icon: Shield },
        { id: 'compliance', title: '5. Соответствие требованиям', icon: AlertTriangle },
        { id: 'reports', title: '6. Отчеты', icon: FileText },
        { id: 'tax-analysis', title: '7. AI Анализ налогов', icon: BarChart3 },
        { id: 'transformation', title: '8. Трансформация балансов', icon: Upload },
        { id: 'documents', title: '9. Документы', icon: FileText },
        { id: 'admin', title: '10. Административные функции', icon: Settings },
    ];

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            {/* Sidebar Navigation */}
            <div className="w-64 border-r bg-gray-50 overflow-y-auto">
                <div className="p-4">
                    <h2 className="text-lg font-bold mb-4">Руководство пользователя</h2>
                    <nav className="space-y-1">
                        {sections.map((section) => {
                            const Icon = section.icon;
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${activeSection === section.id
                                        ? 'bg-blue-600 text-white'
                                        : 'hover:bg-gray-200 text-gray-700'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="text-sm">{section.title}</span>
                                    {activeSection === section.id && <ChevronRight className="h-4 w-4 ml-auto" />}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    {activeSection === 'introduction' && (
                        <div>
                            <h1 className="text-4xl font-bold mb-4">RegAI Platform - Руководство пользователя</h1>
                            <p className="text-gray-600 mb-6">Версия: 1.0 | Дата: 28 ноября 2025</p>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Что такое RegAI?</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p>
                                        <strong>RegAI</strong> — это интеллектуальная платформа для управления нормативными требованиями и финансовой отчетностью. Платформа помогает компаниям:
                                    </p>
                                    <ul className="list-disc ml-6 space-y-2">
                                        <li>✅ Отслеживать изменения в регуляторных требованиях</li>
                                        <li>✅ Проверять соответствие нормативам</li>
                                        <li>✅ Управлять финансовыми отчетами</li>
                                        <li>✅ Анализировать налоговую отчетность с помощью AI</li>
                                        <li>✅ Трансформировать балансы из МСФО в IFRS</li>
                                    </ul>

                                    <div className="mt-6">
                                        <h3 className="font-semibold mb-3">Роли пользователей</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="border rounded-lg p-4">
                                                <h4 className="font-semibold text-blue-600">Superadmin</h4>
                                                <p className="text-sm text-gray-600">Полный доступ ко всем функциям</p>
                                            </div>
                                            <div className="border rounded-lg p-4">
                                                <h4 className="font-semibold text-green-600">Admin</h4>
                                                <p className="text-sm text-gray-600">Управление компанией и пользователями</p>
                                            </div>
                                            <div className="border rounded-lg p-4">
                                                <h4 className="font-semibold text-purple-600">Accountant</h4>
                                                <p className="text-sm text-gray-600">Работа с отчетами и балансами</p>
                                            </div>
                                            <div className="border rounded-lg p-4">
                                                <h4 className="font-semibold text-orange-600">Auditor</h4>
                                                <p className="text-sm text-gray-600">Проверка отчетов и соответствия</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeSection === 'login' && (
                        <div>
                            <h1 className="text-3xl font-bold mb-6">2. Вход в систему</h1>

                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Шаг 1: Открыть страницу входа</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ol className="list-decimal ml-6 space-y-2">
                                        <li>Откройте браузер (рекомендуется Chrome, Firefox или Safari)</li>
                                        <li>Перейдите по адресу платформы</li>
                                        <li>Вы увидите страницу входа</li>
                                    </ol>
                                </CardContent>
                            </Card>

                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Шаг 2: Ввести учетные данные</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ol className="list-decimal ml-6 space-y-2">
                                        <li><strong>Email</strong> — введите ваш email (например: admin@example.com)</li>
                                        <li><strong>Пароль</strong> — введите ваш пароль</li>
                                        <li>Нажмите кнопку <strong>"Войти"</strong></li>
                                    </ol>
                                    <div className="mt-4 bg-yellow-50 border border-yellow-200 p-3 rounded">
                                        <p className="text-sm text-yellow-800">
                                            <strong>Примечание:</strong> Если вы забыли пароль, обратитесь к администратору компании.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Шаг 3: Переход на главную страницу</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p>После успешного входа вы будете перенаправлены на главную панель (Dashboard).</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeSection === 'dashboard' && (
                        <div>
                            <h1 className="text-3xl font-bold mb-6">3. Главная панель (Dashboard)</h1>

                            <div className="mb-6">
                                <img
                                    src="/Users/air/.gemini/antigravity/brain/e954b391-dcc6-4039-8a61-43671517cd53/guide_dashboard_section.png"
                                    alt="Dashboard Section"
                                    className="w-full rounded-lg border shadow-lg"
                                />
                            </div>

                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Активные предупреждения (Active Alerts)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="mb-3"><strong>Что это?</strong></p>
                                    <ul className="list-disc ml-6 space-y-1">
                                        <li>Показывает количество активных предупреждений о несоответствиях</li>
                                        <li>Иконка ℹ️ содержит подсказку о том, что такое Alert</li>
                                    </ul>
                                    <p className="mt-3 mb-2"><strong>Как использовать:</strong></p>
                                    <ol className="list-decimal ml-6 space-y-1">
                                        <li>Посмотрите на число в карточке "Active Alerts"</li>
                                        <li>Нажмите на карточку для перехода к странице Compliance</li>
                                        <li>Там вы увидите детальный список всех предупреждений</li>
                                    </ol>
                                </CardContent>
                            </Card>

                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Категории регуляций (Category Breakdown)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="mb-3"><strong>Что это?</strong></p>
                                    <ul className="list-disc ml-6 space-y-1">
                                        <li>График, показывающий распределение регуляций по категориям</li>
                                        <li>Категории: Finance, Privacy, Healthcare, Security и другие</li>
                                    </ul>
                                    <p className="mt-3 mb-2"><strong>Как использовать:</strong></p>
                                    <ol className="list-decimal ml-6 space-y-1">
                                        <li>Просмотрите график категорий</li>
                                        <li>Нажмите на любую категорию (например, "Finance")</li>
                                        <li>Вы будете перенаправлены на страницу Compliance с автоматическим фильтром</li>
                                    </ol>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Статус соответствия (Compliance Status)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="mb-3"><strong>Что это?</strong></p>
                                    <p className="mb-3">Круговая диаграмма, показывающая распределение предупреждений по уровням серьезности</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-red-500 rounded"></div>
                                            <span className="text-sm"><strong>Critical</strong> — немедленное внимание</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-orange-500 rounded"></div>
                                            <span className="text-sm"><strong>High</strong> — высокий приоритет</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                                            <span className="text-sm"><strong>Medium</strong> — средний приоритет</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                            <span className="text-sm"><strong>Low</strong> — низкий приоритет</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeSection === 'regulations' && (
                        <div>
                            <h1 className="text-3xl font-bold mb-6">4. Регуляции (Regulations)</h1>

                            <div className="mb-6">
                                <img
                                    src="/Users/air/.gemini/antigravity/brain/e954b391-dcc6-4039-8a61-43671517cd53/guide_regulations_section.png"
                                    alt="Regulations Section"
                                    className="w-full rounded-lg border shadow-lg"
                                />
                            </div>

                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Поиск регуляций</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <h4 className="font-semibold mb-2">Шаг 1: Использовать поисковую строку</h4>
                                    <ol className="list-decimal ml-6 space-y-1 mb-4">
                                        <li>Найдите поле поиска в верхней части страницы</li>
                                        <li>Введите ключевое слово (например, "IFRS", "GDPR", "tax")</li>
                                        <li>Результаты обновятся автоматически</li>
                                    </ol>

                                    <h4 className="font-semibold mb-2">Шаг 2: Применить фильтры</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="font-medium">Фильтр по категории:</p>
                                            <ul className="list-disc ml-6 text-sm space-y-1">
                                                <li>Finance (Финансы)</li>
                                                <li>Privacy (Конфиденциальность)</li>
                                                <li>Healthcare (Здравоохранение)</li>
                                                <li>Security (Безопасность)</li>
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Экспорт регуляций</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ol className="list-decimal ml-6 space-y-2">
                                        <li>Нажмите кнопку "Export" в правом верхнем углу</li>
                                        <li>Выберите формат:
                                            <ul className="list-disc ml-6 mt-1">
                                                <li><strong>Excel</strong> — таблица со всеми регуляциями</li>
                                                <li><strong>PDF</strong> — документ для печати</li>
                                                <li><strong>CSV</strong> — для импорта в другие системы</li>
                                            </ul>
                                        </li>
                                        <li>Файл автоматически загрузится</li>
                                    </ol>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeSection === 'compliance' && (
                        <div>
                            <h1 className="text-3xl font-bold mb-6">5. Соответствие требованиям (Compliance)</h1>

                            <div className="mb-6">
                                <img
                                    src="/Users/air/.gemini/antigravity/brain/e954b391-dcc6-4039-8a61-43671517cd53/guide_compliance_section.png"
                                    alt="Compliance Section"
                                    className="w-full rounded-lg border shadow-lg"
                                />
                            </div>

                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Запуск проверки соответствия</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ol className="list-decimal ml-6 space-y-2">
                                        <li>Нажмите кнопку <strong>"Run Compliance Check"</strong></li>
                                        <li>Система автоматически проверит все данные (несколько секунд)</li>
                                        <li>Появится уведомление о завершении</li>
                                        <li>Обновится счетчик предупреждений и графики</li>
                                    </ol>
                                </CardContent>
                            </Card>

                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Фильтрация предупреждений</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold mb-2">По статусу:</h4>
                                            <ul className="list-disc ml-6 space-y-1">
                                                <li><strong>Open</strong> — новые предупреждения</li>
                                                <li><strong>In Progress</strong> — в работе</li>
                                                <li><strong>Resolved</strong> — решенные</li>
                                                <li><strong>Dismissed</strong> — отклоненные</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2">По уровню серьезности:</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                                                    <span className="text-sm">Critical</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                                                    <span className="text-sm">High</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                                                    <span className="text-sm">Medium</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                                    <span className="text-sm">Low</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Работа с предупреждениями</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <h4 className="font-semibold mb-2">Изменение статуса:</h4>
                                    <ol className="list-decimal ml-6 space-y-1">
                                        <li>Найдите предупреждение в списке</li>
                                        <li>Нажмите на выпадающий список статуса</li>
                                        <li>Выберите новый статус</li>
                                        <li>Статус обновится автоматически</li>
                                    </ol>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeSection === 'reports' && (
                        <div>
                            <h1 className="text-3xl font-bold mb-6">6. Отчеты (Reports)</h1>

                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Создание нового отчета</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ol className="list-decimal ml-6 space-y-2">
                                        <li>Нажмите <strong>"+ New Report"</strong></li>
                                        <li>Заполните форму:
                                            <ul className="list-disc ml-6 mt-2 space-y-1">
                                                <li><strong>Title</strong> — название отчета</li>
                                                <li><strong>Description</strong> — краткое описание</li>
                                                <li><strong>Report Type</strong> — Financial, Tax, Audit и т.д.</li>
                                                <li><strong>Upload File</strong> — прикрепите PDF, Excel или CSV</li>
                                            </ul>
                                        </li>
                                        <li>Нажмите <strong>"Create Report"</strong></li>
                                    </ol>
                                    <div className="mt-4 bg-blue-50 border border-blue-200 p-3 rounded">
                                        <p className="text-sm"><strong>Поддерживаемые форматы:</strong> PDF, Excel, CSV, TXT</p>
                                        <p className="text-sm"><strong>Максимальный размер:</strong> 10 МБ</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Статусы отчетов</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="border rounded p-3">
                                            <span className="inline-block px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs font-semibold mb-2">DRAFT</span>
                                            <p className="text-sm">Черновик — можно редактировать и удалять</p>
                                        </div>
                                        <div className="border rounded p-3">
                                            <span className="inline-block px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs font-semibold mb-2">SUBMITTED</span>
                                            <p className="text-sm">Отправлен — ожидает проверки</p>
                                        </div>
                                        <div className="border rounded p-3">
                                            <span className="inline-block px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-semibold mb-2">UNDER REVIEW</span>
                                            <p className="text-sm">На рассмотрении — проверяется администратором</p>
                                        </div>
                                        <div className="border rounded p-3">
                                            <span className="inline-block px-2 py-1 bg-green-200 text-green-800 rounded text-xs font-semibold mb-2">APPROVED</span>
                                            <p className="text-sm">Одобрен — проверка пройдена</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Действия с отчетами</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div>
                                            <h4 className="font-semibold">Скачивание файла:</h4>
                                            <p className="text-sm text-gray-600">Нажмите иконку Download для скачивания прикрепленного файла</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">Удаление отчета:</h4>
                                            <ol className="list-decimal ml-6 text-sm text-gray-600">
                                                <li>Нажмите иконку Trash (только для черновиков)</li>
                                                <li>Подтвердите удаление в диалоговом окне</li>
                                            </ol>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeSection === 'tax-analysis' && (
                        <div>
                            <h1 className="text-3xl font-bold mb-6">7. AI Анализ налогов (Tax Analysis)</h1>

                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Выбор режима работы</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold mb-2">Режим 1: Select Existing</h4>
                                            <p className="text-sm text-gray-600 mb-2">Выбрать существующий отчет из системы</p>
                                            <ol className="list-decimal ml-6 text-sm space-y-1">
                                                <li>Нажмите кнопку "Select Existing"</li>
                                                <li>Выберите отчет из выпадающего списка</li>
                                            </ol>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2">Режим 2: Upload New PDF</h4>
                                            <p className="text-sm text-gray-600 mb-2">Загрузить новый файл для анализа</p>
                                            <ol className="list-decimal ml-6 text-sm space-y-1">
                                                <li>Нажмите кнопку "Upload New PDF"</li>
                                                <li>Введите название отчета (опционально)</li>
                                                <li>Выберите файл (PDF, Excel, CSV, TXT)</li>
                                            </ol>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Настройка параметров анализа</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold mb-2">Выбор страны:</h4>
                                            <p className="text-sm text-gray-600">United Kingdom, United States, Germany, France и другие</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2">Выбор типов налогов:</h4>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>☑ VAT (НДС)</div>
                                                <div>☑ Corporate Tax</div>
                                                <div>☐ Income Tax</div>
                                                <div>☐ Social Tax</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Результаты анализа</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div>
                                            <h4 className="font-semibold mb-2">Compliance Score (Оценка соответствия):</h4>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                                                    <span>90-100% — Отличное соответствие</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                                                    <span>70-89% — Хорошее с проблемами</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                                                    <span>50-69% — Требуется внимание</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                                                    <span>0-49% — Срочные действия</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2">Статистика:</h4>
                                            <ul className="list-disc ml-6 text-sm space-y-1">
                                                <li><strong>Passed</strong> — успешные проверки</li>
                                                <li><strong>Errors</strong> — критические ошибки</li>
                                                <li><strong>Warnings</strong> — предупреждения</li>
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeSection === 'transformation' && (
                        <div>
                            <h1 className="text-3xl font-bold mb-6">8. Трансформация балансов (Transformation)</h1>

                            <div className="mb-6">
                                <img
                                    src="/Users/air/.gemini/antigravity/brain/e954b391-dcc6-4039-8a61-43671517cd53/guide_transformation_section.png"
                                    alt="Transformation Section"
                                    className="w-full rounded-lg border shadow-lg"
                                />
                            </div>

                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Создание нового баланса</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ol className="list-decimal ml-6 space-y-2">
                                        <li>Нажмите <strong>"+ Create New Balance Sheet"</strong></li>
                                        <li>Заполните основную информацию:
                                            <ul className="list-disc ml-6 mt-2 space-y-1">
                                                <li>Период (месяц и год)</li>
                                                <li>Название компании</li>
                                                <li>Валюта (RUB, USD, EUR, GBP)</li>
                                            </ul>
                                        </li>
                                        <li>Введите данные баланса:
                                            <ul className="list-disc ml-6 mt-2 space-y-1">
                                                <li>Активы (текущие и внеоборотные)</li>
                                                <li>Обязательства (текущие и долгосрочные)</li>
                                                <li>Капитал</li>
                                            </ul>
                                        </li>
                                    </ol>
                                </CardContent>
                            </Card>

                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Сохранение и трансформация</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div>
                                            <h4 className="font-semibold mb-2">Вариант 1: Сохранить черновик</h4>
                                            <p className="text-sm text-gray-600">Нажмите "Save Draft" для сохранения без трансформации</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2">Вариант 2: Трансформировать</h4>
                                            <ol className="list-decimal ml-6 text-sm space-y-1">
                                                <li>Нажмите "Transform"</li>
                                                <li>Система проверит данные</li>
                                                <li>Применит правила трансформации МСФО → IFRS</li>
                                                <li>Откроется страница результатов</li>
                                            </ol>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Удаление баланса</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ol className="list-decimal ml-6 space-y-1 text-sm">
                                        <li>Найдите баланс в списке</li>
                                        <li>Нажмите иконку Trash</li>
                                        <li>Подтвердите удаление в диалоговом окне</li>
                                        <li>Баланс будет удален безвозвратно</li>
                                    </ol>
                                    <div className="mt-3 bg-yellow-50 border border-yellow-200 p-3 rounded">
                                        <p className="text-sm text-yellow-800">
                                            <strong>Важно:</strong> Удалить можно только балансы со статусом "Draft" или "Transformed"
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeSection === 'documents' && (
                        <div>
                            <h1 className="text-3xl font-bold mb-6">9. Документы (Documents)</h1>

                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Загрузка документа</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ol className="list-decimal ml-6 space-y-2">
                                        <li>Выберите тип документа:
                                            <ul className="list-disc ml-6 mt-1">
                                                <li>Invoice (Счета)</li>
                                                <li>Contract (Контракты)</li>
                                                <li>Bank Statement (Банковские выписки)</li>
                                            </ul>
                                        </li>
                                        <li>Нажмите кнопку "Upload"</li>
                                        <li>Выберите файл (PDF, JPEG, PNG, BMP, TIFF)</li>
                                        <li>Дождитесь обработки</li>
                                    </ol>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Просмотр извлеченных данных</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ol className="list-decimal ml-6 space-y-1 text-sm">
                                        <li>Найдите документ со статусом "completed"</li>
                                        <li>Нажмите кнопку "View Data"</li>
                                        <li>Изучите извлеченные данные в формате JSON</li>
                                        <li>Закройте окно</li>
                                    </ol>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeSection === 'admin' && (
                        <div>
                            <h1 className="text-3xl font-bold mb-6">10. Административные функции</h1>

                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Управление пользователями (Users)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 mb-3">Доступ: Admin, Superadmin</p>
                                    <h4 className="font-semibold mb-2">Создание нового пользователя:</h4>
                                    <ol className="list-decimal ml-6 space-y-1 text-sm">
                                        <li>Нажмите "+ Invite User"</li>
                                        <li>Введите Email, Full Name, Password</li>
                                        <li>Выберите роль (Accountant, Auditor, Admin)</li>
                                        <li>Нажмите "Create"</li>
                                    </ol>
                                </CardContent>
                            </Card>

                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Настройки компании (Company Settings)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 mb-3">Доступ: Admin</p>
                                    <ul className="list-disc ml-6 space-y-1 text-sm">
                                        <li>Название компании</li>
                                        <li>Описание</li>
                                        <li>Веб-сайт</li>
                                        <li>Индустрия</li>
                                        <li>Количество сотрудников</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Журнал аудита (Audit Log)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 mb-3">Просмотр всех действий пользователей в системе</p>
                                    <h4 className="font-semibold mb-2">Фильтрация:</h4>
                                    <ul className="list-disc ml-6 space-y-1 text-sm">
                                        <li>По пользователю</li>
                                        <li>По действию (Login, Create, Update, Delete)</li>
                                        <li>По дате</li>
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
