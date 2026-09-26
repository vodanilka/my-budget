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

```bash
cd mobile
npm install
npx expo start --tunnel --port 47821
```

1. Установите [Expo Go](https://apps.apple.com/app/expo-go/id982107779).
2. Отсканируйте QR из терминала камерой iPhone или откройте `exp://` ссылку.
3. Если туннель просит вход: `npx expo login` (аккаунт expo.dev). Без входа можно `npx expo start --lan`, но телефон должен быть в той же Wi‑Fi сети.

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
