# 🚀 Руководство по деплою RegAI на Firebase

> **Текущий статус**: Проект успешно создан и развернут на Firebase!
> - **Название проекта**: **RegAI** (ID: `regai-cfc1d9`)
> - **Живой URL**: [https://regai-cfc1d9.web.app](https://regai-cfc1d9.web.app) (также [https://regai-cfc1d9.firebaseapp.com](https://regai-cfc1d9.firebaseapp.com))
> - **Firebase Console**: [https://console.firebase.google.com/project/regai-cfc1d9/overview](https://console.firebase.google.com/project/regai-cfc1d9/overview)

В экосистеме Firebase для современных Full-stack приложений с Python FastAPI и React SPA используется архитектура:
1. **Frontend (React + Vite SPA)** размещается на **Firebase Hosting** (глобальный CDN, бесплатный SSL, мгновенная доставка статики).
2. **Backend (FastAPI + OCR + ChromaDB)** подключается через **Google Cloud Run** (нативная интеграция с Firebase Hosting через реврайты в `firebase.json`) либо через отдельный бэкенд URL.

---

## 📋 Что было добавлено и настроено

1. `firebase.json` — конфигурация Firebase Hosting с:
   - Настройкой директории сборки (`frontend/dist`);
   - SPA-роутингом (`** -> /index.html`);
   - Заголовками безопасности (OWASP: nosniff, DENY, XSS-protection);
   - Кэшированием ассетов Vite (`/assets/**` на 1 год immutable);
   - Нативным проксированием API (`/api/**`, `/docs`, `/health`) в Google Cloud Run без CORS.
2. `.firebaserc` — файл привязки к вашему Firebase Project ID.
3. `frontend/.env.production` — конфигурация окружения для продакшн-сборки (`VITE_API_URL=/api/v1`).
4. `frontend/package.json` — новые скрипты:
   - `npm run deploy:firebase` — сборка и деплой на Firebase Hosting.
   - `npm run deploy:preview` — деплой во временный превью-канал для тестирования.
5. `backend/app/main.py` — в CORS добавлен белый список доменов Firebase (`https://*.web.app` и `https://*.firebaseapp.com`).
6. `deploy_firebase.sh` — автоматизированный скрипт развертывания в один клик.
7. `.github/workflows/firebase-hosting-deploy.yml` — CI/CD пайплайн для автоматического деплоя при пуше в GitHub.

---

## 🛠 Предварительные требования

1. **Node.js** версии 18 или новее.
2. **Firebase аккаунт**: перейдите в [Firebase Console](https://console.firebase.google.com/) и создайте проект (например, `regai-prod`).
3. Установите Firebase CLI (если еще не установлен):
   ```bash
   npm install -g firebase-tools
   ```
   *(или можно использовать `npx firebase-tools` без глобальной установки).*

---

## 🚀 Вариант 1. Быстрый деплой фронтенда на Firebase Hosting

### Шаг 1. Авторизация в Firebase CLI
```bash
firebase login
```
*(Если работаете на удаленном сервере без браузера, используйте `firebase login --no-localhost`).*

### Шаг 2. Привязка проекта
Укажите ID вашего проекта из Firebase Console:
```bash
firebase use --add
# или укажите напрямую:
firebase use <YOUR_PROJECT_ID>
```

### Шаг 3. Деплой через скрипт
Запустите интерактивный скрипт из корня проекта `regai/`:
```bash
./deploy_firebase.sh <YOUR_PROJECT_ID>
```

Или вручную:
```bash
cd frontend
npm install
npm run build
cd ..
firebase deploy --only hosting
```

После завершения ваш сайт станет доступен по адресам:
- `https://<YOUR_PROJECT_ID>.web.app`
- `https://<YOUR_PROJECT_ID>.firebaseapp.com`

---

## 🌐 Вариант 2. Полный Full-Stack (Frontend на Firebase + Backend на Cloud Run)

Это **рекомендуемая архитектура Google Firebase** для микросервисов и контейнеров.
Firebase Hosting выступает единой точкой входа (единый домен), проксируя запросы `/api/**` в Cloud Run, что полностью исключает проблемы с CORS.

### 1. Деплой Backend в Cloud Run (в том же проекте GCP / Firebase)
Установите [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install) и выполните:
```bash
# Авторизация в GCP под тем же аккаунтом
gcloud auth login
gcloud config set project <YOUR_PROJECT_ID>

# Сборка и деплой Docker-контейнера бэкенда
gcloud run deploy regai-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "SECRET_KEY=your_production_secret_32_chars,OPENAI_API_KEY=your_key"
```

### 2. Деплой Firebase Hosting
В `firebase.json` уже прописано правило:
```json
{
  "source": "/api/**",
  "run": {
    "serviceId": "regai-backend",
    "region": "us-central1"
  }
}
```
Теперь просто выполните:
```bash
firebase deploy --only hosting
```

Готово! Теперь:
- Запрос `https://<YOUR_PROJECT_ID>.web.app/` открывает React-интерфейс.
- Запрос `https://<YOUR_PROJECT_ID>.web.app/api/v1/auth/login` напрямую обрабатывается FastAPI-сервером в Cloud Run.

---

## 🔗 Вариант 3. Frontend на Firebase + Backend на отдельном сервере (Railway / VPS / Render)

Если ваш бэкенд уже запущен на отдельном сервере или в Railway:

1. Откройте `frontend/.env.production` и укажите адрес бэкенда:
   ```env
   VITE_API_URL=https://your-backend-domain.com/api/v1
   VITE_SSO_ENABLED=false
   ```
2. Соберите и опубликуйте фронтенд:
   ```bash
   cd frontend
   npm run build
   cd ..
   firebase deploy --only hosting
   ```
Бэкенд RegAI уже автоматически разрешает запросы с любых доменов Firebase (`*.web.app` и `*.firebaseapp.com`).

---

## 🧪 Полезные команды

- **Локальное тестирование Firebase Hosting**:
  ```bash
  npx firebase-tools emulators:start --only hosting
  ```
  Приложение откроется на `http://localhost:5000`.

- **Деплой во временный канал (Preview Channel)**:
  ```bash
  cd frontend
  npm run deploy:preview
  ```
  Firebase сгенерирует временную ссылку (действует 7 дней) для демонстрации или проверки фичи до публикации на продакшн.

- **Подключение своего домена**:
  В [Firebase Console](https://console.firebase.google.com/) -> Hosting -> **Add custom domain** (SSL-сертификат выдается бесплатно и обновляется автоматически).
