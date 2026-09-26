# My budget

iPhone-приложение бюджета по книге **Budget_VF.xlsm**. Репозиторий: [vodanilka/my-budget](https://github.com/vodanilka/my-budget) (имя на GitHub без пробела; отображаемое имя — My budget).

Модель один в один со таблицей: категории и карты только из листа `Lists`, операции из `Expenses`, зарплата и долг с Владом как на `Reports` / `Salary`, план месяца с `MyBudget`, регулярные платежи с `Subscription&bills`, кредитки с `Danil Credit Card`.

Два клиента, одна модель:

- **Expo Go** (`mobile/`) — нативное приложение для iPhone. Откройте в Expo Go по QR или ссылке.
- **PWA** (корень) — Safari → «Поделиться» → «На экран „Домой“».

## Что умеет

- **Обзор** — траты месяца против плана, зарплата Данила/Влада, баланс с Владом, категории Analitics
- **Операции** — 1300+ строк Expenses, поиск, фильтры, ручное добавление как на листе Form
- **Банки** — подключение нескольких счетов (BoFa, Square, Ollo, Mission Lane, Kikoff, Reliable, Houzz, наличные). Песочница без ключей Plaid: `user_good` / `pass_good`
- **Чек** — камера iPhone, галерея, демо-чек WinCo, разбор суммы/даты/магазина и запись в тот же бюджет

Данные на устройстве (AsyncStorage / localStorage). Сервер и база не нужны.

## Expo Go (iPhone)

**В списке Projects внутри Expo Go My budget не появится.** Это dev-сервер, а не опубликованный проект аккаунта Expo. Откройте его по ссылке или QR — после этого оно останется в недавних.

```bash
cd mobile
npm install
npx expo start --tunnel --port 47821
```

1. Установите [Expo Go](https://apps.apple.com/app/expo-go/id982107779) и обновите его (нужен SDK 57).
2. На iPhone откройте страницу загрузки Metro (`/_expo/loading?platform=ios`) и нажмите **Open in Expo Go**.
3. Или в Expo Go нажмите сканер QR / **Enter URL** и вставьте `exp://…` из терминала. Не ищите название на вкладке Projects.
4. Если официальный `--tunnel` просит вход: `npx expo login` (expo.dev). Без входа можно `--lan` в той же Wi‑Fi сети, либо Cloudflare-туннель как в этой сессии.

## PWA

```bash
npm install
npm run dev
```

Откройте [http://127.0.0.1:43173](http://127.0.0.1:43173). Сборка: `npm run build && npm start`.

## OCR и банки

- В Expo Go демо-чек WinCo распознаётся полностью (сумма $47.82). Живое фото прикрепляется к операции — поля можно поправить вручную (Tesseract WASM в Expo Go недоступен).
- В PWA чеки читает Tesseract.js в браузере.
- Банки работают в песочнице. Настоящий Plaid не обязателен.

## Листы книги

`Form`, `Reports`, `Analitics`, `Expenses`, `Lists`, `Salary`, `MyBudget`, `Subscription&bills`, `Danil Credit Card`, `Transaction fee`, `Filter by description`.
